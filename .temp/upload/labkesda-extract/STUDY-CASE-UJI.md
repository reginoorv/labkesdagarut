# Study Case — Uji End-to-End LIS Labkesda Garut

Skenario ini menguji seluruh alur dari pendaftaran sampai surat hasil & laporan.
Jalankan `npm run dev`, buka `http://localhost:3000`. Password semua akun: `password123`.

| Username | Role |
|----------|------|
| `loket1` | Petugas Loket |
| `kasir1` | Kasir |
| `analis1` | Analis Laboratorium |
| `pjlab` | Penanggung Jawab Lab |
| `admin` | Administrator Sistem |

---

## Kasus A — Pasien OFFLINE (loket), Umum

**Tokoh:** Ujang Suryana, laki-laki, Umum, paket Hematologi + Glukosa Darah Puasa.

1. **Loket** (`loket1`) → menu Registrasi Pasien Baru.
   - Isi identitas, penjamin **Umum**, pilih paket **Hematologi (HEM)** + **Glukosa Darah Puasa (GDP)**, prioritas Normal.
   - Simpan.
   - ✅ Harapan: muncul layar sukses berisi **Nomor Antrian** (mis. A-00x), penjamin, dokter. 
   - ✅ Cek menu **Antrian Pasien**: nama muncul dengan stage "Menunggu Kasir".
   - ✅ Cek menu **Print Label**: pasien muncul, barcode Code128 asli & rapi.

2. **Analis** (`analis1`) → menu Detail Data Pemeriksaan.
   - ✅ Harapan: exam Ujang terlihat, tapi terkunci badge **"Menunggu Kasir"** (belum bisa isi nilai).

3. **Kasir** (`kasir1`) → menu Pembayaran & Verifikasi.
   - Buka tagihan Ujang → klik **Konfirmasi Lunas** (jalur Umum).
   - ✅ Harapan: status jadi LOLOS, muncul tombol **Cetak Invoice**.
   - Klik Cetak Invoice → ✅ invoice rapi, ada rincian tarif + total + stempel LUNAS.

4. **Analis** (`analis1`) → Detail Data Pemeriksaan (reload).
   - ✅ Sekarang bisa mengisi nilai tiap parameter.
   - Isi nilai, mis. Hb `4.5` (uji kritis), Leukosit `7.200`, Trombosit `250.000`, GDP `180`.
   - ✅ Flag muncul otomatis: Hb → **CRITICAL**, GDP → **HIGH**, sisanya NORMAL.
   - Klik **Simpan & Selesaikan** (satu tombol).
   - ✅ Status langsung jadi SELESAI, tanpa harus input ulang.

5. **PJ Lab** (`pjlab`) → menu Validasi Pasien.
   - ✅ Harapan: HANYA exam berstatus SELESAI yang muncul (yang masih diproses tidak muncul).
   - Centang Ujang → **Validasi Terpilih**.
   - ✅ Setelah validasi, otomatis diarahkan ke **Surat Hasil**.
   - ✅ Surat bergaya formal, semua nilai TERISI (bukan strip -), Hb ditandai kritis.
   - Klik **Cetak Surat Hasil** → ✅ tampil rapi untuk diserahkan ke pasien.

---

## Kasus B — Pasien ONLINE (mandiri), BPJS

**Tokoh:** Rina, BPJS, rujukan puskesmas.

1. **Publik** → buka `/daftar-online` (tanpa login).
   - Step 1 data diri (penjamin **BPJS**), Step 2 pilih tes + tanggal, Step 3 centang **persetujuan**.
   - ✅ Tombol kirim terkunci sampai persetujuan dicentang.
   - Submit → ✅ muncul **Kode Booking** + **barcode asli** + tombol **Simpan Bukti Booking** & **Kembali/Daftar Lagi**.
   - Klik Simpan Bukti Booking → ✅ file PNG rapi (kop, barcode, detail, instruksi), bukan barcode polos.

2. **Loket** (`loket1`) → menu Pendaftaran Online.
   - Verifikasi booking Rina → ✅ terbit Nomor Antrian, order lab + parameter tergenerate.

3. **Kasir** (`kasir1`) → Pembayaran.
   - Jalur BPJS: isi catatan eligibilitas → **Verifikasi & Lanjutkan**.
   - ✅ Status LOLOS (tanpa nominal bayar).

4. Lanjut sama seperti Kasus A langkah 4–5 (analis isi → PJ Lab validasi → surat hasil).

---

## Kasus C — Uji Keamanan Role (penting)

1. Login `kasir1`.
   - ✅ Sidebar hanya menampilkan menu Kasir (tak ada menu Analis/PJ Lab).
   - Coba akses URL langsung: ketik `/pemeriksaan/validasi` di address bar.
   - ✅ Harapan: ditolak, otomatis dilempar balik ke `/dashboard`.

2. Login `analis1` vs `pjlab` — bandingkan sidebar.
   - ✅ Analis TIDAK punya menu "Validasi Pasien"; PJ Lab punya. (Dulu sama, sekarang beda.)

3. Login tiap role → cek Dashboard.
   - ✅ Kartu & grafik berbeda per role (Kasir lihat kartu relevan kasir, dst). Hanya Admin lihat semua.

---

## Kasus D — Laporan Admin

1. Login `admin` → menu **Laporan**.
   - ✅ Ada 4 tab: Keuangan, Kunjungan, TAT & Mutu, Audit.
   - Ganti periode (Harian/Mingguan/Bulanan/Tahunan) → data ikut berubah.
   - ✅ Tiap tab: kartu ringkasan + breakdown + tabel + tombol ekspor CSV.

2. Login non-admin (mis. `kasir1`) → coba akses `/laporan` via URL.
   - ✅ Ditolak (dilempar ke dashboard); API `/api/laporan` balas 403.

---

## Kasus E — Uji Negatif (harus GAGAL / tertolak)

1. Analis coba isi hasil sebelum kasir memproses → ✅ ditolak "Menunggu pembayaran".
2. PJ Lab coba validasi exam yang belum SELESAI → ✅ tidak muncul di daftar & API menolak.
3. Cetak Surat Hasil sebelum divalidasi → ✅ tombol cetak terkunci ("Belum divalidasi PJ Lab").

---

---

# Perbaikan Lanjutan (9 Poin) — Skenario Uji

> Catatan: jika port 3000 sedang dipakai, Next.js otomatis pindah ke 3001.
> Perhatikan baris `Local: http://localhost:PORT` di terminal saat `npm run dev`.
> Fitur **Kop Surat** butuh migrasi `supabase/migrations/0003_letterhead_settings.sql`
> dijalankan dulu di Supabase SQL Editor (sebelum itu API tetap balas nilai default,
> hanya penyimpanan yang belum aktif).

## Kasus F — UI Pendaftaran Online Dirapikan (#1)

1. **Publik** → buka `/daftar-online` di layar lebar (desktop).
   - ✅ Muncul **panel branding hijau di kiri** (logo, judul, ringkasan manfaat, stepper vertikal 1-2-3 dengan status aktif/selesai) dan **kolom form di kanan**.
   - Lanjutkan step 1 → 2 → 3.
   - ✅ Di panel kiri, langkah yang sudah lewat berubah jadi centang, langkah aktif ter-highlight.
2. Perkecil jendela / buka di HP (mobile).
   - ✅ Panel kiri hilang, muncul **header ringkas** + **progress bar tipis** dengan teks "Langkah X dari 3 — <nama step>".
   - ✅ Form tetap terbaca, tidak berantakan.

## Kasus G — Registrasi Offline Tanpa Rujukan (#2)

1. **Loket** (`loket1`) → Registrasi Pasien Baru.
   - Perhatikan toggle **Rujukan / Tanpa Rujukan (Datang Langsung)**.
2. Pilih **Tanpa Rujukan**.
   - ✅ Field **faskes perujuk** & **dokter perujuk** hilang.
   - Isi sisa data → Simpan.
   - ✅ Tersimpan sukses tanpa error validasi; data faskes/dokter kosong di record.
3. Ulangi, kali ini pilih **Rujukan** tapi kosongkan faskes/dokter → Simpan.
   - ✅ Ditolak: faskes & dokter perujuk wajib diisi pada mode Rujukan.

## Kasus H — Gate "Lihat/Cetak Hasil" Sebelum Validasi (#3)

1. **Analis** (`analis1`) → isi nilai suatu exam → **Simpan & Selesaikan**.
   - ✅ Status jadi SELESAI, muncul badge **"Menunggu Validasi PJ Lab"** (bukan tombol lihat hasil).
2. Buka URL surat hasil exam itu langsung sebelum divalidasi.
   - ✅ Isi surat diblokir dengan keterangan "Belum divalidasi PJ Lab"; tombol **Cetak Surat Hasil** tidak muncul.
3. **PJ Lab** (`pjlab`) validasi exam tsb → buka lagi surat hasil.
   - ✅ Status VALIDA, isi tampil lengkap, tombol Cetak Surat Hasil aktif.

## Kasus I — PJ Lab Tak Punya Menu Detail Pemeriksaan (#4)

1. Login `pjlab` → periksa sidebar.
   - ✅ **Tidak ada** menu "Detail Data Pemeriksaan". Yang ada: Validasi, Duplo, Auto-Flagging, Nilai Kritis.
2. Ketik `/pemeriksaan` di address bar.
   - ✅ Ditolak, dilempar ke `/dashboard`.

## Kasus J — Kelola Kop Surat (Admin) (#5)

> Prasyarat: migrasi `0003_letterhead_settings.sql` sudah dijalankan.

1. Login `admin` → menu **Pengaturan → Kelola Kop Surat**.
   - ✅ Form berisi 3 baris judul, alamat, kontak (terisi default), plus **upload logo**.
2. Ubah salah satu baris (mis. kontak) + upload logo PNG kecil (<512 KB) → **Simpan Kop Surat**.
   - ✅ Toast sukses. Reload → nilai tetap tersimpan.
   - Uji logo >512 KB → ✅ ditolak dengan peringatan ukuran.
3. Buka **Surat Hasil** exam yang sudah VALIDA.
   - ✅ Kop surat memakai teks & **logo baru** (bukan placeholder).
4. Login non-admin → coba PUT `/api/letterhead`.
   - ✅ Ditolak 403 ("Hanya Administrator").

## Kasus K — Fungsi 4 Menu Pemeriksaan Terverifikasi (#6)

1. **PJ Lab / Analis** → menu **Hasil Duplo**.
   - ✅ Menampilkan parameter berpenanda duplo: nilai asli vs ulang + selisih (data nyata dari `/api/examinations`).
2. Menu **Auto-Flagging**.
   - ✅ Merekap hasil abnormal (HIGH ↑ / LOW ↓ / CRITICAL) yang dihitung otomatis saat input.
3. Menu **Nilai Kritis**.
   - ✅ Daftar pelaporan nilai kritis dengan status (Belum → Dilaporkan → Dikonfirmasi), siapa dilapori & jam.
4. Registrasi dengan prioritas **CITO** → cek antrian/dashboard.
   - ✅ Ditandai urgent/merah dan didahulukan.

## Kasus L — Notifikasi Per-Role Fungsional (#7)

1. Login `pjlab` → klik ikon **lonceng** di topbar.
   - ✅ Muncul notifikasi nyata, mis. **"N Hasil Menunggu Validasi"** dengan jumlah sesuai data.
   - Klik notifikasi → ✅ diarahkan ke `/pemeriksaan/validasi`.
2. Login `loket1` → lonceng.
   - ✅ Notifikasi berbeda (pendaftaran online pending); kosong bila memang tak ada.
3. Buka tanpa login → panggil `/api/notifications`.
   - ✅ Balas `{"authenticated":false,"notifications":[]}`.
4. Diamkan 30 detik setelah data berubah.
   - ✅ Jumlah notifikasi ter-refresh otomatis (polling).

## Kasus M — Dashboard Sinkron Data Nyata (#8)

1. Login tiap role → buka Dashboard, catat angka kartu.
   - ✅ **Pasien Hari Ini** = pasien terdaftar hari ini saja (bukan total keseluruhan).
   - ✅ Tak ada angka statis palsu (dulu 12/88); grafik & kartu berasal dari `/api/dashboard`.
   - ✅ Widget **CITO** hanya menghitung yang belum tervalidasi.
   - ✅ **Pending Online** = sumber sama dengan menu Pendaftaran Online.
2. Tambah 1 registrasi baru → reload Dashboard.
   - ✅ Angka bertambah konsisten.

## Kasus N — Backup jadi Ekspor Data Nyata (#9)

1. Login `admin` → **Pengaturan → Backup & Ekspor Data**.
   - Klik **Ekspor & Unduh Data Sekarang**.
   - ✅ Browser mengunduh berkas `backup_labkesda_<tanggal>.json`.
   - ✅ Toast melaporkan jumlah baris & tabel yang diekspor.
2. Buka file JSON.
   - ✅ Ada `meta` (waktu, totalRows, daftar tabel) + `data` per tabel (hospitals, patients, examinations, dst).
   - ✅ Tabel `users` **tidak memuat** `password_hash`.
3. Cek tabel **Riwayat Backup** di halaman.
   - ✅ Baris baru tercatat dengan ukuran (MB) & durasi (detik) nyata, status SUKSES.

---

## Ringkasan Titik Verifikasi Kritis
- [ ] Pasien offline masuk Kasir & Print Label (bug #6 lama)
- [ ] Nomor antrian terbit di semua jalur
- [ ] Gate pembayaran mengunci input analis
- [ ] Satu tombol Simpan & Selesaikan (tak input ulang)
- [ ] Auto-flag benar (Hb 4.5 = CRITICAL)
- [ ] PJ Lab tak bisa validasi yang belum diisi
- [ ] Surat hasil nilai terisi + gaya formal
- [ ] Invoice & bukti booking rapi
- [ ] Menu & dashboard beda per role, guard URL jalan
- [ ] Laporan admin 4 jenis + ekspor CSV, non-admin ditolak

### Perbaikan Lanjutan (9 poin)
- [ ] #1 UI daftar online 2 kolom (desktop) + ringkas (mobile)
- [ ] #2 Registrasi offline mode Tanpa Rujukan (faskes/dokter tersembunyi & tak wajib)
- [ ] #3 Lihat/Cetak hasil terkunci sampai VALIDA
- [ ] #4 PJ Lab tanpa menu Detail Pemeriksaan + guard URL
- [ ] #5 Kelola kop surat (logo + teks) tampil di surat hasil, PUT khusus admin
- [ ] #6 Duplo / Auto-Flagging / CITO / Nilai Kritis berfungsi dengan data nyata
- [ ] #7 Notifikasi per-role, klik menuju halaman, refresh 30 detik, tolak tanpa login
- [ ] #8 Dashboard sinkron (pasien hari ini benar, tanpa angka palsu, CITO/online konsisten)
- [ ] #9 Backup = ekspor JSON nyata (tanpa password_hash), log ukuran/durasi asli
