import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// Isi data awal LIS Labkesda Garut. Idempotent: kalau tabel hospitals
// sudah berisi, fungsi ini langsung berhenti. Dipanggil otomatis dari
// API route saat pertama diakses.
export async function ensureSeedData() {
  try {
    const { count: hospitalCount, error: countErr } = await supabaseAdmin
      .from("hospitals")
      .select("id", { count: "exact", head: true });

    if (countErr) throw countErr;
    if ((hospitalCount ?? 0) > 0) {
      return; // Already seeded
    }

    console.log("Seeding initial LIS data for Labkesda Garut...");

    // 1. Seed Hospitals
    const { data: seededHospitals, error: hErr } = await supabaseAdmin
      .from("hospitals")
      .insert([
        { code: "RSUD-SLM", name: "RSUD dr. Slamet Garut", type: "Rumah Sakit", phone: "0262-232720", address: "Jl. Rumah Sakit No. 12, Garut Kota", contact_person: "dr. Hj. Nining, Sp.PK", cooperation_type: "BPJS & Daerah", is_active: true },
        { code: "PKM-TRG", name: "Puskesmas Tarogong Kaler", type: "Puskesmas", phone: "0262-233112", address: "Jl. Otista No. 88, Tarogong Kaler", contact_person: "Dr. Asep Supriatna", cooperation_type: "BPJS", is_active: true },
        { code: "PKM-GRT", name: "Puskesmas Garut Kota", type: "Puskesmas", phone: "0262-231456", address: "Jl. Pasirwangi No. 4, Garut Kota", contact_person: "Bidan Euis R.", cooperation_type: "BPJS", is_active: true },
        { code: "KLN-MDN", name: "Klinik Utama Medina Garut", type: "Klinik Utama", phone: "0262-240199", address: "Jl. Cimanuk No. 102, Garut", contact_person: "dr. Rian Firmansyah", cooperation_type: "Mandiri", is_active: true },
        { code: "RS-INTAN", name: "RS Intan Husada Garut", type: "Rumah Sakit", phone: "0262-224777", address: "Jl. Suherman No. 72, Tarogong", contact_person: "Ns. Yayan M.", cooperation_type: "Asuransi Swasta", is_active: true },
      ])
      .select();
    if (hErr) throw hErr;

    const rsudId = seededHospitals![0].id;
    const pkmTarogongId = seededHospitals![1].id;
    const klnMedinaId = seededHospitals![3].id;
    const rsIntanId = seededHospitals![4].id;

    // 2. Seed Patients
    const { data: seededPatients, error: pErr } = await supabaseAdmin
      .from("patients")
      .insert([
        { rm_no: "RM-2026-00101", nik: "3205011405880001", name: "Asep Saepulloh", gender: "L", dob: "1988-05-14", phone: "081223456789", address: "Jl. Patriot No. 15, Tarogong Kidul, Garut", guarantee_type: "BPJS", hospital_id: rsudId },
        { rm_no: "RM-2026-00102", nik: "3205016208920003", name: "Siti Nurjanah", gender: "P", dob: "1992-08-22", phone: "085298765432", address: "Kp. Nagrog RT 02/05, Wanaraja, Garut", guarantee_type: "UMUM", hospital_id: pkmTarogongId },
        { rm_no: "RM-2026-00103", nik: "3205010311750002", name: "Dadang Hidayat", gender: "L", dob: "1975-11-03", phone: "087812349087", address: "Jl. Ciledug No. 45, Garut Kota", guarantee_type: "BPJS", hospital_id: rsudId },
        { rm_no: "RM-2026-00104", nik: "3205014502600001", name: "Hj. Popon Suhayati", gender: "P", dob: "1960-02-15", phone: "082133445566", address: "Griya Intan Asri Block C-4, Tarogong", guarantee_type: "ASURANSI", hospital_id: rsIntanId },
        { rm_no: "RM-2026-00105", nik: "3205011910990005", name: "Enjang Iskandar", gender: "L", dob: "1999-10-19", phone: "083890123456", address: "Kp. Chilawu RT 01/03, Garut", guarantee_type: "BPJS", hospital_id: pkmTarogongId },
        { rm_no: "RM-2026-00106", nik: "3205015804010004", name: "Dewi Sartika", gender: "P", dob: "2001-04-18", phone: "081377889900", address: "Jl. Pembangunan No. 22, Tarogong Kidul", guarantee_type: "UMUM", hospital_id: klnMedinaId },
        { rm_no: "RM-2026-00107", nik: "3205010909650003", name: "Cecep Rustandi", gender: "L", dob: "1965-09-09", phone: "081122334455", address: "Jl. Proklamasi No. 10, Garut", guarantee_type: "DINAS", hospital_id: rsudId },
      ])
      .select();
    if (pErr) throw pErr;

    // 3. Seed Examinations
    const now = new Date();
    const agoMinutes = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();

    const { data: seededExams, error: eErr } = await supabaseAdmin
      .from("examinations")
      .insert([
        { lab_no: "LAB-260515-001", patient_id: seededPatients![0].id, doctor_name: "dr. Asep Supriatna, Sp.PD", hospital_id: rsudId, priority: "CITO", status: "SELESAI", clinical_notes: "Pasien lemas, pucat hebat, anemia berat suspect perdarahan GI", sample_received_at: agoMinutes(85), completed_at: agoMinutes(25), validated_at: null, validator_name: null, source_channel: "LOKET", queue_no: "C-001", queue_channel: "CITO", payment_gate_status: "LOLOS", created_at: agoMinutes(90) },
        { lab_no: "LAB-260515-002", patient_id: seededPatients![1].id, doctor_name: "dr. Hj. Nining, Sp.PK", hospital_id: pkmTarogongId, priority: "NORMAL", status: "VALIDA", clinical_notes: "Pemeriksaan rutin pra-operatif minor", sample_received_at: agoMinutes(180), completed_at: agoMinutes(60), validated_at: agoMinutes(40), validator_name: "Apoteker / Analis Kurnia, A.Md.AK", source_channel: "LOKET", queue_no: "A-001", queue_channel: "LOKET", payment_gate_status: "LOLOS", created_at: agoMinutes(190) },
        { lab_no: "LAB-260515-003", patient_id: seededPatients![2].id, doctor_name: "dr. Bambang, Sp.PD", hospital_id: rsudId, priority: "CITO", status: "PROSES", clinical_notes: "Koma Diabetikum, Glukosa Darah sewaktu sangat tinggi", sample_received_at: agoMinutes(45), completed_at: null, validated_at: null, validator_name: null, source_channel: "LOKET", queue_no: "C-002", queue_channel: "CITO", payment_gate_status: "LOLOS", created_at: agoMinutes(50) },
        { lab_no: "LAB-260515-004", patient_id: seededPatients![3].id, doctor_name: "dr. Rian Firmansyah", hospital_id: rsIntanId, priority: "NORMAL", status: "PROSES", clinical_notes: "Lemas, riwayat Leukemia / Sepsis", sample_received_at: agoMinutes(30), completed_at: null, validated_at: null, validator_name: null, source_channel: "LOKET", queue_no: "A-002", queue_channel: "LOKET", payment_gate_status: "LOLOS", created_at: agoMinutes(35) },
        { lab_no: "LAB-260515-005", patient_id: seededPatients![4].id, doctor_name: "dr. Cecep, Sp.B", hospital_id: pkmTarogongId, priority: "CITO", status: "REGISTRASI", clinical_notes: "Accident trauma abdominal, cek HB & Golongan Darah CITO", sample_received_at: agoMinutes(10), completed_at: null, validated_at: null, validator_name: null, source_channel: "LOKET", queue_no: "C-003", queue_channel: "CITO", payment_gate_status: "MENUNGGU_PEMBAYARAN", created_at: agoMinutes(10) },
        { lab_no: "LAB-260515-006", patient_id: seededPatients![5].id, doctor_name: "dr. Siska Yuliani", hospital_id: klnMedinaId, priority: "NORMAL", status: "SELESAI", clinical_notes: "Nyeri pinggang dextra & demam", sample_received_at: agoMinutes(110), completed_at: agoMinutes(20), validated_at: null, validator_name: null, source_channel: "LOKET", queue_no: "A-003", queue_channel: "LOKET", payment_gate_status: "LOLOS", created_at: agoMinutes(120) },
        { lab_no: "LAB-260515-007", patient_id: seededPatients![6].id, doctor_name: "dr. Taufik, Sp.PD", hospital_id: rsudId, priority: "CITO", status: "SELESAI", clinical_notes: "DHF Grade III, petekie +, perdarahan gusi", sample_received_at: agoMinutes(75), completed_at: agoMinutes(15), validated_at: null, validator_name: null, source_channel: "LOKET", queue_no: "C-004", queue_channel: "CITO", payment_gate_status: "LOLOS", created_at: agoMinutes(80) },
      ])
      .select();
    if (eErr) throw eErr;

    // 4. Seed Examination Details (Parameters)
    const { error: edErr } = await supabaseAdmin.from("examination_details").insert([
      // LAB-001 (Asep) - Critical Anemia
      { examination_id: seededExams![0].id, category: "Hematologi", test_code: "HEM-HB", test_name: "Hemoglobin (Hb)", value: "4.2", unit: "g/dL", reference_range: "13.0 - 17.5", flag: "CRITICAL", is_duplo: true, duplo_value: "4.3", duplo_difference: "0.1", duplo_tolerated: true },
      { examination_id: seededExams![0].id, category: "Hematologi", test_code: "HEM-LEU", test_name: "Leukosit (WBC)", value: "14.800", unit: "/µL", reference_range: "4.000 - 10.000", flag: "HIGH", is_duplo: false },
      { examination_id: seededExams![0].id, category: "Hematologi", test_code: "HEM-PLT", test_name: "Trombosit (PLT)", value: "245.000", unit: "/µL", reference_range: "150.000 - 450.000", flag: "NORMAL", is_duplo: false },
      { examination_id: seededExams![0].id, category: "Hematologi", test_code: "HEM-HCT", test_name: "Hematokrit (HCT)", value: "13.5", unit: "%", reference_range: "40.0 - 52.0", flag: "CRITICAL", is_duplo: false },
      // LAB-002 (Siti) - All Normal
      { examination_id: seededExams![1].id, category: "Hematologi", test_code: "HEM-HB", test_name: "Hemoglobin (Hb)", value: "13.8", unit: "g/dL", reference_range: "12.0 - 15.5", flag: "NORMAL", is_duplo: false },
      { examination_id: seededExams![1].id, category: "Kimia Klinik", test_code: "KIM-GDS", test_name: "Glukosa Darah Sewaktu", value: "112", unit: "mg/dL", reference_range: "< 140", flag: "NORMAL", is_duplo: false },
      { examination_id: seededExams![1].id, category: "Kimia Klinik", test_code: "KIM-UREUM", test_name: "Ureum", value: "28", unit: "mg/dL", reference_range: "15 - 45", flag: "NORMAL", is_duplo: false },
      { examination_id: seededExams![1].id, category: "Kimia Klinik", test_code: "KIM-CREAT", test_name: "Kreatinin", value: "0.8", unit: "mg/dL", reference_range: "0.6 - 1.2", flag: "NORMAL", is_duplo: false },
      // LAB-003 (Dadang) - Duplo Glukosa Critical
      { examination_id: seededExams![2].id, category: "Kimia Klinik", test_code: "KIM-GDS", test_name: "Glukosa Darah Sewaktu (Duplo)", value: "485", unit: "mg/dL", reference_range: "< 140", flag: "CRITICAL", is_duplo: true, duplo_value: "488", duplo_difference: "3 mg/dL", duplo_tolerated: true },
      { examination_id: seededExams![2].id, category: "Kimia Klinik", test_code: "KIM-SGOT", test_name: "SGOT (AST)", value: "68", unit: "U/L", reference_range: "< 35", flag: "HIGH", is_duplo: false },
      { examination_id: seededExams![2].id, category: "Kimia Klinik", test_code: "KIM-SGPT", test_name: "SGPT (ALT)", value: "74", unit: "U/L", reference_range: "< 41", flag: "HIGH", is_duplo: false },
      // LAB-004 (Popon) - Duplo Leukosit Out of Tolerance
      { examination_id: seededExams![3].id, category: "Hematologi", test_code: "HEM-LEU", test_name: "Leukosit (WBC Duplo)", value: "28.500", unit: "/µL", reference_range: "4.000 - 10.000", flag: "HIGH", is_duplo: true, duplo_value: "34.200", duplo_difference: "5.700 /µL (18.2%)", duplo_tolerated: false },
      { examination_id: seededExams![3].id, category: "Hematologi", test_code: "HEM-HB", test_name: "Hemoglobin (Hb)", value: "9.1", unit: "g/dL", reference_range: "12.0 - 15.5", flag: "LOW", is_duplo: false },
      // LAB-006 (Dewi) - Urinalisis
      { examination_id: seededExams![5].id, category: "Urinalisis", test_code: "URI-PROT", test_name: "Protein Urine", value: "Positif (++)", unit: "-", reference_range: "Negatif", flag: "HIGH", is_duplo: false },
      { examination_id: seededExams![5].id, category: "Urinalisis", test_code: "URI-LEU", test_name: "Sedimen Leukosit", value: "15-20", unit: "/LPB", reference_range: "0 - 5", flag: "HIGH", is_duplo: false },
      // LAB-007 (Cecep) - Critical Trombosit
      { examination_id: seededExams![6].id, category: "Hematologi", test_code: "HEM-PLT", test_name: "Trombosit (PLT)", value: "18.000", unit: "/µL", reference_range: "150.000 - 450.000", flag: "CRITICAL", is_duplo: true, duplo_value: "17.500", duplo_difference: "500 /µL", duplo_tolerated: true },
      { examination_id: seededExams![6].id, category: "Hematologi", test_code: "HEM-HB", test_name: "Hemoglobin (Hb)", value: "10.4", unit: "g/dL", reference_range: "13.0 - 17.5", flag: "LOW", is_duplo: false },
    ]);
    if (edErr) throw edErr;

    // 5. Seed Critical Reports
    const { error: crErr } = await supabaseAdmin.from("critical_reports").insert([
      { examination_id: seededExams![0].id, patient_name: "Asep Saepulloh", lab_no: "LAB-260515-001", parameter_name: "Hemoglobin (Hb)", critical_value: "4.2 g/dL (Kritis Sangat Rendah)", reported_by: "Kurnia, A.Md.AK", reported_to: "dr. Asep Supriatna, Sp.PD", doctor_phone: "081299887766", response_time_minutes: 4, status: "BELUM_DILAPORKAN", notes: "Nilai kritis terkonfirmasi recheck duplo. Butuh verifikasi laporan dokter.", reported_at: agoMinutes(20) },
      { examination_id: seededExams![2].id, patient_name: "Dadang Hidayat", lab_no: "LAB-260515-003", parameter_name: "Glukosa Darah Sewaktu", critical_value: "485 mg/dL (Kritis Tinggi)", reported_by: "Siti Rahma, S.Tr.Kes", reported_to: "dr. Bambang, Sp.PD", doctor_phone: "081344556677", response_time_minutes: 6, status: "SUDAH_DILAPORKAN", notes: "Telah ditelepon pukul 10.15 WIB. Dokter instruksi siapkan insulin drip.", reported_at: agoMinutes(35) },
      { examination_id: seededExams![6].id, patient_name: "Cecep Rustandi", lab_no: "LAB-260515-007", parameter_name: "Trombosit (PLT)", critical_value: "18.000 /µL (Kritis Sangat Rendah)", reported_by: "Kurnia, A.Md.AK", reported_to: "dr. Taufik, Sp.PD", doctor_phone: "081122334455", response_time_minutes: 3, status: "DIKONFIRMASI", notes: "Laporan diterima dr. Taufik, resep TC (Thrombocyte Concentrate) 4 kolf.", reported_at: agoMinutes(12) },
    ]);
    if (crErr) throw crErr;

    // 6. Seed Audit Trails
    const { error: atErr } = await supabaseAdmin.from("audit_trails").insert([
      { patient_id: seededPatients![0].id, patient_rm: "RM-2026-00101", entity_type: "PEMERIKSAAN", action: "CREATE", changed_by: "Petugas Registrasi LIS", details: "Registrasi sampel CITO LAB-260515-001 dari RSUD dr. Slamet Garut", created_at: agoMinutes(90) },
      { patient_id: seededPatients![1].id, patient_rm: "RM-2026-00102", entity_type: "VALIDASI", action: "VALIDATE", changed_by: "Kurnia, A.Md.AK", details: "Validasi hasil laboratorium lengkap LAB-260515-002 (Siti Nurjanah)", created_at: agoMinutes(40) },
    ]);
    if (atErr) throw atErr;

    // 7. Seed Backup Logs & Settings
    const { error: blErr } = await supabaseAdmin.from("backup_logs").insert([
      { backup_type: "OTOMATIS", status: "SUKSES", filename: "backup_labkesda_20260514_2300.dump.gz", file_size_mb: "48.50", duration_seconds: 14, created_by: "SYSTEM_CRON", created_at: agoMinutes(720) },
      { backup_type: "MANUAL", status: "SUKSES", filename: "backup_labkesda_20260515_0800_manual.dump.gz", file_size_mb: "49.12", duration_seconds: 16, created_by: "Admin Super", created_at: agoMinutes(200) },
    ]);
    if (blErr) throw blErr;

    const { error: bsErr } = await supabaseAdmin.from("backup_settings").insert({
      auto_backup_enabled: true, schedule_frequency: "HARIAN", schedule_time: "23:00", retention_days: 30, destination_folder: "/var/backups/labkesda_garut",
    });
    if (bsErr) throw bsErr;

    // 8. Seed Users (password: password123 for all — CHANGE ON FIRST USE)
    const hash = await bcrypt.hash("password123", 10);
    const { error: uErr } = await supabaseAdmin.from("users").insert([
      { username: "loket1", password_hash: hash, full_name: "Dede Supriatna", role: "PETUGAS_LOKET" },
      { username: "kasir1", password_hash: hash, full_name: "Rina Agustina, SE", role: "KASIR" },
      { username: "analis1", password_hash: hash, full_name: "Siti Rahma, S.Tr.Kes", role: "ANALIS_LAB" },
      { username: "pjlab", password_hash: hash, full_name: "Kurnia, A.Md.AK", role: "PJ_LAB" },
      { username: "admin", password_hash: hash, full_name: "Admin Sistem LIS", role: "ADMIN_SISTEM" },
    ]);
    if (uErr) throw uErr;

    // 9. Seed Tariffs
    const { error: tErr } = await supabaseAdmin.from("tariffs").insert([
      { category: "Hematologi", test_code: "HEM-HB", test_name: "Hemoglobin (Hb)", price: "25000" },
      { category: "Hematologi", test_code: "HEM-LEU", test_name: "Leukosit (WBC)", price: "25000" },
      { category: "Hematologi", test_code: "HEM-PLT", test_name: "Trombosit (PLT)", price: "25000" },
      { category: "Hematologi", test_code: "HEM-HCT", test_name: "Hematokrit (HCT)", price: "25000" },
      { category: "Hematologi", test_code: "HEM-DL", test_name: "Darah Lengkap (CBC)", price: "75000" },
      { category: "Kimia Klinik", test_code: "KIM-GDS", test_name: "Glukosa Darah Sewaktu", price: "30000" },
      { category: "Kimia Klinik", test_code: "KIM-GDP", test_name: "Glukosa Darah Puasa", price: "30000" },
      { category: "Kimia Klinik", test_code: "KIM-SGOT", test_name: "SGOT (AST)", price: "35000" },
      { category: "Kimia Klinik", test_code: "KIM-SGPT", test_name: "SGPT (ALT)", price: "35000" },
      { category: "Kimia Klinik", test_code: "KIM-UREUM", test_name: "Ureum", price: "30000" },
      { category: "Kimia Klinik", test_code: "KIM-CREAT", test_name: "Kreatinin", price: "30000" },
      { category: "Kimia Klinik", test_code: "KIM-CHOL", test_name: "Kolesterol Total", price: "35000" },
      { category: "Kimia Klinik", test_code: "KIM-UA", test_name: "Asam Urat", price: "30000" },
      { category: "Imunoserologi", test_code: "IMU-HBSAG", test_name: "HBsAg Rapid", price: "45000" },
      { category: "Imunoserologi", test_code: "IMU-HIV", test_name: "HIV Screening Rapid", price: "55000" },
      { category: "Imunoserologi", test_code: "IMU-WIDAL", test_name: "Widal Test", price: "40000" },
      { category: "Mikrobiologi", test_code: "MIK-KULTUR", test_name: "Kultur Bakteri & Sensitivitas", price: "150000" },
      { category: "Mikrobiologi", test_code: "MIK-BTA", test_name: "BTA (Bakteri Tahan Asam)", price: "35000" },
      { category: "Urinalisis", test_code: "URI-RUTIN", test_name: "Urinalisis Rutin", price: "25000" },
      { category: "Urinalisis", test_code: "URI-PROT", test_name: "Protein Urine", price: "20000" },
      { category: "Urinalisis", test_code: "URI-SED", test_name: "Sedimen Urine", price: "25000" },
    ]);
    if (tErr) throw tErr;

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Error during seed execution:", err);
  }
}
