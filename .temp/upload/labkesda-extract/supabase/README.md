# Setup Database Supabase — Labkesda Garut LIS

Panduan menyambungkan aplikasi ke database Supabase.

Aplikasi konek ke Supabase lewat **Supabase SDK** (`@supabase/supabase-js`)
memakai **service_role key** di sisi server (API routes). Bukan lewat
koneksi Postgres langsung / `DATABASE_URL`.

## Langkah-langkah

### 1. Buat project Supabase
- Buka https://supabase.com > New Project.
- Tunggu sampai project selesai provisioning.

### 2. Jalankan skema
- Buka **SQL Editor** di dashboard Supabase > **New query**.
- Copy seluruh isi `supabase/migrations/0001_init_schema.sql`.
- Paste dan klik **Run**.
- Harusnya muncul "Success". Ini membuat semua tabel + index + mengaktifkan RLS.

### 3. Isi environment variable
- Copy `.env.example` jadi `.env`.
- Ambil dari **Project Settings > API**:
  - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (RAHASIA — jangan dibocorkan)
- Isi `JWT_SECRET` dengan string acak (`openssl rand -base64 48`).

### 4. Jalankan aplikasi
```bash
npm install
npm run dev
```
Buka http://localhost:3000. Saat pertama kali diakses (atau saat login),
fungsi `ensureSeedData()` otomatis mengisi data awal: 5 RS, pasien contoh,
21 tarif, dan 5 user login.

### 5. Login
Semua user awal pakai password: `password123`

| Username | Role                 |
|----------|----------------------|
| loket1   | Petugas Loket        |
| kasir1   | Kasir                |
| analis1  | Analis Laboratorium  |
| pjlab    | Penanggung Jawab Lab |
| admin    | Administrator Sistem |

> Ganti password ini sebelum dipakai sungguhan.

## Catatan keamanan (PENTING)

Aplikasi memakai **service_role key** di server. Key ini **bypass RLS** dan
punya akses penuh ke semua tabel. Karena itu:

- `SUPABASE_SERVICE_ROLE_KEY` **hanya boleh ada di server** (`.env`, bukan
  variabel `NEXT_PUBLIC_*`). Jangan pernah dipakai di komponen client.
- File `src/lib/supabase.ts` hanya diimpor dari API routes.
- Otorisasi antar-role tetap ditangani di `middleware.ts` (JWT + RBAC),
  bukan oleh RLS — karena service_role melewati RLS.

Migration mengaktifkan **RLS tanpa policy** di semua tabel. Efeknya akses
lewat REST API publik dengan **anon key** otomatis diblokir, jadi tabel
tidak bocor lewat endpoint PostgREST bawaan. Kalau nanti kamu mau frontend
akses Supabase langsung pakai anon key, kamu perlu menambahkan policy RLS
sesuai kebutuhan.
