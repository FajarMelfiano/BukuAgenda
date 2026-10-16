"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { Tombol } from "@/components/ui/tombol";

/**
 * Cetak memakai dialog cetak peramban, bukan menghasilkan PDF di server.
 * Alasannya: dokumen ini adalah lembar agenda untuk arsip fisik, dan
 * pengguna lebih butuh hasil yang bisa langsung dimasukkan ke map kertas.
 */
export function TombolCetak({ label = "Cetak" }: { label?: string }) {
  const [siap, setSiap] = useState(false);
  useEffect(() => setSiap(true), []);

  return (
    <Tombol
      variant="kedua"
      ukuran="md"
      data-cetak="sembunyi"
      onClick={() => window.print()}
      disabled={!siap}
    >
      <Printer aria-hidden className="size-3.5" />
      {label}
    </Tombol>
  );
}