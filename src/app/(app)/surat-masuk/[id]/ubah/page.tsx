import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ubahSuratMasuk } from "@/app/actions/surat";
import { prisma } from "@/lib/db";
import { konteks } from "@/lib/sesi";
import { KepalaHalaman } from "@/components/ui/tabel";
import { FormSuratMasuk, type NilaiMasuk } from "@/components/form-surat";

export const metadata: Metadata = { title: "Ubah surat masuk" };

function keInputTanggal(v: Date): string {
  return new Date(v.getTime() - v.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export default async function UbahSuratMasuk({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await konteks();

  const surat = await prisma.suratMasuk.findFirst({
    where: { id, unitId: { in: ctx.cakupanUnitIds } },
  });
  if (!surat) notFound();

  const awal: Partial<NilaiMasuk> = {
    nomorSurat: surat.nomorSurat,
    tanggalSurat: keInputTanggal(surat.tanggalSurat),
    tanggalMasuk: keInputTanggal(surat.tanggalMasuk),
    pengirim: surat.pengirim,
    penerima: surat.penerima ?? "",
    jenis: surat.jenis,
    perihal: surat.perihal,
    disposisi: surat.disposisi ?? "",
    diteruskanKe: surat.diteruskanKe ?? "",
    catatan: surat.catatan ?? "",
    lampiran: surat.lampiran ?? "",
  } as Partial<NilaiMasuk>;

  return (
    <div className="mx-auto w-full max-w-[52rem] px-4 py-4">
      <Link
        href={`/surat-masuk/${id}`}
        data-cetak="sembunyi"
        className="mb-3 inline-flex items-center gap-1 rounded-kontrol text-[12.5px] font-medium text-tinta-2 hover:text-tinta"
      >
        <ChevronLeft aria-hidden className="size-3.5" />
        Kembali ke rincian surat
      </Link>

      <KepalaHalaman
        judul="Ubah isi surat masuk"
        konteks={`Nomor ${surat.nomorSurat}. Status dan riwayat tidak ikut berubah dari halaman ini.`}
      />

      <div className="rounded-panel border border-garis bg-lembar p-4">
        <FormSuratMasuk
          aksi={ubahSuratMasuk.bind(null, id)}
          mode="ubah"
          hrefBatal={`/surat-masuk/${id}`}
          awal={awal}
        />
      </div>
    </div>
  );
}