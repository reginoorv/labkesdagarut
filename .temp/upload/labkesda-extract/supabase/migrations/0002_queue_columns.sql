-- ── Migrasi 0002: kolom nomor antrian pada examinations ──────────
-- Dipakai oleh alur registrasi loket, verifikasi online, kasir, dan
-- papan antrian (/api/queue). Idempotent — aman dijalankan berulang.

ALTER TABLE examinations
  ADD COLUMN IF NOT EXISTS queue_no      VARCHAR(20),
  ADD COLUMN IF NOT EXISTS queue_channel VARCHAR(20);

-- Bantu query papan antrian harian (filter per channel + tanggal).
CREATE INDEX IF NOT EXISTS idx_examinations_queue
  ON examinations (queue_channel, created_at);
