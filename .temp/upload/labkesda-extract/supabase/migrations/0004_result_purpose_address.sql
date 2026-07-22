-- ── 0004: keperluan tes, tipe surat hasil, komponen alamat ────────
-- Menambah dukungan untuk:
--  * Tes Narkoba & Surat Keterangan Sehat (template surat berbeda)
--  * Field keperluan/tujuan pemeriksaan (wajib utk Narkoba/Sehat)
--  * Komponen alamat bertingkat (untuk pendaftaran online + auto-isi NIK)

-- Pasien mandiri/online tidak punya dokter pengirim → doctor_name boleh NULL.
ALTER TABLE examinations ALTER COLUMN doctor_name DROP NOT NULL;

-- Keperluan/tujuan pemeriksaan (mis. "Melamar kerja", "Syarat SIM").
ALTER TABLE examinations ADD COLUMN IF NOT EXISTS purpose TEXT;

-- Tipe surat hasil: LAB (default), NARKOBA, SEHAT.
ALTER TABLE examinations ADD COLUMN IF NOT EXISTS result_template VARCHAR(20) NOT NULL DEFAULT 'LAB';

-- Komponen alamat terstruktur (dipakai form online + auto-isi via NIK).
ALTER TABLE patients ADD COLUMN IF NOT EXISTS country  TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city     TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS village  TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS rt_rw    TEXT;

-- Online registrations: keperluan + template (dibawa saat verifikasi).
ALTER TABLE online_registrations ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE online_registrations ADD COLUMN IF NOT EXISTS result_template VARCHAR(20) NOT NULL DEFAULT 'LAB';
