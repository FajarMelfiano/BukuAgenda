import type { ReactNode } from "react";

/**
 * Lencana status. Warna di sini adalah warna *stempel* — seperti cap tinta di
 * atas kertas. Setiap lencana selalu membawa teks dan titik, tidak pernah
 * warna saja, supaya tetap terbaca oleh pengguna dengan buta warna dan oleh
 * pembaca layar.
 */

type Warna = "amber" | "biru" | "ungu" | "hijau" | "merah" | "netral";

export type { Warna };

const GAYA: Record<Warna, string> = {
  amber: "text-stempel-amber bg-stempel-amber-latar border-stempel-amber/25",
  biru: "text-stempel-biru bg-stempel-biru-latar border-stempel-biru/25",
  ungu: "text-stempel-ungu bg-stempel-ungu-latar border-stempel-ungu/25",
  hijau: "text-stempel-hijau bg-stempel-hijau-latar border-stempel-hijau/25",
  merah: "text-stempel-merah bg-stempel-merah-latar border-stempel-merah/25",
  netral: "text-tinta-2 bg-panel border-garis-kuat",
};

const TITIK: Record<Warna, string> = {
  amber: "bg-stempel-amber",
  biru: "bg-stempel-biru",
  ungu: "bg-stempel-ungu",
  hijau: "bg-stempel-hijau",
  merah: "bg-stempel-merah",
  netral: "bg-tinta-3",
};

export function Lencana({
  warna = "netral",
  children,
  judul,
}: {
  warna?: Warna;
  children: ReactNode;
  judul?: string;
}) {
  return (
    <span
      title={judul}
      className={[
        "inline-flex items-center gap-1.5 rounded-kontrol border px-1.5 py-0.5",
        "text-[11.5px] font-semibold whitespace-nowrap",
        GAYA[warna],
      ].join(" ")}
    >
      <span className={["size-1.5 rounded-full", TITIK[warna]].join(" ")} aria-hidden />
      {children}
    </span>
  );
}