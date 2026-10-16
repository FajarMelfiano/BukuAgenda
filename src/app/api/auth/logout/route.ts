import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hapusSesi, NAMA_COOKIE, opsiCookie } from "@/lib/sesi";

/** Formulir pada bilah atas mengirim POST biasa, jadi keluar bisa tanpa JS. */
export async function POST() {
  const store = await cookies();
  await hapusSesi(store.get(NAMA_COOKIE)?.value);
  store.set(NAMA_COOKIE, "", { ...opsiCookie(new Date(0)), value: "" });
  redirect("/masuk");
}