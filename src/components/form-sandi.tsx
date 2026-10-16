"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, LoaderCircle } from "lucide-react";
import type { StateForm } from "@/app/actions/surat";
import { GalatBaris, BerhasilBaris } from "@/components/ui/state";
import { Bidang, Input } from "@/components/ui/form";
import { Tombol } from "@/components/ui/tombol";

export function FormGantiSandi({
  aksi,
}: {
  aksi: (state: StateForm, bentuk: FormData) => Promise<StateForm>;
}) {
  const [state, formAction] = useActionState(aksi, {});
  const galat = (k: string) => state.fields?.[k];

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.galat ? <GalatBaris>{state.galat}</GalatBaris> : null}
      {state.nilai?.info ? <BerhasilBaris>{state.nilai.info}</BerhasilBaris> : null}

      <Bidang label="Kata sandi sekarang" wajib galat={galat("sandiSekarang")}>
        {(p) => (
          <Input
            {...p}
            name="sandiSekarang"
            type="password"
            autoComplete="current-password"
            required
            maxLength={72}
          />
        )}
      </Bidang>

      <Bidang
        label="Kata sandi baru"
        wajib
        bantuan="Minimal 8 karakter. Gabungan kata yang mudah diingat lebih baik daripada sandi pendek yang rumit."
        galat={galat("sandiBaru")}
      >
        {(p) => (
          <Input
            {...p}
            name="sandiBaru"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
          />
        )}
      </Bidang>

      <Bidang label="Ulangi kata sandi baru" wajib galat={galat("sandiUlangi")}>
        {(p) => (
          <Input
            {...p}
            name="sandiUlangi"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
          />
        )}
      </Bidang>

      <div className="flex justify-end border-t border-garis pt-4">
        <TombolSimpan />
      </div>
    </form>
  );
}

function TombolSimpan() {
  const { pending } = useFormStatus();
  return (
    <Tombol type="submit" variant="utama" ukuran="lg" disabled={pending} aria-busy={pending}>
      {pending ? (
        <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
      ) : (
        <KeyRound aria-hidden className="size-3.5" />
      )}
      {pending ? "Menyimpan…" : "Simpan kata sandi baru"}
    </Tombol>
  );
}