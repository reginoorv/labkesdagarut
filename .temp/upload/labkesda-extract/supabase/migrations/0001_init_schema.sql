-- =====================================================================
-- Labkesda Garut LIS — Skema Database untuk Supabase
-- Digenerate mengikuti src/db/schema.ts (Drizzle ORM) — SATU-SATUNYA
-- sumber kebenaran yang dipakai frontend & API saat ini.
--
-- Cara pakai:
--   Buka Supabase Dashboard > SQL Editor > New query,
--   paste seluruh isi file ini, lalu Run.
--   (Aman dijalankan ulang: pakai IF NOT EXISTS + drop-recreate policy.)
--
-- Catatan: kolom "serial" Drizzle = integer auto-increment (SERIAL).
--          Data awal (RS, pasien, tarif, user) TIDAK ada di sini —
--          diisi otomatis oleh ensureSeedData() saat aplikasi diakses.
-- =====================================================================

-- ── 1. hospitals ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id               SERIAL PRIMARY KEY,
  code             VARCHAR(20)  NOT NULL UNIQUE,
  name             TEXT         NOT NULL,
  type             VARCHAR(30)  NOT NULL,
  phone            TEXT,
  address          TEXT,
  contact_person   TEXT,
  cooperation_type VARCHAR(50)  DEFAULT 'Mandiri',
  is_active        BOOLEAN      NOT NULL DEFAULT true,
  created_at       TIMESTAMP    NOT NULL DEFAULT now()
);

-- ── 2. patients ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id             SERIAL PRIMARY KEY,
  rm_no          VARCHAR(30)  NOT NULL UNIQUE,
  nik            VARCHAR(20),
  name           TEXT         NOT NULL,
  gender         VARCHAR(10)  NOT NULL,
  dob            VARCHAR(20)  NOT NULL,
  phone          TEXT,
  address        TEXT,
  guarantee_type VARCHAR(30)  NOT NULL DEFAULT 'UMUM',
  hospital_id    INTEGER      REFERENCES hospitals(id),
  source_channel VARCHAR(20)  NOT NULL DEFAULT 'LOKET',
  created_at     TIMESTAMP    NOT NULL DEFAULT now(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT now()
);

-- ── 3. examinations ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS examinations (
  id                  SERIAL PRIMARY KEY,
  lab_no              VARCHAR(40)  NOT NULL UNIQUE,
  patient_id          INTEGER      NOT NULL REFERENCES patients(id),
  doctor_name         TEXT         NOT NULL,
  hospital_id         INTEGER      REFERENCES hospitals(id),
  priority            VARCHAR(20)  NOT NULL DEFAULT 'NORMAL',
  status              VARCHAR(30)  NOT NULL DEFAULT 'REGISTRASI',
  clinical_notes      TEXT,
  sample_received_at  TIMESTAMP    NOT NULL DEFAULT now(),
  target_tat_minutes  INTEGER      NOT NULL DEFAULT 120,
  completed_at        TIMESTAMP,
  validated_at        TIMESTAMP,
  validator_name      TEXT,
  source_channel      VARCHAR(20)  NOT NULL DEFAULT 'LOKET',
  payment_gate_status VARCHAR(30)  NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN',
  queue_no            VARCHAR(20),
  queue_channel       VARCHAR(20),
  created_at          TIMESTAMP    NOT NULL DEFAULT now()
);

-- ── 4. examination_details ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS examination_details (
  id               SERIAL PRIMARY KEY,
  examination_id   INTEGER     NOT NULL REFERENCES examinations(id),
  category         TEXT        NOT NULL,
  test_code        TEXT        NOT NULL,
  test_name        TEXT        NOT NULL,
  value            TEXT,
  unit             TEXT,
  reference_range  TEXT,
  flag             VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  is_duplo         BOOLEAN     NOT NULL DEFAULT false,
  duplo_value      TEXT,
  duplo_difference TEXT,
  duplo_tolerated  BOOLEAN     DEFAULT true,
  updated_at       TIMESTAMP   NOT NULL DEFAULT now()
);

-- ── 5. critical_reports ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS critical_reports (
  id                    SERIAL PRIMARY KEY,
  examination_id        INTEGER     NOT NULL REFERENCES examinations(id),
  patient_name          TEXT        NOT NULL,
  lab_no                VARCHAR(40) NOT NULL,
  parameter_name        TEXT        NOT NULL,
  critical_value        TEXT        NOT NULL,
  reported_by           TEXT        NOT NULL,
  reported_to           TEXT        NOT NULL,
  doctor_phone          TEXT,
  response_time_minutes INTEGER     DEFAULT 0,
  status                VARCHAR(40) NOT NULL DEFAULT 'BELUM_DILAPORKAN',
  notes                 TEXT,
  reported_at           TIMESTAMP   NOT NULL DEFAULT now()
);

-- ── 6. audit_trails ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_trails (
  id          SERIAL PRIMARY KEY,
  patient_id  INTEGER     REFERENCES patients(id),
  patient_rm  VARCHAR(30),
  entity_type TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  changed_by  TEXT        NOT NULL,
  details     TEXT        NOT NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT now()
);

-- ── 7. backup_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backup_logs (
  id               SERIAL PRIMARY KEY,
  backup_type      VARCHAR(20)   NOT NULL,
  status           VARCHAR(20)   NOT NULL,
  filename         TEXT          NOT NULL,
  file_size_mb     NUMERIC(10,2),
  duration_seconds INTEGER,
  created_by       TEXT          NOT NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT now()
);

-- ── 8. backup_settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backup_settings (
  id                  SERIAL PRIMARY KEY,
  auto_backup_enabled BOOLEAN     NOT NULL DEFAULT true,
  schedule_frequency  VARCHAR(20) NOT NULL DEFAULT 'HARIAN',
  schedule_time       VARCHAR(10) NOT NULL DEFAULT '00:00',
  retention_days      INTEGER     NOT NULL DEFAULT 30,
  destination_folder  TEXT        NOT NULL DEFAULT '/var/backups/labkesda_garut',
  updated_at          TIMESTAMP   NOT NULL DEFAULT now()
);

-- ── 9. online_registrations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS online_registrations (
  id                      SERIAL PRIMARY KEY,
  booking_code            VARCHAR(30) NOT NULL UNIQUE,
  name                    TEXT        NOT NULL,
  nik                     VARCHAR(20),
  dob                     VARCHAR(20) NOT NULL,
  gender                  VARCHAR(10) NOT NULL,
  phone                   TEXT        NOT NULL,
  address                 TEXT,
  guarantee_type          VARCHAR(30) NOT NULL DEFAULT 'UMUM',
  visit_date              VARCHAR(20) NOT NULL,
  requested_tests         TEXT        NOT NULL,
  referral_file_url       TEXT,
  notes                   TEXT,
  status                  VARCHAR(30) NOT NULL DEFAULT 'MENUNGGU_VERIFIKASI',
  rejection_reason        TEXT,
  converted_patient_id    INTEGER     REFERENCES patients(id),
  converted_examination_id INTEGER    REFERENCES examinations(id),
  verified_by             TEXT,
  verified_at             TIMESTAMP,
  created_at              TIMESTAMP   NOT NULL DEFAULT now()
);

-- ── 10. users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  full_name     TEXT        NOT NULL,
  role          VARCHAR(30) NOT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  created_at    TIMESTAMP   NOT NULL DEFAULT now()
);

-- ── 11. tariffs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tariffs (
  id         SERIAL PRIMARY KEY,
  category   TEXT          NOT NULL,
  test_code  VARCHAR(30)   NOT NULL,
  test_name  TEXT          NOT NULL,
  price      NUMERIC(12,2) NOT NULL,
  is_active  BOOLEAN       NOT NULL DEFAULT true,
  updated_at TIMESTAMP     NOT NULL DEFAULT now()
);

-- ── 12. payments ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              SERIAL PRIMARY KEY,
  examination_id  INTEGER       NOT NULL UNIQUE REFERENCES examinations(id),
  invoice_no      VARCHAR(40)   NOT NULL UNIQUE,
  guarantee_type  VARCHAR(30)   NOT NULL,
  total_amount    NUMERIC(12,2) NOT NULL,
  payment_method  VARCHAR(30),
  status          VARCHAR(30)   NOT NULL DEFAULT 'MENUNGGU_PEMBAYARAN',
  eligibility_note TEXT,
  processed_by    TEXT,
  paid_at         TIMESTAMP,
  created_at      TIMESTAMP     NOT NULL DEFAULT now()
);

-- ── 13. payment_items ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_items (
  id         SERIAL PRIMARY KEY,
  payment_id INTEGER       NOT NULL REFERENCES payments(id),
  tariff_id  INTEGER       REFERENCES tariffs(id),
  test_name  TEXT          NOT NULL,
  price      NUMERIC(12,2) NOT NULL
);

-- ── Index bantu untuk query yang sering dipakai API ───────────────
CREATE INDEX IF NOT EXISTS idx_examinations_patient   ON examinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_examinations_status    ON examinations(status);
CREATE INDEX IF NOT EXISTS idx_examinations_priority  ON examinations(priority);
CREATE INDEX IF NOT EXISTS idx_exam_details_exam      ON examination_details(examination_id);
CREATE INDEX IF NOT EXISTS idx_examinations_queue      ON examinations(queue_channel, created_at);
CREATE INDEX IF NOT EXISTS idx_critical_reports_exam  ON critical_reports(examination_id);
CREATE INDEX IF NOT EXISTS idx_online_regs_status     ON online_registrations(status);
CREATE INDEX IF NOT EXISTS idx_payments_exam          ON payments(examination_id);
CREATE INDEX IF NOT EXISTS idx_payment_items_payment  ON payment_items(payment_id);

-- =====================================================================
-- KEAMANAN — Row Level Security (RLS)
-- Aplikasi ini konek ke DB pakai koneksi Postgres langsung (role
-- "postgres"/service) lewat Drizzle, BUKAN lewat API PostgREST Supabase
-- dengan anon key. Semua otorisasi sudah ditangani di layer aplikasi
-- (middleware.ts + JWT + RBAC).
--
-- Tapi Supabase mengekspos PostgREST publik pakai anon key. Untuk
-- mencegah tabel terbaca/tertulis lewat REST anon, kita AKTIFKAN RLS
-- tanpa policy apa pun = default deny untuk anon/authenticated.
-- Role "postgres"/service_role BYPASS RLS, jadi aplikasi tetap jalan.
-- =====================================================================
ALTER TABLE hospitals            ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE examinations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trails         ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE tariffs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_items        ENABLE ROW LEVEL SECURITY;

-- Selesai. 13 tabel + index + RLS aktif.
