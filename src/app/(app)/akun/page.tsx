import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { gantiKataSandi } from "@/app/actions/surat";
import { prisma } from "@/lib/db";
import { konteks } from "@/lib/sesi";
import { PERAN } from "@/lib/domain";
import { KepalaHalaman } from "@/components/ui/tabel";
import { Baris } from "@/components/ui/form";
import { FormGantiSandi } from "@/components/form-sandi";
import { LambangUnit } from "@/components/lambang";

export const metadata: Metadata = { title: "Akun" };

export default async function HalamanAkun() {
  const ctx = await konteks();
  if (!ctx) throw new Error("Konteks tidak ada");

  const sibling = await prisma.unit.findMany({
    where: { id: { in: ctx.cakupanUnitIds, not: ctx.unit.id } },
    select: { nama: true, kode: true },
    orderBy: { nama: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-[52rem] px-4 py-4">
      <Link
        href="/surat-masuk"
        data-cetak="sembunyi"
        className="mb-3 inline-flex items-center gap-1 rounded-kontrol text-[12.5px] font-medium text-tinta-2 hover:text-tinta"
      >
        <ChevronLeft aria-hidden className="size-3.5" />
        Kembali ke daftar surat masuk
      </Link>

      <KepalaHalaman judul="Akun" konteks="Data masuk Anda dan penggantian kata sandi." />

      <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
        <section className="h-fit rounded-panel border border-garis bg-lembar">
          <h2 className="border-b border-garis px-4 py-2 text-[13px] font-semibold text-tinta">
            Data masuk
          </h2>
          <div className="flex items-center gap-2.5 border-b border-garis px-4 py-3">
            <LambangUnit kode={ctx.unit.kode} className="size-8 text-[12px]" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-tinta">{ctx.unit.nama}</p>
              <p className="text-[12px] text-tinta-2">
                {ctx.pengguna.peran} · {ctx.pengguna.username}
              </p>
            </div>
          </div>
          <dl className="px-4 py-1">
            <Baris label="Nama">{ctx.pengguna.nama}</Baris>
            <Baris label="Peran">
              {PERAN[ctx.pengguna.peran]}
              {ctx.bisaHapus ? (
                <span className="ml-1.5 text-[12px] text-tinta-3">
                  — dapat menghapus surat
                </span>
              ) : (
                <span className="ml-1.5 text-[12px] text-tinta-3">
                  — tidak dapat menghapus surat
                </span>
              )}
            </Baris>
            <Baris label="Unit kerja">{ctx.unit.nama}</Baris>
            <Baris label="Unit lain yang terlihat">
              {sibling.length
                ? sibling.map((u) => `${u.nama} (${u.kode})`).join(", ")
                : "Tidak ada. Anda hanya melihat satu unit kerja."}
            </Baris>
          </dl>
        </section>

        <section className="rounded-panel border border-garis bg-lembar">
          <h2 className="border-b border-garis px-4 py-2 text-[13px] font-semibold text-tinta">
            Ganti kata sandi
          </h2>
          <div className="p-4">
            <p className="mb-4 text-[12.5px] leading-relaxed text-tinta-2">
              Setelah diganti, semua sesi akan dikeluarkan dari perangkat lain. Sesi pada peramban
              ini tetap aktif sampai Anda menutup halaman.
            </p>
            <FormGantiSandi aksi={gantiKataSandi} />
          </div>
        </section>
      </div>
    </div>
  );
}