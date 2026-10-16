import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { simpanSuratMasuk } from "@/app/actions/surat";
import { FormSuratMasuk } from "@/components/form-surat";
import { KepalaHalaman } from "@/components/ui/tabel";
import { konteks } from "@/lib/sesi";

export const metadata: Metadata = { title: "Catat surat masuk" };

const HARI_INI = new Date().toISOString().slice(0, 10);

export default async function CatatSuratMasuk() {
  const ctx = await konteks();

  return (
    <div className="mx-auto w-full max-w-[52rem] px-4 py-4">
      <Link
        href="/surat-masuk"
        data-cetak="sembunyi"
        className="mb-3 inline-flex items-center gap-1 rounded-kontrol text-[12.5px] font-medium text-tinta-2 hover:text-tinta"
      >
        <ChevronLeft aria-hidden className="size-3.5" />
        Kembali ke daftar surat masuk
      </Link>

      <KepalaHalaman
        judul="Catat surat masuk"
        konteks={`Berkas yang diterima ${ctx.unit.nama}. Nomor surat dicatat apa adanya seperti pada berkas aslinya.`}
      />

      <div className="rounded-panel border border-garis bg-lembar p-4">
        <FormSuratMasuk
          aksi={simpanSuratMasuk}
          mode="buat"
          hrefBatal="/surat-masuk"
          awal={{ tanggalSurat: HARI_INI, tanggalMasuk: HARI_INI }}
        />
      </div>
    </div>
  );
}