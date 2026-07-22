# Rencana Perbaikan LIS Labkesda Garut

Berdasarkan 7 temuan pengujian end-to-end. Keputusan desain (sudah disepakati):
- Output pendaftaran online = **Nomor Antrian** (utama) + barcode booking asli untuk discan loket.
- Alur ke kasir = **Sistem Nomor Antrian**.
- Parameter hasil analis = **auto-generate dari paket tes** saat registrasi.

---

## Akar masalah yang sudah dikonfirmasi dari kode

| # | Temuan | Akar masalah di kode |
|---|--------|----------------------|
| 6 | Pasien offline (Ujang) tidak masuk ke Kasir | **BUG UTAMA**: frontend kirim `testCategories`, API `api/patients` baca `selectedTests` → tidak match → order pemeriksaan **tidak pernah dibuat**. Pasien tersimpan tanpa order lab. |
| 3 | Offline tidak masuk Print Label | Efek turunan #6 (tidak ada order → tidak muncul). Beres otomatis stlh #6. |
| 2 | BPJS & rujukan puskesmas tak tampil | Layar sukses registrasi (`registrasi/baru`) hanya render Nama/RM/Lab/Prioritas. |
| 1 | Barcode online palsu + tak ada tombol kembali | `QRCodeSVG` di `daftar-online` cuma pola kotak acak; tak ada tombol kembali. |
| 7 | Analis tak bisa input hasil | **Fitur belum ada**: semua halaman `pemeriksaan/` read-only, tak ada endpoint simpan hasil / ubah status. |
| 4,5 | Output online & alur ke kasir | Belum ada sistem nomor antrian. Halaman `/antrian` masih terkunci (dummy). |

---

## Perubahan Database (WAJIB dijalankan dulu di Supabase SQL Editor)

> **18 Jul 2026 — FIX ERROR ONLINE:** Migration `0004_result_purpose_address.sql`
> **belum di-apply** ke project Supabase `sftrfplaglpqbiitnrio` (diverifikasi:
> kolom `purpose` & `result_template` TIDAK ada di tabel `online_registrations`
> maupun `examinations`). Itulah penyebab error online
> *"Could not find the 'purpose' column of 'online_registrations' in the
> schema cache"*.
>
> **Cara fix:** Buka **Supabase Dashboard → SQL Editor → New query**, paste
> seluruh isi `supabase/migrations/0004_result_purpose_address.sql`, klik **Run**.
> Aman dijalankan ulang (memakai `ADD COLUMN IF NOT EXISTS`). Setelah itu
> PostgREST akan re-cache schema dalam ~1 menit dan error hilang.
>
> **Perbaikan duplikat RM (offline):** error
> *"duplicate key value violates unique constraint ..._rm_no_key"* kini ditangani
> di kode (`src/app/api/patients/route.ts` & `registrasi/baru/page.tsx`):
> - Cari pasien existing by NIK / `existingPatientId`; bila ada → **UPDATE**
>   record lama, bukan INSERT baru.
> - `rm_no` baru dibuat **berurutan & unik** (`RM-YYYYMM-NNNNN`, count+1 +
>   retry bila bentrok), bukan random 3-digit yang rentan tabrakan.

---

Tambah kolom antrian ke `examinations`:
```sql
ALTER TABLE examinations ADD COLUMN IF NOT EXISTS queue_no      VARCHAR(20);
ALTER TABLE examinations ADD COLUMN IF NOT EXISTS queue_channel VARCHAR(20);
```
File `supabase/migrations/0001_init_schema.sql` akan diperbarui juga agar setup baru ikut punya kolom ini.

---

## Fase 1 — Perbaikan bug registrasi offline (#6, #3, #2)

**`src/lib/test-catalog.ts`** (baru): katalog paket → parameter.
Memetakan id paket (`HEM`, `GDP`, `RENAL`, dst) ke daftar parameter `{category, testCode, testName, unit, referenceRange}` selaras data tarif/seed. Dipakai bersama saat registrasi & input analis.

**`src/app/api/patients/route.ts`** (POST):
- Baca `testCategories` (tetap terima `selectedTests` demi kompatibilitas).
- Saat buat `examinations`: set `source_channel='LOKET'`, `queue_no` (mis. `A-001`, CITO `C-001`), `queue_channel`.
- Expand paket terpilih → insert baris `examination_details` kosong (`value=null`, `flag='NORMAL'`) siap diisi analis.
- Kembalikan `guaranteeType`, `hospitalName`, `queueNo`, `clinicalNotes` di response.

**`src/app/(app)/registrasi/baru/page.tsx`**:
- Layar sukses tampilkan: Jenis Penjamin (BPJS), Faskes Perujuk (Puskesmas Tarogong Kaler), Dokter, **Nomor Antrian**, catatan klinis.

## Fase 2 — Barcode asli (#1) + komponen bersama

**`src/lib/barcode.ts`** + **`src/components/common/Barcode.tsx`** (baru):
Generator **Code128** SVG asli (tanpa dependency baru) — deterministik, printable, scannable. Ganti barcode palsu di dua tempat.

**`src/app/(app)/registrasi/print-label/page.tsx`**:
- Ganti barcode palsu (div acak, baris ~247) dengan komponen `<Barcode value={labNo} />` asli.
- Tampilkan Nomor Antrian di label.

## Fase 3 — Output online: Nomor Antrian (#1, #4, #5)

**`src/app/api/online-registrations/[id]/verify/route.ts`**:
- Set `queue_no` (channel online, mis. `O-001`) + `queue_channel='ONLINE'` saat buat examination.
- Auto-generate `examination_details` dari paket yg diminta (parse `requested_tests`).

**`src/app/daftar-online/page.tsx`**:
- Ganti `QRCodeSVG` palsu → `<Barcode>` asli untuk kode booking.
- Jadikan **Nomor Antrian** info utama + instruksi ("Tunjukkan ke loket untuk verifikasi, lalu tunggu nomor antrian dipanggil di kasir").
- Tambah tombol **Kembali / Daftar Lagi**.
- Catatan: nomor antrian final terbit saat loket memverifikasi; halaman sukses online menampilkan kode booking + info alur. (Nomor antrian tampil di struk loket / halaman antrian.)

## Fase 4 — Sistem Nomor Antrian (#5)

**`src/app/api/queue/route.ts`** (baru): GET daftar antrian hari ini + stage (Menunggu Bayar / Di Lab / Selesai) berdasarkan `payment_gate_status` & `status`.

**`src/app/(app)/antrian/page.tsx`**: ganti halaman terkunci → papan antrian fungsional (nomor, nama, stage, prioritas). Kasir memanggil berdasarkan nomor.

**`src/app/(app)/kasir/pembayaran/page.tsx`**: tampilkan `queueNo` di tiap baris.

## Fase 5 — Input hasil analis (#7)

**`src/app/api/examinations/route.ts`** (GET): tambahkan `paymentGateStatus`, `queueNo` ke response.

**`src/app/api/examinations/[id]/results/route.ts`** (baru, PATCH):
- Body: `{ action: 'start'|'save'|'complete', details: [{id, value, unit, referenceRange}], analystName }`.
- `start`: status `REGISTRASI→PROSES` (tolak jika `payment_gate_status != LOLOS`).
- `save`: update nilai tiap detail + **auto-flag** (parse rentang rujukan `13.0 - 17.5`, `< 140`, `Negatif` → NORMAL/HIGH/LOW/CRITICAL).
- `complete`: status `PROSES→SELESAI`, set `completed_at`. Tulis audit trail.

**`src/app/(app)/pemeriksaan/page.tsx`**:
- Untuk analis: tabel parameter jadi **editable** (input nilai), tombol **Mulai Proses**, **Simpan Hasil**, **Selesaikan**.
- Gate visual: jika `paymentGateStatus != LOLOS` → input terkunci + badge "Menunggu Pembayaran".

## Fase 6 — Seed & verifikasi

- `src/db/seed.ts`: isi `queue_no`/`queue_channel` untuk exam seed + `source_channel`.
- Jalankan `npm run typecheck` dan `npm run build`.
- Uji manual alur dua pasien (Rina online, Ujang offline) sampai status `SELESAI`.

---

## Catatan teknis
- **Tanpa dependency baru**: Code128 di-generate manual (SVG). Jika kamu lebih suka pakai library (`jsbarcode`), bilang saja.
- Perubahan DB manual (ALTER TABLE) harus dijalankan user di Supabase SQL Editor — akan saya ingatkan saat eksekusi.
- Validasi PJ Lab (tahap akhir) sudah berfungsi; setelah #7 beres, alur bisa lanjut sampai `VALIDA`.
