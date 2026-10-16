import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Paginator. Menampilkan rentang data ("1–25 dari 143"), bukan sekadar nomor
 * halaman — petugas perlu tahu apakah daftar ini seluruh arsip atau hanya
 * bagian pertama.
 */
export function Paginasi({
  halaman,
  total,
  perHalaman,
  buatUrl,
}: {
  halaman: number;
  total: number;
  perHalaman: number;
  buatUrl: (halaman: number) => string;
}) {
  const totalHalaman = Math.max(1, Math.ceil(total / perHalaman));
  if (total === 0) return null;

  const dari = (halaman - 1) * perHalaman + 1;
  const sampai = Math.min(halaman * perHalaman, total);

  return (
    <nav
      aria-label="Paginasi daftar surat"
      data-cetak="sembunyi"
      className="flex flex-col gap-2.5 border-t border-garis p-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-3 sm:py-2"
    >
      <p className="tabular text-[12px] text-tinta-2 text-center sm:text-left" aria-live="polite">
        Menampilkan <span className="font-semibold text-tinta">{dari}</span>–
        <span className="font-semibold text-tinta">{sampai}</span> dari {total} surat
      </p>

      {totalHalaman > 1 ? (
        <ul className="flex items-center justify-center gap-1">
          <li>
            <Link
              href={halaman > 1 ? buatUrl(halaman - 1) : "#"}
              aria-disabled={halaman === 1}
              tabIndex={halaman === 1 ? -1 : undefined}
              className={[
                "inline-flex size-7 items-center justify-center rounded-kontrol border border-garis-kuat bg-lembar",
                "text-tinta-2 hover:bg-panel hover:text-tinta",
                halaman === 1 && "pointer-events-none opacity-40",
              ].join(" ")}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft aria-hidden className="size-3.5" />
            </Link>
          </li>

          {nomorHalamanTerlihat(halaman, totalHalaman).map((n, i) =>
            n === null ? (
              <li key={`gap-${i}`} aria-hidden className="px-0.5 text-[12px] text-tinta-3">
                …
              </li>
            ) : (
              <li key={n}>
                <Link
                  href={buatUrl(n)}
                  aria-current={n === halaman ? "page" : undefined}
                  className={[
                    "tabular inline-flex size-7 items-center justify-center rounded-kontrol border text-[12.5px] font-medium",
                    n === halaman
                      ? "border-hijau bg-hijau text-white"
                      : "border-garis-kuat bg-lembar text-tinta-2 hover:bg-panel hover:text-tinta",
                  ].join(" ")}
                >
                  {n}
                </Link>
              </li>
            ),
          )}

          <li>
            <Link
              href={halaman < totalHalaman ? buatUrl(halaman + 1) : "#"}
              aria-disabled={halaman === totalHalaman}
              tabIndex={halaman === totalHalaman ? -1 : undefined}
              className={[
                "inline-flex size-7 items-center justify-center rounded-kontrol border border-garis-kuat bg-lembar",
                "text-tinta-2 hover:bg-panel hover:text-tinta",
                halaman === totalHalaman && "pointer-events-none opacity-40",
              ].join(" ")}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight aria-hidden className="size-3.5" />
            </Link>
          </li>
        </ul>
      ) : null}
    </nav>
  );
}

/** Tampilkan maksimal 7 nomor: sekitar halaman aktif, dengan elipsis. */
function nomorHalamanTerlihat(halaman: number, total: number): Array<number | null> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const hasil = new Set<number>([1, total, halaman]);
  for (const d of [1, -1, 2, -2]) {
    const n = halaman + d;
    if (n >= 1 && n <= total) hasil.add(n);
  }
  const urut = [...hasil].sort((a, b) => a - b);

  const keluaran: Array<number | null> = [];
  let sebelumnya = 0;
  for (const n of urut) {
    if (sebelumnya && n - sebelumnya > 1) keluaran.push(null);
    keluaran.push(n);
    sebelumnya = n;
  }
  return keluaran;
}

/**
 * Kepala halaman: satu h1, satu kalimat konteks, lalu aksi utama.
 */
export function KepalaHalaman({
  judul,
  konteks,
  aksi,
}: {
  judul: string;
  konteks: ReactNode;
  aksi?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 px-3 pt-3 pb-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:px-4 sm:pt-4 sm:pb-3">
      <div className="min-w-0">
        <h1 className="text-[17px] font-bold tracking-[-0.015em] text-tinta sm:text-[19px]">{judul}</h1>
        <div className="mt-0.5 text-[12px] leading-relaxed text-tinta-2 sm:text-[12.5px]">{konteks}</div>
      </div>
      {aksi ? <div className="flex flex-wrap items-center gap-2">{aksi}</div> : null}
    </div>
  );
}

/** Bungkus tabel: satu bingkai hairline, kepala menempel saat menggulir. */
export function BingkaiTabel({
  children,
  judul,
  aksi,
}: {
  children: ReactNode;
  judul: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-garis bg-lembar">
      {judul ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-garis px-3 py-2">
          <h2 className="text-[13px] font-semibold text-tinta">{judul}</h2>
          {aksi ? <div className="flex items-center gap-2">{aksi}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}