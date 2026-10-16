import { SLA_HARI } from "./domain";

const TZ = "Asia/Jakarta";

const tanggalPendek = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});

const tanggalPanjang = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

const waktuLengkap = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const bulanPanjang = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: TZ,
});

const angka = new Intl.NumberFormat("id-ID");
const nomorUrut = new Intl.NumberFormat("id-ID", { minimumIntegerDigits: 3 });

export function tglPendek(v: Date | string): string {
  return tanggalPendek.format(typeof v === "string" ? new Date(v) : v);
}

export function tglPanjang(v: Date | string): string {
  return tanggalPanjang.format(typeof v === "string" ? new Date(v) : v);
}

export function waktu(v: Date | string): string {
  return waktuLengkap.format(typeof v === "string" ? new Date(v) : v);
}

export function namaBulan(v: Date | string): string {
  return bulanPanjang.format(typeof v === "string" ? new Date(v) : v);
}

export function angkaId(v: number): string {
  return angka.format(v);
}

export function urutId(v: number): string {
  return nomorUrut.format(v);
}

/** "2026-10" untuk <input type="month"> dan query filter. */
export function bulanKunci(v: Date | string = new Date()): string {
  const d = typeof v === "string" ? new Date(v) : v;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Batas bawah & atas <input type="date"> dihitung dalam zona Asia/Jakarta. */
export function rentangTahun(): { min: string; maks: string } {
  const sekarang = new Date();
  return {
    min: `${sekarang.getFullYear() - 6}-01-01`,
    maks: `${sekarang.getFullYear() + 1}-12-31`,
  };
}

export function hariSejak(v: Date | string, dari: Date = new Date()): number {
  const tgl = typeof v === "string" ? new Date(v) : v;
  const awal = new Date(tgl.getFullYear(), tgl.getMonth(), tgl.getDate());
  const akhir = new Date(dari.getFullYear(), dari.getMonth(), dari.getDate());
  return Math.round((akhir.getTime() - awal.getTime()) / 86_400_000);
}

/** Surat masuk yang sudah melewati SLA dan belum selesai. */
export function sudahTerlambat(
  tanggalMasuk: Date | string,
  status: string,
  dari: Date = new Date(),
): boolean {
  if (status === "SELESAI" || status === "DITOLAK") return false;
  return hariSejak(tanggalMasuk, dari) > SLA_HARI;
}

export function hariPendek(n: number): string {
  if (n === 0) return "hari ini";
  if (n === 1) return "1 hari lalu";
  if (n < 7) return `${n} hari lalu`;
  if (n < 30) return `${Math.floor(n / 7)} minggu lalu`;
  return `${Math.floor(n / 30)} bulan lalu`;
}

/** Bersihkan teks sebelum masuk CSV: cegah formula injection pada Excel. */
export function selCsv(nilai: unknown): string {
  let teks = nilai === null || nilai === undefined ? "" : String(nilai);
  if (/^[=+\-@\t\r]/.test(teks)) teks = `'${teks}`;
  if (/[",\n\r]/.test(teks)) teks = `"${teks.replaceAll('"', '""')}"`;
  return teks;
}

export function unduhCsv(namaBerkas: string, isi: string): Response {
  return new Response(isi, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${namaBerkas}"`,
      "Cache-Control": "no-store",
    },
  });
}