"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CircleAlert, LoaderCircle, Save } from "lucide-react";
import type { StateForm } from "@/app/actions/surat";
import { GalatBaris } from "@/components/ui/state";
import { Bidang, Input, Select, Textarea } from "@/components/ui/form";
import { Tombol } from "@/components/ui/tombol";
import { rentangTahun } from "@/lib/format";
import {
  JENIS_KELUAR,
  JENIS_MASUK,
  SIFAT_SURAT,
  STATUS_KELUAR,
  STATUS_MASUK,
} from "@/lib/domain";

type Aksi = (state: StateForm, bentuk: FormData) => Promise<StateForm>;

/* ------------------------------------------------------------------ *
 * Tombol simpan — menampilkan keadaan sedang agar tidak terkirim dua kali
 * ------------------------------------------------------------------ */

function TombolSimpan({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" variant="utama" ukuran="lg" disabled={pending} aria-busy={pending}>
      {pending ? (
        <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
      ) : (
        <Save aria-hidden className="size-3.5" />
      )}
      {pending ? "Menyimpan…" : label}
    </Tombol>
  );
}

/* ------------------------------------------------------------------ *
 * Surat masuk
 * ------------------------------------------------------------------ */

export type NilaiMasuk = {
  nomorSurat: string;
  tanggalSurat: string;
  tanggalMasuk: string;
  pengirim: string;
  penerima: string;
  jenis: string;
  perihal: string;
  disposisi: string;
  diteruskanKe: string;
  catatan: string;
  lampiran: string;
};

export function FormSuratMasuk({
  aksi,
  awal,
  mode,
  hrefBatal,
}: {
  aksi: Aksi;
  awal?: Partial<NilaiMasuk>;
  mode: "buat" | "ubah";
  hrefBatal: string;
}) {
  const [state, formAction] = useActionState(aksi, {});
  const galat = (k: string) => state.fields?.[k];

  return (
    <form action={formAction} noValidate className="space-y-6">
      {state.galat ? <GalatBaris>{state.galat}</GalatBaris> : null}

      <fieldset className="space-y-4">
        <legend className="mb-1 border-b border-garis pb-1.5 text-[13px] font-semibold text-tinta">
          Data berkas
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang
            label="Nomor surat"
            wajib
            bantuan="Tulis persis seperti pada berkas, termasuk garis miring."
            galat={galat("nomorSurat")}
          >
            {(p) => (
              <Input
                {...p}
                name="nomorSurat"
                defaultValue={awal?.nomorSurat}
                placeholder="mis. 045/KL/SM/2026"
                maxLength={64}
                required
                className="tabular"
              />
            )}
          </Bidang>

          <Bidang label="Jenis surat" wajib galat={galat("jenis")}>
            {(p) => (
              <Select {...p} name="jenis" defaultValue={awal?.jenis ?? ""} required>
                <option value="">Pilih jenis surat</option>
                {JENIS_MASUK.map((j) => (
                  <option key={j.nilai} value={j.nilai}>
                    {j.label}
                  </option>
                ))}
              </Select>
            )}
          </Bidang>

          <Bidang label="Tanggal surat" wajib galat={galat("tanggalSurat")}>
            {(p) => (
              <Input
                {...p}
                name="tanggalSurat"
                type="date"
                defaultValue={awal?.tanggalSurat}
                min={rentangTahun().min}
                max={rentangTahun().maks}
                required
              />
            )}
          </Bidang>

          <Bidang
            label="Tanggal masuk"
            wajib
            bantuan="Tanggal berkas diterima di unit kerja."
            galat={galat("tanggalMasuk")}
          >
            {(p) => (
              <Input
                {...p}
                name="tanggalMasuk"
                type="date"
                defaultValue={awal?.tanggalMasuk}
                min={rentangTahun().min}
                max={rentangTahun().maks}
                required
              />
            )}
          </Bidang>

          <Bidang label="Pengirim" wajib galat={galat("pengirim")}>
            {(p) => (
              <Input
                {...p}
                name="pengirim"
                defaultValue={awal?.pengirim}
                placeholder="mis. Dinas Reh Transmigrasi Kabupaten"
                maxLength={160}
                required
              />
            )}
          </Bidang>

          <Bidang label="Penerima di unit" galat={galat("penerima")}>
            {(p) => (
              <Input
                {...p}
                name="penerima"
                defaultValue={awal?.penerima}
                placeholder="mis. Bagian Umum"
                maxLength={120}
              />
            )}
          </Bidang>

          <Bidang
            label="Perihal"
            wajib
            lebarPenuh
            bantuan="Satu kalimat yang menjelaskan isi berkas."
            galat={galat("perihal")}
          >
            {(p) => (
              <Textarea
                {...p}
                name="perihal"
                defaultValue={awal?.perihal}
                maxLength={500}
                required
                className="min-h-[60px]"
              />
            )}
          </Bidang>

          <Bidang label="Lampiran" lebarPenuh galat={galat("lampiran")}>
            {(p) => (
              <Input
                {...p}
                name="lampiran"
                defaultValue={awal?.lampiran}
                placeholder="mis. 1 berkas foto, 1 lembar news"
                maxLength={200}
              />
            )}
          </Bidang>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 border-b border-garis pb-1.5 text-[13px] font-semibold text-tinta">
          Disposisi
        </legend>
        <p className="text-[12.5px] leading-relaxed text-tinta-2">
          Disposisi boleh diisi sekarang, atau nanti lewat tombol “Ubah status” setelah berkas dibaca.
          Status awal setiap surat yang baru dicatat adalah {STATUS_MASUK[0]?.label}.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang label="Diteruskan kepada" galat={galat("diteruskanKe")}>
            {(p) => (
              <Input
                {...p}
                name="diteruskanKe"
                defaultValue={awal?.diteruskanKe}
                placeholder="mis. Kepala Kelurahan"
                maxLength={120}
              />
            )}
          </Bidang>

          <Bidang label="Disposisi" lebarPenuh galat={galat("disposisi")}>
            {(p) => (
              <Textarea
                {...p}
                name="disposisi"
                defaultValue={awal?.disposisi}
                maxLength={500}
                placeholder="mis. Mohon ditindaklanjuti dan laporkan hasilnya ke Bagian Umum."
              />
            )}
          </Bidang>

          <Bidang label="Catatan lain" lebarPenuh galat={galat("catatan")}>
            {(p) => (
              <Textarea
                {...p}
                name="catatan"
                defaultValue={awal?.catatan}
                maxLength={500}
                className="min-h-[60px]"
              />
            )}
          </Bidang>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-garis pt-4">
        <Link href={hrefBatal}>
          <Tombol variant="kedua" ukuran="lg">
            Batal
          </Tombol>
        </Link>
        <TombolSimpan label={mode === "buat" ? "Simpan surat masuk" : "Simpan perubahan"} />
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ *
 * Surat keluar
 * ------------------------------------------------------------------ */

export type NilaiKeluar = {
  tanggalSurat: string;
  tujuan: string;
  jenis: string;
  sifat: string;
  perihal: string;
  penandatangan: string;
  catatan: string;
  status: string;
};

export function FormSuratKeluar({
  aksi,
  awal,
  mode,
  hrefBatal,
  pratinjauNomor,
}: {
  aksi: Aksi;
  awal?: Partial<NilaiKeluar>;
  mode: "buat" | "ubah";
  hrefBatal: string;
  pratinjauNomor?: string;
}) {
  const [state, formAction] = useActionState(aksi, {});
  const galat = (k: string) => state.fields?.[k];
  const [tahun, setTahun] = useState(
    Number(awal?.tanggalSurat?.slice(0, 4)) || new Date().getFullYear(),
  );
  void tahun;

  return (
    <form action={formAction} noValidate className="space-y-6">
      {state.galat ? <GalatBaris>{state.galat}</GalatBaris> : null}

      <div className="flex flex-wrap items-start justify-between gap-3 border border-garis bg-panel px-3 py-2.5">
        <div className="min-w-0">
          <p className="meta">Nomor surat keluar</p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-tinta-2">
            Dibangkitkan otomatis saat disimpan, berurutan per unit dan per tahun. Nomor yang sudah
            terbit tidak berubah lagi.
          </p>
        </div>
        <span className="docket docket-lg">{pratinjauNomor ?? "—"}</span>
      </div>

      <fieldset className="space-y-4">
        <legend className="mb-1 border-b border-garis pb-1.5 text-[13px] font-semibold text-tinta">
          Isi surat
        </legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang label="Tanggal surat" wajib galat={galat("tanggalSurat")}>
            {(p) => (
              <Input
                {...p}
                name="tanggalSurat"
                type="date"
                defaultValue={awal?.tanggalSurat}
                min={rentangTahun().min}
                max={rentangTahun().maks}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) setTahun(Number(v.slice(0, 4)));
                }}
                required
              />
            )}
          </Bidang>

          <Bidang label="Sifat surat" wajib galat={galat("sifat")}>
            {(p) => (
              <Select {...p} name="sifat" defaultValue={awal?.sifat ?? "BIASA"} required>
                {SIFAT_SURAT.map((s) => (
                  <option key={s.nilai} value={s.nilai}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Bidang>

          <Bidang label="Tujuan" wajib galat={galat("tujuan")}>
            {(p) => (
              <Input
                {...p}
                name="tujuan"
                defaultValue={awal?.tujuan}
                placeholder="mis. Ketua RT se-Kelurahan Sukamaju"
                maxLength={160}
                required
              />
            )}
          </Bidang>

          <Bidang label="Jenis surat" wajib galat={galat("jenis")}>
            {(p) => (
              <Select {...p} name="jenis" defaultValue={awal?.jenis ?? ""} required>
                <option value="">Pilih jenis surat</option>
                {JENIS_KELUAR.map((j) => (
                  <option key={j.nilai} value={j.nilai}>
                    {j.label}
                  </option>
                ))}
              </Select>
            )}
          </Bidang>

          <Bidang label="Perihal" wajib lebarPenuh galat={galat("perihal")}>
            {(p) => (
              <Textarea
                {...p}
                name="perihal"
                defaultValue={awal?.perihal}
                maxLength={500}
                required
                className="min-h-[60px]"
              />
            )}
          </Bidang>

          <Bidang
            label="Penandatangan"
            lebarPenuh
            bantuan="Kosongkan untuk memakai nama Kepala Unit secara otomatis."
            galat={galat("penandatangan")}
          >
            {(p) => (
              <Input
                {...p}
                name="penandatangan"
                defaultValue={awal?.penandatangan}
                maxLength={120}
              />
            )}
          </Bidang>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 border-b border-garis pb-1.5 text-[13px] font-semibold text-tinta">
          Status awal
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang
            label="Status saat disimpan"
            galat={galat("status")}
            bantuan="Pilih Draft bila surat belum ditandatangani."
          >
            {(p) => (
              <Select {...p} name="status" defaultValue={awal?.status ?? "DRAFT"}>
                {STATUS_KELUAR.map((s) => (
                  <option key={s.nilai} value={s.nilai}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Bidang>

          <Bidang label="Catatan" galat={galat("catatan")}>
            {(p) => (
              <Input
                {...p}
                name="catatan"
                defaultValue={awal?.catatan}
                placeholder="mis. Diantar langsung oleh petugas"
                maxLength={500}
              />
            )}
          </Bidang>
        </div>
      </fieldset>

      {mode === "ubah" ? (
        <p className="flex items-start gap-2 border-l-2 border-stempel-amber bg-stempel-amber-latar px-3 py-2 text-[12.5px] leading-relaxed text-stempel-amber">
          <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
          Nomor surat dan tanggal terbit tidak ikut berubah saat disunting — surat sudah keluar dari
          unit ini. Status diubah lewat tombol “Ubah status” di halaman detail.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-garis pt-4">
        <Link href={hrefBatal}>
          <Tombol variant="kedua" ukuran="lg">
            Batal
          </Tombol>
        </Link>
        <TombolSimpan label={mode === "buat" ? "Simpan surat keluar" : "Simpan perubahan"} />
      </div>
    </form>
  );
}