import type { ReactNode } from "react";
import { useId } from "react";

/**
 * Elemen formulir. Label selalu di atas input (bukan sebagai placeholder),
 * teks bantuan opsional, dan pesan galat di bawah field — bukan toast.
 * Tidak ada komponen pun yang memakai placeholder sebagai label.
 */

export function Bidang({
  label,
  wajib = false,
  bantuan,
  galat,
  children,
  lebarPenuh = false,
}: {
  label: string;
  wajib?: boolean;
  bantuan?: ReactNode;
  galat?: string;
  children: (prop: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode;
  lebarPenuh?: boolean;
}) {
  const id = useId();
  const idBantuan = `${id}-b`;
  const idGalat = `${id}-g`;
  const dideskripsi = [bantuan ? idBantuan : null, galat ? idGalat : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={lebarPenuh ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-1 block text-[12.5px] font-semibold text-tinta">
        {label}
        {wajib ? (
          <span className="ml-1 font-normal text-stempel-merah" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children({
        id,
        "aria-invalid": Boolean(galat),
        "aria-describedby": dideskripsi || undefined,
      })}
      {bantuan ? (
        <p id={idBantuan} className="mt-1 text-[12px] leading-relaxed text-tinta-2">
          {bantuan}
        </p>
      ) : null}
      {galat ? (
        <p id={idGalat} className="mt-1 text-[12px] font-medium text-stempel-merah">
          {galat}
        </p>
      ) : null}
    </div>
  );
}

/** Gaya kontrol yang dipakai bersama oleh input, select, dan textarea. */
const DASAR =
  "w-full rounded-kontrol border bg-lembar px-2.5 py-1.5 text-[13.5px] text-tinta " +
  "placeholder:text-tinta-3 transition-colors duration-100 " +
  "hover:border-garis-kuat focus:border-hijau focus:outline-none focus:ring-2 focus:ring-hijau/25 " +
  "disabled:bg-panel disabled:text-tinta-3";

export function Input({ className = "", ...sisa }: React.ComponentProps<"input">) {
  return (
    <input
      className={[DASAR, "h-8", galatClass(sisa["aria-invalid"]), className].join(" ")}
      {...sisa}
    />
  );
}

export function Textarea({ className = "", ...sisa }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={[DASAR, "min-h-[76px] resize-y leading-relaxed", galatClass(sisa["aria-invalid"]), className].join(" ")}
      {...sisa}
    />
  );
}

export function Select({ className = "", children, ...sisa }: React.ComponentProps<"select">) {
  return (
    <select
      className={[DASAR, "h-8 cursor-pointer appearance-none bg-no-repeat pr-7", galatClass(sisa["aria-invalid"]), className].join(" ")}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%23565c54' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 8px center",
      }}
      {...sisa}
    >
      {children}
    </select>
  );
}

function galatClass(ariaInvalid: unknown): string {
  return ariaInvalid
    ? "border-stempel-merah focus:border-stempel-merah focus:ring-stempel-merah/25"
    : "border-garis-kuat";
}

/** Baris label + nilai untuk halaman detail. Dipisah hairline, bukan kartu. */
export function Baris({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-garis py-2 last:border-b-0 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4 sm:py-2.5">
      <dt className="meta pt-0.5">{label}</dt>
      <dd
        className={[
          "min-w-0 text-[13px] leading-relaxed text-tinta sm:text-[13.5px]",
          mono && "tabular",
          "empty:after:text-[13px] empty:after:text-tinta-3 empty:after:content-['—']",
        ].join(" ")}
      >
        {children}
      </dd>
    </div>
  );
}