-- CreateEnum
CREATE TYPE "LevelUnit" AS ENUM ('KELURAHAN', 'KECAMATAN');

-- CreateEnum
CREATE TYPE "Peran" AS ENUM ('PETUGAS', 'KEPALA');

-- CreateEnum
CREATE TYPE "JenisSuratMasuk" AS ENUM ('UNDANGAN', 'KEPUTUSAN', 'PERMOHONAN', 'INFORMASI', 'TAGIHAN', 'SANKSI', 'LAINNYA');

-- CreateEnum
CREATE TYPE "StatusSuratMasuk" AS ENUM ('BARU', 'DISPOSISI', 'PROSES', 'SELESAI');

-- CreateEnum
CREATE TYPE "JenisSuratKeluar" AS ENUM ('EDARAN', 'REKOMENDASI', 'PERMOHONAN', 'BALASAN', 'UNDANGAN', 'LAINNYA');

-- CreateEnum
CREATE TYPE "SifatSurat" AS ENUM ('BIASA', 'PENTING', 'SANGAT_PENTING');

-- CreateEnum
CREATE TYPE "StatusSuratKeluar" AS ENUM ('DRAFT', 'DIKIRIM', 'DITERIMA');

-- CreateEnum
CREATE TYPE "JenisSurat" AS ENUM ('MASUK', 'KELUAR');

-- CreateEnum
CREATE TYPE "TipeCounter" AS ENUM ('URUT_MASUK', 'NOMOR_KELUAR');

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "level" "LevelUnit" NOT NULL,
    "indukId" TEXT,
    "alamat" TEXT,
    "telepon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pengguna" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "peran" "Peran" NOT NULL DEFAULT 'PETUGAS',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "unitId" TEXT NOT NULL,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sesi" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "penggunaId" TEXT NOT NULL,
    "kedaluwarsa" TIMESTAMP(3) NOT NULL,
    "alamatIp" TEXT,
    "userAgent" TEXT,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sesi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratMasuk" (
    "id" TEXT NOT NULL,
    "nomorUrut" INTEGER NOT NULL,
    "nomorSurat" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "tanggalSurat" TIMESTAMP(3) NOT NULL,
    "tanggalMasuk" TIMESTAMP(3) NOT NULL,
    "pengirim" TEXT NOT NULL,
    "penerima" TEXT,
    "jenis" "JenisSuratMasuk" NOT NULL,
    "perihal" TEXT NOT NULL,
    "status" "StatusSuratMasuk" NOT NULL DEFAULT 'BARU',
    "disposisi" TEXT,
    "diteruskanKe" TEXT,
    "catatan" TEXT,
    "lampiran" TEXT,
    "unitId" TEXT NOT NULL,
    "dibuatOlehId" TEXT NOT NULL,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubahPada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuratMasuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratKeluar" (
    "id" TEXT NOT NULL,
    "nomorUrut" INTEGER NOT NULL,
    "nomorSurat" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "tanggalSurat" TIMESTAMP(3) NOT NULL,
    "tujuan" TEXT NOT NULL,
    "jenis" "JenisSuratKeluar" NOT NULL,
    "sifat" "SifatSurat" NOT NULL DEFAULT 'BIASA',
    "perihal" TEXT NOT NULL,
    "status" "StatusSuratKeluar" NOT NULL DEFAULT 'DRAFT',
    "penandatangan" TEXT,
    "catatan" TEXT,
    "unitId" TEXT NOT NULL,
    "dibuatOlehId" TEXT NOT NULL,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diubahPada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuratKeluar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuratRiwayat" (
    "id" TEXT NOT NULL,
    "suratJenis" "JenisSurat" NOT NULL,
    "suratId" TEXT NOT NULL,
    "dari" TEXT,
    "ke" TEXT NOT NULL,
    "catatan" TEXT,
    "olehId" TEXT NOT NULL,
    "dibuatPada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuratRiwayat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "tipe" "TipeCounter" NOT NULL,
    "n" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Unit_level_idx" ON "Unit"("level");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_kode_nama_key" ON "Unit"("kode", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "Pengguna_username_key" ON "Pengguna"("username");

-- CreateIndex
CREATE INDEX "Pengguna_unitId_idx" ON "Pengguna"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "Sesi_tokenHash_key" ON "Sesi"("tokenHash");

-- CreateIndex
CREATE INDEX "Sesi_penggunaId_idx" ON "Sesi"("penggunaId");

-- CreateIndex
CREATE INDEX "Sesi_kedaluwarsa_idx" ON "Sesi"("kedaluwarsa");

-- CreateIndex
CREATE INDEX "SuratMasuk_unitId_tanggalMasuk_idx" ON "SuratMasuk"("unitId", "tanggalMasuk" DESC);

-- CreateIndex
CREATE INDEX "SuratMasuk_unitId_status_idx" ON "SuratMasuk"("unitId", "status");

-- CreateIndex
CREATE INDEX "SuratMasuk_unitId_jenis_idx" ON "SuratMasuk"("unitId", "jenis");

-- CreateIndex
CREATE UNIQUE INDEX "SuratMasuk_unitId_nomorSurat_tahun_key" ON "SuratMasuk"("unitId", "nomorSurat", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "SuratMasuk_unitId_tahun_nomorUrut_key" ON "SuratMasuk"("unitId", "tahun", "nomorUrut");

-- CreateIndex
CREATE INDEX "SuratKeluar_unitId_tanggalSurat_idx" ON "SuratKeluar"("unitId", "tanggalSurat" DESC);

-- CreateIndex
CREATE INDEX "SuratKeluar_unitId_status_idx" ON "SuratKeluar"("unitId", "status");

-- CreateIndex
CREATE INDEX "SuratKeluar_unitId_jenis_idx" ON "SuratKeluar"("unitId", "jenis");

-- CreateIndex
CREATE UNIQUE INDEX "SuratKeluar_unitId_nomorSurat_key" ON "SuratKeluar"("unitId", "nomorSurat");

-- CreateIndex
CREATE UNIQUE INDEX "SuratKeluar_unitId_tahun_nomorUrut_key" ON "SuratKeluar"("unitId", "tahun", "nomorUrut");

-- CreateIndex
CREATE INDEX "SuratRiwayat_suratJenis_suratId_idx" ON "SuratRiwayat"("suratJenis", "suratId");

-- CreateIndex
CREATE INDEX "SuratRiwayat_dibuatPada_idx" ON "SuratRiwayat"("dibuatPada" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Counter_unitId_tahun_tipe_key" ON "Counter"("unitId", "tahun", "tipe");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_indukId_fkey" FOREIGN KEY ("indukId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pengguna" ADD CONSTRAINT "Pengguna_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sesi" ADD CONSTRAINT "Sesi_penggunaId_fkey" FOREIGN KEY ("penggunaId") REFERENCES "Pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratMasuk" ADD CONSTRAINT "SuratMasuk_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratMasuk" ADD CONSTRAINT "SuratMasuk_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "Pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratKeluar" ADD CONSTRAINT "SuratKeluar_dibuatOlehId_fkey" FOREIGN KEY ("dibuatOlehId") REFERENCES "Pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuratRiwayat" ADD CONSTRAINT "SuratRiwayat_olehId_fkey" FOREIGN KEY ("olehId") REFERENCES "Pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Counter" ADD CONSTRAINT "Counter_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
