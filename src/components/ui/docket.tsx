import type { ComponentProps } from "react";

/**
 * Kotak docket — tanda tangan produk. Nomor surat ditampilkan seperti nomor
 * agenda yang dicetak di kertas: bingkai hairline, huruf mono, angka
 * sejajar. Fungsinya nyata (klik untuk menyalin), bentuknya pula mengikat
 * aplikasi ini ke artefak fisiknya.
 */

export function Docket({
  children,
  besar = false,
  salin = true,
  className = "",
  ...sisa
}: {
  children: string;
  besar?: boolean;
  salin?: boolean;
} & ComponentProps<"span">) {
  return (
    <span
      className={["docket", besar && "docket-lg", className].join(" ")}
      data-nomor-surat={children}
      tabIndex={salin ? 0 : undefined}
      title={salin ? "Klik untuk menyalin nomor surat" : undefined}
      {...sisa}
    >
      {children}
    </span>
  );
}