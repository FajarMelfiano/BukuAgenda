import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ubahSuratKeluar } from "@/app/actions/surat";
import { prisma } from "@/lib/db";
import { konteks } from "@/lib/sesi";
import { KepalaHalaman } from "@/components/ui/tabel";
import { Docket } from "@/components/ui/docket";
import { FormSuratKeluar, type NilaiKeluar } from "@/components/form-surat";

export const metadata: Metadata = { title: "Ubah surat keluar" };

function keInputTanggal(v: Date): string {
  return new Date(v.getTime() - v.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export default async function UbahSuratKeluar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await konteks();
  if (!ctx) throw new Error("Konteks tidak ada");

  const surat = await prisma.suratKeluar.findFirst({
    where: { id, unitId: { in: ctx.cakupanUnitIds } },
  });
  if (!surat) notFound();

  const awal: Partial<NilaiKeluar> = {
    tanggalSurat: keInputTanggal(surat.tanggalSurat),
    tujuan: surat.tujuan,
    jenis: surat.jenis,
    sifat: surat.sifat,
    perihal: surat.perihal,
    penandatangan: surat.penandatangan ?? "",
    catatan: surat.catatan ?? "",
    status: surat.status,
  };

  return (
    <div className="mx-auto w-full max-w-[52rem] px-4 py-4">
      <Link
        href={`/surat-keluar/${id}`}
        data-cetak="sembunyi"
        className="mb-3 inline-flex items-center gap-1 rounded-kontrol text-[12.5px] font-medium text-tinta-2 hover:text-tinta"
      >
        <ChevronLeft aria-hidden className="size-3.5" />
        Kembali ke rincian surat
      </Link>

      <KepalaHalaman
        judul="Ubah isi surat keluar"
        konteks={
          <span className="flex flex-wrap items-center gap-2">
            Nomor surat
            <Docket>{surat.nomorSurat}</Docket>
            <span className="text-tinta-3">tidak berubah setelah terbit.</span>
          </span>
        }
      />

      <div className="rounded-panel border border-garis bg-lembar p-4">
        <FormSuratKeluar
          aksi={ubahSuratKeluar.bind(null, id)}
          mode="ubah"
          hrefBatal={`/surat-keluar/${id}`}
          pratinjauNomor={surat.nomorSurat}
          awal={awal}
        />
      </div>
    </div>
  );
}