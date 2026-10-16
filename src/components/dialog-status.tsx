"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight, LoaderCircle, Trash2 } from "lucide-react";
import type { StateForm } from "@/app/actions/surat";
import { Dialog } from "@/components/ui/dialog";
import { GalatBaris } from "@/components/ui/state";
import { Bidang, Input, Textarea } from "@/components/ui/form";
import { Tombol } from "@/components/ui/tombol";

type Aksi = (state: StateForm, bentuk: FormData) => Promise<StateForm>;

/**
 * Dialog perubahan status.
 *
 * Hanya tahap BERIKUTNYA yang ditawarkan, karena status hanya boleh maju satu
 * tahap. Kalau surat sudah di tahap terakhir, yang ditampilkan adalah
 * penjelasan — bukan daftar pilihan kosong yang membingungkan.
 *
 * Tombol kirim berada di luar elemen <form> (di kaki dialog), jadi
 * dihubungkan lewat atribut `form` — tetap terkirim ke server action tanpa
 * javascript tambahan.
 */
export function DialogStatus({
  aksi,
  nilaiAwal,
  judul,
  deskripsi,
  labelSimpan,
  tahapBerikut,
  tampilkanDisposisi = false,
}: {
  aksi: Aksi;
  nilaiAwal?: { disposisi?: string | null; diteruskanKe?: string | null };
  judul: string;
  deskripsi: string;
  labelSimpan: string;
  tahapBerikut: Array<{ nilai: string; label: string; deskripsi: string }>;
  tampilkanDisposisi?: boolean;
}) {
  const [buka, setBuka] = useState(false);
  const [state, formAction] = useActionState(aksi, {});
  const pemicu = useRef<HTMLButtonElement>(null);
  const idForm = useRef(`form-status-${Math.random().toString(36).slice(2, 9)}`).current;

  useEffect(() => {
    if (state.nilai?.info) setBuka(false);
  }, [state]);

  const tutup = () => {
    setBuka(false);
    pemicu.current?.focus();
  };

  if (tahapBerikut.length === 0) {
    return (
      <p className="rounded-kontrol border border-garis bg-panel px-3 py-2 text-[12.5px] leading-relaxed text-tinta-2">
        Surat sudah berada pada tahap terakhir. Tidak ada perubahan status yang perlu dilakukan.
      </p>
    );
  }

  return (
    <>
      <Tombol
        ref={pemicu as never}
        variant="utama"
        ukuran="md"
        onClick={() => setBuka(true)}
      >
        <ArrowRight aria-hidden className="size-3.5" />
        Ubah status
      </Tombol>

      <Dialog
        buka={buka}
        onTutup={tutup}
        judul={judul}
        deskripsi={deskripsi}
        aksi={
          <>
            <TombolBatal onClick={tutup} />
            <TombolKirimStatus label={labelSimpan} form={idForm} />
          </>
        }
      >
        <form id={idForm} action={formAction} noValidate className="space-y-4">
          {state.galat ? <GalatBaris>{state.galat}</GalatBaris> : null}

          <fieldset>
            <legend className="sr-only">Tahap status berikutnya</legend>
            <div className="space-y-2">
              {tahapBerikut.map((t, i) => (
                <label
                  key={t.nilai}
                  className="flex cursor-pointer items-start gap-2.5 rounded-kontrol border border-garis-kuat bg-lembar px-3 py-2.5 hover:border-hijau has-[:checked]:border-hijau has-[:checked]:bg-hijau-terang"
                >
                  <input
                    type="radio"
                    name="status"
                    value={t.nilai}
                    defaultChecked={i === 0}
                    className="mt-0.5 size-3.5 accent-hijau"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-tinta">{t.label}</span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-tinta-2">
                      {t.deskripsi}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {tampilkanDisposisi ? (
            <>
              <Bidang label="Diteruskan kepada">
                {(p) => (
                  <Input
                    {...p}
                    name="diteruskanKe"
                    defaultValue={nilaiAwal?.diteruskanKe ?? ""}
                    placeholder="mis. Kepala Kelurahan"
                    maxLength={120}
                  />
                )}
              </Bidang>
              <Bidang label="Disposisi">
                {(p) => (
                  <Textarea
                    {...p}
                    name="disposisi"
                    defaultValue={nilaiAwal?.disposisi ?? ""}
                    maxLength={500}
                    placeholder="Mohon ditindaklanjuti dan laporkan hasilnya ke Bagian Umum."
                  />
                )}
              </Bidang>
            </>
          ) : null}

          <Bidang
            label="Catatan untuk riwayat"
            bantuan="Tersimpan pada riwayat status dan ikut terbaca saat berkas ditelusuri kembali."
          >
            {(p) => <Input {...p} name="catatan" maxLength={500} />}
          </Bidang>
        </form>
      </Dialog>
    </>
  );
}

function TombolBatal({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <Tombol variant="kedua" ukuran="md" onClick={onClick} disabled={pending}>
      Batal
    </Tombol>
  );
}

/** Tombol submit di kaki dialog yang mengikuti keadaan simpan. */
function TombolKirimStatus({ label, form }: { label: string; form: string }) {
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

import { hapusSuratMasuk, hapusSuratKeluar } from "@/app/actions/surat";

/**
 * Tombol hapus. Nomor surat disebut langsung di dalam konfirmasi supaya
 * petugas tidak salah menghapus berkas yang mirip.
 *
 * Menerima suratId dan jenis langsung agar tidak meneruskan event handler
 * dari Server Component ke Client Component.
 */
export function TombolHapus({
  nomorSurat,
  suratId,
  jenis,
}: {
  nomorSurat: string;
  suratId: string;
  jenis: "MASUK" | "KELUAR";
}) {
  const [buka, setBuka] = useState(false);
  const [sedang, setSedang] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);

  const jalankanHapus = async () => {
    setSedang(true);
    setGalat(null);
    try {
      const res =
        jenis === "MASUK"
          ? await hapusSuratMasuk(suratId)
          : await hapusSuratKeluar(suratId);
      if (res?.galat) {
        setGalat(res.galat);
        setSedang(false);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("NEXT_REDIRECT")) return;
      setGalat(msg || "Gagal menghapus surat.");
      setSedang(false);
    }
  };

  return (
    <>
      <Tombol variant="bahaya" ukuran="md" onClick={() => setBuka(true)}>
        <Trash2 aria-hidden className="size-3.5" />
        Hapus
      </Tombol>
      <Dialog
        buka={buka}
        onTutup={() => setBuka(false)}
        judul="Hapus surat ini?"
        lebar="sm"
        aksi={
          <>
            <Tombol variant="kedua" ukuran="md" onClick={() => setBuka(false)} disabled={sedang}>
              Batal
            </Tombol>
            <Tombol
              variant="bahaya"
              ukuran="md"
              disabled={sedang}
              aria-busy={sedang}
              onClick={jalankanHapus}
            >
              {sedang ? "Menghapus…" : "Hapus surat"}
            </Tombol>
          </>
        }
      >
        {galat ? (
          <div className="mb-3 rounded-kontrol border border-stempel-merah bg-stempel-merah-latar px-3 py-2 text-[12.5px] text-stempel-merah">
            {galat}
          </div>
        ) : null}
        <p className="text-[13px] leading-relaxed text-tinta-2">
          Surat{" "}
          <span className="docket align-middle">{nomorSurat}</span> akan dihapus permanen dari arsip
          unit ini, termasuk riwayat statusnya. Tindakan ini tidak dapat dibatalkan.
        </p>
      </Dialog>
    </>
  );
}

export { TombolKirimStatus };