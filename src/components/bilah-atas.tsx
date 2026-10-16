"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Search, Settings } from "lucide-react";
import { Tombol } from "@/components/ui/tombol";
import { Lambang, LambangUnit } from "@/components/lambang";

/**
 * Bilah atas. Isinya tiga hal yang selalu dibutuhkan petugas:
 *  - unit kerja yang sedang aktif (dan selector ini muncul kalau pengguna
 *    punya cakupan lebih dari satu unit),
 *  - pencarian global yang bisa dipanggil dari mana saja dengan "/",
 *  - menu akun (ganti kata sandi, keluar).
 */
export function BilahAtas({
  pengguna,
  unit,
  unitOpsi,
  unitAktifId,
  pencarian,
}: {
  pengguna: { nama: string; peran: string };
  unit: { nama: string; kode: string; level: string };
  unitOpsi: Array<{ id: string; nama: string; kode: string }>;
  unitAktifId: string;
  pencarian: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(pencarian);
  const [unitAktif, setUnitAktif] = useState(unitAktifId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [menuBuka, setMenuBuka] = useState(false);

  useEffect(() => {
    setQ(pencarian);
  }, [pencarian]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get("unit");
    if (u) setUnitAktif(u);
    const qAwal = params.get("q");
    if (qAwal) setQ(qAwal);
  }, []);

  // Pintasan "/": tekan di mana saja (kecuali saat mengetik) untuk fokus pencarian.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const mengetik =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "/" && !mengetik && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuBuka) return;
    const tutup = () => setMenuBuka(false);
    window.addEventListener("click", tutup);
    return () => window.removeEventListener("click", tutup);
  }, [menuBuka]);

  const cari = (nilai: string) => {
    setQ(nilai);
    const params = new URLSearchParams(window.location.search);
    if (nilai.trim()) params.set("q", nilai.trim());
    else params.delete("q");
    params.delete("halaman");
    const tujuan = `/surat-masuk?${params.toString()}`;
    router.push(tujuan);
  };

  return (
    <header
      className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-garis bg-lembar px-3 sm:px-4"
      data-cetak="sembunyi"
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Lambang className="size-6 sm:size-7 shrink-0" />
          <div className="leading-tight">
            <p className="whitespace-nowrap text-[13px] font-bold tracking-[-0.01em] text-tinta sm:text-[14px]">
              Buku Agenda
            </p>
            <p className="meta -mt-px hidden text-[10px] sm:block">Surat masuk &amp; keluar</p>
          </div>
        </div>

        <span aria-hidden className="mx-0.5 hidden h-6 w-px bg-garis sm:block" />

        {/* Unit kerja aktif — selector hanya muncul bila pengguna punya lebih
            dari satu unit dalam cakupan (kecamatan melihat kelurahannya). */}
        <div className="min-w-0">
          <label htmlFor="pilih-unit" className="sr-only">
            Unit kerja aktif
          </label>
          {unitOpsi.length > 1 ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="hidden sm:inline-flex">
                <LambangUnit
                  kode={unitOpsi.find((u) => u.id === unitAktif)?.kode ?? unit.kode}
                  className="text-[10px]"
                />
              </span>
              <select
                id="pilih-unit"
                value={unitAktif}
                onChange={(e) => {
                  const val = e.target.value;
                  setUnitAktif(val);
                  const params = new URLSearchParams(window.location.search);
                  if (val === "__semua__") params.delete("unit");
                  else params.set("unit", val);
                  params.delete("halaman");
                  router.push(`${window.location.pathname}?${params.toString()}`);
                  router.refresh();
                }}
                className="h-8 max-w-[6.5rem] cursor-pointer truncate rounded-kontrol border border-garis-kuat bg-lembar px-1.5 text-[11.5px] font-medium text-tinta hover:border-tinta-3 focus:border-hijau focus:outline-none focus:ring-2 focus:ring-hijau/25 xs:max-w-[8rem] sm:max-w-[14rem] sm:px-2 sm:text-[13px]"
              >
                {unitOpsi.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama}
                  </option>
                ))}
                <option value="__semua__">Semua unit</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <LambangUnit kode={unit.kode} className="hidden sm:inline-flex" />
              <span className="max-w-[8rem] truncate text-[12px] font-medium text-tinta sm:max-w-none sm:text-[13px]">
                {unit.nama}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            cari(q);
          }}
          className="relative hidden sm:block"
        >
          <label htmlFor="cari-surat" className="sr-only">
            Cari surat
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-tinta-3"
          />
          <input
            id="cari-surat"
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nomor, pengirim, perihal"
            className="h-8 w-56 rounded-kontrol border border-garis-kuat bg-lembar pl-7 pr-9 text-[13px] text-tinta placeholder:text-tinta-3 hover:border-tinta-3 focus:border-hijau focus:outline-none focus:ring-2 focus:ring-hijau/25"
          />
          <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 rounded-kontrol border border-garis bg-panel px-1 font-mono text-[10px] text-tinta-3">
            /
          </kbd>
        </form>

        <div className="relative">
          <Tombol
            variant="halus"
            ukuran="md"
            aria-haspopup="menu"
            aria-expanded={menuBuka}
            onClick={(e) => {
              e.stopPropagation();
              setMenuBuka((v) => !v);
            }}
            className="h-8 px-2 sm:px-2.5"
          >
            <span className="max-w-[3.75rem] truncate text-[12px] xs:max-w-[5rem] sm:max-w-[9rem] sm:text-[13px]">
              {pengguna.nama}
            </span>
            <ChevronDown aria-hidden className="size-3 text-tinta-3 sm:size-3.5" />
          </Tombol>

          {menuBuka ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+4px)] z-40 w-56 rounded-panel border border-garis-kuat bg-lembar shadow-dialog"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-garis px-3 py-2">
                <p className="text-[13px] font-semibold text-tinta">{pengguna.nama}</p>
                <p className="text-[12px] text-tinta-2">{pengguna.peran}</p>
              </div>
              <a
                href="/akun"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2 text-[13px] text-tinta hover:bg-panel focus:bg-panel focus:outline-none"
              >
                <Settings aria-hidden className="size-3.5 text-tinta-3" />
                Ganti kata sandi
              </a>
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-stempel-merah hover:bg-stempel-merah-latar focus:bg-stempel-merah-latar focus:outline-none"
                >
                  <LogOut aria-hidden className="size-3.5" />
                  Keluar
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}