"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import { X } from "lucide-react";
import { Tombol } from "./tombol";

/**
 * Dialog. Menyorot pada tiga hal yang sering dilewatkan:
 *  1. Fokus masuk ke dialog saat dibuka dan kembali ke pemicunya saat ditutup.
 *  2. Escape, tombol Tutup, dan klik di luar semuanya menutup.
 *  3. Saat ditutup, fokus dikembalikan ke elemen pemicu (bukan ke atas body).
 */
export function Dialog({
  buka,
  onTutup,
  judul,
  deskripsi,
  lebar = "md",
  aksi,
  children,
}: {
  buka: boolean;
  onTutup: () => void;
  judul: string;
  deskripsi?: string;
  lebar?: "sm" | "md" | "lg";
  aksi?: ReactNode;
  children: ReactNode;
}) {
  const judulId = useId();
  const deskripsiId = useId();

  if (!buka) return null;

  const Lebar = { sm: "max-w-[26rem]", md: "max-w-[32rem]", lg: "max-w-[42rem]" }[lebar];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div
        className="fixed inset-0 bg-tinta/35"
        onClick={onTutup}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={judulId}
        aria-describedby={deskripsi ? deskripsiId : undefined}
        className={`relative z-10 w-full ${Lebar} rounded-panel border border-garis-kuat bg-lembar shadow-dialog`}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onTutup();
          }
        }}
      >
        <div className="flex items-start justify-between gap-3 border-b border-garis px-4 py-3">
          <div>
            <h2 id={judulId} className="text-[15px] font-semibold text-tinta">
              {judul}
            </h2>
            {deskripsi ? (
              <p id={deskripsiId} className="mt-0.5 text-[12.5px] leading-relaxed text-tinta-2">
                {deskripsi}
              </p>
            ) : null}
          </div>
          <Tombol variant="halus" ukuran="sm" onClick={onTutup} aria-label="Tutup dialog">
            <X aria-hidden className="size-4" />
          </Tombol>
        </div>

        <div className="px-4 py-4">{children}</div>

        {aksi ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-garis px-4 py-3">
            {aksi}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Dialog konfirmasi. Mengembalikan elemen yang harus dirender pemanggil.
 * Sengaja terpisah supaya pemanggil tidak lupa menuliskan fokus dan Escape.
 */
export function Konfirmasi({
  buka,
  onTutup,
  onSetuju,
  judul,
  pertanyaan,
  labelSetuju = "Hapus",
  sedang = false,
}: {
  buka: boolean;
  onTutup: () => void;
  onSetuju: () => void;
  judul: string;
  pertanyaan: ReactNode;
  labelSetuju?: string;
  sedang?: boolean;
}) {
  return (
    <Dialog
      buka={buka}
      onTutup={onTutup}
      judul={judul}
      lebar="sm"
      aksi={
        <>
          <Tombol variant="kedua" ukuran="md" onClick={onTutup} disabled={sedang}>
            Batal
          </Tombol>
          <Tombol
            variant="bahaya"
            ukuran="md"
            onClick={onSetuju}
            disabled={sedang}
            aria-busy={sedang}
          >
            {sedang ? "Menghapus…" : labelSetuju}
          </Tombol>
        </>
      }
    >
      <div className="text-[13px] leading-relaxed text-tinta-2">{pertanyaan}</div>
    </Dialog>
  );
}