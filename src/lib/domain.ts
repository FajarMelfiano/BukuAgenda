/**
 * Konstanta domain. Semua label Bahasa Indonesia dan urutan status hidup di
 * sini supaya tidak ada string Bahasa Indonesia yang ditulis ulang di banyak
 * tempat (sumber utama ketidakkonsistenan di UI).
 */

export const LEVEL_UNIT = {
  KELURAHAN: "Kelurahan",
  KECAMATAN: "Kecamatan",
} as const;

export const PERAN = {
  PETUGAS: "Petugas",
  KEPALA: "Kepala Unit",
} as const;

/** Status surat masuk beserta urutan maj monkunannya (monoton naik). */
export const STATUS_MASUK = [
  {
    nilai: "BARU",
    label: "Baru",
    ringkas: "Baru",
    warna: "amber",
    deskripsi: "Sudah dicatat, belum diberi arahan apa pun.",
  },
  {
    nilai: "DISPOSISI",
    label: "Disposisi",
    ringkas: "Disposisi",
    warna: "biru",
    deskripsi: "Sudah diarahkan ke petugas yang menangani surat ini.",
  },
  {
    nilai: "PROSES",
    label: "Diproses",
    ringkas: "Proses",
    warna: "ungu",
    deskripsi: "Sedang dikerjakan, ada tindak lanjut berjalan.",
  },
  {
    nilai: "SELESAI",
    label: "Selesai",
    ringkas: "Selesai",
    warna: "hijau",
    deskripsi: "Tindak lanjut tuntas, berkas bisa diarsipkan.",
  },
] as const;

export const STATUS_KELUAR = [
  {
    nilai: "DRAFT",
    label: "Draft",
    ringkas: "Draft",
    warna: "netral",
    deskripsi: "Sudah dibuat, belum ditandatangani atau dikirim.",
  },
  {
    nilai: "DIKIRIM",
    label: "Dikirim",
    ringkas: "Dikirim",
    warna: "biru",
    deskripsi: "Sudah diserahkan ke tujuan atau diantar.",
  },
  {
    nilai: "DITERIMA",
    label: "Diterima",
    ringkas: "Diterima",
    warna: "hijau",
    deskripsi: "Tujuan sudah menerima dan hasilnya dicatat di buku agenda.",
  },
] as const;

export const JENIS_MASUK = [
  { nilai: "UNDANGAN", label: "Undangan" },
  { nilai: "KEPUTUSAN", label: "Keputusan" },
  { nilai: "PERMOHONAN", label: "Permohonan" },
  { nilai: "INFORMASI", label: "Informasi" },
  { nilai: "TAGIHAN", label: "Tagihan" },
  { nilai: "SANKSI", label: "Sanksi" },
  { nilai: "LAINNYA", label: "Lainnya" },
] as const;

export const JENIS_KELUAR = [
  { nilai: "EDARAN", label: "Surat Edaran" },
  { nilai: "REKOMENDASI", label: "Rekomendasi" },
  { nilai: "PERMOHONAN", label: "Permohonan" },
  { nilai: "BALASAN", label: "Balasan" },
  { nilai: "UNDANGAN", label: "Undangan" },
  { nilai: "LAINNYA", label: "Lainnya" },
] as const;

export const SIFAT_SURAT = [
  { nilai: "BIASA", label: "Biasa" },
  { nilai: "PENTING", label: "Penting" },
  { nilai: "SANGAT_PENTING", label: "Sangat Penting" },
] as const;

export type StatusMasuk = (typeof STATUS_MASUK)[number]["nilai"];
export type StatusKeluar = (typeof STATUS_KELUAR)[number]["nilai"];

export const STATUS_MASUK_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_MASUK.map((s) => [s.nilai, s.label]),
);
export const STATUS_KELUAR_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_KELUAR.map((s) => [s.nilai, s.label]),
);
export const JENIS_MASUK_LABEL: Record<string, string> = Object.fromEntries(
  JENIS_MASUK.map((j) => [j.nilai, j.label]),
);
export const JENIS_KELUAR_LABEL: Record<string, string> = Object.fromEntries(
  JENIS_KELUAR.map((j) => [j.nilai, j.label]),
);
export const SIFAT_LABEL: Record<string, string> = Object.fromEntries(
  SIFAT_SURAT.map((s) => [s.nilai, s.label]),
);

/** Transisi status yang diperbolehkan. Mundur sengaja tidak dibuka. */
export const TRANSISI_MASUK: Record<StatusMasuk, StatusMasuk[]> = {
  BARU: ["DISPOSISI"],
  DISPOSISI: ["PROSES"],
  PROSES: ["SELESAI"],
  SELESAI: [],
};

export const TRANSISI_KELUAR: Record<StatusKeluar, StatusKeluar[]> = {
  DRAFT: ["DIKIRIM"],
  DIKIRIM: ["DITERIMA"],
  DITERIMA: [],
};

/** Umur surat (hari) sebelum ditandai "terlambat" — SLA administrasi desa. */
export const SLA_HARI = 7;

export function bolehKe(
  statusMasuk: Record<string, string>,
  dari: string,
  ke: string,
): boolean {
  return (TRANSISI_MASUK[dari as StatusMasuk] ?? []).includes(ke as StatusMasuk);
}