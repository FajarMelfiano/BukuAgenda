import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

/**
 * Font di-self-host oleh next/font: berkas .woff2 diambil saat build dan
 * disajikan dari origin sendiri. Tidak ada <link> ke Google Fonts di HTML,
 * jadi alamat IP petugas tidak bocor ke pihak ketiga.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Buku Agenda — Surat Masuk & Keluar",
    template: "%s · Buku Agenda",
  },
  description:
    "Sistem manajemen surat masuk dan surat keluar untuk kelurahan dan kecamatan: mencatat, mendisposisi, melacak, dan mencetak buku agenda.",
  applicationName: "Buku Agenda",
  robots: { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f4f0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}