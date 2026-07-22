---
SECTION_ID: docs.labkesda-patient-mobile-app-concept
TYPE: note
STATUS: draft
PRIORITY: high
---

# Konsep Aplikasi Mobile Pasien LABKESDA Garut
## Android & iOS — Terintegrasi dengan LIMS Web Existing

**Versi:** 1.0 (Draft Konsep)
**Tanggal:** 2026-01
**Status:** Untuk review PO & Client

---

## 1. LATAR BELAKANG & TUJUAN

### 1.1 Masalah Saat Ini
- Pendaftaran online pasien saat ini hanya via halaman web publik `/daftar-online` — tidak mobile-friendly optimal, tidak ada akun pasien, tidak ada riwayat.
- Cek hasil lab via `/cek-hasil` — pasien harus hafal Kode Booking/No. Lab + NIK setiap kali cek.
- Tidak ada notifikasi proaktif ke pasien (status verifikasi, jadwal, hasil selesai).
- Pasien tidak punya bukti digital (barcode/QR) saat datang ke lab — harus catat kode manual.

### 1.2 Tujuan
Aplikasi mobile **khusus pasien** (Android & iOS) yang:
1. Menggantikan pendaftaran online web → jadi native app
2. Terintegrasi penuh dengan LIMS web existing (Supabase backend yang sama)
3. Role staff (Loket, Kasir, Analis, PJ Lab, Admin) **tetap pakai web** — tidak berubah
4. Pasien mendapat pengalaman end-to-end: daftar → pantau status → bayar info → lihat hasil

### 1.3 Prinsip Desain
- **Single source of truth:** semua data tetap di Supabase LIMS existing — app hanya client baru
- **Zero disruption:** web LIMS untuk staff tidak diubah alurnya, hanya tambah API
- **Patient-first UX:** bahasa sederhana, besar, jelas — target pengguna umum Garut (banyak first-time smartphone user)
- Branding konsisten: warna primary `#0F6E5A` (teal), font Inter, style clean seperti web

---

## 2. HASIL RISET BENCHMARK

Dari riset aplikasi lab pasien terkemuka:

| Aplikasi | Fitur Kunci yang Diadopsi |
|---|---|
| **LabCorp Patient (US)** | View/download/print hasil resmi, notifikasi saat hasil ready, QR code check-in, kelola dependen (anak/orang tua), login biometrik (fingerprint/Face ID), riwayat hasil |
| **LifeLabs (Canada)** | Booking online, check-in online, cari lokasi lab terdekat, akses hasil |
| **SatuSehat Mobile (Kemenkes RI)** | Standar aplikasi kesehatan pemerintah Indonesia, NIK-based identity, riwayat kesehatan |
| **Interior Health (Canada)** | Info persiapan tes (puasa dll), edukasi hasil |

**Kesimpulan riset:** fitur inti yang wajib ada = registrasi akun, booking pemeriksaan, notifikasi status, akses hasil digital, profil keluarga (dependen), pembayaran info.

---

## 3. PEMETAAN FITUR: WEB EXISTING → MOBILE APP

### 3.1 Fitur yang DIMIGRASI (dari web publik ke app)

| Fitur Web Sekarang | Lokasi Web | Di Mobile App |
|---|---|---|
| Form pendaftaran online (3 step: data diri → pilih tes → konfirmasi) | `/daftar-online` | **Modul Pendaftaran** — sama persis fieldnya, ditambah simpan profil agar tidak isi ulang |
| Dropdown wilayah (provinsi→kota→kecamatan→desa) | `src/lib/wilayah.ts` | Sama, data wilayah yang sama |
| Pilih kategori tes (7 kategori: Hematologi, Kimia, Imunoserologi, Mikrobiologi, Urinalisis, NARKOBA, KESEHATAN) | `src/lib/test-catalog.ts` | Sama + **tampilkan estimasi tarif** dari tabel `tariffs` |
| Field keperluan (wajib untuk NARKOBA/KESEHATAN) | `PURPOSE_REQUIRED_PACKAGES` | Sama, validasi sama |
| Upload surat rujukan | referralFileName di form | **Foto langsung dari kamera** (keunggulan mobile) |
| Pilih tanggal kunjungan (H+1 s/d H+14) | minDate/maxDate di form | Date picker native + tampilkan hari libur |
| Kode booking (BK-XXXXXX) + barcode | Halaman sukses daftar | **QR/barcode digital di app** — tinggal tunjukkan ke loket |
| NIK lookup (isi otomatis pasien lama) | `/api/patients?search=` | Otomatis — karena pasien sudah login, data langsung terisi |
| Cek hasil (kode + NIK) | `/cek-hasil` | **Riwayat hasil otomatis** — tidak perlu input kode lagi, semua hasil pasien tampil di app |
| Surat hasil A4 (cetak/download) | `/cek-hasil` (print) | **Lihat + download PDF + share** dari app |

### 3.2 Fitur yang TETAP di WEB (staff only — TIDAK masuk app)

- Verifikasi/reject pendaftaran online (Petugas Loket)
- Kasir: pembayaran, verifikasi eligibilitas BPJS, invoice
- Pemeriksaan: input hasil, validasi, duplo, auto-flagging, nilai kritis
- Antrian board, monitoring TAT, laporan, master data, pengaturan

### 3.3 Fitur BARU (mobile-only, tidak ada di web)

| Fitur Baru | Alasan | Data Source |
|---|---|---|
| **Akun pasien** (register/login via NIK + no HP + OTP) | Web sekarang tanpa akun — pasien isi ulang tiap daftar | Tabel baru `patient_accounts` (link ke `patients` via NIK) |
| **Push notification** | Status verifikasi, antrian dipanggil, hasil selesai | Trigger dari status `online_registrations` & `examinations` |
| **Status tracking real-time** | Pasien bisa lihat: Menunggu Verifikasi → Terverifikasi → Menunggu Pembayaran → Diproses Lab → Hasil Siap | `online_registrations.status` + `examinations.status` + `paymentGateStatus` |
| **Riwayat kunjungan & hasil** | Semua pemeriksaan masa lalu dalam 1 tempat | `examinations` by patient NIK |
| **Profil keluarga (dependen)** | Daftarkan anak/orang tua dari 1 akun (seperti LabCorp) | Sub-profil di `patient_accounts` |
| **Info tarif sebelum daftar** | Transparansi biaya | Tabel `tariffs` existing |
| **Estimasi antrian** | Lihat nomor antrian sendiri & posisi | `queue` existing |
| **Info lab** | Jam operasional, lokasi/maps, kontak, info persiapan tes (puasa 10-12 jam untuk GDP/Lipid) | Konten statis + `letterhead_settings` |
| **Login biometrik** | Fingerprint/Face ID | Local device auth |
| **BPJS eligibility status** | Pasien BPJS bisa lihat status verifikasi jaminannya | `payments.status` (mock BPJS existing) |

---

## 4. DAFTAR FITUR APLIKASI (DETAIL)

### F1 — Onboarding & Autentikasi
- Splash screen + intro 3 slide (cara daftar, pantau status, lihat hasil)
- Register: NIK (16 digit), nama, tgl lahir, no HP → **OTP SMS/WA** → buat PIN 6 digit
- Validasi NIK terhadap data `patients` existing → auto-link rekam medis lama
- Login: NIK + PIN, atau biometrik
- Lupa PIN: reset via OTP

### F2 — Beranda (Home)
- Greeting + nama pasien
- Kartu status pendaftaran aktif (jika ada): kode booking, tanggal kunjungan, status terkini, QR code
- Menu utama: Daftar Pemeriksaan, Riwayat & Hasil, Antrian, Tarif, Info Lab
- Banner info (jam operasional, pengumuman)
- Badge notifikasi

### F3 — Pendaftaran Pemeriksaan (migrasi `/daftar-online`)
- Step 1 — Pilih pasien: diri sendiri / anggota keluarga (data auto-terisi, edit jika perlu)
- Step 2 — Pilih pemeriksaan: 7 kategori tes + lihat tarif per kategori + estimasi total
- Step 3 — Jadwal & lampiran: tanggal kunjungan (H+1..H+14), foto surat rujukan (kamera), keperluan (jika NARKOBA/KESEHATAN), catatan
- Step 4 — Konfirmasi & persetujuan (checkbox consent, sama seperti web)
- Sukses → **Kode booking + QR Code** tersimpan di app
- POST ke API yang sama: `POST /api/online-registrations`

### F4 — Status & Tracking Pendaftaran
Timeline visual per pendaftaran:
1. ✅ Pendaftaran Terkirim (`MENUNGGU_VERIFIKASI`)
2. ✅/❌ Terverifikasi Loket (`TERVERIFIKASI` / `DITOLAK` + alasan)
3. 💳 Menunggu Pembayaran di Kasir (`paymentGateStatus = MENUNGGU_PEMBAYARAN`)
4. 🧪 Sampel Diproses (`REGISTRASI` → `PROSES`)
5. 📄 Hasil Siap (`SELESAI` → tervalidasi)
- Push notification di setiap perubahan status
- Jika ditolak: tampilkan alasan + tombol "Daftar Ulang" (form terisi data lama)

### F5 — Antrian Saya
- Nomor antrian digital (A-xxx/O-xxx/C-xxx) setelah verifikasi
- Posisi antrian saat ini (berapa orang di depan) — dari `/api/queue`
- Estimasi waktu tunggu
- Notifikasi saat giliran hampir tiba (3 antrian sebelum)

### F6 — Riwayat & Hasil Lab (migrasi `/cek-hasil`)
- Daftar semua pemeriksaan (terurut terbaru): tanggal, jenis tes, status
- Detail hasil: tabel parameter, nilai, satuan, rujukan, flag (Normal/Tinggi/Rendah/Kritis) — tampilan ramah awam
- Surat hasil resmi: preview A4 + **Download PDF** + share
- Filter per tahun/kategori
- Untuk hasil lama sebelum punya akun: menu "Hubungkan Hasil" (input kode + NIK seperti `/cek-hasil`)

### F7 — Pembayaran & Penjamin
- Info tagihan: rincian tes + total (dari data kasir)
- Status: Menunggu Pembayaran / Lunas / Terverifikasi Jaminan
- Metode di MVP: bayar di kasir saat datang (tunjukkan QR)
- BPJS: status eligibilitas + catatan
- (Fase 2: pembayaran online — transfer/QRIS/e-wallet)

### F8 — Profil & Keluarga
- Data diri: edit no HP, alamat (dropdown wilayah sama dengan web)
- Anggota keluarga: tambah/edit dependen (NIK, nama, tgl lahir, hubungan)
- Pengaturan: notifikasi on/off, ganti PIN, bahasa (ID), biometrik
- Logout

### F9 — Info & Bantuan
- Jam operasional, alamat + Google Maps, telepon (tap-to-call)
- Daftar tarif pemeriksaan (searchable)
- Panduan persiapan tes: puasa untuk GDP/Lipid, syarat urine, dll
- FAQ + kontak pengaduan

### F10 — Notifikasi Center
- Inbox notifikasi di app (selain push)
- Jenis: status pendaftaran, pengingat jadwal (H-1), antrian, hasil ready, pengumuman

---

## 5. ARSITEKTUR & INTEGRASI

### 5.1 Arsitektur High-Level

```
┌─────────────────┐         ┌──────────────────────────┐
│  MOBILE APP     │  HTTPS  │   Next.js API (existing) │
│  (Flutter/RN)   ├────────►│   + endpoint baru pasien │
│  Android & iOS  │         └───────────┬──────────────┘
└─────────────────┘                     │
                                        ▼
                              ┌──────────────────┐
                              │  Supabase (DB)   │  ◄── sama dengan web LIMS
                              │  + tabel baru:   │
                              │  patient_accounts│
                              │  device_tokens   │
                              └──────────────────┘
                                        ▲
┌─────────────────┐                     │
│  WEB LIMS Staff ├─────────────────────┘
│  (tidak berubah)│
└─────────────────┘
```

### 5.2 Rekomendasi Teknologi Mobile
- **Flutter** (1 codebase → Android + iOS) — cocok untuk tim kecil pemerintah daerah, performa baik, komponen Material lengkap
- Alternatif: React Native (jika tim sudah kuat React dari Next.js)
- Push notification: **Firebase Cloud Messaging** (gratis, andal)
- OTP: SMS gateway lokal / WhatsApp API (Fonnte/dll — sudah umum di Indonesia)

### 5.3 API yang DIPAKAI ULANG (existing, tanpa ubah)
| Endpoint | Dipakai untuk |
|---|---|
| `POST /api/online-registrations` | Kirim pendaftaran dari app |
| `GET /api/patients?search=` | NIK lookup saat registrasi akun |
| `POST /api/cek-hasil` | Hubungkan hasil lama |
| `GET /api/tariffs` | Daftar tarif di app |
| `GET /api/queue` | Posisi antrian |

### 5.4 API BARU yang harus dibuat
| Endpoint Baru | Fungsi |
|---|---|
| `POST /api/patient-auth/register` | Daftar akun (NIK+HP → OTP) |
| `POST /api/patient-auth/verify-otp` | Verifikasi OTP, terbitkan token |
| `POST /api/patient-auth/login` | Login NIK+PIN → JWT |
| `GET /api/patient/me/registrations` | Daftar pendaftaran milik pasien login |
| `GET /api/patient/me/examinations` | Riwayat pemeriksaan + hasil |
| `GET /api/patient/me/notifications` | Inbox notifikasi |
| `POST /api/patient/me/device-token` | Simpan FCM token utk push |
| `PUT /api/patient/me/profile` | Update profil & dependen |

**Autentikasi app:** JWT token terpisah dari cookie session web (`labkesda_session`). Endpoint baru pakai middleware auth pasien, **tidak** mengganggu auth staff.

### 5.5 Tabel Database Baru (Supabase migration 0005)
```sql
patient_accounts (
  id, patient_id → patients.id, nik UNIQUE, phone,
  pin_hash, fcm_token, is_active, created_at
)
patient_dependents (
  id, account_id → patient_accounts.id,
  nik, name, dob, gender, relation
)
patient_otps (
  id, phone, otp_code, expires_at, verified
)
notifications_patient (
  id, account_id, title, body, type,
  reference_id, is_read, created_at
)
```

### 5.6 Titik Integrasi Push Notification (di web existing)
Web LIMS perlu trigger notifikasi saat:
1. Loket klik **Verifikasi** di `/registrasi/pendaftaran-online` → push "Pendaftaran Terverifikasi" (atau Ditolak + alasan)
2. Kasir proses pembayaran → push "Silakan lanjut ke pengambilan sampel"
3. PJ Lab klik **Validasi** → push "Hasil lab Anda sudah tersedia"
4. Cron H-1 → push pengingat jadwal kunjungan

---

## 6. USER FLOW UTAMA

### Flow A — Daftar Akun Baru
```
Buka app → Daftar → input NIK + No HP → OTP → buat PIN
→ sistem cek NIK di tabel patients:
   • ketemu → akun terhubung, riwayat lama muncul
   • tidak ketemu → akun baru (pasien baru)
→ masuk Beranda
```

### Flow B — Pendaftaran Pemeriksaan (inti)
```
Beranda → Daftar Pemeriksaan
→ pilih: Diri Sendiri / Keluarga
→ pilih kategori tes (lihat tarif)
→ pilih tanggal kunjungan (H+1 s/d H+14)
→ (opsional) foto surat rujukan via kamera
→ (wajib jika Narkoba/Kesehatan) isi keperluan
→ konfirmasi + centang persetujuan
→ SUKSES: Kode Booking BK-XXXXXX + QR Code
→ PUSH: "Pendaftaran terkirim, menunggu verifikasi"
```

### Flow C — Hari Kunjungan
```
H-1: PUSH pengingat "Besar Anda dijadwalkan..."
Datang ke lab → tunjukkan QR ke Petugas Loket
→ Loket verifikasi (di web, existing) → PUSH "Terverifikasi, no antrian O-005"
→ Antrian Saya: pantau posisi → PUSH "3 antrian lagi"
→ Kasir: bayar tunai / verifikasi BPJS (di web, existing) → PUSH "Lanjut ke sampling"
→ Sampel diambil → PUSH "Sampel sedang diproses"
→ PJ Lab validasi → PUSH "Hasil siap!" → buka di Riwayat & Hasil → lihat/download PDF
```

### Flow D — Cek Hasil Lama (tanpa daftar online)
```
Riwayat → "Hubungkan Hasil" → input Kode Booking/No.Lab + NIK
→ (pakai API /api/cek-hasil existing) → hasil tampil → tersimpan di riwayat akun
```

---

## 7. PRIORITAS & ROADMAP (REKOMENDASI MVP)

### MVP — Fase 1 (rilis pertama)
1. F1 Autentikasi (register OTP + login PIN)
2. F3 Pendaftaran pemeriksaan (migrasi penuh `/daftar-online`)
3. F4 Status tracking + push notifikasi status
4. F6 Riwayat & hasil + download PDF
5. F8 Profil (diri sendiri dulu)
6. F9 Info lab + tarif

### Fase 2
7. F5 Antrian real-time + notifikasi panggilan
8. F8 Dependen/keluarga
9. F7 Pembayaran online (QRIS/VA)
10. Login biometrik

### Fase 3
11. Integrasi BPJS/SatuSehat
12. Chat/helpdesk
13. Rating & feedback layanan
14. Home service (pengambilan sampel di rumah) — jika diminta client

---

## 8. NON-FUNCTIONAL REQUIREMENTS

| Aspek | Requirement |
|---|---|
| Keamanan | PIN hash (bcrypt), JWT expiry, HTTPS only, data sensitif terenkripsi, sesuai UU PDP |
| Privasi | Consent eksplisit saat daftar (sama seperti web), hasil hanya bisa dilihat pemilik NIK |
| Performa | API response < 2s, app startup < 3s, offline cache untuk riwayat |
| Kompatibilitas | Android 8+ (API 26), iOS 13+ |
| Ukuran | App < 40 MB |
| Aksesibilitas | Font besar jelas, kontras WCAG AA, bahasa Indonesia sederhana |
| Ketersediaan | Backend existing (Supabase + Vercel), push FCM 99.9% |

---

## 9. DAMPAK KE WEB EXISTING (MINIMAL)

| Perubahan | Detail | Effort |
|---|---|---|
| Tambah 8 endpoint API pasien | File route baru, tidak sentuh route lama | Sedang |
| Tambah middleware JWT pasien | Terpisah dari auth staff | Kecil |
| Trigger push di 3 titik | verify, pay, validate — tambah helper `sendPush()` | Kecil |
| Migration 0005 | 4 tabel baru, tidak alter tabel lama | Kecil |
| Halaman `/daftar-online` web | **Opsi A:** tetap ada (fallback) — **Opsi B:** redirect ke halaman download app | Trivial |

**Rekomendasi:** Opsi A — web pendaftaran tetap jalan sebagai fallback untuk pasien tanpa smartphone; app jadi kanal utama.

---

## 10. PERTANYAAN UNTUK CLIENT/PO (sebelum finalisasi)

1. OTP via SMS (berbayar per SMS) atau WhatsApp gateway (lebih murah, umum di Garut)?
2. Apakah pembayaran online (QRIS) masuk scope tahun ini, atau cukup bayar di kasir?
3. Apakah halaman web `/daftar-online` dinonaktifkan setelah app rilis, atau tetap sebagai alternatif?
4. Apakah pasien BPJS perlu upload foto kartu BPJS di app saat pendaftaran?
5. Bahasa: Indonesia saja atau perlu Sunda?
6. Siapa pemilik akun Google Play & Apple Developer (Labkesda/Dinkes)? Apple Developer $99/tahun.

---

## LAMPIRAN — Referensi
- LabCorp Patient App (US) — QR check-in, notifikasi hasil, dependen
- LifeLabs (Canada) — booking + check-in online
- SatuSehat Mobile (Kemenkes RI) — standar app kesehatan pemerintah
- Analisis kode LIMS existing: `meta/facts/` + PLAN.md, STUDY-CASE-UJI.md
