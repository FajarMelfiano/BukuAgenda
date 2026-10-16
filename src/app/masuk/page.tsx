import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { buatSesi, bersihkanSesiKedaluwarsa, NAMA_COOKIE, opsiCookie, konteksJikaAda } from "@/lib/sesi";
import { FormMasuk, type AksiMasuk, type StateMasuk } from "@/components/form-masuk";
import { Lambang } from "@/components/lambang";

export const metadata: Metadata = { title: "Masuk" };

export default async function HalamanMasuk({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  if (await konteksJikaAda()) redirect("/surat-masuk");

  const konnfirmasi = typeof sp.kesalahan === "string" ? sp.kesalahan : null;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-[24rem]">
        <div className="mb-6 flex items-center gap-2.5">
          <Lambang className="size-9" />
          <div className="leading-tight">
            <p className="text-[17px] font-bold tracking-[-0.01em] text-tinta">Buku Agenda</p>
            <p className="text-[12px] text-tinta-2">Surat masuk &amp; keluar kelurahan dan kecamatan</p>
          </div>
        </div>

        <div className="rounded-panel border border-garis bg-lembar p-5">
          <h1 className="text-[15px] font-semibold text-tinta">Masuk</h1>
          <p className="mt-0.5 mb-4 text-[12.5px] leading-relaxed text-tinta-2">
            Gunakan nama pengguna dan kata sandi yang diberikan administrator unit kerja Anda.
          </p>

          <FormMasuk
            aksi={
              (async (state: StateMasuk, bentuk: FormData): Promise<StateMasuk> => {
                "use server";
                await bersihkanSesiKedaluwarsa();

                const username = String(bentuk.get("username") ?? "").trim();
                const password = String(bentuk.get("password") ?? "");
                const fields: Record<string, string> = {};
                if (!username) fields.username = "Nama pengguna wajib diisi.";
                if (!password) fields.password = "Kata sandi wajib diisi.";
                if (Object.keys(fields).length) return { fields };

                const pengguna = await prisma.pengguna.findUnique({ where: { username } });
                // Tetap lakukan perbandingan walau pengguna tidak ada, supaya
                // waktu respons tidak membocorkan username mana yang terdaftar.
                const hash =
                  pengguna?.passwordHash ??
                  "$2a$12$0000000000000000000000000000000000000000000000000000";
                const cocok = await compare(password, hash);

                if (!pengguna || !cocok || !pengguna.aktif) {
                  return { galat: "Nama pengguna atau kata sandi salah." };
                }

                const store = await import("next/headers").then((m) => m.cookies());
                const { token, kedaluwarsa } = await buatSesi(pengguna.id, {});
                store.set({ ...opsiCookie(kedaluwarsa), value: token });
                redirect("/surat-masuk");
              }) as AksiMasuk
            }
          />
        </div>

        {konnfirmasi ? (
          <p className="mt-3 border-l-2 border-stempel-amber bg-stempel-amber-latar px-3 py-2 text-[12.5px] leading-relaxed text-stempel-amber">
            {konnfirmasi}
          </p>
        ) : null}

        <p className="mt-5 text-[12px] leading-relaxed text-tinta-3">
          Sesi berakhir otomatis setelah 8 jam. Jangan berbagi kata sandi antar petugas —
          setiap orang sebaiknya punya akun sendiri supaya riwayat statusnya jelas.
        </p>
      </div>
    </main>
  );
}