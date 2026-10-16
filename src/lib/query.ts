import "server-only";
import type { Prisma } from "@prisma/client";
import { TRANSISI_MASUK, TRANSISI_KELUAR, type StatusMasuk, type StatusKeluar } from "./domain";

/**
 * Pembangun klausa WHERE untuk daftar surat, dipakai bersama oleh halaman
 * daftar, ekspor CSV, dan penghitungan angka. Setiap query WAJIB lewat sini
 * supaya batas unit (cakupan pengguna) tidak pernah terlupa di satu halaman.
 */

export type ParameterWhere = {
  unitIds: string[];
  q?: string;
  status?: string;
  jenis?: string;
  bulan?: string;
  unitId?: string;
};

/** some() helper: memecah satu kata kunci menjadi beberapa klausa OR. */
function atauTeks(teks: string, kolom: Array<"nomorSurat" | "pengirim" | "tujuan" | "perihal">) {
  return teks
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .flatMap((t) => kolom.map((k) => ({ [k]: { contains: t, mode: "insensitive" } })));
}

export function whereMasuk(p: ParameterWhere): Prisma.SuratMasukWhereInput {
  const and: Prisma.SuratMasukWhereInput[] = [{ unitId: { in: p.unitIds } }];

  if (p.unitId && p.unitIds.includes(p.unitId)) and.push({ unitId: p.unitId });
  if (p.status) and.push({ status: p.status as Prisma.EnumStatusSuratMasukFilter });
  if (p.jenis) and.push({ jenis: p.jenis as Prisma.EnumJenisSuratMasukFilter });
  if (p.bulan) {
    const [tahun, bulan] = p.bulan.split("-").map(Number);
    if (tahun && bulan) {
      and.push({
        tanggalMasuk: { gte: new Date(tahun, bulan - 1, 1), lt: new Date(tahun, bulan, 1) },
      });
    }
  }
  if (p.q?.trim()) {
    and.push({ OR: atauTeks(p.q, ["nomorSurat", "pengirim", "perihal"]) });
  }

  return { AND: and };
}

export function whereKeluar(p: ParameterWhere): Prisma.SuratKeluarWhereInput {
  const and: Prisma.SuratKeluarWhereInput[] = [{ unitId: { in: p.unitIds } }];

  if (p.unitId && p.unitIds.includes(p.unitId)) and.push({ unitId: p.unitId });
  if (p.status) and.push({ status: p.status as Prisma.EnumStatusSuratKeluarFilter });
  if (p.jenis) and.push({ jenis: p.jenis as Prisma.EnumJenisSuratKeluarFilter });
  if (p.bulan) {
    const [tahun, bulan] = p.bulan.split("-").map(Number);
    if (tahun && bulan) {
      and.push({
        tanggalSurat: { gte: new Date(tahun, bulan - 1, 1), lt: new Date(tahun, bulan, 1) },
      });
    }
  }
  if (p.q?.trim()) {
    and.push({ OR: atauTeks(p.q, ["nomorSurat", "tujuan", "perihal"]) });
  }

  return { AND: and };
}

export function bolehTransisiMasuk(dari: string, ke: string): boolean {
  return (TRANSISI_MASUK[dari as StatusMasuk] ?? []).includes(ke as StatusMasuk);
}

export function bolehTransisiKeluar(dari: string, ke: string): boolean {
  return (TRANSISI_KELUAR[dari as StatusKeluar] ?? []).includes(ke as StatusKeluar);
}

/** Ringkasan filter aktif, untuk ditampilkan diUI. */
export function ringkasFilter(p: ParameterWhere): string[] {
  const bagian: string[] = [];
  if (p.q) bagian.push(`“${p.q}”`);
  if (p.status) bagian.push(`status ${p.status.toLowerCase()}`);
  if (p.jenis) bagian.push(`jenis ${p.jenis.toLowerCase()}`);
  if (p.bulan) bagian.push(`bulan ${p.bulan}`);
  return bagian;
}