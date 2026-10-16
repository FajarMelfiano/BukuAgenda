import { STATUS_KELUAR_LABEL, STATUS_MASUK_LABEL } from "@/lib/domain";
import { waktu } from "@/lib/format";

export type BarisRiwayat = {
  id: string;
  dari: string | null;
  ke: string;
  catatan: string | null;
  dibuatPada: Date;
  oleh: { nama: string };
};

/**
 * Riwayat status.
 *
 * Ini bukan dekorasi: setiap perubahan status memang menulis satu baris ke
 * tabel riwayat, jadi yang ditampilkan di sini adalah data, bukan rekonstruksi
 * dari tebakan. Untuk surat keluar dan masuk, label status dipetakan
 * terpisah karena keduanya punya kamus status yang berbeda.
 */
export function Riwayat({
  baris,
  jenis,
}: {
  baris: BarisRiwayat[];
  jenis: "MASUK" | "KELUAR";
}) {
  const label = jenis === "MASUK" ? STATUS_MASUK_LABEL : STATUS_KELUAR_LABEL;

  if (baris.length === 0) {
    return (
      <p className="px-3 py-4 text-[12.5px] text-tinta-3">Belum ada riwayat untuk surat ini.</p>
    );
  }

  return (
    <ol className="px-3 py-1">
      {baris.map((b, i) => (
        <li key={b.id} className="relative flex gap-3 pb-3 last:pb-1">
          {/* Rel batang waktu: garis penghubung, bukan titik dekoratif. */}
          <div aria-hidden className="flex flex-col items-center">
            <span
              className={[
                "mt-1 size-2 shrink-0 rounded-full border",
                i === 0 ? "border-hijau bg-hijau" : "border-garis-kuat bg-lembar",
              ].join(" ")}
            />
            {i < baris.length - 1 ? <span className="mt-1 w-px flex-1 bg-garis" /> : null}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] leading-snug text-tinta">
              {b.dari ? (
                <>
                  <span className="text-tinta-2">{label[b.dari] ?? b.dari}</span>
                  <span aria-hidden className="mx-1.5 text-tinta-3">
                    →{" "}
                  </span>
                  <span className="sr-only">diubah menjadi</span>
                </>
              ) : (
                <span className="text-tinta-2">Dicatat sebagai</span>
              )}
              <span className="font-semibold">{label[b.ke] ?? b.ke}</span>
            </p>
            {b.catatan ? (
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-tinta-2">{b.catatan}</p>
            ) : null}
            <p className="tabular mt-0.5 text-[11px] text-tinta-3">
              {waktu(b.dibuatPada)} · {b.oleh.nama}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}