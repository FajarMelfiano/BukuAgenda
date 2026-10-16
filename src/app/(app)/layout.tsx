import { redirect } from "next/navigation";
import { Navigasi } from "@/components/navigasi";
import { BilahAtas } from "@/components/bilah-atas";
import { PERAN, LEVEL_UNIT } from "@/lib/domain";
import { konteks } from "@/lib/sesi";
import { prisma } from "@/lib/db";

/**
 * Kerangka aplikasi. Cakupan unit dihitung sekali di sini lalu diteruskan ke
 * bilah atas sebagai daftar pilihan, sehingga setiap halaman di bawah tidak
 * perlu bekerja lagi dengan hierarki unit.
 */
export default async function Kerangka({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await konteks();

  const semuaUnit = await prisma.unit.findMany({
    where: { id: { in: ctx.cakupanUnitIds } },
    select: { id: true, nama: true, kode: true, level: true },
    orderBy: [{ level: "asc" }, { nama: "asc" }],
  });

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <BilahAtas
        pengguna={{ nama: ctx.pengguna.nama, peran: PERAN[ctx.pengguna.peran] }}
        unit={{
          nama: ctx.unit.nama,
          kode: ctx.unit.kode,
          level: LEVEL_UNIT[ctx.unit.level],
        }}
        unitOpsi={semuaUnit.map((u) => ({ id: u.id, nama: u.nama, kode: u.kode }))}
        unitAktifId={ctx.unit.id}
        pencarian=""
      />
      <div className="flex min-h-0 flex-1">
        <Navigasi />
        <main
          id="konten"
          data-cetak="halaman"
          className="halaman min-w-0 flex-1 overflow-y-auto pb-[56px] md:pb-0"
        >
          {children}
        </main>
      </div>
    </div>
  );
}