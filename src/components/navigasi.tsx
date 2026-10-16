"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, Inbox, Send } from "lucide-react";

/**
 * Navigasi utama. Tepat tiga item — sesuai ruang lingkup aplikasi: surat
 * masuk, surat keluar, rekap & arsip. Tidak ada hamburger di layar desktop;
 * di bawah 768px baris ini berubah menjadi tab bar di bagian bawah.
 */
const MENU = [
  { href: "/surat-masuk", label: "Surat Masuk", Ikon: Inbox },
  { href: "/surat-keluar", label: "Surat Keluar", Ikon: Send },
  { href: "/rekap", label: "Rekap & Arsip", Ikon: Archive },
] as const;

export function Navigasi() {
  const pathname = usePathname();

  const aktif = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        data-cetak="sembunyi"
        className="hidden w-[13.5rem] shrink-0 flex-col border-r border-garis bg-panel md:flex"
      >
        <ul className="flex flex-col gap-0.5 p-2">
          {MENU.map(({ href, label, Ikon }) => {
            const terpilih = aktif(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={terpilih ? "page" : undefined}
                  className={[
                    "relative flex items-center gap-2.5 rounded-kontrol py-1.5 pl-3 pr-2",
                    "text-[13.5px] transition-colors duration-100",
                    terpilih
                      ? "bg-hijau-terang font-semibold text-hijau-gelap"
                      : "font-medium text-tinta-2 hover:bg-lembar hover:text-tinta",
                  ].join(" ")}
                >
                  {/* Item aktif ditandai dua kali: garis tinta di kiri (bentuk
                      seperti tab map) DAN latar hijau. Bukan warna saja. */}
                  {terpilih ? (
                    <span aria-hidden className="absolute top-1 bottom-1 left-0 w-[3px] rounded-full bg-hijau" />
                  ) : null}
                  <Ikon aria-hidden className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto border-t border-garis px-4 py-3">
          <p className="meta">Nomor surat keluar</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-tinta-2">
            Dibangkitkan otomatis per unit dan per tahun, jadi tidak mungkin
            nomor sama tercatat dua kali.
          </p>
        </div>
      </nav>

      {/* Di bawah 768px: tab bar di bawah, selalu terlihat, tanpa hamburger. */}
      <nav
        aria-label="Navigasi utama"
        data-cetak="sembunyi"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-garis bg-lembar md:hidden"
      >
        {MENU.map(({ href, label, Ikon }) => {
          const terpilih = aktif(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={terpilih ? "page" : undefined}
              className={[
                "flex min-h-[56px] flex-col items-center justify-center gap-0.5 border-t-2 text-[11px]",
                terpilih
                  ? "border-hijau font-semibold text-hijau-gelap"
                  : "border-transparent font-medium text-tinta-2",
              ].join(" ")}
            >
              <Ikon aria-hidden className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}