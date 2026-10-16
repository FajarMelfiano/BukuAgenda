import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { ubahStatusKeluar } from "@/app/actions/surat";
import { prisma } from "@/lib/db";
import { konteks } from "@/lib/sesi";
import {
  JENIS_KELUAR_LABEL,
  LEVEL_UNIT,
  SIFAT_LABEL,
  STATUS_KELUAR,
  TRANSISI_KELUAR,
} from "@/lib/domain";
import { tglPanjang, waktu } from "@/lib/format";
import { KepalaHalaman } from "@/components/ui/tabel";
import { Docket } from "@/components/ui/docket";
import { StatusKeluar } from "@/components/ui/status";
import { Baris } from "@/components/ui/form";
import { Tombol } from "@/components/ui/tombol";
import { DialogStatus, TombolHapus } from "@/components/dialog-status";
import { Riwayat } from "@/components/riwayat";
import { TombolCetak } from "@/components/tombol-cetak";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const surat = await prisma.suratKeluar.findUnique({
    where: { id },
    select: { nomorSurat: true },
  });
  return { title: surat ? `Surat keluar ${surat.nomorSurat}` : "Surat keluar" };
}

export default async function DetailSuratKeluar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await konteks();
  if (!ctx) throw new Error("Konteks tidak ada");

  const surat = await prisma.suratKeluar.findFirst({
    where: { id, unitId: { in: ctx.cakupanUnitIds } },
    include: {
      unit: { select: { nama: true, kode: true, level: true } },
      dibuatOleh: { select: { nama: true } },
    },
  });
  if (!surat) notFound();

  const riwayat = await prisma.suratRiwayat.findMany({
    where: { suratId: id, suratJenis: "KELUAR" },
    orderBy: { dibuatPada: "desc" },
    include: { oleh: { select: { nama: true } } },
  });

  const tahapBerikut = TRANSISI_KELUAR[surat.status].map((nilai) => {
    const meta = STATUS_KELUAR.find((s) => s.nilai === nilai);
    return { nilai, label: meta?.label ?? nilai, deskripsi: meta?.deskripsi ?? "" };
  });

  return (
    <div className="mx-auto w-full max-w-[74rem] px-4 py-4">
      <Link
        href="/surat-keluar"
        data-cetak="sembunyi"
        className="mb-3 inline-flex items-center gap-1 rounded-kontrol text-[12.5px] font-medium text-tinta-2 hover:text-tinta"
      >
        <ChevronLeft aria-hidden className="size-3.5" />
        Kembali ke daftar surat keluar
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
            <StatusKeluar status={surat.status} />
          </span>
        }
        aksi={
          <>
            <TombolCetak />
            {ctx.bisaHapus ? (
              <TombolHapus nomorSurat={surat.nomorSurat} suratId={surat.id} jenis="KELUAR" />
            ) : null}
            <Link href={`/surat-keluar/${surat.id}/ubah`}>
              <Tombol variant="kedua" ukuran="md">
                <Pencil aria-hidden className="size-3.5" />
                Ubah isi surat
              </Tombol>
            </Link>
          </>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[1.55fr_1fr]">
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
            <Baris label="Jenis surat">{JENIS_KELUAR_LABEL[surat.jenis]}</Baris>
            <Baris label="Sifat surat">{SIFAT_LABEL[surat.sifat]}</Baris>
            <Baris label="Tujuan">{surat.tujuan}</Baris>
            <Baris label="Perihal">{surat.perihal}</Baris>
            <Baris label="Penandatangan">{surat.penandatangan}</Baris>
            <Baris label="Catatan">{surat.catatan}</Baris>
            <Baris label="Unit kerja">
              {LEVEL_UNIT[surat.unit.level]} {surat.unit.nama}
            </Baris>
            <Baris label="Dibuat oleh">
              {surat.dibuatOleh.nama}
              <span className="tabular ml-1.5 text-[12px] text-tinta-3">{waktu(surat.dibuatPada)}</span>
            </Baris>
          </dl>
        </section>

        <div className="space-y-3">
          <section className="rounded-panel border border-garis bg-lembar">
            <h2 className="border-b border-garis px-4 py-2 text-[13px] font-semibold text-tinta">
              Status pengiriman
            </h2>
            <div className="px-4 py-3">
              <DialogStatus
                aksi={ubahStatusKeluar.bind(null, surat.id)}
                judul="Ubah status surat keluar"
                deskripsi={`Surat saat ini berstatus “${STATUS_KELUAR.find((s) => s.nilai === surat.status)?.label}”. Status hanya bisa maju satu tahap.`}
                labelSimpan="Simpan status"
                tahapBerikut={tahapBerikut}
              />
            </div>
          </section>

          <section className="rounded-panel border border-garis bg-lembar">
            <h2 className="border-b border-garis px-4 py-2 text-[13px] font-semibold text-tinta">
              Riwayat status
            </h2>
            <Riwayat baris={riwayat} jenis="KELUAR" />
          </section>
        </div>
      </div>
    </div>
  );
}