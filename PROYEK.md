# Buku Agenda — Spesifikasi Proyek Lengkap

> Dokumen ini adalah **blueprint menyeluruh** untuk membangun aplikasi manajemen surat masuk dan surat keluar untuk kelurahan dan kecamatan. Semua aspek teknis dijelaskan rinci. Aspek UI/visual sengaja tidak didokumentasikan di sini — UI sudah final dan berjalan.

---

## 1. Ringkasan Eksekutif

**Buku Agenda** adalah aplikasi web untuk mencatat, memantau, dan mengarsipkan surat masuk dan surat keluar di lingkungan pemerintahan desa/kelurahan dan kecamatan. Aplikasi ini menggantikan buku agenda kertas dengan sistem digital yang tetap mempertahankan cara kerja administrasi yang sudah berlaku.

### Karakteristik Utama

- **Tepat 3 fitur inti**: Surat Masuk, Surat Keluar, Rekap & Arsip
- **Multi-unit**: satu kecamatan bisa mengawasi beberapa kelurahan
- **Bahasa Indonesia penuh**: seluruh antarmuka, laporan, dan dokumen
- **Siap produksi**: aman, cepat, dan mudah dirawat

---

## 2. Fitur Aplikasi

### 2.1 Surat Masuk

**Tujuan**: Mencatat setiap surat yang diterima dari pihak luar.

**Alur Kerja**:
1. Petugas menerima surat dari pengirim
2. Petugas membuka form "Surat Masuk Baru"
3. Mengisi: nomor surat (dari pengirim), tanggal surat, tanggal diterima, pengirim, jenis surat, perihal, dan catatan
4. Sistem menyimpan dengan status awal **BARU**
5. Petugas dapat mengubah status: BARU → DISPOSISI → PROSES → SELESAI
6. Setiap perubahan status tercatat di riwayat

**Validasi**:
- Nomor surat wajib dan unik per unit per tahun
- Tanggal masuk tidak boleh lebih awal dari tanggal surat
- Tanggal tidak boleh di masa depan
- Perihal maksimal 500 karakter

**Nomor Urut**:
- Dibangkitkan otomatis oleh sistem (bukan dari pengirim)
- Format: `{nomor_urut}/{kode_unit}/{tahun}`
- Increment atomik: dua petugas yang menyimpan bersamaan mendapat nomor berbeda

### 2.2 Surat Keluar

**Tujuan**: Mencatat setiap surat yang dibuat dan dikirim ke pihak luar.

**Alur Kerja**:
1. Petugas membuka form "Surat Keluar Baru"
2. Mengisi: tanggal surat, tujuan, jenis surat, sifat (Biasa/Penting/Sangat Penting), perihal, penandatangan
3. Sistem membangkitkan nomor surat otomatis: `{nomor_urut}/{kode_unit}/SK/{tahun}`
4. Sistem menyimpan dengan status awal **DRAFT**
5. Petugas dapat mengubah status: DRAFT → DIKIRIM → DITERIMA
6. Setiap perubahan status tercatat di riwayat

**Validasi**:
- Tanggal tidak boleh di masa depan
- Tujuan wajib diisi
- Perihal maksimal 500 karakter

**Perbedaan dengan Surat Masuk**:
- Nomor surat dibangkitkan sistem (bukan dari pengirim)
- Ada field "sifat" (Biasa/Penting/Sangat Penting)
- Ada field "penandatangan"
- Status: DRAFT → DIKIRIM → DITERIMA

### 2.3 Rekap & Arsip

**Tujuan**: Melihat ringkasan data dan mengunduh arsip.

**Fitur**:
- **Angka ringkasan**: total surat masuk, total surat keluar, surat yang terlambat diproses, surat per status
- **Arsip gabungan**: daftar semua surat (masuk + keluar) dalam satu tabel yang bisa difilter
- **Filter**: berdasarkan bulan, unit kerja, kata kunci, status, jenis
- **Ekspor CSV**: unduh arsip gabungan sebagai file CSV (bisa dibuka di Excel)

**Perhitungan Keterlambatan**:
- Surat masuk dianggap "terlambat" jika sudah lebih dari 7 hari sejak tanggal diterima dan status belum SELESAI
- Ditandai dengan warna berbeda di tabel

---

## 3. Arsitektur Teknis

### 3.1 Stack Teknologi

| Lapisan | Teknologi | Alasan |
|---------|-----------|--------|
| Framework | Next.js 15.5.28 | App Router, Server Components, Server Actions |
| Database | PostgreSQL 17.6 | ACID, JSON support, full-text search |
| ORM | Prisma 6.19.3 | Type-safe, migrations, seeding |
| Auth | Custom (cookie + HMAC) | Ringan, tidak butuh library eksternal |
| Styling | Tailwind CSS v4.3.3 | Utility-first, konsisten |
| Validasi | Zod 4.6.7 | Schema-first, type inference |
| Hashing | bcryptjs 3.0.3 | Standar industri untuk password |
| Ikon | lucide-react 1.57.0 | SVG konsisten, tree-shakeable |

### 3.2 Struktur Folder

```
BukuAgenda/
├── prisma/
│   ├── schema.prisma      # Definisi database
│   ├── seed.ts            # Data awal (±60 surat)
│   ├── naskah.txt         # Daftar kata untuk seed
│   └── migrations/        # Migrasi database
├── scripts/
│   ├── pg.sh              # Kontrol PostgreSQL embedded
│   └── cek-naskah.py      # Verifikasi karakter asing
├── src/
│   ├── app/
│   │   ├── (app)/         # Route group yang butuh login
│   │   │   ├── layout.tsx # Shell aplikasi (navbar, sidebar)
│   │   │   ├── surat-masuk/
│   │   │   │   ├── page.tsx       # Daftar surat masuk
│   │   │   │   ├── baru/page.tsx  # Form surat masuk baru
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # Detail surat
│   │   │   │       └── ubah/page.tsx  # Form edit
│   │   │   ├── surat-keluar/
│   │   │   │   ├── page.tsx       # Daftar surat keluar
│   │   │   │   ├── baru/page.tsx  # Form surat keluar baru
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx       # Detail surat
│   │   │   │       └── ubah/page.tsx  # Form edit
│   │   │   ├── rekap/page.tsx  # Ringkasan & arsip
│   │   │   └── akun/page.tsx   # Profil & ganti sandi
│   │   ├── masuk/page.tsx  # Halaman login
│   │   ├── page.tsx        # Redirect ke /surat-masuk
│   │   ├── layout.tsx      # Root layout (html, body)
│   │   └── globals.css     # Design tokens + print styles
│   ├── components/
│   │   ├── ui/            # Komponen generik (tabel, tombol, dsb)
│   │   ├── dialog-status.tsx  # Dialog ubah status + hapus
│   │   ├── form-surat.tsx     # Form surat masuk/keluar
│   │   ├── form-masuk.tsx     # Form login
│   │   ├── form-sandi.tsx     # Form ganti sandi
│   │   ├── riwayat.tsx        # Panel riwayat status
│   │   ├── kop.tsx            # Kop surat untuk cetak
│   │   ├── lambang.tsx        # Logo unit
│   │   ├── kendali.tsx        # Filter & paginasi
│   │   ├── navigasi.tsx       # Navigasi bawah (mobile)
│   │   ├── bilah-atas.tsx     # Top bar
│   │   └── tombol-cetak.tsx   # Tombol cetak
│   ├── lib/
│   │   ├── db.ts          # Instance Prisma
│   │   ├── sesi.ts        # Auth, cookie, HMAC
│   │   ├── domain.ts      # Konstanta & label Bahasa Indonesia
│   │   ├── query.ts       # Builder WHERE + filter
│   │   ├── validasi.ts    # Skema Zod
│   │   └── format.ts      # Formatter tanggal, angka, CSV
│   └── middleware.ts      # Proteksi route
├── .env                   # Environment variables (tidak di-commit)
├── .env.example           # Contoh environment
├── next.config.ts         # Konfigurasi Next.js + security headers
├── tsconfig.json          # Konfigurasi TypeScript
└── package.json
```

### 3.3 Arsitektur Server Actions

Seluruh mutasi data (tambah, edit, hapus, ubah status) dilakukan via **Server Actions** — bukan route handler CRUD terpisah. Ini adalah keputusan desain penting:

- **Manfaat**: type-safe, otomatis revalidate, tidak perlu API layer terpisah
- **Pola**: Server Action → Validasi Zod → Transaksi Prisma → Revalidate → Redirect

```typescript
// Contoh pola Server Action
export async function simpanSuratMasuk(_state: StateForm, bentuk: FormData): Promise<StateForm> {
  // 1. Validasi
  const hasil = suratMasukSkema.safeParse(Object.fromEntries(bentuk));
  if (!hasil.success) return { fields: keFieldError(hasil.error) };
  
  // 2. Transaksi atomik
  await prisma.$transaction(async (tx) => { ... });
  
  // 3. Revalidasi
  revalidatePath("/surat-masuk");
  
  // 4. Redirect
  redirect("/surat-masuk");
}
```

---

## 4. Database

### 4.1 Entity Relationship

```
┌─────────────────────────────────────────────────────────────────┐
│                           UNIT                                   │
│  id, nama, kode, level (KELURAHAN/KECAMATAN), indukId (self-ref) │
└──────────────┬──────────────────────────────────────────────────┘
               │ 1:N
       ┌───────┴────────┐
       │                │
┌──────┴──────┐   ┌─────┴──────────┐
│  PENGGUNA   │   │   SURAT MASUK   │
│  id, nama   │   │   id, nomorSurat│
│  username   │   │   tahun         │
│  passwordHash│  │   tanggalSurat  │
│  peran      │   │   tanggalMasuk  │
│  unitId     │   │   pengirim      │
└─────────────┘   │   jenis, status │
                  │   unitId        │
                  └────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                        SURAT KELUAR                               │
│  id, nomorSurat, tahun, tanggalSurat, tujuan, jenis, sifat,      │
│  status, unitId, dibuatOlehId                                    │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                        SURAT RIWAYAT                             │
│  id, suratJenis (MASUK/KELUAR), suratId, dari, ke, catatan,     │
│  olehId, dibuatPada                                              │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                          COUNTER                                 │
│  id, unitId, tahun, tipe (URUT_MASUK/NOMOR_KELUAR), n            │
│  UNIQUE(unitId, tahun, tipe)                                     │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                           SESI                                   │
│  id, tokenHash, penggunaId, kedaluwarsa, alamatIp, userAgent     │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Tabel Unit

Unit kerja bisa berupa **Kecamatan** atau **Kelurahan**. Hierarki dibangun dengan self-referencing `indukId`:

```
Kecamatan Cibiru (KECAMATAN)
├── Kelurahan Cibiru Wetan (KELURAHAN) → indukId = KEC
├── Kelurahan Cibiru Kulon (KELURAHAN) → indukId = KEC
└── Kelurahan Cipadung (KELURAHAN)     → indukId = KEC
```

**Aturan Akses**:
- Petugas/Kepala di **Kelurahan** → hanya melihat kelurahannya sendiri
- Petugas/Kepala di **Kecamatan** → melihat kecamatan + semua anaknya (kelurahan)

### 4.3 Tabel SuratMasuk

| Field | Tipe | Keterangan |
|-------|------|------------|
| id | String (cuid) | Primary key |
| nomorUrut | Int | Nomor urut internal per unit per tahun |
| nomorSurat | String | Nomor surat dari pengirim (unik per unit per tahun) |
| tahun | Int | Tahun surat |
| tanggalSurat | DateTime | Tanggal pada surat |
| tanggalMasuk | DateTime | Tanggal diterima |
| pengirim | String | Nama pengirim |
| penerima | String? | Nama penerima di unit |
| jenis | Enum | UNDANGAN/KEPUTUSAN/PERMOHONAN/INFORMASI/TAGIHAN/SANKSI/LAINNYA |
| perihal | String | Ringkasan isi surat |
| status | Enum | BARU/DISPOSISI/PROSES/SELESAI |
| disposisi | String? | Arahan dari kepala |
| diteruskanKe | String? | Petugas yang dituju |
| catatan | String? | Catatan internal |
| lampiran | String? | Nama file lampiran |
| unitId | String | Foreign key ke Unit |
| dibuatOlehId | String | Foreign key ke Pengguna |

**Unique Constraint**: `(unitId, nomorSurat, tahun)` — mencegah nomor surat sama di unit yang sama di tahun yang sama.

### 4.4 Tabel SuratKeluar

| Field | Tipe | Keterangan |
|-------|------|------------|
| id | String (cuid) | Primary key |
| nomorUrut | Int | Nomor urut internal |
| nomorSurat | String | Dibangkitkan sistem |
| tahun | Int | Tahun surat |
| tanggalSurat | DateTime | Tanggal pada surat |
| tujuan | String | Penerima surat |
| jenis | Enum | EDARAN/REKOMENDASI/PERMOHONAN/BALASAN/UNDANGAN/LAINNYA |
| sifat | Enum | BIASA/PENTING/SANGAT_PENTING |
| perihal | String | Ringkasan isi |
| status | Enum | DRAFT/DIKIRIM/DITERIMA |
| penandatangan | String? | Nama penandatangan |
| catatan | String? | Catatan internal |

### 4.5 Tabel Counter

Digunakan untuk penomoran atomik. Setiap unit punya counter per tahun per tipe:

```
unitId | tahun | tipe          | n
-------|-------|---------------|----
KEC    | 2026  | URUT_MASUK    | 47
KEC    | 2026  | NOMOR_KELUAR  | 23
KDL    | 2026  | URUT_MASUK    | 31
```

**Increment Atomik**: Prisma `upsert` + `increment` di dalam transaksi menjamin tidak ada nomor ganda.

### 4.6 Tabel SuratRiwayat

Setiap perubahan status menulis satu baris riwayat:

```
suratJenis | suratId | dari   | ke        | catatan | olehId | dibuatPada
MASUK      | abc123  | null   | BARU      | -       | user1  | 2026-10-01
MASUK      | abc123  | BARU   | DISPOSISI | -       | user1  | 2026-10-02
MASUK      | abc123  | DISPOSISI | PROSES | -       | user1  | 2026-10-05
```

---

## 5. Keamanan

### 5.1 Autentikasi

- **Password hashing**: bcrypt dengan cost factor 12
- **Sesi**: token acak 32 byte, disimpan sebagai cookie httpOnly
- **Token di database**: SHA-256 hash (bukan plaintext) — kalau DB bocor, cookie curian tetap tidak bisa dipakai
- **HMAC signing**: cookie ditandatangani dengan HMAC-SHA256 + secret dari environment
- **TTL**: 8 jam, kedaluwarsa otomatis
- **Rate limiting**: 5 percobaan gagal per username+IP dalam 15 menit

### 5.2 Otorisasi

- **Batas unit**: setiap query difilter oleh `cakupanUnitIds` pengguna
- **Peran**: KEPALA bisa menghapus surat, PETUGAS tidak bisa
- **Validasi transisi status**: hanya transisi maju yang diperbolehkan (tidak bisa mundur)

### 5.3 Validasi Input

- **Server-side**: semua input divalidasi dengan Zod sebelum masuk database
- **Client-side**: validasi HTML5 dasar (required, minlength, maxlength)
- **SQL Injection**: Prisma menggunakan parameterized queries
- **XSS**: React auto-escape semua output

### 5.4 HTTP Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 6. Alur Data

### 6.1 Alur Menambah Surat Masuk

```
┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│ Petugas  │────>│ Form Surat   │────>│ Server      │────>│ Database │
│          │     │ Masuk Baru   │     │ Action      │     │          │
└──────────┘     └──────────────┘     └──────┬──────┘     └──────────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │ 1. Validasi  │
                                      │    Zod       │
                                      └──────┬───────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │ 2. Transaksi │
                                      │    Counter++ │
                                      │    Insert    │
                                      │    Riwayat   │
                                      └──────┬───────┘
                                             │
                                             ▼
                                      ┌──────────────┐
                                      │ 3. Revalidate│
                                      │ 4. Redirect  │
                                      └──────────────┘
```

### 6.2 Alur Mengubah Status

```
┌──────────┐     ┌──────────────┐     ┌──────────────────┐
│ Petugas  │────>│ Dialog Status│────>│ Server Action    │
│ klik     │     │ di detail    │     │ ubahStatusMasuk  │
└──────────┘     └──────────────┘     └────────┬─────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ Validasi     │
                                       │ transisi?    │
                                       └──────┬───────┘
                                              │
                                       ┌──────┴───────┐
                                       │ Ya           │
                                       ▼              ▼
                                ┌─────────────┐  ┌─────────┐
                                │ Update      │  │ Return  │
                                │ status      │  │ error   │
                                │ Insert      │  └─────────┘
                                │ riwayat     │
                                └──────┬──────┘
                                       │
                                       ▼
                                ┌─────────────┐
                                │ Revalidate  │
                                └─────────────┘
```

### 6.3 Alur Ekspor CSV

```
┌──────────┐     ┌──────────────┐     ┌──────────────────┐
│ Petugas  │────>│ Klik "Ekspor"│────>│ Route Handler    │
│          │     │ di Rekap     │     │ /api/rekap/ekspor│
└──────────┘     └──────────────┘     └────────┬─────────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ 1. Baca ctx  │
                                       │ 2. Validasi  │
                                       │    filter    │
                                       └──────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ 3. Query     │
                                       │    dengan    │
                                       │    whereMasuk│
                                       │    +whereKeluar│
                                       └──────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ 4. Normalisasi│
                                       │    ke format │
                                       │    CSV       │
                                       └──────┬───────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │ 5. Return    │
                                       │    Response  │
                                       │    dengan    │
                                       │    BOM UTF-8 │
                                       └──────────────┘
```

---

## 7. API Endpoints

### 7.1 Route Handler (API)

| Method | Path | Fungsi | Auth |
|--------|------|--------|------|
| POST | `/api/auth/login` | Login, buat sesi | Tidak |
| POST | `/api/auth/logout` | Hapus sesi | Ya |
| GET | `/api/rekap/ekspor` | Ekspor CSV | Ya |

### 7.2 Server Actions

| Action | Fungsi |
|--------|--------|
| `simpanSuratMasuk` | Tambah surat masuk baru |
| `ubahSuratMasuk` | Edit surat masuk |
| `hapusSuratMasuk` | Hapus surat masuk (KEPALA only) |
| `ubahStatusMasuk` | Ubah status surat masuk |
| `simpanSuratKeluar` | Tambah surat keluar baru |
| `ubahSuratKeluar` | Edit surat keluar |
| `hapusSuratKeluar` | Hapus surat keluar (KEPALA only) |
| `ubahStatusKeluar` | Ubah status surat keluar |
| `gantiSandi` | Ganti kata sandi |

---

## 8. Validasi & Aturan Bisnis

### 8.1 Transisi Status

**Surat Masuk** (monoton naik, tidak bisa mundur):
```
BARU ──> DISPOSISI ──> PROSES ──> SELESAI
```

**Surat Keluar** (monoton naik, tidak bisa mundur):
```
DRAFT ──> DIKIRIM ──> DITERIMA
```

### 8.2 SLA (Service Level Agreement)

- Surat masuk harus diproses maksimal **7 hari** sejak diterima
- Surat yang melewati SLA ditandai "terlambat" di UI
- Dihitung: `hari_ini - tanggal_masuk > 7 && status != SELESAI`

### 8.3 Keunikan

| Field | Scope | Alasan |
|-------|-------|--------|
| nomorSurat | unitId + tahun | Mencegah nomor surat masuk ganda |
| nomorUrut | unitId + tahun | Mencegah nomor urut internal ganda |
| nomorSurat (keluar) | unitId | Mencegah nomor surat keluar ganda |

### 8.4 Validasi Tanggal

- Tanggal surat tidak boleh di masa depan
- Tanggal masuk tidak boleh lebih awal dari tanggal surat
- Format: `YYYY-MM-DD`

---

## 9. Data Seed

### 9.1 Unit

```
Kecamatan Cibiru (KECAMATAN)
├── Kelurahan Cibiru Wetan
├── Kelurahan Cibiru Kulon
└── Kelurahan Cipadung
```

### 9.2 Pengguna

| Username | Nama | Peran | Unit |
|----------|------|-------|------|
| dedi | Dedi Supriatna | KEPALA | Kecamatan Cibiru |
| rina | Rina Marlina | PETUGAS | Kecamatan Cibiru |
| ahmad | Ahmad Fauzi | KEPALA | Kelurahan Cibiru Wetan |
| siti | Siti Nurhaliza | PETUGAS | Kelurahan Cibiru Kulon |

**Password default**: `demo1234` (semua akun)

### 9.3 Surat

- **Surat Masuk**: ~60 surat, tersebar di 3 tahun terakhir
- **Surat Keluar**: ~50 surat, tersebar di 3 tahun terakhir
- **Status**: campuran (BARU, DISPOSISI, PROSES, SELESAI untuk masuk; DRAFT, DIKIRIM, DITERIMA untuk keluar)
- **Tanggal**: acak dalam bulan, jam kerja (08:00-16:00)
- **Pengirim/Tujuan**: nama instansi realistis (Dinas Pendidikan, Dinas Kesehatan, Polsek, dll)
- **Perihal**: digabungkan dari daftar kata Indonesia

### 9.4 Riwayat

Setiap surat punya riwayat status yang konsisten dengan status akhirnya.

---

## 10. Query Database

### 10.1 Query Daftar Surat Masuk

```sql
SELECT * FROM "SuratMasuk"
WHERE "unitId" IN ($cakupanUnitIds)
  AND ($status IS NULL OR status = $status)
  AND ($jenis IS NULL OR jenis = $jenis)
  AND ($bulan IS NULL OR "tanggalMasuk" >= $awalBulan AND "tanggalMasuk" < $awalBulan + interval '1 month')
  AND ($q IS NULL OR 
       "nomorSurat" ILIKE '%' || $q || '%' OR 
       "pengirim" ILIKE '%' || $q || '%' OR 
       "perihal" ILIKE '%' || $q || '%')
ORDER BY "tanggalMasuk" DESC, "nomorUrut" DESC
LIMIT 25 OFFSET ($halaman - 1) * 25;
```

### 10.2 Query Ringkasan Rekap

```sql
-- Total per status
SELECT status, COUNT(*) FROM "SuratMasuk"
WHERE "unitId" IN ($cakupanUnitIds)
GROUP BY status;

-- Total per bulan
SELECT TO_CHAR("tanggalMasuk", 'YYYY-MM') as bulan, COUNT(*)
FROM "SuratMasuk"
WHERE "unitId" IN ($cakupanUnitIds)
GROUP BY bulan
ORDER BY bulan;

-- Surat terlambat
SELECT COUNT(*) FROM "SuratMasuk"
WHERE "unitId" IN ($cakupanUnitIds)
  AND status != 'SELESAI'
  AND "tanggalMasuk" < NOW() - interval '7 days';
```

---

## 11. Environment Variables

```env
# Database
DATABASE_URL="postgresql://bukuagenda:password@localhost:5432/bukuagenda"

# Session
SESSION_SECRET="random-string-min-32-characters"

# App
NODE_ENV="development"
PORT=3210
```

---

## 12. Deployment

### 12.1 Development

```bash
# 1. Start PostgreSQL
bash scripts/pg.sh start

# 2. Install dependencies
npm install

# 3. Run migration
npm run db:deploy

# 4. Seed data
npm run db:seed

# 5. Start dev server
npm run dev
```

### 12.2 Production

```bash
# 1. Build
npm run build

# 2. Start
npm start
```

### 12.3 Docker (opsional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3210
CMD ["npm", "start"]
```

---

## 13. Testing

### 13.1 Verifikasi Typecheck

```bash
npm run typecheck
```

### 13.2 Verifikasi Build

```bash
npm run build
```

### 13.3 Smoke Test API

```bash
# Login
curl -X POST http://localhost:3210/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=dedi&password=demo1234" \
  -c cookies.txt

# Ekspor CSV
curl http://localhost:3210/api/rekap/ekspor -b cookies.txt -o rekap.csv

# Logout
curl -X POST http://localhost:3210/api/auth/logout -b cookies.txt
```

### 13.4 Verifikasi UI

- Login → redirect ke /surat-masuk
- Daftar surat masuk → tampil, filter jalan
- Tambah surat masuk → sukses, muncul di daftar
- Ubah status → sukses, riwayat tercatat
- Detail surat → tampil lengkap dengan riwayat
- Ekspor CSV → file terunduh, bisa dibuka di Excel

---

## 14. Pertanyaan yang Sering Diajakan

### 14.1 Kenapa tidak pakai NextAuth?

NextAuth untuk SSO OAuth eksternal. Aplikasi ini butuh autentikasi sederhana (username+password) dengan kontrol penuh atas sesi. Custom auth lebih ringan dan lebih mudah diaudit.

### 14.2 Kenapa tidak pakai tRPC?

tRPC untuk end-to-end type safety. Next.js Server Actions sudah memberikan type safety yang cukup dengan overhead lebih kecil.

### 14.3 Kenapa tidak pakai Docker untuk PostgreSQL?

PostgreSQL embedded (zonky binary) berjalan tanpa root/sudo/docker. Lebih sederhana untuk development dan deployment di server yang tidak mendukung container.

### 14.4 Bagaimana cara menambah unit baru?

Lewat Prisma Studio atau tambahkan di seed.ts:

```typescript
await db.unit.create({
  data: { kode: "KBL", nama: "Kelurahan Baru", level: "KELURAHAN", indukId: "KEC" },
});
```

---

## 15. Troubleshooting

### 15.1 Error "SESSION_SECRET belum diisi"

```bash
# Generate secret
openssl rand -base64 48

# Tambahkan ke .env
SESSION_SECRET="hasil-openssl"
```

### 15.2 Error "P1001: Can't reach database"

```bash
# Pastikan PostgreSQL berjalan
bash scripts/pg.sh status

# Jika tidak, start
bash scripts/pg.sh start
```

### 15.3 Error "P2002: Unique constraint failed"

Nomor surat sudah ada di database. Gunakan nomor surat yang berbeda.

### 15.4 Error "403: Akses ditolak"

Anda mencoba mengakses unit di luar cakupan Anda. Hubungi admin kecamatan untuk menambah cakupan.

---

## 16. Kesimpulan

Buku Agenda adalah aplikasi yang **fokus, aman, dan mudah digunakan**. Tidak ada fitur yang tidak perlu. Setiap fungsi dirancang untuk mempercepat pekerjaan administrasi surat, bukan menambah kompleksitas.

**Prinsip desain yang dijaga**:
1. **Sederhana**: 3 fitur, tidak lebih
2. **Aman**: validasi di setiap lapisan, batas unit ditegakkan di query
3. **Cepat**: Server Components, query teroptimasi, paginasi
4. **Jelas**: bahasa Indonesia konsisten, label jelas, tidak ambigu
</longcat_think>
