"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import { GalatBaris } from "@/components/ui/state";
import { Input } from "@/components/ui/form";
import { Tombol } from "@/components/ui/tombol";

export type StateMasuk = { galat?: string; fields?: Record<string, string> };

export type AksiMasuk = (
  state: StateMasuk,
  bentuk: FormData,
) => Promise<StateMasuk>;

export function TombolMasuk() {
  const { pending } = useFormStatus();
  return (
    <Tombol
      type="submit"
      variant="utama"
      ukuran="lg"
      className="w-full"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? <LoaderCircle aria-hidden className="size-3.5 animate-spin" /> : null}
      {pending ? "Memeriksa…" : "Masuk"}
    </Tombol>
  );
}

export function FormMasuk({ aksi }: { aksi: AksiMasuk }) {
  const [state, formAction] = useActionState(aksi, {});

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.galat ? <GalatBaris>{state.galat}</GalatBaris> : null}

      <div>
        <label htmlFor="username" className="mb-1 block text-[12.5px] font-semibold text-tinta">
          Nama pengguna
        </label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={60}
          aria-invalid={Boolean(state.fields?.username)}
          className="h-9"
        />
        {state.fields?.username ? (
          <p className="mt-1 text-[12px] font-medium text-stempel-merah">{state.fields.username}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-[12.5px] font-semibold text-tinta">
          Kata sandi
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={72}
          aria-invalid={Boolean(state.fields?.password)}
          className="h-9"
        />
        {state.fields?.password ? (
          <p className="mt-1 text-[12px] font-medium text-stempel-merah">{state.fields.password}</p>
        ) : null}
      </div>

      <TombolMasuk />
    </form>
  );
}