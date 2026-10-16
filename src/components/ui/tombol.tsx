import type { ComponentProps, ReactNode } from "react";

/**
 * Primitif tombol. Tiga jenjang, tidak ada yang keempat:
 *  - utama   : satu per bagian, aksi yang ingin dijalankan pengguna
 *  - kedua   : aksi alternatif yang sah (ekspor, cetak, batal)
 *  - halus   : aksi-lowercase di dalam baris tabel dan dialog
 * Satu radius untuk semua kontrol (2px). Tidak ada gradient, tidak ada
 * bayangan, tidak ada "hover lift".
 */

type Variant = "utama" | "kedua" | "halus" | "bahaya";

const gaya: Record<Variant, string> = {
  utama:
    "bg-hijau text-white border border-hijau hover:bg-hijau-gelap hover:border-hijau-gelap active:bg-hijau-gelap",
  kedua:
    "bg-lembar text-tinta border border-garis-kuat hover:bg-panel hover:border-tinta-3 active:bg-panel",
  halus:
    "bg-transparent text-tinta-2 border border-transparent hover:bg-panel hover:text-tinta active:bg-panel",
  bahaya:
    "bg-lembar text-stempel-merah border border-stempel-merah/40 hover:bg-stempel-merah hover:text-white hover:border-stempel-merah active:bg-stempel-merah",
};

const ukuran = {
  sm: "h-7 px-2 text-[12px] gap-1",
  md: "h-8 px-3 text-[13px] gap-1.5",
  lg: "h-9 px-3.5 text-[14px] gap-1.5",
} as const;

export type TombolProps = {
  variant?: Variant;
  ukuran?: keyof typeof ukuran;
} & ComponentProps<"button">;

export function Tombol({
  variant = "kedua",
  ukuran: uk = "md",
  className = "",
  type = "button",
  ...sisa
}: TombolProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-kontrol font-medium whitespace-nowrap",
        "transition-colors duration-100 select-none",
        "disabled:pointer-events-none disabled:opacity-45",
        ukuran[uk],
        gaya[variant],
        className,
      ].join(" ")}
      {...sisa}
    />
  );
}

export function Ikon({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center [&>svg]:size-3.5">
      {children}
    </span>
  );
}