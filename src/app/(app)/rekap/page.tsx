import Link from "next/link";
import { Download, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { konteks } from "@/lib/sesi";
import { JENIS_KELUAR_LABEL, JENIS_MASUK_LABEL, SLA_HARI } from "@/lib/domain";
import { filterSkema } from "@/lib/validasi";
import { whereKeluar, whereMasuk } from "@/lib/query";
import { angkaId, bulanKunci, namaBulan, tglPendek, urutId } from "@/lib/format";
import { BingkaiTabel, KepalaHalaman, Paginasi } from "@/components/ui/tabel";
import { Docket } from "@/components/ui/docket";
import { StatusKeluar, StatusMasuk } from "@/components/ui/status";
import { Kosong, KosongFilter } from "@/components/ui/state";
import { Kendali } from "@/components/kendali";
import { TombolCetak } from "@/components/tombol-cetak";
import { Tombol } from "@/components/ui/tombol";
import { Kop } from "@/components/kop";

const PER_HALAMAN = 25;
const BATAS_ARSIP = 500;

/** Satu baris arsip gabungan, dinormalkan supaya dua tabel bisa ditampilkan
 *  sebagai satu daftar. */
type Arsip = {
  kunci: string;
  href: string;
  arah: "Masuk" | "Keluar";
  nomorUrut: number;
  nomorSurat: string;
  tanggal: Date;
  jenisLabel: string;
  status: string;
  lawan: string;
  perihal: string;
};

export default async function HalamanRekap({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await konteks();
  if (!ctx) throw new Error("Konteks tidak ada");
  const sp = await searchParams;
  const f = filterSkema.parse({
    q: typeof sp.q === "string" ? sp.q : undefined,
    bulan: typeof sp.bulan === "string" ? sp.bulan : undefined,
    unit: typeof sp.unit === "string" ? sp.unit : undefined,
    halaman: typeof sp.halaman === "string" ? sp.halaman : undefined,
  });

  const dasar = { unitIds: ctx.cakupanUnitIds, q: f.q, bulan: f.bulan, unitId: f.unit };
  const whereM = whereMasuk(dasar);
  const whereK = whereKeluar(dasar);

  const [masuk, keluar, totalMasuk, totalKeluar] = await Promise.all([
    f.q
      ? prisma.suratMasuk.findMany({
          where: whereM,
          orderBy: { tanggalMasuk: "desc" },
          take: BATAS_ARSIP,
          select: {
            id: true,
            nomorUrut: true,
            nomorSurat: true,
            tanggalMasuk: true,
            pengirim: true,
            perihal: true,
            jenis: true,
            status: true,
          },
        })
      : Promise.resolve([]),
    f.q
      ? prisma.suratKeluar.findMany({
          where: whereK,
          orderBy: { tanggalSurat: "desc" },
          take: BATAS_ARSIP,
          select: {
            id: true,
            nomorUrut: true,
            nomorSurat: true,
            tanggalSurat: true,
            tujuan: true,
            perihal: true,
            jenis: true,
            status: true,
          },
        })
      : Promise.resolve([]),
    prisma.suratMasuk.count({ where: whereM }),
    prisma.suratKeluar.count({ where: whereK }),
  ]);

  const total = totalMasuk + totalKeluar;
  const halaman = f.halaman ?? 1;

  const arsip: Arsip[] = [
    ...masuk.map((m) => ({
      kunci: `M${m.id}`,
      href: `/surat-masuk/${m.id}`,
      arah: "Masuk" as const,
      nomorUrut: m.nomorUrut,
      nomorSurat: m.nomorSurat,
      tanggal: m.tanggalMasuk,
      jenisLabel: JENIS_MASUK_LABEL[m.jenis] ?? m.jenis,
      status: m.status,
      lawan: m.pengirim,
      perihal: m.perihal,
    })),
    ...keluar.map((k) => ({
      kunci: `K${k.id}`,
      href: `/surat-keluar/${k.id}`,
      arah: "Keluar" as const,
      nomorUrut: k.nomorUrut,
      nomorSurat: k.nomorSurat,
      tanggal: k.tanggalSurat,
      jenisLabel: JENIS_KELUAR_LABEL[k.jenis] ?? k.jenis,
      status: k.status,
      lawan: k.tujuan,
      perihal: k.perihal,
    })),
  ].sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime());

  const isiHalaman = arsip.slice((halaman - 1) * PER_HALAMAN, halaman * PER_HALAMAN);

  const buatUrl = (h: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: f.q, bulan: f.bulan, unit: f.unit })) {
      if (v) p.set(k, String(v));
    }
    if (h > 1) p.set("halaman", String(h));
    const qs = p.toString();
    return qs ? `/rekap?${qs}` : "/rekap";
  };

  const parameterEkspor = new URLSearchParams();
  if (f.q) parameterEkspor.set("q", f.q);
  if (f.bulan) parameterEkspor.set("bulan", f.bulan);
  if (f.unit) parameterEkspor.set("unit", f.unit);
  const qsEkspor = parameterEkspor.toString();
  const urlEkspor = `/api/rekap/ekspor${qsEkspor ? `?${qsEkspor}` : ""}`;

  const bulanBerjalan = bulanKunci();
  const [masukBulanIni, keluarBulanIni, terlambat] = await Promise.all([
    prisma.suratMasuk.count({
      where: whereMasuk({ unitIds: ctx.cakupanUnitIds, unitId: f.unit, bulan: bulanBerjalan }),
    }),
    prisma.suratKeluar.count({
      where: whereKeluar({ unitIds: ctx.cakupanUnitIds, unitId: f.unit, bulan: bulanBerjalan }),
    }),
    prisma.suratMasuk.count({
      where: {
        unitId: { in: f.unit && ctx.cakupanUnitIds.includes(f.unit) ? [f.unit] : ctx.cakupanUnitIds },
        status: { notIn: ["SELESAI", "DITOLAK"] },
        tanggalMasuk: { lt: new Date(Date.now() - SLA_HARI * 86_400_000) },
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-[86rem] space-y-3 px-2.5 py-3 sm:px-4 sm:py-4">
      <KepalaHalaman
        judul="Rekap & Arsip"
        konteks={
          <>
            Angka {namaBulan(new Date())} untuk {ctx.unit.nama}, lalu arsip gabungan surat masuk dan
            keluar.
          </>
        }
        aksi={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <TombolCetak label="Cetak rekap" />
            <a href={urlEkspor} download className="flex-1 sm:flex-initial">
              <Tombol variant="kedua" ukuran="md" className="w-full sm:w-auto justify-center">
                <Download aria-hidden className="size-3.5" />
                Unduh CSV
              </Tombol>
            </a>
          </div>
        }
      />

      {/* Tiga angka. Masing-masing punya sub-label yang menjelaskan apa yang
          dihitung, supaya tidak jadi kartu hiasan. */}
      <section aria-label="Ringkasan bulan berjalan" className="grid gap-3 sm:grid-cols-3">
        <Angka
          label="Surat masuk bulan ini"
          nilai={masukBulanIni}
          keterangan="Seluruh berkas yang tercatat masuk pada bulan berjalan."
          tautan="/surat-masuk"
        />
        <Angka
          label="Surat keluar bulan ini"
          nilai={keluarBulanIni}
          keterangan="Surat yang diterbitkan unit ini pada bulan berjalan."
          tautan="/surat-keluar"
        />
        <Angka
          label={`Menunggu lebih dari ${SLA_HARI} hari`}
          nilai={terlambat}
          keterangan="Surat masuk yang belum selesai tahapnya dan sudah melewati batas penanganan."
          nada="peringatan"
        />
      </section>

      <BingkaiTabel judul="">
        <Kop
          judul="REKAP & ARSIP SURAT"
          unit={ctx.unit}
          ringkas={
            f.q
              ? `Pencarian “${f.q}”${f.bulan ? ` · bulan ${f.bulan}` : ""}`
              : "Seluruh arsip, tanpa penyaring"
          }
        />

        <Kendali
          basePath="/rekap"
          labelCari="Cari di seluruh arsip masuk dan keluar"
          tampilkanStatus={false}
          tampilkanJenis={false}
        />

        {!f.q ? (
          <Kosong
            judul="Arsip gabungan dibuka lewat pencarian"
            penjelasan="Masukkan nomor surat, nama pengirim, nama tujuan, atau kata kunci dari perihal. Hasilnya menampilkan surat masuk dan surat keluar dalam satu daftar."
            ikon={<Search aria-hidden className="size-6" />}
          />
        ) : total === 0 ? (
          <KosongFilter />
        ) : (
          <>
            {/* Tampilan Ponsel (< md): Kartu arsip gabungan */}
            <div className="divide-y divide-garis md:hidden">
              {isiHalaman.map((b) => (
                <Link
                  key={b.kunci}
                  href={b.href}
                  className="block p-3 transition-colors hover:bg-hijau-terang/30 active:bg-hijau-terang/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[12px] text-tinta-2">
                      <span
                        className={[
                          "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                          b.arah === "Masuk"
                            ? "bg-hijau-terang text-hijau-gelap"
                            : "bg-panel text-tinta",
                        ].join(" ")}
                      >
                        {b.arah}
                      </span>
                      <span data-mono>#{urutId(b.nomorUrut)}</span>
                      <span aria-hidden="true">·</span>
                      <span data-mono>{tglPendek(b.tanggal)}</span>
                    </div>
                    {b.arah === "Masuk" ? (
                      <StatusMasuk status={b.status as never} />
                    ) : (
                      <StatusKeluar status={b.status as never} />
                    )}
                  </div>

                  <div className="my-2">
                    <Docket>{b.nomorSurat}</Docket>
                  </div>

                  <p className="line-clamp-1 text-[13px] font-semibold text-tinta">
                    {b.lawan}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-tinta-2">
                    {b.perihal}
                  </p>
                </Link>
              ))}
            </div>

            {/* Tampilan Desktop (>= md): Tabel arsip lengkap */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[56rem] border-collapse text-left">
                <caption className="sr-only">
                  Arsip gabungan surat masuk dan keluar, {total} berkas cocok dengan pencarian
                </caption>
                <thead>
                  <tr className="border-b border-garis-kuat bg-panel/60">
                    <th scope="col" className="meta w-24 px-3 py-2 font-semibold">
                      Arah
                    </th>
                    <th scope="col" className="meta w-12 px-3 py-2 font-semibold">
                      No
                    </th>
                    <th scope="col" className="meta w-28 px-3 py-2 font-semibold">
                      Tanggal
                    </th>
                    <th scope="col" className="meta w-48 px-3 py-2 font-semibold">
                      Nomor surat
                    </th>
                    <th scope="col" className="meta w-56 px-3 py-2 font-semibold">
                      Pengirim / tujuan
                    </th>
                    <th scope="col" className="meta px-3 py-2 font-semibold">
                      Perihal
                    </th>
                    <th scope="col" className="meta w-32 px-3 py-2 font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-garis">
                  {isiHalaman.map((b) => (
                    <tr key={b.kunci} className="hover:bg-hijau-terang/40">
                      <td className="px-3 py-2 align-top">
                        <span
                          className={[
                            "text-[11.5px] font-semibold",
                            b.arah === "Masuk" ? "text-stempel-biru" : "text-stempel-hijau",
                          ].join(" ")}
                        >
                          {b.arah}
                        </span>
                        <span className="block text-[11px] text-tinta-3">{b.jenisLabel}</span>
                      </td>
                      <td data-mono className="px-3 py-2 align-top text-[12.5px] text-tinta-3">
                        {urutId(b.nomorUrut)}
                      </td>
                      <td data-mono className="px-3 py-2 align-top text-[12.5px] whitespace-nowrap text-tinta-2">
                        {tglPendek(b.tanggal)}
                      </td>
                      <td className="px-3 py-1.5 align-top">
                        <Link
                          href={b.href}
                          className="inline-flex rounded-kontrol focus-visible:outline-2"
                        >
                          <Docket>{b.nomorSurat}</Docket>
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-top text-[13px] leading-snug text-tinta">
                        <span className="line-clamp-2">{b.lawan}</span>
                      </td>
                      <td className="px-3 py-2 align-top text-[13px] leading-snug text-tinta-2">
                        <span className="line-clamp-2">{b.perihal}</span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {b.arah === "Masuk" ? (
                          <StatusMasuk status={b.status as never} />
                        ) : (
                          <StatusKeluar status={b.status as never} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginasi
              halaman={halaman}
              total={arsip.length}
              perHalaman={PER_HALAMAN}
              buatUrl={buatUrl}
            />
          </>
        )}
      </BingkaiTabel>
    </div>
  );
}

function Angka({
  label,
  nilai,
  keterangan,
  tautan,
  nada = "biasa",
}: {
  label: string;
  nilai: number;
  keterangan: string;
  tautan?: string;
  nada?: "biasa" | "peringatan";
}) {
  return (
    <div className="rounded-panel border border-garis bg-lembar px-4 py-3">
      <p className="meta">{label}</p>
      <p
        className={[
          "tabular mt-1 text-[30px] leading-none font-bold tracking-[-0.02em]",
          nada === "peringatan" && nilai > 0 ? "text-stempel-merah" : "text-tinta",
        ].join(" ")}
      >
        {angkaId(nilai)}
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-tinta-2">{keterangan}</p>
      {tautan ? (
        <Link
          href={tautan}
          className="mt-2 inline-block text-[12.5px] font-medium text-hijau underline underline-offset-2 hover:text-hijau-gelap"
        >
          Buka daftarnya
        </Link>
      ) : null}
    </div>
  );
}