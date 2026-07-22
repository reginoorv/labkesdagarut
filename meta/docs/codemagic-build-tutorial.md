---
SECTION_ID: docs.codemagic-build-tutorial
TYPE: note
STATUS: final
PRIORITY: high
---

# Tutorial: Build APK & IPA via Codemagic CI (Tanpa Flutter SDK Lokal)

Panduan ini untuk Anda yang ingin **build & install aplikasi Labkesda Patient
App tanpa install Flutter SDK di komputer**. Semua compile terjadi di cloud
Codemagic. Anda tinggal download hasilnya.

**Target hasil:**
- **Android** → file `.apk` → install langsung ke HP Android.
- **iOS** → file `.ipa` → install ke iPhone (butuh Apple Developer, dijelaskan di bawah).

---

## BAGIAN 1 — Siapkan Repo (Sekali Saja)

### 1.1 Pastikan file ini sudah ter-commit & ter-push ke GitHub/GitLab
```
codemagic.yaml                              ← config CI (sudah dibuat)
labkesda_patient_app/pubspec.yaml
labkesda_patient_app/lib/**                  ← semua kode Dart
```
Folder `android/` & `ios/` **tidak perlu** ada — CI men-generate-nya otomatis.

### 1.2 Ganti email notifikasi di `codemagic.yaml`
Cari `andi@example.com` (muncul 2×) → ganti dengan email Anda.

---

## BAGIAN 2 — Setup Codemagic (Sekali Saja, ~5 Menit)

### 2.1 Buat akun
1. Buka https://codemagic.io → **Sign up** (gratis).
2. Login dengan **GitHub / GitLab / Bitbucket** yang berisi repo Anda.
3. Free tier: **500 menit build/bulan di Mac mini M2** — cukup untuk
   project ini (1 build Android ≈ 10 menit, iOS ≈ 15 menit).
   ⚠️ Free plan **hanya menyediakan instance macOS M2** — Linux/Windows
   berbayar. Karena itu workflow Android juga memakai `mac_mini_m2`
   (build APK di Mac tetap bisa dan sama hasilnya).

### 2.2 Hubungkan repo
1. Dashboard → **Add application**.
2. Pilih provider Git Anda → pilih repo **labkesda** (repo yang berisi
   `codemagic.yaml`).
3. Codemagic otomatis mendeteksi `codemagic.yaml` → 2 workflow muncul:
   - **Android APK (Install Langsung)**
   - **iOS IPA**

### 2.3 Isi environment variable `API_BASE_URL`
App butuh tahu alamat server Next.js (web LIMS) Anda.

1. Di halaman aplikasi Codemagic → tab **Environment variables**.
2. Buat **variable group** bernama persis: `api_config`
3. Tambahkan variable:
   - **Name:** `API_BASE_URL`
   - **Value:** alamat server web LIMS Anda, contoh:
     - Development (HP & komputer 1 WiFi): `http://192.168.1.10:3000`
       *(ganti dengan IP LAN komputer yang menjalankan `npm run dev` — cek via
       `ipconfig` → IPv4 Address)*
     - Production (sudah deploy): `https://labkesda.domain-anda.go.id`
   - **Secure:** boleh dicentang (opsional).

> ⚠️ **PENTING:** Jangan pakai `http://10.0.2.2:3000` di Codemagic — itu hanya
> berlaku untuk emulator Android lokal. Untuk HP fisik, pakai IP LAN / domain.

---

## BAGIAN 3 — Build & Install ANDROID (Paling Mudah)

### 3.1 Jalankan build
1. Dashboard Codemagic → pilih aplikasi Anda.
2. Klik **Start new build**.
3. Workflow: **Android APK (Install Langsung)** → branch `main` → **Start build**.
4. Tunggu ±5 menit. Status hijau = sukses.

### 3.2 Download APK
Setelah build selesai, ada 2 cara ambil APK:

**Cara A — dari halaman build:**
- Di halaman hasil build, scroll ke bagian **Artifacts** → download
  `app-release.apk`.

**Cara B — dari email:**
- Codemagic mengirim email "Build succeeded" → klik link APK di dalamnya.

### 3.3 Install ke HP Android
1. Kirim file `.apk` ke HP (via kabel, WhatsApp ke diri sendiri, Google Drive,
   atau buka link email langsung di HP).
2. Tap file APK.
3. Pertama kali, Android meminta izin: **Settings → Allow from this source**
   (atau "Install unknown apps") → aktifkan.
4. Tap **Install** → **Open**.
5. Selesai — app **Labkesda Garut** muncul di home screen.

> 💡 **Testing OTP tanpa SMS gateway:** jalankan web server dalam mode
> development (`NODE_ENV != production`). API register akan mengembalikan
> `devOtp` dan app menampilkannya di layar — jadi Anda bisa test registrasi
> lengkap tanpa WhatsApp/SMS sungguhan.

---

## BAGIAN 4 — Build & Install iOS (Butuh Apple Developer)

iOS lebih ketat: Apple **tidak mengizinkan** install IPA sembarangan seperti
Android. Ada 2 skenario:

### Skenario A — Belum punya Apple Developer (hanya mau coba UI/UX)
Anda **tidak bisa** install ke iPhone fisik tanpa akun Apple Developer.
Alternatif untuk melihat tampilan:
- Jalankan di **simulator iOS** (butuh Mac + Xcode), ATAU
- Minta bantuan rekan yang punya Mac untuk menjalankan `flutter run` sekali, ATAU
- Gunakan build Android saja dulu untuk demo client.

Workflow **iOS IPA** di `codemagic.yaml` tetap berjalan dan menghasilkan
`.xcarchive` (unsigned) — berguna untuk arsip, tapi tidak bisa diinstall langsung.

### Skenario B — Sudah punya Apple Developer ($99/tahun)
Butuh **code signing**: sertifikat + provisioning profile. Langkah ringkas:

1. **Daftar Apple Developer:** https://developer.apple.com → enroll ($99/tahun).
   Pemilik akun sebaiknya Labkesda/Dinkes (organisasi), bukan pribadi developer.
2. **Di Codemagic → aplikasi Anda → tab Code signing identities:**
   - Upload **iOS distribution certificate** (.p12) + password.
   - Upload **provisioning profile** (.mobileprovision) bertipe **Ad Hoc**
     (untuk install ke HP tester terdaftar) atau **App Store** (untuk TestFlight).
   - Cara membuat keduanya ada panduan resmi Codemagic:
     https://docs.codemagic.io/code-signing/ios-code-signing/
3. **Ubah script build iOS** di `codemagic.yaml`: hapus flag `--no-codesign`
   pada perintah `flutter build ipa`.
4. Build ulang → hasil `.ipa` bertanda tangan.

### Install IPA bertanda tangan ke iPhone tester
- **Ad Hoc:** daftarkan UDID iPhone tester di Apple Developer portal → masukkan
  ke provisioning profile → install IPA via **Apple Configurator 2** (Mac) atau
  **AltStore/Sideloadly** (Windows).
- **TestFlight (direkomendasikan untuk tim):** upload build ke App Store Connect
  → tambahkan tester via email → tester install app **TestFlight** → download
  app dari sana. Codemagic bisa auto-publish ke TestFlight.

> 💡 **Saran:** untuk MVP ke client Labkesda, mulai dengan **Android APK saja**
> (Bagian 3). iOS menyusul setelah akun Apple Developer organisasi siap —
> sekaligus untuk distribusi TestFlight/App Store resmi.

---

## BAGIAN 5 — Alur Kerja Harian Setelah Setup

```
Anda edit kode Dart (lib/**)
        ↓
git add . && git commit && git push
        ↓
Codemagic OTOMATIS build (karena ada trigger on push ke main)
        ↓
Email masuk: "Build succeeded" + link APK
        ↓
Download & install ke HP → test
```

Tidak perlu buka Codemagic lagi kecuali mau ganti `API_BASE_URL` atau cek log
build yang gagal.

---

## Troubleshooting Umum

| Masalah | Penyebab | Solusi |
|---|---|---|
| Build gagal: "API_BASE_URL is not defined" | Variable group salah nama | Pastikan group di Codemagic persis `api_config` (huruf kecil, underscore) dan berisi `API_BASE_URL` |
| Build gagal di step "flutter create" | Repo tidak berisi pubspec.yaml | Pastikan `labkesda_patient_app/pubspec.yaml` ter-commit |
| App terinstall tapi "Tidak dapat terhubung ke server" | API_BASE_URL salah / server mati | Pastikan web Next.js jalan & bisa diakses dari HP (buka URL di browser HP) |
| iOS build sukses tapi tidak ada file .ipa | Masih pakai `--no-codesign` | Normal untuk unsigned — yang dihasilkan `.xcarchive`. Untuk .ipa, setup code signing (Bagian 4B) |
| Email tidak masuk | Email di codemagic.yaml belum diganti | Ganti `andi@example.com` dengan email Anda |

---

## Checklist Cepat

- [ ] `codemagic.yaml` + kode Flutter ter-push ke repo Git
- [ ] Email notifikasi di `codemagic.yaml` sudah diganti
- [ ] Akun Codemagic dibuat & repo terhubung
- [ ] Variable group `api_config` berisi `API_BASE_URL` sudah dibuat
- [ ] Build Android sukses (hijau)
- [ ] APK terdownload & terinstall di HP Android
- [ ] Web server jalan & bisa diakses dari HP
- [ ] Registrasi akun di app berhasil (pakai `devOtp` saat development)
