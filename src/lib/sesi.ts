import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { prisma } from "./db";

/**
 * Sesi memakai token acak 32 byte yang dikirim sebagai cookie httpOnly. Yang
 * disimpan di database bukan tokennya, melainkan SHA-256-nya — kalau database
 * bocor, cookie yang sudah dicuri tetap tidak bisa dipakai.
 */

export const NAMA_COOKIE = "buku_agenda_sesi";
const TTL_JAM = 8;
export const TTL_MS = TTL_JAM * 60 * 60 * 1000;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenBaru(): string {
  return randomBytes(32).toString("base64url");
}

function rahasia(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "SESSION_SECRET belum diisi atau terlalu pendek (minimal 32 karakter). " +
        "Isi di .env — contoh nilai acak: openssl rand -base64 48",
    );
  }
  return s;
}

/** Cookie sesi ditandatangani lewat HMAC agar cookie acak tidak bisa dipalsukan. */
function tandai(token: string): string {
  return `${token}.${mac(token)}`;
}

function mac(token: string): string {
  return createHmac("sha256", rahasia()).update(token).digest("base64url").slice(0, 27);
}

export function verifikasiTanda(token: string): boolean {
  const bagian = token.split(".");
  if (bagian.length !== 2) return false;
  const [tokenAsli, macDiberikan] = bagian as [string, string];
  if (!tokenAsli || !macDiberikan) return false;
  const a = Buffer.from(macDiberikan);
  const b = Buffer.from(mac(tokenAsli));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function opsiCookie(kedaluwarsa: Date) {
  return {
    name: NAMA_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires: kedaluwarsa,
  };
}

/** Root context untuk seluruh request: pengguna + cakupan unit yang boleh dilihat. */
export type Konteks = NonNullable<Awaited<ReturnType<typeof muatKonteks>>>;

/**
 * Cakupan unit:
 *  - Petugas / Kepala LEVEL_KELURAHAN → hanya kelurahannya sendiri.
 *  - Pengguna LEVEL_KECAMATAN → dirinya sendiri (unit kecamatan) + semua
 *    kelurahannya, supaya kecamatan bisa memantau tanpa ikut mengubah milik
   * kelurahan.
 */
const muatKonteks = cache(async (token: string | undefined) => {
  if (!token || !verifikasiTanda(token)) return null;
  const tokenAsli = token.split(".")[0];
  if (!tokenAsli) return null;

  const sesi = await prisma.sesi.findUnique({
    where: { tokenHash: hashToken(tokenAsli) },
    include: {
      pengguna: {
        include: { unit: { include: { anak: { select: { id: true, nama: true, kode: true, level: true } } } } },
      },
    },
  });

  if (!sesi) return null;
  if (sesi.kedaluwarsa.getTime() < Date.now()) return null;
  if (!sesi.pengguna.aktif) return null;

  const unit = sesi.pengguna.unit;
  const cakupanUnitIds = unit.level === "KECAMATAN"
    ? [unit.id, ...unit.anak.map((a) => a.id)]
    : [unit.id];

  return {
    pengguna: {
      id: sesi.pengguna.id,
      nama: sesi.pengguna.nama,
      username: sesi.pengguna.username,
      peran: sesi.pengguna.peran,
    },
    unit: {
      id: unit.id,
      nama: unit.nama,
      kode: unit.kode,
      level: unit.level,
      alamat: unit.alamat,
      telepon: unit.telepon,
      anak: unit.anak,
    },
    cakupanUnitIds,
    bisaHapus: sesi.pengguna.peran === "KEPALA",
    sesiId: sesi.id,
  };
});

export async function konteks(): Promise<Konteks> {
  const store = await cookies();
  const ctx = await muatKonteks(store.get(NAMA_COOKIE)?.value);
  if (!ctx) redirect("/masuk");
  return ctx;
}

/** Untuk halaman yang tidak wajib login (mis. /masuk) — hanya membaca ctx. */
export async function konteksJikaAda(): Promise<Konteks | null> {
  const store = await cookies();
  return muatKonteks(store.get(NAMA_COOKIE)?.value);
}

export async function buatSesi(penggunaId: string, meta: { ip?: string; ua?: string }) {
  const token = tokenBaru();
  const kedaluwarsa = new Date(Date.now() + TTL_MS);
  await prisma.sesi.create({
    data: {
      tokenHash: hashToken(token),
      penggunaId,
      kedaluwarsa,
      alamatIp: meta.ip ?? null,
      userAgent: meta.ua?.slice(0, 255) ?? null,
    },
  });
  return { token: tandai(token), kedaluwarsa };
}

export async function hapusSesi(token: string | undefined) {
  if (!token) return;
  const tokenAsli = token.split(".")[0];
  if (tokenAsli) {
    await prisma.sesi.deleteMany({ where: { tokenHash: hashToken(tokenAsli) } });
  }
}

export async function hapusSemuaSesiPengguna(penggunaId: string) {
  await prisma.sesi.deleteMany({ where: { penggunaId } });
}

/** Buang sesi kedaluwarsa agar tabel sesi tidak tumbuh tanpa batas. */
export async function bersihkanSesiKedaluwarsa() {
  await prisma.sesi.deleteMany({ where: { kedaluwarsa: { lt: new Date() } } });
}