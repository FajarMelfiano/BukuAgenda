import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { konteks } from "@/lib/sesi";
import { JENIS_KELUAR, STATUS_KELUAR } from "@/lib/domain";
import { filterSkema } from "@/lib/validasi";
import { whereKeluar } from "@/lib/query";
import { angkaId, tglPendek, urutId } from "@/lib/format";
import { BingkaiTabel, KepalaHalaman, Paginasi } from "@/components/ui/tabel";
import { Docket } from "@/components/ui/docket";
import { StatusKeluar } from "@/components/ui/status";
import { Kosong, KosongFilter } from "@/components/ui/state";
import { Kendali } from "@/components/kendali";
import { TombolCetak } from "@/components/tombol-cetak";
import { Tombol } from "@/components/ui/tombol";
import { Kop } from "@/components/kop";

const PER_HALAMAN = 25;

export default async function HalamanSuratKeluar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await konteks();
  if (!ctx) throw new Error("Konteks tidak ada");
  const sp = await searchParams;
  const f = filterSkema.parse({
    q: typeof sp.q === "string" ? sp.q : undefined,
    status: typeof sp.status === "string" ? sp.status : undefined,
    jenis: typeof sp.jenis === "string" ? sp.jenis : undefined,
    bulan: typeof sp.bulan === "string" ? sp.bulan : undefined,
    unit: typeof sp.unit === "string" ? sp.unit : undefined,
    halaman: typeof sp.halaman === "string" ? sp.halaman : undefined,
  });

  const where = whereKeluar({
    unitIds: ctx.cakupanUnitIds,
    q: f.q,
    status: f.status,
    jenis: f.jenis,
    bulan: f.bulan,
    unitId: f.unit,
  });

  const halaman = f.halaman ?? 1;

  const [total, surat] = await Promise.all([
    prisma.suratKeluar.count({ where }),
    prisma.suratKeluar.findMany({
      where,
      orderBy: [{ tanggalSurat: "desc" }, { nomorUrut: "desc" }],
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      select: {
        id: true,
        nomorUrut: true,
        nomorSurat: true,
        tanggalSurat: true,
        tujuan: true,
        perihal: true,
        jenis: true,
        sifat: true,
        status: true,
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
    return qs ? `/surat-keluar?${qs}` : "/surat-keluar";
  };

  const belumTerkirim = await prisma.suratKeluar.count({
    where: { ...where, status: "DRAFT" },
  });

  return (
    <div className="mx-auto w-full max-w-[86rem] space-y-3 px-2.5 py-3 sm:px-4 sm:py-4">
      <KepalaHalaman
        judul="Surat Keluar"
        konteks={
          <>
            Surat yang diterbitkan {ctx.unit.nama}. Nomor terbit otomatis berurutan per tahun.
            <span className="tabular text-tinta-3"> {angkaId(total)} berkas</span>
            {belumTerkirim > 0 ? (
              <>
                {" · "}
                <span className="font-semibold text-stempel-biru">{belumTerkirim} masih draft</span>
              </>
            ) : null}
          </>
        }
        aksi={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <TombolCetak />
            <Link href="/surat-keluar/baru" className="flex-1 sm:flex-initial">
              <Tombol variant="utama" ukuran="md" className="w-full sm:w-auto justify-center">
                <Plus aria-hidden className="size-3.5" />
                Buat surat keluar
              </Tombol>
            </Link>
          </div>
        }
      />

      <BingkaiTabel judul="">
        <Kop
          judul="BUKU AGENDA SURAT KELUAR"
          unit={ctx.unit}
          ringkas={
            filterDipakai
              ? `Penyaring aktif — ${total} berkas cocok`
              : `Seluruh arsip surat keluar ${ctx.unit.nama}`
          }
        />

        <Kendali
          basePath="/surat-keluar"
          labelCari="Cari nomor surat, tujuan, atau perihal"
          opsiStatus={STATUS_KELUAR.map((s) => ({ nilai: s.nilai, label: s.label }))}
          opsiJenis={JENIS_KELUAR.map((j) => ({ nilai: j.nilai, label: j.label }))}
        />

        {total === 0 ? (
          filterDipakai ? (
            <KosongFilter />
          ) : (
            <Kosong
              judul={`Belum ada surat keluar di ${ctx.unit.nama}`}
              penjelasan="Surat keluar dibuat dari sini: isi tujuan dan materinya, lalu nomor surat diterbitkan otomatis oleh sistem."
              aksi={
                <Link href="/surat-keluar/baru">
                  <Tombol variant="utama" ukuran="md">
                    <Plus aria-hidden className="size-3.5" />
                    Buat surat keluar
                  </Tombol>
                </Link>
              }
            />
          )
        ) : (
          <>
            {/* Tampilan Ponsel (< md): Kartu register padat & mudah dibaca */}
            <div className="divide-y divide-garis md:hidden">
              {surat.map((s) => (
                <Link
                  key={s.id}
                  href={`/surat-keluar/${s.id}`}
                  className="block p-3 transition-colors hover:bg-hijau-terang/30 active:bg-hijau-terang/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[12px] text-tinta-2">
                      <span data-mono className="font-semibold text-tinta-3">
                        #{urutId(s.nomorUrut)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span data-mono>{tglPendek(s.tanggalSurat)}</span>
                      <span className="rounded bg-panel px-1.5 py-0.5 font-mono text-[11px] text-tinta-2">
                        {s.unit.kode}
                      </span>
                    </div>
                    <StatusKeluar status={s.status} />
                  </div>

                  <div className="my-2">
                    <Docket>{s.nomorSurat}</Docket>
                  </div>

                  <p className="line-clamp-1 text-[13px] font-semibold text-tinta">
                    Kepada: {s.tujuan}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-tinta-2">
                    {s.perihal}
                  </p>
                </Link>
              ))}
            </div>

            {/* Tampilan Desktop (>= md): Tabel register lengkap */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[56rem] border-collapse text-left">
                <caption className="sr-only">
                  Daftar surat keluar {ctx.unit.nama}, {total} berkas
                </caption>
                <thead>
                  <tr className="border-b border-garis-kuat bg-panel/60">
                    <th scope="col" className="meta w-14 px-3 py-2 font-semibold">
                      No
                    </th>
                    <th scope="col" className="meta w-28 px-3 py-2 font-semibold">
                      Tanggal surat
                    </th>
                    <th scope="col" className="meta w-52 px-3 py-2 font-semibold">
                      Nomor surat
                    </th>
                    <th scope="col" className="meta w-60 px-3 py-2 font-semibold">
                      Tujuan
                    </th>
                    <th scope="col" className="meta px-3 py-2 font-semibold">
                      Perihal
                    </th>
                    <th scope="col" className="meta w-28 px-3 py-2 font-semibold">
                      Status
                    </th>
                    <th scope="col" className="meta w-24 px-3 py-2 font-semibold">
                      <span className="sr-only">Unit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-garis">
                  {surat.map((s) => (
                    <tr key={s.id} className="hover:bg-hijau-terang/40">
                      <td data-mono className="px-3 py-2 align-top text-[12.5px] text-tinta-3">
                        {urutId(s.nomorUrut)}
                      </td>
                      <td data-mono className="px-3 py-2 align-top text-[12.5px] whitespace-nowrap text-tinta-2">
                        {tglPendek(s.tanggalSurat)}
                      </td>
                      <td className="px-3 py-1.5 align-top">
                        <Link
                          href={`/surat-keluar/${s.id}`}
                          className="inline-flex rounded-kontrol focus-visible:outline-2"
                        >
                          <Docket>{s.nomorSurat}</Docket>
                        </Link>
                      </td>
                      <td className="px-3 py-2 align-top text-[13px] leading-snug text-tinta">
                        <span className="line-clamp-2">{s.tujuan}</span>
                      </td>
                      <td className="px-3 py-2 align-top text-[13px] leading-snug text-tinta-2">
                        <span className="line-clamp-2">{s.perihal}</span>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <StatusKeluar status={s.status} />
                      </td>
                      <td className="px-3 py-2 align-top text-[12px] whitespace-nowrap text-tinta-3">
                        {s.unit.kode}
                      </td>
                    </tr>
                  ))}
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