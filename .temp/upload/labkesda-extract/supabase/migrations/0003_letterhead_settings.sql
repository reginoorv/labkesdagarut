-- ── Letterhead (kop surat) settings ──────────────────────────────
-- Menyimpan konfigurasi kop surat yang dipakai pada surat hasil lab.
-- Hanya satu baris (single row) yang dipakai; dikelola oleh Admin Sistem.
CREATE TABLE IF NOT EXISTS letterhead_settings (
  id             SERIAL PRIMARY KEY,
  line1          TEXT NOT NULL DEFAULT 'Pemerintah Kabupaten Garut',
  line2          TEXT NOT NULL DEFAULT 'Dinas Kesehatan',
  line3          TEXT NOT NULL DEFAULT 'Laboratorium Kesehatan Daerah',
  address        TEXT NOT NULL DEFAULT 'Jl. Proklamasi No. 2, Tarogong Kidul, Garut 44151, Jawa Barat',
  contact        TEXT NOT NULL DEFAULT 'Telp. (0262) 232720 • Email: labkesda@garutkab.go.id',
  logo_url       TEXT,
  updated_at     TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE letterhead_settings ENABLE ROW LEVEL SECURITY;
