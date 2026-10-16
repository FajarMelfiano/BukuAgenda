import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { konteks } from "@/lib/sesi";
import { JENIS_MASUK, SLA_HARI, STATUS_MASUK } from "@/lib/domain";
import { filterSkema } from "@/lib/validasi";
import { whereMasuk } from "@/lib/query";
import { angkaId, hariSejak, sudahTerlambat, tglPendek, urutId } from "@/lib/format";
import { BingkaiTabel, KepalaHalaman, Paginasi } from "@/components/ui/tabel";
import { Docket } from "@/components/ui/docket";
import { StatusMasuk } from "@/components/ui/status";
import { Kosong, KosongFilter } from "@/components/ui/state";
import { Kendali } from "@/components/kendali";
import { TombolCetak } from "@/components/tombol-cetak";
import { Tombol } from "@/components/ui/tombol";
import { Kop } from "@/components/kop";

export const PER_HALAMAN = 25;

export default async function HalamanSuratMasuk({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await konteks();
  const sp = await searchParams;
  const f = filterSkema.parse({
    q: typeof sp.q === "string" ? sp.q : undefined,
    status: typeof sp.status === "string" ? sp.status : undefined,
    jenis: typeof sp.jenis === "string" ? sp.jenis : undefined,
    bulan: typeof sp.bulan === "string" ? sp.bulan : undefined,
    unit: typeof sp.unit === "string" ? sp.unit : undefined,
    halaman: typeof sp.halaman === "string" ? sp.halaman : undefined,
  });

  const where = whereMasuk({
    unitIds: ctx.cakupanUnitIds,
    q: f.q,
    status: f.status,
    jenis: f.jenis,
    bulan: f.bulan,
    unitId: f.unit,
  });

  const halaman = f.halaman ?? 1;

  const [total, surat] = await Promise.all([
    prisma.suratMasuk.count({ where }),
    prisma.suratMasuk.findMany({
      where,
      orderBy: [{ tanggalMasuk: "desc" }, { nomorUrut: "desc" }],
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      select: {
        id: true,
        nomorUrut: true,
        nomorSurat: true,
        tanggalMasuk: true,
        pengirim: true,
        perihal: true,
        jenis: true,
        status: true,
        diteruskanKe: true,
        unit: { select: { nama: true, kode: true } },
      },
    }),
  ]);

  const filterDipakai = Boolean(f.q || f.status || f.jenis || f.bulan);
  const buatUrl = (h: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({
      q: f.q,
      status: f.status,
      jenis: f.jenis,
      bulan: f.bulan,
      unit: f.unit,
    })) {
      if (v) p.set(k, String(v));
    }
    if (h > 1) p.set("halaman", String(h));
    const qs = p.toString();
    return qs ? `/surat-masuk?${qs}` : "/surat-masuk";
  };

  const terlambatCount = await prisma.suratMasuk.count({
    where: {
      ...where,
      status: { notIn: ["SELESAI", "DITOLAK"] },
      tanggalMasuk: { lt: new Date(Date.now() - SLA_HARI * 86_400_000) },
    },
  });

  return (
    <div className="mx-auto w-full max-w-[86rem] space-y-3 px-2.5 py-3 sm:px-4 sm:py-4">
      <KepalaHalaman
        judul="Surat Masuk"
        konteks={
          <>
            Surat yang diterima unit kerja dan menunggu pencatatan disposisi.
            <span className="tabular text-tinta-3"> {angkaId(total)} berkas</span>
            {terlambatCount > 0 ? (
              <>
                {" · "}
                <span className="font-semibold text-stempel-merah">
                  {terlambatCount} menunggu lebih dari {SLA_HARI} hari
                </span>
              </>
            ) : null}
          </>
        }
        aksi={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <TombolCetak />
            <Link href="/surat-masuk/baru" className="flex-1 sm:flex-initial">
              <Tombol variant="utama" ukuran="md" className="w-full sm:w-auto justify-center">
                <Plus aria-hidden className="size-3.5" />
                Catat surat masuk
              </Tombol>
            </Link>
          </div>
        }
      />

      <BingkaiTabel judul="" aksi={null}>
        <Kop
          judul="BUKU AGENDA SURAT MASUK"
          unit={ctx.unit}
          ringkas={
            filterDipakai
              ? `Penyaring aktif — ${total} berkas cocok`
              : `Seluruh arsip surat masuk ${ctx.unit.nama}`
          }
        />

        <Kendali
          basePath="/surat-masuk"
          labelCari="Cari nomor surat, pengirim, atau perihal"
          opsiStatus={STATUS_MASUK.map((s) => ({ nilai: s.nilai, label: s.label }))}
          opsiJenis={JENIS_MASUK.map((j) => ({ nilai: j.nilai, label: j.label }))}
        />

        {total === 0 ? (
          filterDipakai ? (
            <KosongFilter />
          ) : (
            <Kosong
              judul={`Belum ada surat masuk di ${ctx.unit.nama}`}
              penjelasan="Setiap berkas yang masuk dicatat di sini supaya bisa diberi disposisi dan dilacak sampai selesai. Nomor surat ikut dicatat apa adanya seperti pada berkas aslinya."
              aksi={
                <Link href="/surat-masuk/baru">
                  <Tombol variant="utama" ukuran="md">
                    <Plus aria-hidden className="size-3.5" />
                    Catat surat masuk
                  </Tombol>
                </Link>
              }
            />
          )
        ) : (
          <>
            {/* Tampilan Ponsel (< md): Kartu register padat & mudah dibaca */}
            <div className="divide-y divide-garis md:hidden">
              {surat.map((s) => {
                const terlambat = sudahTerlambat(s.tanggalMasuk, s.status);
                const umur = hariSejak(s.tanggalMasuk);
                return (
                  <Link
                    key={s.id}
                    href={`/surat-masuk/${s.id}`}
                    className="block p-3 transition-colors hover:bg-hijau-terang/30 active:bg-hijau-terang/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[12px] text-tinta-2">
                        <span data-mono className="font-semibold text-tinta-3">
                          #{urutId(s.nomorUrut)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span data-mono>{tglPendek(s.tanggalMasuk)}</span>
                        <span className="rounded bg-panel px-1.5 py-0.5 font-mono text-[11px] text-tinta-2">
                          {s.unit.kode}
                        </span>
                      </div>
                      <StatusMasuk status={s.status} terlambat={terlambat} />
                    </div>

                    <div className="my-2">
                      <Docket>{s.nomorSurat}</Docket>
                    </div>

                    <p className="line-clamp-1 text-[13px] font-semibold text-tinta">
                      {s.pengirim}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-tinta-2">
                      {s.perihal}
                    </p>

                    {s.diteruskanKe ? (
                      <p className="mt-1 flex items-center gap-1 text-[11.5px] text-tinta-3">
                        <span>Petugas:</span>
                        <strong className="font-medium text-tinta-2">{s.diteruskanKe}</strong>
                      </p>
                    ) : null}

                    {terlambat ? (
                      <p className="tabular mt-2 text-[11.5px] font-medium text-stempel-merah">
                        {umur} hari sejak masuk
                      </p>
                    ) : null}
                  </Link>
                );
              })}
            </div>

            {/* Tampilan Desktop (>= md): Tabel register lengkap */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[56rem] border-collapse text-left">
                <caption className="sr-only">
                  Daftar surat masuk {ctx.unit.nama}, {total} berkas
                </caption>
                <thead>
                  <tr className="border-b border-garis-kuat bg-panel/60">
                    <th scope="col" className="meta w-14 px-3 py-2 font-semibold">
                      No
                    </th>
                    <th scope="col" className="meta w-28 px-3 py-2 font-semibold">
                      Tanggal masuk
                    </th>
                    <th scope="col" className="meta w-48 px-3 py-2 font-semibold">
                      Nomor surat
                    </th>
                    <th scope="col" className="meta w-64 px-3 py-2 font-semibold">
                      Pengirim
                    </th>
                    <th scope="col" className="meta px-3 py-2 font-semibold">
                      Perihal
                    </th>
                    <th scope="col" className="meta w-32 px-3 py-2 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="meta w-24 px-3 py-2 font-semibold">
                      <span className="sr-only">Unit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-garis">
                  {surat.map((s) => {
                    const terlambat = sudahTerlambat(s.tanggalMasuk, s.status);
                    const umur = hariSejak(s.tanggalMasuk);
                    return (
                      <tr key={s.id} className="group hover:bg-hijau-terang/40">
                        <td data-mono className="px-3 py-2 align-top text-[12.5px] text-tinta-3">
                          {urutId(s.nomorUrut)}
                        </td>
                        <td data-mono className="px-3 py-2 align-top text-[12.5px] whitespace-nowrap text-tinta-2">
                          {tglPendek(s.tanggalMasuk)}
                        </td>
                        <td className="px-3 py-1.5 align-top">
                          <Link
                            href={`/surat-masuk/${s.id}`}
                            className="inline-flex rounded-kontrol focus-visible:outline-2"
                          >
                            <Docket>{s.nomorSurat}</Docket>
                          </Link>
                        </td>
                        <td className="px-3 py-2 align-top text-[13px] leading-snug text-tinta">
                          <span className="line-clamp-2">{s.pengirim}</span>
                        </td>
                        <td className="px-3 py-2 align-top text-[13px] leading-snug text-tinta-2">
                          <span className="line-clamp-2">{s.perihal}</span>
                          {s.diteruskanKe ? (
                            <span className="mt-1 block text-[11px] text-tinta-3">
                              Petugas: <strong className="font-medium text-tinta-2">{s.diteruskanKe}</strong>
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <StatusMasuk status={s.status} terlambat={terlambat} />
                          {terlambat ? (
                            <p className="tabular mt-1 text-[11px] text-stempel-merah">
                              {umur} hari sejak masuk
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 align-top text-[12px] whitespace-nowrap text-tinta-3">
                          {s.unit.kode}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Paginasi halaman={halaman} total={total} perHalaman={PER_HALAMAN} buatUrl={buatUrl} />
          </>
        )}
      </BingkaiTabel>
    </div>
  );
}