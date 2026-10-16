"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { hapusSemuaSesiPengguna, konteks } from "@/lib/sesi";
import {
  gantiSandiSkema,
  keFieldError,
  statusKeluarSkema,
  statusMasukSkema,
  suratKeluarSkema,
  suratMasukSkema,
} from "@/lib/validasi";
import { bolehTransisiKeluar, bolehTransisiMasuk } from "@/lib/query";
import { urutId } from "@/lib/format";
import { STATUS_KELUAR_LABEL, STATUS_MASUK_LABEL } from "@/lib/domain";

export type StateForm = {
  galat?: string;
  fields?: Record<string, string>;
  nilai?: Record<string, string>;
};

function gagal(galat: string, nilai?: Record<string, string>): StateForm {
  return { galat, nilai };
}

/** Prisma P2002 = pelanggaran unique constraint. */
function bentrok(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/** Nilai isian dikembalikan ke formulir supaya tidak hilang saat validasi gagal. */
function nilaiDariBentuk(bentuk: FormData): Record<string, string> {
  const nilai: Record<string, string> = {};
  for (const [kunci, v] of bentuk.entries()) {
    if (typeof v === "string") nilai[kunci] = v;
  }
  return nilai;
}

function tengahHari(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ================================================================== *
 * Surat masuk
 * ================================================================== */

/**
 * Nomor urut surat masuk diambil dari tabel Counter dengan increment atomik di
 * dalam transaksi, jadi dua petugas yang menyimpan di detik yang sama tetap
 * mendapat nomor berbeda. Nomor SURAT-nya datang dari pengirim, sehingga
 * keunikannya divalidasi per unit dan per tahun lewat batasan basis data.
 */
export async function simpanSuratMasuk(_state: StateForm, bentuk: FormData): Promise<StateForm> {
  const ctx = await konteks();

  const hasil = suratMasukSkema.safeParse(Object.fromEntries(bentuk));
  if (!hasil.success) {
    return { fields: keFieldError(hasil.error), nilai: nilaiDariBentuk(bentuk) };
  }
  const data = hasil.data;

  const tanggalSurat = new Date(`${data.tanggalSurat}T00:00:00`);
  const tanggalMasuk = new Date(`${data.tanggalMasuk}T00:00:00`);

  if (tanggalSurat > tengahHari()) {
    return gagal("Tanggal surat tidak boleh berada di masa depan.", {
      tanggalSurat: data.tanggalSurat,
    });
  }
  if (tanggalMasuk < tanggalSurat) {
    return gagal("Tanggal masuk tidak boleh lebih awal daripada tanggal surat pada berkas.", {
      tanggalMasuk: data.tanggalMasuk,
    });
  }

  const tahun = tanggalMasuk.getFullYear();

  try {
    await prisma.$transaction(async (tx) => {
      const counter = await tx.counter.upsert({
        where: { unitId_tahun_tipe: { unitId: ctx.unit.id, tahun, tipe: "URUT_MASUK" } },
        create: { unitId: ctx.unit.id, tahun, tipe: "URUT_MASUK", n: 1 },
        update: { n: { increment: 1 } },
      });

      const surat = await tx.suratMasuk.create({
        data: {
          nomorUrut: counter.n,
          nomorSurat: data.nomorSurat,
          tahun,
          tanggalSurat,
          tanggalMasuk,
          pengirim: data.pengirim,
          penerima: data.penerima,
          jenis: data.jenis,
          perihal: data.perihal,
          disposisi: data.disposisi,
          diteruskanKe: data.diteruskanKe,
          catatan: data.catatan,
          lampiran: data.lampiran,
          unitId: ctx.unit.id,
          dibuatOlehId: ctx.pengguna.id,
        },
        select: { id: true, nomorUrut: true },
      });

      await tx.suratRiwayat.create({
        data: {
          suratJenis: "MASUK",
          suratId: surat.id,
          dari: null,
          ke: "BARU",
          catatan: `Dicatat dari berkas bernomor ${data.nomorSurat}`,
          olehId: ctx.pengguna.id,
        },
      });
    });
  } catch (e) {
    if (bentrok(e)) {
      return gagal(
        `Nomor surat ${data.nomorSurat} sudah tercatat di ${ctx.unit.nama} untuk tahun ${tahun}. ` +
          "Periksa lagi nomor berkas, atau catat dengan nomor yang berbeda.",
        { nomorSurat: data.nomorSurat },
      );
    }
    throw e;
  }

  revalidatePath("/surat-masuk");
  revalidatePath("/rekap");
  redirect("/surat-masuk");
}

export async function ubahSuratMasuk(
  id: string,
  _state: StateForm,
  bentuk: FormData,
): Promise<StateForm> {
  const ctx = await konteks();

  const surat = await prisma.suratMasuk.findFirst({
    where: { id, unitId: { in: ctx.cakupanUnitIds } },
  });
  if (!surat) return gagal("Surat tidak ditemukan, atau berada di luar unit kerja Anda.");

  const hasil = suratMasukSkema.safeParse(Object.fromEntries(bentuk));
  if (!hasil.success) {
    return { fields: keFieldError(hasil.error), nilai: nilaiDariBentuk(bentuk) };
  }
  const data = hasil.data;

  const tanggalSurat = new Date(`${data.tanggalSurat}T00:00:00`);
  const tanggalMasuk = new Date(`${data.tanggalMasuk}T00:00:00`);

  if (tanggalSurat > tengahHari()) {
    return gagal("Tanggal surat tidak boleh berada di masa depan.", {
      tanggalSurat: data.tanggalSurat,
    });
  }
  if (tanggalMasuk < tanggalSurat) {
    return gagal("Tanggal masuk tidak boleh lebih awal daripada tanggal surat pada berkas.", {
      tanggalMasuk: data.tanggalMasuk,
    });
  }

  try {
    await prisma.suratMasuk.update({
      where: { id },
      data: {
        nomorSurat: data.nomorSurat,
        tahun: tanggalMasuk.getFullYear(),
        tanggalSurat,
        tanggalMasuk,
        pengirim: data.pengirim,
        penerima: data.penerima,
        jenis: data.jenis,
        perihal: data.perihal,
        disposisi: data.disposisi,
        diteruskanKe: data.diteruskanKe,
        catatan: data.catatan,
        lampiran: data.lampiran,
      },
    });
  } catch (e) {
    if (bentrok(e)) {
      return gagal(
        `Nomor surat ${data.nomorSurat} sudah tercatat di unit ini untuk tahun yang sama.`,
        { nomorSurat: data.nomorSurat },
      );
    }
    throw e;
  }

  revalidatePath("/surat-masuk");
  revalidatePath(`/surat-masuk/${id}`);
  revalidatePath("/rekap");
  redirect(`/surat-masuk/${id}`);
}

/**
 * Transisi status surat masuk. Mundur sengaja ditolak di server, bukan
 * hanya disembunyikan di antarmuka.
 */
export async function ubahStatusMasuk(
  id: string,
  _state: StateForm,
  bentuk: FormData,
): Promise<StateForm> {
  const ctx = await konteks();

  const surat = await prisma.suratMasuk.findFirst({
    where: { id, unitId: { in: ctx.cakupanUnitIds } },
  });
  if (!surat) return gagal("Surat tidak ditemukan, atau berada di luar unit kerja Anda.");

  const hasil = statusMasukSkema.safeParse(Object.fromEntries(bentuk));
  if (!hasil.success) return { fields: keFieldError(hasil.error) };
  const data = hasil.data;

  if (data.status === surat.status) {
    return gagal(`Status surat sudah ${STATUS_MASUK_LABEL[surat.status]}.`);
  }
  if (!bolehTransisiMasuk(surat.status, data.status)) {
    return gagal(
      `Status tidak bisa diubah dari ${STATUS_MASUK_LABEL[surat.status]} ke ${STATUS_MASUK_LABEL[data.status]}. ` +
        "Status hanya bisa maju satu tahap.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.suratMasuk.update({
      where: { id },
      data: {
        status: data.status,
        disposisi: data.disposisi ?? surat.disposisi,
        diteruskanKe: data.diteruskanKe ?? surat.diteruskanKe,
        catatan: data.catatan ?? surat.catatan,
      },
    });
    await tx.suratRiwayat.create({
      data: {
        suratJenis: "MASUK",
        suratId: id,
        dari: surat.status,
        ke: data.status,
        catatan: data.catatan,
        olehId: ctx.pengguna.id,
      },
    });
  });

  revalidatePath("/surat-masuk");
  revalidatePath(`/surat-masuk/${id}`);
  revalidatePath("/rekap");
  return { nilai: { info: `Status diubah ke ${STATUS_MASUK_LABEL[data.status]}.` } };
}

export async function hapusSuratMasuk(id: string): Promise<StateForm> {
  const ctx = await konteks();
  if (!ctx.bisaHapus) return gagal("Hanya Kepala Unit yang dapat menghapus surat.");
  return hapusSurat("MASUK", id, ctx.cakupanUnitIds);
}

/* ================================================================== *
 * Surat keluar
 * ================================================================== */

/**
 * Nomor surat keluar dibangkitkan aplikasi: urutan nol-pad tiga digit, kode
 * unit, /SK/, dan tahun — misalnya 007/KL/SK/2026. Increment terjadi di dalam
 * transaksi sehingga mustahil dua petugas mendapat nomor sama.
 */
export async function nomorKeluarBerikutnya(
  tx: Prisma.TransactionClient,
  unitId: string,
  kode: string,
  tahun: number,
) {
  const counter = await tx.counter.upsert({
    where: { unitId_tahun_tipe: { unitId, tahun, tipe: "NOMOR_KELUAR" } },
    create: { unitId, tahun, tipe: "NOMOR_KELUAR", n: 1 },
    update: { n: { increment: 1 } },
  });
  return {
    nomorUrut: counter.n,
    nomorSurat: `${urutId(counter.n)}/${kode}/SK/${tahun}`,
  };
}

/** Pratinjau nomor berikutnya untuk ditampilkan di formulir sebelum disimpan. */
export async function pratinjauNomorKeluar(tahun: number): Promise<string> {
  const ctx = await konteks();
  const counter = await prisma.counter.findUnique({
    where: { unitId_tahun_tipe: { unitId: ctx.unit.id, tahun, tipe: "NOMOR_KELUAR" } },
  });
  return `${urutId((counter?.n ?? 0) + 1)}/${ctx.unit.kode}/SK/${tahun}`;
}

export async function simpanSuratKeluar(_state: StateForm, bentuk: FormData): Promise<StateForm> {
  const ctx = await konteks();

  const hasil = suratKeluarSkema.safeParse(Object.fromEntries(bentuk));
  if (!hasil.success) {
    return { fields: keFieldError(hasil.error), nilai: nilaiDariBentuk(bentuk) };
  }
  const data = hasil.data;

  const tanggalSurat = new Date(`${data.tanggalSurat}T00:00:00`);
  if (tanggalSurat > tengahHari()) {
    return gagal("Tanggal surat tidak boleh berada di masa depan.", {
      tanggalSurat: data.tanggalSurat,
    });
  }

  const tahun = tanggalSurat.getFullYear();

  const dibuat = await prisma.$transaction(async (tx) => {
    const nomor = await nomorKeluarBerikutnya(tx, ctx.unit.id, ctx.unit.kode, tahun);
    const surat = await tx.suratKeluar.create({
      data: {
        nomorUrut: nomor.nomorUrut,
        nomorSurat: nomor.nomorSurat,
        tahun,
        tanggalSurat,
        tujuan: data.tujuan,
        jenis: data.jenis,
        sifat: data.sifat,
        perihal: data.perihal,
        status: data.status,
        penandatangan: data.penandatangan ?? `Kepala ${ctx.unit.nama}`,
        catatan: data.catatan,
        unitId: ctx.unit.id,
        dibuatOlehId: ctx.pengguna.id,
      },
      select: { id: true },
    });
    await tx.suratRiwayat.create({
      data: {
        suratJenis: "KELUAR",
        suratId: surat.id,
        dari: null,
        ke: data.status,
        catatan: `Dibuat dengan nomor ${nomor.nomorSurat}`,
        olehId: ctx.pengguna.id,
      },
    });
    return surat;
  });

  revalidatePath("/surat-keluar");
  revalidatePath("/rekap");
  redirect(`/surat-keluar/${dibuat.id}`);
}

export async function ubahSuratKeluar(
  id: string,
  _state: StateForm,
  bentuk: FormData,
): Promise<StateForm> {
  const ctx = await konteks();

  const surat = await prisma.suratKeluar.findFirst({
    where: { id, unitId: { in: ctx.cakupanUnitIds } },
  });
  if (!surat) return gagal("Surat tidak ditemukan, atau berada di luar unit kerja Anda.");

  const hasil = suratKeluarSkema.safeParse(Object.fromEntries(bentuk));
  if (!hasil.success) {
    return { fields: keFieldError(hasil.error), nilai: nilaiDariBentuk(bentuk) };
  }
  const data = hasil.data;

  const tanggalSurat = new Date(`${data.tanggalSurat}T00:00:00`);
  if (tanggalSurat > tengahHari()) {
    return gagal("Tanggal surat tidak boleh berada di masa depan.", {
      tanggalSurat: data.tanggalSurat,
    });
  }

  // Nomor surat sengaja TIDAK ikut berubah saat menyunting: surat sudah
  // tercetak dan keluar dari unit ini, jadi nomornya mengikat.
  await prisma.suratKeluar.update({
    where: { id },
    data: {
      tanggalSurat,
      tujuan: data.tujuan,
      jenis: data.jenis,
      sifat: data.sifat,
      perihal: data.perihal,
      penandatangan: data.penandatangan,
      catatan: data.catatan,
    },
  });

  revalidatePath("/surat-keluar");
  revalidatePath(`/surat-keluar/${id}`);
  revalidatePath("/rekap");
  redirect(`/surat-keluar/${id}`);
}

export async function ubahStatusKeluar(
  id: string,
  _state: StateForm,
  bentuk: FormData,
): Promise<StateForm> {
  const ctx = await konteks();

  const surat = await prisma.suratKeluar.findFirst({
    where: { id, unitId: { in: ctx.cakupanUnitIds } },
  });
  if (!surat) return gagal("Surat tidak ditemukan, atau berada di luar unit kerja Anda.");

  const hasil = statusKeluarSkema.safeParse(Object.fromEntries(bentuk));
  if (!hasil.success) return { fields: keFieldError(hasil.error) };
  const data = hasil.data;

  if (data.status === surat.status) {
    return gagal(`Status surat sudah ${STATUS_KELUAR_LABEL[surat.status]}.`);
  }
  if (!bolehTransisiKeluar(surat.status, data.status)) {
    return gagal(
      `Status tidak bisa diubah dari ${STATUS_KELUAR_LABEL[surat.status]} ke ${STATUS_KELUAR_LABEL[data.status]}. ` +
        "Status hanya bisa maju satu tahap.",
    );
  }

  await prisma.$transaction([
    prisma.suratKeluar.update({ where: { id }, data: { status: data.status } }),
    prisma.suratRiwayat.create({
      data: {
        suratJenis: "KELUAR",
        suratId: id,
        dari: surat.status,
        ke: data.status,
        catatan: data.catatan,
        olehId: ctx.pengguna.id,
      },
    }),
  ]);

  revalidatePath("/surat-keluar");
  revalidatePath(`/surat-keluar/${id}`);
  revalidatePath("/rekap");
  return { nilai: { info: `Status diubah ke ${STATUS_KELUAR_LABEL[data.status]}.` } };
}

export async function hapusSuratKeluar(id: string): Promise<StateForm> {
  const ctx = await konteks();
  if (!ctx.bisaHapus) return gagal("Hanya Kepala Unit yang dapat menghapus surat.");
  return hapusSurat("KELUAR", id, ctx.cakupanUnitIds);
}

/* ================================================================== *
 * Bantu
 * ================================================================== */

async function hapusSurat(
  jenis: "MASUK" | "KELUAR",
  id: string,
  cakupanUnitIds: string[],
): Promise<StateForm> {
  const model = jenis === "MASUK" ? prisma.suratMasuk : prisma.suratKeluar;
  const target = model as typeof prisma.suratMasuk;

  const surat = await target.findFirst({ where: { id, unitId: { in: cakupanUnitIds } } });
  if (!surat) return gagal("Surat tidak ditemukan, atau berada di luar unit kerja Anda.");

  await prisma.$transaction([
    prisma.suratRiwayat.deleteMany({ where: { suratId: id, suratJenis: jenis } }),
    target.delete({ where: { id } }),
  ]);

  const tujuan = jenis === "MASUK" ? "/surat-masuk" : "/surat-keluar";
  revalidatePath(tujuan);
  revalidatePath("/rekap");
  redirect(tujuan);
}

/* ================================================================== *
 * Akun
 * ================================================================== */

export async function gantiKataSandi(
  _state: StateForm,
  bentuk: FormData,
): Promise<StateForm> {
  const ctx = await konteks();
  if (!ctx) throw new Error("Konteks tidak ada");

  const hasil = gantiSandiSkema.safeParse(Object.fromEntries(bentuk));
  if (!hasil.success) return { fields: keFieldError(hasil.error) };
  const data = hasil.data;

  const pengguna = await prisma.pengguna.findUnique({ where: { id: ctx.pengguna.id } });
  if (!pengguna) return gagal("Akun tidak ditemukan.");

  if (!(await compare(data.sandiSekarang, pengguna.passwordHash))) {
    return gagal("Kata sandi sekarang salah.", {
      sandiSekarang: "Periksa kembali kata sandi lama.",
    });
  }

  await prisma.pengguna.update({
    where: { id: ctx.pengguna.id },
    data: { passwordHash: await hash(data.sandiBaru, 12) },
  });

  // Semua sesi dicabut supaya perangkat lain langsung keluar. Sesi peramban
  // ini ikut-build up kembali oleh pengguna yang sedang mengganti kata sandi.
  await hapusSemuaSesiPengguna(ctx.pengguna.id);

  return {
    nilai: {
      info: "Kata sandi berhasil diubah. Sesi lain pada perangkat ini sudah dikeluarkan.",
    },
  };
}