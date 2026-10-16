/**
 * Lambang Buku Agenda.
 *
 * Mark geometric tunggal: buku agenda terbuka — garis-garis halaman dengan
 * panjang yang menurun dan garis punggung di kiri. Ini satu-satunya SVG yang
 * digambar tangan di aplikasi; semua ikon antarmuka lain datang dari Lucide.
 * Bentuknya bisa diganti lewat prop `namaUnit` tanpa menyentuh logika.
 */
export function Lambang({ className = "size-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="Lambang Buku Agenda"
      fill="none"
    >
      <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="2.5" className="fill-hijau" />
      <path d="M10 7.5v17" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M13.5 10.5h9M13.5 14.5h9M13.5 18.5h6"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Lambang unit: inisial kode unit dalam kotak hairline, dipakai di pemilih unit. */
export function LambangUnit({ kode, className = "" }: { kode: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={[
        "inline-flex size-6 shrink-0 items-center justify-center rounded-kontrol border border-garis-kuat",
        "bg-lembar font-mono text-[11px] font-semibold text-tinta-2",
        className,
      ].join(" ")}
    >
      {kode}
    </span>
  );
}