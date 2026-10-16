import { redirect } from "next/navigation";
import { konteksJikaAda } from "@/lib/sesi";

export default async function HalamanAwal() {
  const ctx = await konteksJikaAda();
  redirect(ctx ? "/surat-masuk" : "/masuk");
}