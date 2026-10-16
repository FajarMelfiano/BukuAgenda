import { z } from "zod";

/**
 * Skema validasi. Semua form dan server action memakainya — bukan hanya sisi
 * peramban. Panjang dibatasi karena kolom database punya batas dan input
 * raksasa adalah cara termudah membuat antarmuka rusak.
 */

const teksSingkat = (maks: number, label: string) =>
  z
    .string()
    .trim()
    .max(maks, `${label} maksimal ${maks} karakter.`);

const wajib = (maks: number, label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi.`)
    .max(maks, `${label} maksimal ${maks} karakter.`);

const tanggal = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus diisi dengan format tahun-bulan-hari.");

/** Nomor surat: huruf, angka, titik, garis, dan spasi saja. */
const nomorSurat = z
  .string()
  .trim()
  .min(1, "Nomor surat wajib diisi.")
  .max(64, "Nomor surat maksimal 64 karakter.")
  .regex(
    /^[A-Za-z0-9.\-\/ ]+$/,
    "Nomor surat hanya boleh berisi huruf, angka, titik, garis miring, dan spasi.",
  );

export const MASUK_NILAI = [
  "UNDANGAN",
  "KEPUTUSAN",
  "PERMOHONAN",
  "INFORMASI",
  "TAGIHAN",
  "SANKSI",
  "LAINNYA",
] as const;
export const KELUAR_NILAI = [
  "EDARAN",
  "REKOMENDASI",
  "PERMOHONAN",
  "BALASAN",
  "UNDANGAN",
  "LAINNYA",
] as const;
export const SIFAT_NILAI = ["BIASA", "PENTING", "SANGAT_PENTING"] as const;
export const STATUS_MASUK_NILAI = ["BARU", "DISPOSISI", "PROSES", "SELESAI", "DITOLAK"] as const;
export const STATUS_KELUAR_NILAI = ["DRAFT", "DIKIRIM", "DITERIMA", "DITOLAK"] as const;

const opsional = (maks: number, label: string) =>
  z
    .string()
    .trim()
    .max(maks, `${label} maksimal ${maks} karakter.`)
    .optional()
    .transform((v) => (v ? v : null));

export const suratMasukSkema = z.object({
  nomorSurat,
  tanggalSurat: tanggal,
  tanggalMasuk: tanggal,
  pengirim: wajib(160, "Pengirim"),
  penerima: opsional(120, "Penerima"),
  jenis: z.enum(MASUK_NILAI, { message: "Jenis surat belum dipilih." }),
  perihal: wajib(500, "Perihal"),
  disposisi: opsional(500, "Disposisi"),
  diteruskanKe: opsional(120, "Diteruskan kepada"),
  catatan: opsional(500, "Catatan"),
  lampiran: opsional(200, "Lampiran"),
});

export const suratKeluarSkema = z.object({
  tanggalSurat: tanggal,
  tujuan: wajib(160, "Tujuan"),
  jenis: z.enum(KELUAR_NILAI, { message: "Jenis surat belum dipilih." }),
  sifat: z.enum(SIFAT_NILAI, { message: "Sifat surat belum dipilih." }),
  perihal: wajib(500, "Perihal"),
  penandatangan: opsional(120, "Penandatangan"),
  catatan: opsional(500, "Catatan"),
  status: z.enum(STATUS_KELUAR_NILAI).default("DRAFT"),
});

export const statusMasukSkema = z.object({
  status: z.enum(STATUS_MASUK_NILAI, { message: "Status belum dipilih." }),
  disposisi: opsional(500, "Disposisi"),
  diteruskanKe: opsional(120, "Diteruskan kepada"),
  catatan: opsional(500, "Catatan"),
});

export const statusKeluarSkema = z.object({
  status: z.enum(STATUS_KELUAR_NILAI, { message: "Status belum dipilih." }),
  catatan: opsional(500, "Catatan"),
});

export const masukSkema = z.object({
  username: z.string().trim().min(1, "Nama pengguna wajib diisi."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const gantiSandiSkema = z
  .object({
    sandiSekarang: z.string().min(1, "Kata sandi sekarang wajib diisi."),
    sandiBaru: z
      .string()
      .min(8, "Kata sandi baru minimal 8 karakter.")
      .max(72, "Kata sandi baru maksimal 72 karakter."),
    sandiUlangi: z.string().min(1, "Ulangi kata sandi baru."),
  })
  .refine((v) => v.sandiBaru === v.sandiUlangi, {
    message: "Pengulangan kata sandi tidak sama.",
    path: ["sandiUlangi"],
  })
  .refine((v) => v.sandiSekarang !== v.sandiBaru, {
    message: "Kata sandi baru harus berbeda dari yang sekarang.",
    path: ["sandiBaru"],
  });

/** Parameter filter dari URL — sumber kebenaran state tampilan (dapat di-bookmark). */
export const filterSkema = z.object({
  q: z.string().trim().max(120).optional(),
  status: z.string().trim().max(20).optional(),
  jenis: z.string().trim().max(24).optional(),
  bulan: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/, "Format bulan harus tahun-bulan.")
    .optional(),
  unit: z.string().trim().max(40).optional(),
  halaman: z.coerce.number().int().min(1).max(1000).optional(),
});

export type SuratMasukInput = z.infer<typeof suratMasukSkema>;
export type SuratKeluarInput = z.infer<typeof suratKeluarSkema>;
export type Filter = z.infer<typeof filterSkema>;

/** Bentuk hasil validasi yang dipakai form: peta field → pesan pertama. */
export function keFieldError(galat: z.ZodError): Record<string, string> {
  const keluar: Record<string, string> = {};
  for (const isu of galat.issues) {
    const kunci = isu.path[0];
    if (typeof kunci === "string" && !(kunci in keluar)) keluar[kunci] = isu.message;
  }
  return keluar;
}