// Bangkit data awal yang realistis untuk Buku Agenda.
// Teks naskah dibangkitkan prosedural dari daftar kata, deterministik (seed tetap),
// supaya hasil seed sama di setiap mesin dan bebas karakter asing.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import bcrypt from "bcryptjs";
import { PrismaClient, StatusSuratMasuk, StatusSuratKeluar } from "@prisma/client";

const db = new PrismaClient();
const HALAMAN = path.dirname(fileURLToPath(import.meta.url));

// --- acak deterministik (xorshift32) supaya seed selalu sama ---
let benih = 0x5eed1234;
function acak(): number {
  benih ^= benih << 13; benih ^= benih >>> 17; benih ^= benih << 5;
  return (benih >>> 0) / 4294967296;
}
function ambil<T>(daftar: readonly T[]): T {
  return daftar[Math.floor(acak() * daftar.length)]!;
}
function rentang(min: number, max: number): number {
  return min + Math.floor(acak() * (max - min + 1));
}

// --- daftar kata: dibaca dari naskah.txt per baris, aman dari karakter asing ---
function daftar(nama: string): string[] {
  const isi = readFileSync(path.join(HALAMAN, "naskah.txt"), "utf8");
  const blok = isi.split("#awal: " + nama)[1]?.split("#akhir")[0] ?? "";
  return blok.split("\n").map((s) => s.trim()).filter(Boolean);
}

const KATA = daftar("KATA");
const TENTANG = daftar("TENTANG");
const PERIHAL = daftar("PERIHAL");
const SIFAT = daftar("SIFAT");

function kalimat(kata: number): string {
  const bagian: string[] = [];
  for (let i = 0; i < kata; i++) bagian.push(ambil(KATA));
  const t = bagian.join(" ");
  return t.charAt(0).toUpperCase() + t.slice(1) + ".";
}

function ringkas(judul: string): string {
  const potong = judul.split(" ").slice(0, 12).join(" ");
  return potong.length > 150 ? potong.slice(0, 147) + "..." : potong;
}

// --- tanggal: sebar surat lintas bulan supaya rekap terlihat hidup ---
const HARI_MS = 86_400_000;
function tanggalAcak(dari: Date, rentangHari: number): Date {
  const dasar = dari.getTime() + Math.floor(acak() * rentangHari) * HARI_MS;
  const hasil = new Date(dasar);
  hasil.setHours(rentang(8, 16), rentang(0, 59), 0, 0);
  return hasil;
}

const UNIT = [
  { kode: "KEC", nama: "Kecamatan Cibiru", level: "KECAMATAN" as const, induk: null as string | null },
  { kode: "KDL", nama: "Kelurahan Cibiru Wetan", level: "KELURAHAN" as const, induk: "KEC" },
  { kode: "KDG", nama: "Kelurahan Cibiru Kulon", level: "KELURAHAN" as const, induk: "KEC" },
  { kode: "KDH", nama: "Kelurahan Cipadung", level: "KELURAHAN" as const, induk: "KEC" },
];

const PENGGUNA = [
  { nama: "Dedi Supriatna", username: "dedi", peran: "KEPALA" as const, unit: "KEC" },
  { nama: "Rina Marlina", username: "rina", peran: "PETUGAS" as const, unit: "KEC" },
  { nama: "Ahmad Fauzi", username: "ahmad", peran: "KEPALA" as const, unit: "KDL" },
  { nama: "Siti Nurhaliza", username: "siti", peran: "PETUGAS" as const, unit: "KDG" },
];

// --- bangkit satu surat masuk ---
const STATUS_MASUK = ["BARU", "DISPOSISI", "PROSES", "SELESAI"] as const;
const JENIS_MASUK_SEED = ["UNDANGAN", "KEPUTUSAN", "PERMOHONAN", "INFORMASI", "TAGIHAN", "SANKSI", "LAINNYA"] as const;
const JENIS_KELUAR_SEED = ["EDARAN", "REKOMENDASI", "PERMOHONAN", "BALASAN", "UNDANGAN", "LAINNYA"] as const;
const SIFAT_SEED = ["BIASA", "PENTING", "SANGAT_PENTING"] as const;
const PENGIRIM = ["Dinas Pendidikan", "Dinas Kesehatan", "Dinas Sosial", "Kantor Pos", "Polsek Cibiru", "Koramil Cibiru", "RT 03 RW 07", "Karang Taruna", "Bank BJB", "PT Pos Indonesia"];

function buatMasuk(unitKode: string, tahun: number, urut: number, bulan: number) {
  const perihal = `${ambil(PERIHAL)} ${ambil(TENTANG)}`;
  const ringkasan = `${kalimat(rentang(10, 16))} ${kalimat(rentang(8, 14))}`;
  const tanggal = tanggalAcak(new Date(tahun, bulan, 1), 27);
  // campur status; sebagian sengaja dibuat lewat SLA 7 hari supaya perlu tindak lanjut
  const acakStatus = acak();
  const status: StatusSuratMasuk = acakStatus < 0.30 ? "BARU" : acakStatus < 0.55 ? "DISPOSISI" : acakStatus < 0.80 ? "PROSES" : "SELESAI";
  return {
    unitKode, tahun, urut, bulan, tanggal,
    nomor: `${rentang(100, 999)}/${ambil(TENTANG).slice(0, 3).toUpperCase()}/${tahun}`,
    pengirim: ambil(PENGIRIM),
    perihal, ringkasan,
    jenis: ambil(JENIS_MASUK_SEED),
    status,
    terimaLewat: status === "BARU" && acak() < 0.4,
  };
}

// --- bangkit satu surat keluar ---
const STATUS_KELUAR = ["DRAFT", "DIKIRIM", "DITERIMA"] as const;

function buatKeluar(unitKode: string, tahun: number, urut: number, bulan: number) {
  const perihal = `${ambil(PERIHAL)} ${ambil(TENTANG)}`;
  const ringkasan = `${kalimat(rentang(10, 16))} ${kalimat(rentang(8, 14))}`;
  const tanggal = tanggalAcak(new Date(tahun, bulan, 1), 27);
  const acakStatus = acak();
  const status: StatusSuratKeluar = acakStatus < 0.25 ? "DRAFT" : acakStatus < 0.60 ? "DIKIRIM" : "DITERIMA";
  return {
    unitKode, tahun, urut, bulan, tanggal,
    nomor: `${String(urut).padStart(3, "0")}/${unitKode}/SK/${tahun}`,
    tujuan: ambil(PENGIRIM),
    perihal, ringkasan,
    jenis: ambil(JENIS_KELUAR_SEED),
    sifat: ambil(SIFAT_SEED),
    status,
  };
}

// --- susun seed ---
async function utama() {
  console.log("Menghapus data lama...");
  await db.sesi.deleteMany();
  await db.suratRiwayat.deleteMany();
  await db.suratMasuk.deleteMany();
  await db.suratKeluar.deleteMany();
  await db.counter.deleteMany();
  await db.pengguna.deleteMany();
  await db.unit.deleteMany();

  console.log("Membuat unit...");
  const idUnit = new Map<string, string>();
  for (const u of UNIT) {
    const dibuat = await db.unit.create({
      data: { kode: u.kode, nama: u.nama, level: u.level, indukId: u.induk ? idUnit.get(u.induk)! : null },
    });
    idUnit.set(u.kode, dibuat.id);
  }

  console.log("Membuat pengguna...");
  const idUser = new Map<string, string>();
  for (const p of PENGGUNA) {
    const hash = await bcrypt.hash("demo1234", 12);
    const dibuat = await db.pengguna.create({
      data: { nama: p.nama, username: p.username, passwordHash: hash, peran: p.peran, aktif: true, unitId: idUnit.get(p.unit)! },
    });
    idUser.set(p.username, dibuat.id);
  }

  // --- surat masuk: sebar di 3 tahun terakhir, tiap unit ---
  console.log("Membuat surat masuk...");
  let nMasuk = 0;
  const semuaMasuk: ReturnType<typeof buatMasuk>[] = [];
  const tahunIni = new Date().getFullYear();
  for (const u of UNIT) {
    let urut = 0;
    for (let t = tahunIni - 2; t <= tahunIni; t++) {
      const jumlah = t === tahunIni ? rentang(14, 18) : rentang(12, 16);
      for (let i = 0; i < jumlah; i++) {
        urut += 1;
        semuaMasuk.push(buatMasuk(u.kode, t, urut, rentang(0, 11)));
      }
    }
  }
  semuaMasuk.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());
  // nomor urut disusun ulang mengikuti urutan tanggal supaya wajar
  const urutPerUnit = new Map<string, number>();
  for (const s of semuaMasuk) {
    const kunci = s.unitKode + s.tahun;
    const n = (urutPerUnit.get(kunci) ?? 0) + 1;
    urutPerUnit.set(kunci, n);
    s.urut = n;
    s.nomor = `${s.urut.toString().padStart(3, "0")}/${s.unitKode}/${s.tahun}`;
    await db.suratMasuk.create({
      data: {
        nomorSurat: s.nomor,
        tanggalSurat: s.tanggal,
        tanggalMasuk: s.tanggal,
        pengirim: s.pengirim,
        perihal: s.perihal,
        jenis: s.jenis,
        catatan: ringkas(s.ringkasan),
        status: s.status,
        unitId: idUnit.get(s.unitKode)!,
        tahun: s.tahun,
        nomorUrut: s.urut,
        dibuatOlehId: idUser.get("rina") ?? idUser.values().next().value!,
      },
    });
    nMasuk += 1;
  }
  console.log(`  ${nMasuk} surat masuk`);

  // --- surat keluar ---
  console.log("Membuat surat keluar...");
  let nKeluar = 0;
  const semuaKeluar: ReturnType<typeof buatKeluar>[] = [];
  for (const u of UNIT) {
    let urut = 0;
    for (let t = tahunIni - 2; t <= tahunIni; t++) {
      const jumlah = t === tahunIni ? rentang(10, 14) : rentang(8, 12);
      for (let i = 0; i < jumlah; i++) {
        urut += 1;
        semuaKeluar.push(buatKeluar(u.kode, t, urut, rentang(0, 11)));
      }
    }
  }
  semuaKeluar.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());
  const urutKeluar = new Map<string, number>();
  const seqKeluar = new Map<string, number>();
  for (const s of semuaKeluar) {
    const kunci = s.unitKode + s.tahun;
    const n = (urutKeluar.get(kunci) ?? 0) + 1;
    urutKeluar.set(kunci, n);
    s.urut = n;
    s.nomor = `${n.toString().padStart(3, "0")}/${s.unitKode}/SK/${s.tahun}`;
    await db.suratKeluar.create({
      data: {
        nomorSurat: s.nomor,
        tanggalSurat: s.tanggal,
        tujuan: s.tujuan,
        perihal: s.perihal,
        jenis: s.jenis,
        sifat: s.sifat,
        catatan: ringkas(s.ringkasan),
        status: s.status,
        penandatangan: `Kepala Unit ${s.unitKode}`,
        unitId: idUnit.get(s.unitKode)!,
        tahun: s.tahun,
        nomorUrut: s.urut,
        dibuatOlehId: idUser.get("rina") ?? idUser.values().next().value!,
      },
    });
    seqKeluar.set(kunci, n);
    nKeluar += 1;
  }

  console.log("Menyetel counter nomor...");
  for (const [kunci, n] of seqKeluar) {
    const kode = kunci.slice(0, 3);
    const tahun = Number(kunci.slice(3));
    await db.counter.create({ data: { unitId: idUnit.get(kode)!, tahun, tipe: "NOMOR_KELUAR", n } });
  }
  for (const [kunci, n] of urutPerUnit) {
    const kode = kunci.slice(0, 3);
    const tahun = Number(kunci.slice(3));
    await db.counter.create({ data: { unitId: idUnit.get(kode)!, tahun, tipe: "URUT_MASUK", n } });
  }

  console.log(`Selesai: ${nMasuk} surat masuk, ${nKeluar} surat keluar.`);
  console.log("Akun demo (sandi sama semua: demo1234):");
  for (const p of PENGGUNA) console.log(`  ${p.username}  [${p.peran}]`);
}

utama()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
