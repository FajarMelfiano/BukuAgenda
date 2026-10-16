"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Select } from "@/components/ui/form";
import { Tombol } from "@/components/ui/tombol";

/**
 * Baris kendali di atas tabel register.
 *
 * State tampilan (pencarian, status, jenis, bulan) disimpan di URL, bukan di
 * memori komponen: daftar yang sedang dibaca bisa dibagikan ke rekan satu
 * unit, ditandai, dan tetap sama setelah tombol "kembali" ditekan.
 */
export function Kendali({
  basePath,
  labelCari,
  opsiStatus,
  opsiJenis,
  tampilkanStatus = true,
  tampilkanJenis = true,
}: {
  basePath: string;
  labelCari: string;
  opsiStatus?: Array<{ nilai: string; label: string }>;
  opsiJenis?: Array<{ nilai: string; label: string }>;
  tampilkanStatus?: boolean;
  tampilkanJenis?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  const terapkan = (perubahan: Record<string, string | null>) => {
    const baru = new URLSearchParams(params.toString());
    for (const [kunci, nilai] of Object.entries(perubahan)) {
      if (!nilai) baru.delete(kunci);
      else baru.set(kunci, nilai);
    }
    baru.delete("halaman");
    const qs = baru.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const filterAktif =
    Boolean(params.get("status")) ||
    Boolean(params.get("jenis")) ||
    Boolean(params.get("bulan")) ||
    Boolean(params.get("q"));

  return (
    <div
      data-cetak="sembunyi"
      className="flex flex-col gap-2 border-b border-garis p-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:px-3 sm:py-2"
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          terapkan({ q: q.trim() || null });
        }}
        className="relative w-full sm:min-w-[13rem] sm:flex-1"
      >
        <label htmlFor="filter-q" className="sr-only">
          {labelCari}
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-tinta-3"
        />
        <input
          id="filter-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && q) {
              e.preventDefault();
              setQ("");
              terapkan({ q: null });
            }
          }}
          placeholder={labelCari}
          className="h-8 w-full rounded-kontrol border border-garis-kuat bg-lembar pl-7 pr-7 text-[13px] text-tinta placeholder:text-tinta-3 hover:border-tinta-3 focus:border-hijau focus:outline-none focus:ring-2 focus:ring-hijau/25"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              terapkan({ q: null });
            }}
            aria-label="Bersihkan pencarian"
            className="absolute right-1 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-kontrol text-tinta-3 hover:bg-panel hover:text-tinta"
          >
            <X aria-hidden className="size-3.5" />
          </button>
        ) : null}
      </form>

      <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:flex-wrap sm:items-center">
        {tampilkanStatus && opsiStatus?.length ? (
          <div>
            <label htmlFor="filter-status" className="sr-only">
              Saring menurut status
            </label>
            <Select
              id="filter-status"
              value={params.get("status") ?? ""}
              onChange={(e) => terapkan({ status: e.target.value || null })}
              className="w-full sm:w-auto sm:min-w-[8.5rem]"
            >
              <option value="">Semua status</option>
              {opsiStatus.map((s) => (
                <option key={s.nilai} value={s.nilai}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {tampilkanJenis && opsiJenis?.length ? (
          <div>
            <label htmlFor="filter-jenis" className="sr-only">
              Saring menurut jenis
            </label>
            <Select
              id="filter-jenis"
              value={params.get("jenis") ?? ""}
              onChange={(e) => terapkan({ jenis: e.target.value || null })}
              className="w-full sm:w-auto sm:min-w-[9rem]"
            >
              <option value="">Semua jenis</option>
              {opsiJenis.map((j) => (
                <option key={j.nilai} value={j.nilai}>
                  {j.label}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className={!tampilkanStatus && !tampilkanJenis ? "w-full sm:w-auto" : "col-span-2 sm:col-span-1"}>
          <label htmlFor="filter-bulan" className="sr-only">
            Saring menurut bulan
          </label>
          <input
            id="filter-bulan"
            type="month"
            value={params.get("bulan") ?? ""}
            onChange={(e) => terapkan({ bulan: e.target.value || null })}
            className="h-8 w-full sm:w-auto rounded-kontrol border border-garis-kuat bg-lembar px-2 text-[13px] text-tinta hover:border-tinta-3 focus:border-hijau focus:outline-none focus:ring-2 focus:ring-hijau/25"
          />
        </div>

        {filterAktif ? (
          <div className="col-span-2 sm:col-span-1">
            <Tombol variant="halus" ukuran="md" onClick={() => router.push(basePath)} className="w-full sm:w-auto justify-center">
              <X aria-hidden className="size-3.5" />
              Hapus filter
            </Tombol>
          </div>
        ) : null}
      </div>
    </div>
  );
}