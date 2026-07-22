-- ── Migrasi 0005: Aplikasi Mobile Pasien ─────────────────────────
-- Tabel baru untuk akun pasien (app Android/iOS). TIDAK mengubah tabel
-- existing — hanya menambah. Idempotent: aman dijalankan berulang.
--
-- Relasi:
--   patient_accounts.nik ──link──> patients.nik (pasien lama auto-terhubung)
--   patient_dependents   ──anak──> patient_accounts
--   patient_otps         : OTP untuk register/reset PIN
--   notifications_patient: inbox notifikasi pasien (selain push FCM)

CREATE TABLE IF NOT EXISTS patient_accounts (
  id            SERIAL PRIMARY KEY,
  patient_id    INTEGER REFERENCES patients(id) ON DELETE SET NULL,
  nik           VARCHAR(16) NOT NULL UNIQUE,
  phone         VARCHAR(20) NOT NULL,
  pin_hash      TEXT NOT NULL,
  fcm_token     TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMP NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_dependents (
  id            SERIAL PRIMARY KEY,
  account_id    INTEGER NOT NULL REFERENCES patient_accounts(id) ON DELETE CASCADE,
  nik           VARCHAR(16),
  name          VARCHAR(100) NOT NULL,
  dob           DATE,
  gender        VARCHAR(1),
  relation      VARCHAR(30) NOT NULL, -- ANAK / ORANG_TUA / PASANGAN / LAINNYA
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_otps (
  id            SERIAL PRIMARY KEY,
  phone         VARCHAR(20) NOT NULL,
  otp_code      VARCHAR(6) NOT NULL,
  purpose       VARCHAR(20) NOT NULL DEFAULT 'REGISTER', -- REGISTER / RESET_PIN
  expires_at    TIMESTAMP NOT NULL,
  verified      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications_patient (
  id            SERIAL PRIMARY KEY,
  account_id    INTEGER NOT NULL REFERENCES patient_accounts(id) ON DELETE CASCADE,
  title         VARCHAR(150) NOT NULL,
  body          TEXT NOT NULL,
  type          VARCHAR(30) NOT NULL DEFAULT 'INFO', -- REGISTRASI / ANTRIAN / HASIL / PEMBAYARAN / PENGUMUMAN
  reference_id  INTEGER,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMP NOT NULL DEFAULT now()
);

-- Index untuk query umum app
CREATE INDEX IF NOT EXISTS idx_patient_accounts_nik  ON patient_accounts (nik);
CREATE INDEX IF NOT EXISTS idx_patient_otps_phone    ON patient_otps (phone, verified, expires_at);
CREATE INDEX IF NOT EXISTS idx_notif_patient_account ON notifications_patient (account_id, is_read);
CREATE INDEX IF NOT EXISTS idx_dependents_account    ON patient_dependents (account_id);

ALTER TABLE patient_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_dependents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_otps          ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_patient ENABLE ROW LEVEL SECURITY;
