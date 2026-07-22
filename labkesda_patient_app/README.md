# Labkesda Patient App (Flutter)

Aplikasi pasien **Labkesda Garut** untuk Android & iOS. Terintegrasi dengan
web LIMS (Next.js + Supabase) di repo yang sama — memakai **database, tabel,
dan API yang sama** dengan sistem web staff.

## Fitur (MVP)
- Splash, Onboarding
- Register: NIK + No HP → OTP (WA/SMS) → buat PIN
- Login: NIK + PIN (JWT)
- Home: greeting, pendaftaran aktif, menu
- Pendaftaran Online 4 langkah (Data Diri → Alamat → Pilih Tes → Review) →
  kode booking + QR (persis web `/daftar-online`)
- Status & Antrian: timeline tracking + notifikasi inbox
- Riwayat Hasil: list + detail tabel parameter (hanya yang sudah VALIDA)
- Profil: data pasien ter-link, dependen (keluarga), ganti PIN
- Info Lab: identitas, kontak, jam layanan, alur

## Integrasi ke web
| App memakai | Web menyediakan |
|---|---|
| POST `/api/patient-auth/register` | kirim OTP, link `patients` by NIK |
| POST `/api/patient-auth/verify-otp` | buat akun + PIN, terbitkan JWT |
| POST `/api/patient-auth/login` | login NIK+PIN |
| POST `/api/online-registrations` | pendaftaran online (endpoint publik existing) |
| GET `/api/patient/me/registrations` | pendaftaran + status pemeriksaan pasien |
| GET `/api/patient/me/examinations` | riwayat + detail hasil (VALIDA) |
| GET/POST `/api/patient/me/notifications` | inbox notifikasi |
| POST `/api/patient/me/device-token` | simpan FCM token push |
| GET/PUT `/api/patient/me/profile` | profil + dependen |
| GET `/api/letterhead` | identitas lab |

Backend baru: `supabase/migrations/0005_patient_app.sql` +
`src/lib/patient-auth.ts` + `src/lib/push.ts`. Push notification otomatis
terkirim saat petugas **verifikasi**, kasir **bayar**, dan PJ Lab **validasi**.

## Menjalankan
```bash
cd labkesda_patient_app
flutter pub get
# arahkan ke server Next.js (Android emulator pakai 10.0.2.2):
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
```

Build:
```bash
flutter build apk --release --dart-define=API_BASE_URL=https://DOMAIN-ANDA
flutter build ipa --release   # butuh macOS + Xcode
```

## Catatan environment
- Flutter SDK belum terinstall di mesin dev ini → kode siap, compile via
  mesin dengan Flutter SDK atau CI (Codemagic/GitHub Actions).
- OTP dikirim via WA gateway (`WA_GATEWAY_URL`) / Firebase Phone Auth.
  Saat development (non-production) API register mengembalikan `devOtp`.
- Push via FCM (`FCM_SERVER_KEY` di server). Tanpa key, notifikasi tetap
  masuk inbox di aplikasi.
