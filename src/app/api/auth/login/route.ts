import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { buatSesi, bersihkanSesiKedaluwarsa, NAMA_COOKIE, opsiCookie } from "@/lib/sesi";

/**
 * Pembatas percobaan masuk sederhana: 5 kali gagal per kombinasi
 * username+alamat IP dalam 15 menit. Cukup untuk satu unit kerja; ini bukan
 * penghitung terdistribusi, dan tidak berpura-pura menjadi begitu.
 */
const BATAS = 5;
const JENDELA_MS = 15 * 60 * 1000;
const percobaan = new Map<string, { jumlah: number; reset: number }>();

function kunci(username: string, ip: string) {
  return `${username.toLowerCase()}@${ip}`;
}

function bolehMasuk(username: string, ip: string): boolean {
  const s = percobaan.get(kunci(username, ip));
  if (!s) return true;
  if (Date.now() > s.reset) {
    percobaan.delete(kunci(username, ip));
    return true;
  }
  return s.jumlah < BATAS;
}

function catatGagal(username: string, ip: string) {
  const k = kunci(username, ip);
  const s = percobaan.get(k);
  if (!s || Date.now() > s.reset) {
    percobaan.set(k, { jumlah: 1, reset: Date.now() + JENDELA_MS });
  } else {
    s.jumlah += 1;
  }
}

function alamatIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "lokal").trim();
}

export async function POST(req: Request) {
  await bersihkanSesiKedaluwarsa();

  let username = "";
  let password = "";
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const j = await req.json();
      username = String(j.username ?? "");
      password = String(j.password ?? "");
    } else {
      const bentuk = await req.formData();
      username = String(bentuk.get("username") ?? "");
      password = String(bentuk.get("password") ?? "");
    }
  } catch {
    return Response.json({ error: "Permintaan tidak terbaca." }, { status: 400 });
  }

  const ip = alamatIp(req);
  if (!bolehMasuk(username, ip)) {
    return Response.json(
      { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." },
      { status: 429 },
    );
  }

  const pengguna = username
    ? await prisma.pengguna.findUnique({ where: { username } })
    : null;

  const hash = pengguna?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu";
  const cocok = await compare(password, hash);

  if (!pengguna || !cocok || !pengguna.aktif) {
    catatGagal(username, ip);
    // Pesan yang sama untuk "tidak ada" dan "sandi salah" supaya tidak
    // membocorkan username mana yang terdaftar.
    return Response.json(
      { error: "Nama pengguna atau kata sandi salah." },
      { status: 401 },
    );
  }

  percobaan.delete(kunci(username, ip));
  const { token, kedaluwarsa } = await buatSesi(pengguna.id, {
    ip,
    ua: req.headers.get("user-agent") ?? undefined,
  });

  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${NAMA_COOKIE}=${encodeURIComponent(token)}; ${serialkanCookie(opsiCookie(kedaluwarsa))}`,
  );
  return response;
}

function serialkanCookie(o: ReturnType<typeof opsiCookie>) {
  const bagian = [
    `Path=${o.path}`,
    `Expires=${o.expires.toUTCString()}`,
    `HttpOnly`,
    `SameSite=Lax`,
  ];
  if (o.secure) bagian.push("Secure");
  return bagian.join("; ");
}