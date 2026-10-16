import { prisma } from "@/lib/db";
import { konteks } from "@/lib/sesi";
import {
  JENIS_KELUAR_LABEL,
  JENIS_MASUK_LABEL,
  STATUS_KELUAR_LABEL,
  STATUS_MASUK_LABEL,
} from "@/lib/domain";
import { filterSkema } from "@/lib/validasi";
import { whereKeluar, whereMasuk } from "@/lib/query";
import { bulanKunci, selCsv, tglPanjang, unduhCsv } from "@/lib/format";

/**
 * Ekspor arsip gabungan ke CSV.
 *
 * PENTING: klausa WHERE dibangun ulang dari parameter yang sama dengan layar
 * Rekap — dengan batas unit yang sama. Kalau ekspor memakai query sendiri
 * tanpa batas unit, petugas kecamatan bisa mengunduh berkas kelurahannya
 * yang tidak sedang ditampilkan di layar.
 */
const BATAS = 20_000;

export async function GET(req: Request) {
  const ctx = await konteks();
  const url = new URL(req.url);

  const f = filterSkema.parse({
    q: url.searchParams.get("q") ?? undefined,
    bulan: url.searchParams.get("bulan") ?? undefined,
    unit: url.searchParams.get("unit") ?? undefined,
  });

  const dasar = { unitIds: ctx.cakupanUnitIds, q: f.q, bulan: f.bulan, unitId: f.unit };
  if (!ctx) throw new Error("Konteks tidak ada");

  const [masuk, keluar] = await Promise.all([
    prisma.suratMasuk.findMany({
      where: whereMasuk(dasar),
      orderBy: [{ tanggalMasuk: "desc" }],
      take: BATAS,
      select: {
        nomorUrut: true,
        nomorSurat: true,
        tanggalSurat: true,
        tanggalMasuk: true,
        pengirim: true,
        jenis: true,
        perihal: true,
        status: true,
        unit: { select: { nama: true } },
      },
    }),
    prisma.suratKeluar.findMany({
      where: whereKeluar(dasar),
      orderBy: [{ tanggalSurat: "desc" }],
      take: BATAS,
      select: {
        nomorUrut: true,
        nomorSurat: true,
        tanggalSurat: true,
        tujuan: true,
        jenis: true,
        sifat: true,
        perihal: true,
        status: true,
        unit: { select: { nama: true } },
      },
    }),
  ]);

  const kepala = [
    "Arah",
    "Nomor urut",
    "Nomor surat",
    "Tanggal surat",
    "Tanggal masuk",
    "Unit",
    "Pengirim atau tujuan",
    "Jenis",
    "Sifat",
    "Perihal",
    "Status",
  ];

  const baris = [
    kepala,
    ...masuk.map((m) => [
      "Masuk",
      m.nomorUrut,
      m.nomorSurat,
      tglPanjang(m.tanggalSurat),
      tglPanjang(m.tanggalMasuk),
      m.unit.nama,
      m.pengirim,
      JENIS_MASUK_LABEL[m.jenis] ?? m.jenis,
      "",
      m.perihal,
      STATUS_MASUK_LABEL[m.status] ?? m.status,
    ]),
    ...keluar.map((k) => [
      "Keluar",
      k.nomorUrut,
      k.nomorSurat,
      tglPanjang(k.tanggalSurat),
      "",
      k.unit.nama,
      k.tujuan,
      JENIS_KELUAR_LABEL[k.jenis] ?? k.jenis,
      k.sifat,
      k.perihal,
      STATUS_KELUAR_LABEL[k.status] ?? k.status,
    ]),
  ];

  // BOM UTF-8 supaya Excel di Windows membaca karakter Indonesia dengan benar.
  const isi = "\uFEFF" + baris.map((r) => r.map((v) => selCsv(v)).join(",")).join("\r\n");

  const bagian = [f.q ? `cari-${f.q}` : null, f.bulan ? `bulan-${f.bulan}` : null]
    .filter(Boolean)
    .join("-");

  return unduhCsv(`rekap-arsip${bagian ? `-${bagian}` : ""}-${bulanKunci()}.csv`, isi);
}