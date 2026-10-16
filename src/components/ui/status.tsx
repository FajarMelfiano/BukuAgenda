import type { ReactNode } from "react";
import type { StatusSuratKeluar, StatusSuratMasuk } from "@prisma/client";
import { STATUS_KELUAR, STATUS_MASUK } from "@/lib/domain";
import { Lencana } from "./lencana";
import type { Warna } from "./lencana";

type WarnaMasuk = Extract<(typeof STATUS_MASUK)[number]["warna"], Warna>;
type WarnaKeluar = Extract<(typeof STATUS_KELUAR)[number]["warna"], Warna>;

const WARNA_MASUK: Record<string, WarnaMasuk> = {
  BARU: "amber",
  DISPOSISI: "biru",
  PROSES: "ungu",
  SELESAI: "hijau",
};

const WARNA_KELUAR: Record<string, WarnaKeluar> = {
  DRAFT: "netral",
  DIKIRIM: "biru",
  DITERIMA: "hijau",
};

/** Lencana status surat masuk, lengkap dengan deskripsinya sebagai tooltip. */
export function StatusMasuk({
  status,
  terlambat = false,
}: {
  status: StatusSuratMasuk;
  terlambat?: boolean;
}) {
  const meta = STATUS_MASUK.find((s) => s.nilai === status);
  if (terlambat) {
    return <Lencana warna="merah" judul="Lewat batas 7 hari sejak masuk dan belum selesai">Terlambat</Lencana>;
  }
  return (
    <Lencana warna={WARNA_MASUK[status] ?? "netral"} judul={meta?.deskripsi}>
      {meta?.label ?? status}
    </Lencana>
  );
}

export function StatusKeluar({ status }: { status: StatusSuratKeluar }) {
  const meta = STATUS_KELUAR.find((s) => s.nilai === status);
  return (
    <Lencana warna={WARNA_KELUAR[status] ?? "netral"} judul={meta?.deskripsi}>
      {meta?.label ?? status}
    </Lencana>
  );
}

export { WARNA_MASUK, WARNA_KELUAR };