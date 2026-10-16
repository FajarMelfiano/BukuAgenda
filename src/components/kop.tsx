import { Lambang } from "./lambang";
import { LEVEL_UNIT } from "@/lib/domain";
import { tglPanjang } from "@/lib/format";

/**
 * Kop untuk hasil cetak.
 *
 * Ini bukan hiasan: lembar agenda yang dicetak harus sah sebagai dokumen
 * administrasi — mencantumkan nama unit, tingkat unit, alamat, nama kepala
 * unit, tanggal cetak, dan sumber data (filter yang aktif). Di layar kop ini
 * disembunyikan; saat dicetak baru muncul.
 */
export function Kop({
  judul,
  unit,
  ringkas,
  kepala,
}: {
  judul: string;
  unit: { nama: string; kode: string; level: string; alamat?: string | null; telepon?: string | null };
  ringkas: string;
  kepala?: string | null;
}) {
  return (
    <header
      data-cetak="kop"
      className="hidden border-b-2 border-tinta px-5 py-4 print:flex print:flex-wrap print:items-start print:gap-x-4 print:gap-y-2"
    >
      <Lambang className="size-12 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[11pt] leading-tight font-bold tracking-tight text-tinta">
          PEMERINTAH {LEVEL_UNIT[unit.level as keyof typeof LEVEL_UNIT]?.toUpperCase() ?? "KELURAHAN"}{" "}
          {unit.nama.toUpperCase()}
        </p>
        {unit.alamat ? (
          <p className="text-[9pt] leading-snug text-tinta-2">{unit.alamat}</p>
        ) : null}
        {unit.telepon ? <p className="text-[9pt] leading-snug text-tinta-2">Telp. {unit.telepon}</p> : null}
      </div>
      <div className="text-right">
        <p className="text-[11pt] font-bold tracking-wide text-tinta">{judul}</p>
        <p className="text-[9pt] text-tinta-2">Unit: {unit.kode}</p>
      </div>
      <div className="w-full border-t border-garis-kuat pt-2 text-[8.5pt] text-tinta-2">
        <p>
          {kepala ? `Kepala Unit: ${kepala} · ` : ""}Sumber data: {ringkas} · Dicetak:{" "}
          {tglPanjang(new Date())}
        </p>
      </div>
    </header>
  );
}