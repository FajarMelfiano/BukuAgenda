import type { ReactNode } from "react";
import { FilterX, Inbox, RotateCcw, TriangleAlert } from "lucide-react";
import { Tombol } from "./tombol";

/**
 * Empty / error / loading. Ketiganya dirancang, bukan dibiarkan kosong:
 * setiap kondisi menjelaskan apa yang terjadi lalu memberi jalan keluar.
 */

/** Daftar kosong. */
export function Kosong({
  judul,
  penjelasan,
  aksi,
  ikon = <Inbox aria-hidden className="size-6" />,
}: {
  judul: string;
  penjelasan: string;
  aksi?: ReactNode;
  ikon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center" data-cetak="sembunyi">
      <div className="mb-3 flex size-11 items-center justify-center rounded-kontrol border border-garis bg-lembar text-tinta-3">
        {ikon}
      </div>
      <p className="text-[15px] font-semibold text-tinta">{judul}</p>
      <p className="mt-1 max-w-[46ch] text-[13px] leading-relaxed text-tinta-2">{penjelasan}</p>
      {aksi ? <div className="mt-4">{aksi}</div> : null}
    </div>
  );
}

/** Kosong karena filter aktif — pesan dan jalannya keluar berbeda dari kosong
 *  karena memang tidak ada data. */
export function KosongFilter({ aksi }: { aksi?: ReactNode }) {
  return (
    <Kosong
      judul="Tidak ada surat yang cocok dengan filter"
      penjelasan="Data ada, tetapi tidak pada kombinasi pencarian, status, jenis, dan bulan yang sedang aktif."
      ikon={<FilterX aria-hidden className="size-6" />}
      aksi={
        aksi ?? (
          <span className="text-[12.5px] text-tinta-3">Hapus filter di baris di atas untuk melihat semua surat.</span>
        )
      }
    />
  );
}

/** Kegagalan memuat data. Tidak pernah layar putih. */
export function Gagal({
  judul = "Gagal memuat daftar surat",
  penjelasan = "Periksa koneksi, lalu muat ulang. Data yang sudah tersimpan tidak hilang.",
  onUlang,
}: {
  judul?: string;
  penjelasan?: string;
  onUlang?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-14 text-center" data-cetak="sembunyi">
      <div className="mb-3 flex size-11 items-center justify-center rounded-kontrol border border-stempel-merah/30 bg-stempel-merah-latar text-stempel-merah">
        <TriangleAlert aria-hidden className="size-6" />
      </div>
      <p className="text-[15px] font-semibold text-tinta">{judul}</p>
      <p className="mt-1 max-w-[46ch] text-[13px] leading-relaxed text-tinta-2">{penjelasan}</p>
      {onUlang ? (
        <Tombol variant="kedua" ukuran="sm" className="mt-4" onClick={onUlang}>
          <RotateCcw aria-hidden className="size-3.5" />
          Muat ulang
        </Tombol>
      ) : null}
    </div>
  );
}

/** Kerangka tabel dengan bentuk yang sama dengan isi akhirnya. */
export function KerangkaTabel({ baris = 8, kolom = 6 }: { baris?: number; kolom?: number }) {
  const lebar = ["w-8", "w-24", "w-36", "w-48", "w-24", "w-20"];
  return (
    <div aria-busy="true" className="divide-y divide-garis" data-cetak="sembunyi">
      <span className="sr-only">Memuat daftar surat…</span>
      {Array.from({ length: baris }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-2.5">
          {Array.from({ length: kolom }, (_, k) => (
            <div
              key={k}
              className={`h-3 animate-pulse rounded-kontrol bg-panel ${lebar[k] ?? "w-20"}`}
              style={{ opacity: Math.max(0.25, 1 - i * 0.09) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Baris pesan galat di dalam formulir. */
export function GalatBaris({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="border-l-2 border-stempel-merah bg-stempel-merah-latar px-3 py-2 text-[12.5px] leading-relaxed text-stempel-merah"
    >
      {children}
    </p>
  );
}

/** Baris pesan berhasil di dalam formulir. */
export function BerhasilBaris({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="border-l-2 border-hijau bg-hijau-terang px-3 py-2 text-[12.5px] leading-relaxed text-hijau-gelap"
    >
      {children}
    </p>
  );
}