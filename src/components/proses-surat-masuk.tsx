"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  Forward,
  LoaderCircle,
  Play,
  UserCheck,
  XCircle,
} from "lucide-react";
import type { StatusMasuk } from "@/lib/domain";
import type { StateForm } from "@/app/actions/surat";
import { ubahStatusMasuk } from "@/app/actions/surat";
import { Dialog } from "@/components/ui/dialog";
import { GalatBaris } from "@/components/ui/state";
import { Bidang, Input, Textarea } from "@/components/ui/form";
import { Tombol } from "@/components/ui/tombol";

type PetugasRingkas = {
  id: string;
  nama: string;
  peran: string;
  username: string;
};

type SuratRingkas = {
  id: string;
  nomorSurat: string;
  status: StatusMasuk;
  disposisi: string | null;
  diteruskanKe: string | null;
  tanggalMasuk: Date;
  catatan?: string | null;
};

const TEMPLATE_DISPOSISI = [
  "Pelajari dan proses tindak lanjut.",
  "Siapkan konsep atau draft jawaban.",
  "Hadiri undangan dan laporkan hasilnya.",
  "Koordinasikan dengan pihak terkait.",
  "Selesaikan dan laporkan sebelum batas waktu.",
];

const TEMPLATE_TOLAK = [
  "Berkas permohonan tidak lengkap atau tidak memenuhi persyaratan.",
  "Bukan merupakan kewenangan atau tugas pokok unit kerja kami.",
  "Alamat atau tujuan surat salah / tidak sesuai.",
  "Permohonan tidak dapat disetujui setelah dilakukan penelaahan.",
  "Melewati batas waktu yang telah ditentukan.",
];

/**
 * Visual Alur / Stepper Surat Masuk:
 * 1. Baru -> 2. Disposisi -> 3. Diproses -> 4. Selesai (atau Ditolak)
 */
export function AlurStepperMasuk({
  status,
  diteruskanKe,
}: {
  status: StatusMasuk;
  diteruskanKe?: string | null;
}) {
  if (status === "DITOLAK") {
    return (
      <div className="mb-4 rounded-panel border border-stempel-merah/40 bg-stempel-merah-latar/40 p-3.5">
        <div className="flex items-center gap-2.5 text-stempel-merah">
          <XCircle aria-hidden className="size-5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-[13px] font-semibold text-stempel-merah">
              Status Berkas: Ditolak
            </h3>
            <p className="mt-0.5 text-[11.5px] leading-tight text-stempel-merah/90">
              Surat ini telah ditolak. Rangkaian penanganan dan disposisi telah dihentikan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tahapan = [
    {
      kunci: "BARU",
      nomor: 1,
      label: "Baru Dicatat",
      deskripsi: "Tercatat di buku agenda",
      ikon: FileText,
    },
    {
      kunci: "DISPOSISI",
      nomor: 2,
      label: "Disposisi",
      deskripsi: diteruskanKe ? `Ke: ${diteruskanKe}` : "Diarahkan ke petugas",
      ikon: Forward,
    },
    {
      kunci: "PROSES",
      nomor: 3,
      label: "Diproses",
      deskripsi: "Tindak lanjut oleh petugas",
      ikon: Clock,
    },
    {
      kunci: "SELESAI",
      nomor: 4,
      label: "Selesai",
      deskripsi: "Tuntas & diarsipkan",
      ikon: CheckCircle2,
    },
  ];

  const urutanStatus: Record<StatusMasuk, number> = {
    BARU: 1,
    DISPOSISI: 2,
    PROSES: 3,
    SELESAI: 4,
    DITOLAK: 0,
  };

  const indeksSekarang = urutanStatus[status];

  return (
    <div className="mb-4 rounded-panel border border-garis bg-lembar p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[12.5px] font-semibold text-tinta">Alur Penanganan Surat</h3>
        <span className="text-[11.5px] font-medium text-tinta-3">
          Tahap {indeksSekarang} dari 4
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tahapan.map((t) => {
          const selesai = t.nomor < indeksSekarang;
          const aktif = t.nomor === indeksSekarang;
          const Ikon = t.ikon;

          return (
            <div
              key={t.kunci}
              className={[
                "flex items-start gap-2 rounded-kontrol border p-2.5 transition-colors",
                selesai
                  ? "border-hijau/40 bg-hijau-terang/40 text-hijau"
                  : aktif
                    ? "border-hijau bg-hijau-terang/60 shadow-xs"
                    : "border-garis bg-panel/40 text-tinta-3",
              ].join(" ")}
            >
              <div
                className={[
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                  selesai
                    ? "bg-hijau text-lembar"
                    : aktif
                      ? "border-2 border-hijau bg-lembar text-hijau"
                      : "border border-garis-kuat bg-lembar text-tinta-3",
                ].join(" ")}
              >
                {selesai ? <Check aria-hidden className="size-3.5 stroke-[3]" /> : <Ikon aria-hidden className="size-3.5" />}
              </div>
              <div className="min-w-0">
                <p
                  className={[
                    "text-[12px] leading-tight font-semibold",
                    aktif ? "text-tinta" : selesai ? "text-tinta" : "text-tinta-3",
                  ].join(" ")}
                >
                  {t.label}
                </p>
                <p className="mt-0.5 truncate text-[11px] leading-tight text-tinta-2">
                  {t.deskripsi}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Panel Tindak Lanjut Aktif Surat Masuk:
 * Mengarahkan petugas dari status BARU -> DISPOSISI -> PROSES -> SELESAI
 * Serta menyediakan opsi penolakan surat (DITOLAK)
 */
export function PanelTindakLanjutMasuk({
  surat,
  daftarPetugas,
  namaPenggunaAktif,
}: {
  surat: SuratRingkas;
  daftarPetugas: PetugasRingkas[];
  namaPenggunaAktif: string;
}) {
  const [modalBuka, setModalBuka] = useState(false);
  const [modalTolakBuka, setModalTolakBuka] = useState(false);
  const [diteruskanKeInput, setDiteruskanKeInput] = useState(surat.diteruskanKe ?? "");
  const [disposisiInput, setDisposisiInput] = useState(surat.disposisi ?? "");
  const [alasanTolakInput, setAlasanTolakInput] = useState("");

  const aksiBound = ubahStatusMasuk.bind(null, surat.id);
  const [state, formAction] = useActionState(aksiBound, {});
  const [stateTolak, formActionTolak] = useActionState(aksiBound, {});

  const idForm = useRef(`form-tindak-${Math.random().toString(36).slice(2, 9)}`).current;
  const idFormTolak = useRef(`form-tolak-${Math.random().toString(36).slice(2, 9)}`).current;

  useEffect(() => {
    if (state.nilai?.info) setModalBuka(false);
  }, [state]);

  useEffect(() => {
    if (stateTolak.nilai?.info) setModalTolakBuka(false);
  }, [stateTolak]);

  // Dialog Tolak Surat (Rejection Dialog)
  const dialogTolak = (
    <Dialog
      buka={modalTolakBuka}
      onTutup={() => setModalTolakBuka(false)}
      judul="Tolak Surat Masuk"
      deskripsi={`Surat nomor ${surat.nomorSurat} akan ditolak dan proses tindak lanjut dihentikan.`}
      aksi={
        <>
          <Tombol variant="kedua" ukuran="md" onClick={() => setModalTolakBuka(false)}>
            Batal
          </Tombol>
          <Tombol
            type="submit"
            form={idFormTolak}
            variant="bahaya"
            ukuran="md"
          >
            Konfirmasi Tolak Surat
          </Tombol>
        </>
      }
    >
      <form id={idFormTolak} action={formActionTolak} noValidate className="space-y-4">
        {stateTolak.galat ? <GalatBaris>{stateTolak.galat}</GalatBaris> : null}
        <input type="hidden" name="status" value="DITOLAK" />

        <Bidang
          label="Alasan Penolakan (Wajib)"
          bantuan="Jelaskan alasan mengapa surat ini ditolak agar tersimpan pada catatan riwayat berkas."
        >
          {(p) => (
            <div className="space-y-2">
              <Textarea
                {...p}
                name="catatan"
                value={alasanTolakInput}
                onChange={(e) => setAlasanTolakInput(e.target.value)}
                placeholder="mis. Berkas permohonan tidak lengkap atau salah tujuan alamat unit kerja."
                maxLength={500}
                rows={3}
                required
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-tinta-3">Pilihan cepat:</span>
                {TEMPLATE_TOLAK.map((tmpl) => (
                  <button
                    key={tmpl}
                    type="button"
                    onClick={() => setAlasanTolakInput(tmpl)}
                    className="rounded-full border border-garis bg-lembar px-2 py-0.5 text-[11px] text-tinta-2 hover:border-stempel-merah hover:text-stempel-merah"
                  >
                    + {tmpl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Bidang>
      </form>
    </Dialog>
  );

  // Status DITOLAK
  if (surat.status === "DITOLAK") {
    return (
      <div className="rounded-panel border border-stempel-merah/40 bg-stempel-merah-latar/40 p-4">
        <div className="flex items-start gap-2.5">
          <XCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-stempel-merah" />
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-semibold text-tinta">Berkas Surat Ditolak</h4>
            <p className="mt-1 text-[12.5px] leading-relaxed text-tinta-2">
              Surat ini telah ditolak oleh petugas/pimpinan dan proses administrasi telah dihentikan.
            </p>
            {surat.catatan ? (
              <div className="mt-2.5 rounded-kontrol border border-stempel-merah/25 bg-lembar p-2.5 text-[12px]">
                <span className="font-semibold text-stempel-merah">Alasan Penolakan:</span>
                <p className="mt-0.5 text-tinta italic">“{surat.catatan}”</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Status SELESAI
  if (surat.status === "SELESAI") {
    return (
      <div className="rounded-panel border border-hijau/40 bg-hijau-terang/30 p-4">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 aria-hidden className="mt-0.5 size-5 shrink-0 text-hijau" />
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-semibold text-tinta">Penanganan Surat Selesai</h4>
            <p className="mt-1 text-[12.5px] leading-relaxed text-tinta-2">
              Seluruh rangkaian penanganan surat ini telah tuntas diselesaikan dan berkas siap diarsipkan.
            </p>
            {surat.diteruskanKe ? (
              <div className="mt-2 text-[12px] text-tinta-2">
                Ditangani oleh: <strong className="font-semibold text-tinta">{surat.diteruskanKe}</strong>
              </div>
            ) : null}
            {surat.disposisi ? (
              <div className="mt-1 text-[12px] italic text-tinta-2">
                Instruksi disposisi: “{surat.disposisi}”
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Status BARU -> Target berikutnya: DISPOSISI atau DITOLAK
  if (surat.status === "BARU") {
    return (
      <div className="space-y-3">
        <div className="rounded-kontrol border border-garis bg-panel/50 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900">
                Langkah 1: Disposisi
              </span>
              <h4 className="mt-1 text-[13px] font-semibold text-tinta">
                Surat Masuk Baru Dicatat
              </h4>
              <p className="mt-0.5 text-[12px] leading-relaxed text-tinta-2">
                Surat belum diberi disposisi. Tentukan petugas pelaksana atau tolak berkas jika tidak memenuhi syarat.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Tombol variant="utama" ukuran="md" onClick={() => setModalBuka(true)}>
              <Forward aria-hidden className="size-3.5" />
              Beri Disposisi & Teruskan
            </Tombol>
            <Tombol
              variant="kedua"
              ukuran="md"
              onClick={() => setModalTolakBuka(true)}
              className="text-stempel-merah hover:border-stempel-merah hover:bg-stempel-merah-latar"
            >
              <XCircle aria-hidden className="size-3.5" />
              Tolak Surat
            </Tombol>
          </div>
        </div>

        <Dialog
          buka={modalBuka}
          onTutup={() => setModalBuka(false)}
          judul="Disposisi Surat Masuk"
          deskripsi={`Arahkan surat nomor ${surat.nomorSurat} kepada petugas pelaksana dan tentukan instruksi tindak lanjut.`}
          aksi={
            <>
              <Tombol variant="kedua" ukuran="md" onClick={() => setModalBuka(false)}>
                Batal
              </Tombol>
              <TombolKirim form={idForm} label="Simpan Disposisi & Teruskan" />
            </>
          }
        >
          <form id={idForm} action={formAction} noValidate className="space-y-4">
            {state.galat ? <GalatBaris>{state.galat}</GalatBaris> : null}
            <input type="hidden" name="status" value="DISPOSISI" />

            <Bidang
              label="Diteruskan kepada (Petugas / Bidang)"
              bantuan="Pilih petugas pelaksana dari daftar atau ketik langsung nama seksi/petugas."
            >
              {(p) => (
                <div className="space-y-2">
                  <Input
                    {...p}
                    name="diteruskanKe"
                    value={diteruskanKeInput}
                    onChange={(e) => setDiteruskanKeInput(e.target.value)}
                    placeholder="mis. Rina Marlina, Seksi Pemerintahan, dll."
                    maxLength={120}
                    required
                  />
                  {daftarPetugas.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-tinta-3">Petugas di unit:</span>
                      {daftarPetugas.map((pt) => (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() => setDiteruskanKeInput(pt.nama)}
                          className="rounded-full border border-garis bg-lembar px-2 py-0.5 text-[11px] font-medium text-tinta-2 hover:border-hijau hover:text-hijau"
                        >
                          + {pt.nama} ({pt.peran === "KEPALA" ? "Kepala" : "Petugas"})
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </Bidang>

            <Bidang
              label="Instruksi Disposisi"
              bantuan="Catatan arahan atau perintah dari pimpinan untuk petugas penanggung jawab."
            >
              {(p) => (
                <div className="space-y-2">
                  <Textarea
                    {...p}
                    name="disposisi"
                    value={disposisiInput}
                    onChange={(e) => setDisposisiInput(e.target.value)}
                    placeholder="mis. Pelajari berkas permohonan dan koordinasikan dengan RT/RW setempat."
                    maxLength={500}
                    rows={3}
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-tinta-3">Pilihan cepat:</span>
                    {TEMPLATE_DISPOSISI.map((tmpl) => (
                      <button
                        key={tmpl}
                        type="button"
                        onClick={() => setDisposisiInput(tmpl)}
                        className="rounded-full border border-garis bg-lembar px-2 py-0.5 text-[11px] text-tinta-2 hover:border-hijau hover:text-hijau"
                      >
                        + {tmpl}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Bidang>

            <Bidang
              label="Catatan Riwayat (Opsional)"
              bantuan="Dicatat pada riwayat perubahan status berkas."
            >
              {(p) => (
                <Input
                  {...p}
                  name="catatan"
                  placeholder="mis. Disposisi diserahkan via buku kendali"
                  maxLength={500}
                />
              )}
            </Bidang>
          </form>
        </Dialog>

        {dialogTolak}
      </div>
    );
  }

  // Status DISPOSISI -> Target berikutnya: PROSES atau DITOLAK
  if (surat.status === "DISPOSISI") {
    return (
      <div className="space-y-3">
        <div className="rounded-kontrol border border-garis bg-panel/50 p-3">
          <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-semibold text-blue-900">
            Langkah 2: Proses Penanganan
          </span>
          <h4 className="mt-1 text-[13px] font-semibold text-tinta">
            Surat Sudah Diberi Disposisi
          </h4>

          <div className="my-2 rounded-kontrol border border-garis bg-lembar p-2.5 text-[12px] space-y-1">
            <div>
              <span className="text-tinta-3">Ditujukan kepada:</span>{" "}
              <strong className="font-semibold text-tinta">{surat.diteruskanKe || "Belum ditentukan"}</strong>
            </div>
            {surat.disposisi ? (
              <div>
                <span className="text-tinta-3">Arahan:</span>{" "}
                <span className="italic text-tinta-2">“{surat.disposisi}”</span>
              </div>
            ) : null}
          </div>

          <p className="text-[12px] leading-relaxed text-tinta-2">
            Petugas yang ditugaskan dapat langsung memulai penanganan atau menolak berkas jika bukan tupoksinya.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Tombol variant="utama" ukuran="md" onClick={() => setModalBuka(true)}>
              <Play aria-hidden className="size-3.5" />
              Mulai Proses Surat
            </Tombol>
            <Tombol
              variant="kedua"
              ukuran="md"
              onClick={() => setModalTolakBuka(true)}
              className="text-stempel-merah hover:border-stempel-merah hover:bg-stempel-merah-latar"
            >
              <XCircle aria-hidden className="size-3.5" />
              Tolak Surat
            </Tombol>
          </div>
        </div>

        <Dialog
          buka={modalBuka}
          onTutup={() => setModalBuka(false)}
          judul="Mulai Proses Surat Masuk"
          deskripsi={`Tandai bahwa surat nomor ${surat.nomorSurat} sedang aktif dikerjakan oleh petugas.`}
          aksi={
            <>
              <Tombol variant="kedua" ukuran="md" onClick={() => setModalBuka(false)}>
                Batal
              </Tombol>
              <TombolKirim form={idForm} label="Mulai Proses Sekarang" />
            </>
          }
        >
          <form id={idForm} action={formAction} noValidate className="space-y-4">
            {state.galat ? <GalatBaris>{state.galat}</GalatBaris> : null}
            <input type="hidden" name="status" value="PROSES" />

            <div className="rounded-kontrol border border-garis bg-panel/40 p-3 text-[12.5px]">
              <div className="flex items-center gap-1.5 text-tinta">
                <UserCheck aria-hidden className="size-4 text-hijau" />
                <span>Petugas pemroses: <strong>{namaPenggunaAktif}</strong></span>
              </div>
              <p className="mt-1 text-[11.5px] text-tinta-3">
                Penanggung jawab: {surat.diteruskanKe || "Petugas unit"}
              </p>
            </div>

            <Bidang
              label="Catatan Progres / Rencana Tindak Lanjut"
              bantuan="Catat apa yang sedang disiapkan atau dikerjakan untuk menangani surat ini."
            >
              {(p) => (
                <Textarea
                  {...p}
                  name="catatan"
                  placeholder="mis. Berkas sedang diverifikasi dan draft balasan sedang disusun."
                  maxLength={500}
                  rows={3}
                />
              )}
            </Bidang>
          </form>
        </Dialog>

        {dialogTolak}
      </div>
    );
  }

  // Status PROSES -> Target berikutnya: SELESAI atau DITOLAK
  if (surat.status === "PROSES") {
    return (
      <div className="space-y-3">
        <div className="rounded-kontrol border border-garis bg-panel/50 p-3">
          <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[11px] font-semibold text-purple-900">
            Langkah 3: Selesaikan Surat
          </span>
          <h4 className="mt-1 text-[13px] font-semibold text-tinta">
            Surat Sedang Dalam Proses
          </h4>

          <div className="my-2 rounded-kontrol border border-garis bg-lembar p-2.5 text-[12px] space-y-1">
            <div>
              <span className="text-tinta-3">Pelaksana:</span>{" "}
              <strong className="font-semibold text-tinta">{surat.diteruskanKe || "Petugas"}</strong>
            </div>
            {surat.disposisi ? (
              <div>
                <span className="text-tinta-3">Arahan:</span>{" "}
                <span className="italic text-tinta-2">“{surat.disposisi}”</span>
              </div>
            ) : null}
          </div>

          <p className="text-[12px] leading-relaxed text-tinta-2">
            Jika proses pengerjaan tuntas, tandai selesai. Jika hasil telaah tidak dapat disetujui, tolak surat.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Tombol variant="utama" ukuran="md" onClick={() => setModalBuka(true)}>
              <CheckCircle2 aria-hidden className="size-3.5" />
              Tandai Selesai & Arsipkan
            </Tombol>
            <Tombol
              variant="kedua"
              ukuran="md"
              onClick={() => setModalTolakBuka(true)}
              className="text-stempel-merah hover:border-stempel-merah hover:bg-stempel-merah-latar"
            >
              <XCircle aria-hidden className="size-3.5" />
              Tolak Surat
            </Tombol>
          </div>
        </div>

        <Dialog
          buka={modalBuka}
          onTutup={() => setModalBuka(false)}
          judul="Selesaikan Penanganan Surat"
          deskripsi={`Tandai penanganan surat nomor ${surat.nomorSurat} telah selesai dan tuntas.`}
          aksi={
            <>
              <Tombol variant="kedua" ukuran="md" onClick={() => setModalBuka(false)}>
                Batal
              </Tombol>
              <TombolKirim form={idForm} label="Konfirmasi Selesai & Arsipkan" />
            </>
          }
        >
          <form id={idForm} action={formAction} noValidate className="space-y-4">
            {state.galat ? <GalatBaris>{state.galat}</GalatBaris> : null}
            <input type="hidden" name="status" value="SELESAI" />

            <Bidang
              label="Catatan Hasil Akhir / Penyelesaian"
              bantuan="Tuliskan ringkasan hasil tindak lanjut (mis. nomor surat balasan atau arsip disimpan)."
            >
              {(p) => (
                <Textarea
                  {...p}
                  name="catatan"
                  placeholder="mis. Tindak lanjut tuntas. Surat tanggapan telah diterbitkan dan diantarkan ke tujuan."
                  maxLength={500}
                  rows={3}
                />
              )}
            </Bidang>
          </form>
        </Dialog>

        {dialogTolak}
      </div>
    );
  }

  return null;
}

function TombolKirim({ form, label }: { form: string; label: string }) {
  const { pending } = useFormStatus();
  return (
    <Tombol
      type="submit"
      form={form}
      variant="utama"
      ukuran="md"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? <LoaderCircle aria-hidden className="size-3.5 animate-spin" /> : null}
      {pending ? "Menyimpan…" : label}
    </Tombol>
  );
}
