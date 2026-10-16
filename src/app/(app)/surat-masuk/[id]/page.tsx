import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/db";
import { konteks } from "@/lib/sesi";
import {
  JENIS_MASUK_LABEL,
  LEVEL_UNIT,
  SLA_HARI,
} from "@/lib/domain";
import { hariSejak, sudahTerlambat, tglPanjang, waktu } from "@/lib/format";
import { KepalaHalaman } from "@/components/ui/tabel";
import { Docket } from "@/components/ui/docket";
import { StatusMasuk } from "@/components/ui/status";
import { Baris } from "@/components/ui/form";
import { Tombol } from "@/components/ui/tombol";
import { TombolHapus } from "@/components/dialog-status";
import { Riwayat } from "@/components/riwayat";
import { TombolCetak } from "@/components/tombol-cetak";
import { AlurStepperMasuk, PanelTindakLanjutMasuk } from "@/components/proses-surat-masuk";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const surat = await prisma.suratMasuk.findUnique({
    where: { id },
    select: { nomorSurat: true },
  });
  return { title: surat ? `Surat masuk ${surat.nomorSurat}` : "Surat masuk" };
}

export default async function DetailSuratMasuk({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await konteks();

  const surat = await prisma.suratMasuk.findFirst({
    where: { id, unitId: { in: ctx.cakupanUnitIds } },
    include: {
      unit: { select: { nama: true, kode: true, level: true } },
      dibuatOleh: { select: { nama: true } },
    },
  });
  if (!surat) notFound();

  const daftarPetugas = await prisma.pengguna.findMany({
    where: { unitId: surat.unitId, aktif: true },
    select: { id: true, nama: true, peran: true, username: true },
    orderBy: { nama: "asc" },
  });

  const riwayat = await prisma.suratRiwayat.findMany({
    where: { suratId: id, suratJenis: "MASUK" },
    orderBy: { dibuatPada: "desc" },
    include: { oleh: { select: { nama: true } } },
  });

  const terlambat = sudahTerlambat(surat.tanggalMasuk, surat.status);
  const umur = hariSejak(surat.tanggalMasuk);

  return (
    <div className="mx-auto w-full max-w-[74rem] px-4 py-4">
      <Link
        href="/surat-masuk"
        data-cetak="sembunyi"
        className="mb-3 inline-flex items-center gap-1 rounded-kontrol text-[12.5px] font-medium text-tinta-2 hover:text-tinta"
      >
        <ChevronLeft aria-hidden className="size-3.5" />
        Kembali ke daftar surat masuk
      </Link>

      <KepalaHalaman
        judul={surat.perihal.length > 70 ? `${surat.perihal.slice(0, 70)}…` : surat.perihal}
        konteks={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Docket besar>{surat.nomorSurat}</Docket>
            <span className="tabular text-tinta-3">No. urut {surat.nomorUrut}</span>
            <span aria-hidden className="text-tinta-3">
              ·
            </span>
            <StatusMasuk status={surat.status} terlambat={terlambat} />
          </span>
        }
        aksi={
          <>
            <TombolCetak />
            {ctx.bisaHapus ? (
              <TombolHapus nomorSurat={surat.nomorSurat} suratId={surat.id} jenis="MASUK" />
            ) : null}
            <Link href={`/surat-masuk/${surat.id}/ubah`}>
              <Tombol variant="kedua" ukuran="md">
                <Pencil aria-hidden className="size-3.5" />
                Ubah isi surat
              </Tombol>
            </Link>
          </>
        }
      />

      <AlurStepperMasuk status={surat.status} diteruskanKe={surat.diteruskanKe} />

      <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-3">
          <section className="rounded-panel border border-garis bg-lembar">
            <h2 className="border-b border-garis px-4 py-2 text-[13px] font-semibold text-tinta">
              Rincian berkas
            </h2>
            <dl className="px-4 py-1">
              <Baris label="Nomor urut">{surat.nomorUrut}</Baris>
              <Baris label="Nomor surat" mono>
                {surat.nomorSurat}
              </Baris>
              <Baris label="Tanggal surat">{tglPanjang(surat.tanggalSurat)}</Baris>
              <Baris label="Tanggal masuk">
                {tglPanjang(surat.tanggalMasuk)}
                <span className="tabular ml-1.5 text-[12px] text-tinta-3">
                  ({umur} hari lalu)
                </span>
              </Baris>
              <Baris label="Jenis surat">{JENIS_MASUK_LABEL[surat.jenis]}</Baris>
              <Baris label="Pengirim">{surat.pengirim}</Baris>
              <Baris label="Penerima di unit">{surat.penerima}</Baris>
              <Baris label="Perihal">{surat.perihal}</Baris>
              <Baris label="Diteruskan kepada">{surat.diteruskanKe}</Baris>
              <Baris label="Disposisi">{surat.disposisi}</Baris>
              <Baris label="Lampiran">{surat.lampiran}</Baris>
              <Baris label="Catatan">{surat.catatan}</Baris>
              <Baris label="Unit kerja">
                {LEVEL_UNIT[surat.unit.level as keyof typeof LEVEL_UNIT]} {surat.unit.nama}
              </Baris>
              <Baris label="Dicatat oleh">
                {surat.dibuatOleh.nama}
                <span className="tabular ml-1.5 text-[12px] text-tinta-3">
                  {waktu(surat.dibuatPada)}
                </span>
              </Baris>
            </dl>
          </section>
        </div>

        <div className="space-y-3">
          <section className="rounded-panel border border-garis bg-lembar">
            <h2 className="border-b border-garis px-4 py-2 text-[13px] font-semibold text-tinta">
              Tindak lanjut
            </h2>
            <div className="space-y-3 px-4 py-3">
              {terlambat ? (
                <p className="border-l-2 border-stempel-merah bg-stempel-merah-latar px-3 py-2 text-[12.5px] leading-relaxed text-stempel-merah">
                  Surat ini sudah {umur} hari sejak masuk dan belum selesai. Batas penanganan yang
                  lazim dipakai unit kerja adalah {SLA_HARI} hari.
                </p>
              ) : null}
              <PanelTindakLanjutMasuk
                surat={surat}
                daftarPetugas={daftarPetugas}
                namaPenggunaAktif={ctx.pengguna.nama}
              />
            </div>
          </section>

          <section className="rounded-panel border border-garis bg-lembar">
            <h2 className="border-b border-garis px-4 py-2 text-[13px] font-semibold text-tinta">
              Riwayat status
            </h2>
            <Riwayat baris={riwayat} jenis="MASUK" />
          </section>
        </div>
      </div>
    </div>
  );
}