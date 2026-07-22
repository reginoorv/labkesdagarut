---
SECTION_ID: plans.labkesda-patient-mobile-app-build
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# Build: Aplikasi Mobile Pasien LABKESDA + Backend API

GOAL: Bangun Flutter app (Android/iOS) pasien + 8 API endpoint baru di Next.js web existing
DECISIONS: OTP via Firebase Phone Auth (free) + WA notif; Flutter 1 codebase; UI tiru web (#0F6E5A, Inter, rounded-xl)

## Task Checklist

### Phase 1: Backend — Web Next.js (di .temp/upload/labkesda-extract) ✅ SELESAI
- [x] Migration 0005: 4 tabel (patient_accounts, patient_dependents, patient_otps, notifications_patient)
- [x] src/lib/patient-auth.ts: JWT HS256 pasien (PATIENT_JWT_SECRET, fallback JWT_SECRET)
- [x] Middleware: /api/patient-auth/* & /api/patient/* dilepas dari session staff
- [x] API 1-8: register, verify-otp, login, me/registrations, me/examinations, me/notifications, me/device-token, me/profile
- [x] src/lib/push.ts: notifyPatient() FCM + inbox (graceful tanpa FCM_SERVER_KEY)
- [x] Trigger push di verify loket, pay kasir, validasi PJ Lab
- [x] .env.example: PATIENT_JWT_SECRET, FCM_SERVER_KEY, WA_GATEWAY_URL

### Phase 2: Flutter Scaffold ✅ SELESAI
- [x] pubspec.yaml (http, shared_preferences, qr_flutter, intl, shimmer)
- [x] lib/core/theme.dart: warna+typography+components persis web
- [x] lib/core/api_client.dart: base URL (--dart-define), JWT storage, auth header, ApiResult
- [x] lib/core/catalog.dart: testCategories + Wilayah (disalin dari web wilayah.ts)
- [x] lib/main.dart: MaterialApp + named routing

### Phase 3: Flutter Screens MVP ✅ SELESAI (10 screen)
- [x] SplashScreen → routing by token (home/onboarding)
- [x] OnboardingScreen (3 slide + lewati)
- [x] RegisterScreen (NIK+HP → OTP → buat PIN; devOtp tampil saat dev)
- [x] LoginPinScreen (NIK+PIN)
- [x] HomeScreen (greeting, pendaftaran aktif+QR, menu grid, badge notif, logout)
- [x] RegisterWizardScreen (4-step: data diri → alamat wilayah bertingkat → pilih tes → review → sukses+QR)
- [x] StatusTrackingScreen (tab Tracking timeline+QR & tab Notifikasi)
- [x] ResultsHistoryScreen (list) + ResultDetailScreen (DataTable + flag warna, lock bila belum VALIDA)
- [x] ProfileScreen (data pasien, dependen CRUD, ganti PIN, logout)
- [x] LabInfoScreen (letterhead via GET /api/letterhead, kontak, jam, alur)

### Phase 4: Integrasi & Docs ✅ SELESAI
- [x] Semua screen terhubung API (base URL via --dart-define=API_BASE_URL)
- [x] README app: setup, build, mapping API↔web, catatan OTP/FCM
- [ ] Update dokumen konsep: keputusan OTP Firebase+WA (pending)
- [ ] Tes E2E (butuh Flutter SDK / server jalan)

## Success Criteria
- [ ] 8 endpoint pasien jalan di web existing tanpa ganggu staff flow
- [ ] App: register→OTP→PIN→login→daftar→status→hasil lengkap
- [ ] UI app konsisten warna/style dengan web
