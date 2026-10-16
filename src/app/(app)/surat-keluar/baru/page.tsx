import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { pratinjauNomorKeluar, simpanSuratKeluar } from "@/app/actions/surat";
import { FormSuratKeluar } from "@/components/form-surat";
import { KepalaHalaman } from "@/components/ui/tabel";
import { konteks } from "@/lib/sesi";

export const metadata: Metadata = { title: "Buat surat keluar" };

export default async function BuatSuratKeluar() {
  const ctx = await konteks();
  if (!ctx) throw new Error("Konteks tidak ada");
  const tahun = new Date().getFullYear();
  const pratinjau = await pratinjauNomorKeluar(tahun);

  return (
    <div className="mx-auto w-full max-w-[52rem] px-4 py-4">
      <Link
        href="/surat-keluar"
        data-cetak="sembunyi"
        className="mb-3 inline-flex items-center gap-1 rounded-kontrol text-[12.5px] font-medium text-tinta-2 hover:text-tinta"
      >
        <ChevronLeft aria-hidden className="size-3.5" />
        Kembali ke daftar surat keluar
      </Link>

      <KepalaHalaman
        judul="Buat surat keluar"
        konteks={`Nomor surat diterbitkan otomatis oleh ${ctx.unit.nama} dan tidak dapat diubah setelah disimpan.`}
      />

      <div className="rounded-panel border border-garis bg-lembar p-4">
        <FormSuratKeluar
          aksi={simpanSuratKeluar}
          mode="buat"
          hrefBatal="/surat-keluar"
          pratinjauNomor={pratinjau}
          awal={{ tanggalSurat: new Date().toISOString().slice(0, 10), sifat: "BIASA", status: "DRAFT" }}
        />
      </div>
    </div>
  );
}