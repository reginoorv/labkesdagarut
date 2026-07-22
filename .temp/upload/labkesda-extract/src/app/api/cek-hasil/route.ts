import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";

// Endpoint publik (tanpa login) untuk pasien mengecek hasil pemeriksaannya.
// Syarat keamanan minimal: kode (No. Lab / Kode Booking) DAN NIK harus cocok
// pada pemeriksaan yang sama, dan hasil sudah divalidasi PJ Lab (status VALIDA).
export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const code = String(body.code || "").trim();
    const nik = String(body.nik || "").trim();

    if (!code || !nik) {
      return NextResponse.json(
        { success: false, error: "Kode Booking / No. Lab dan NIK wajib diisi." },
        { status: 400 }
      );
    }

    // Kode bisa berupa No. Lab (langsung di examinations) atau Kode Booking
    // (di online_registrations, lalu tautkan ke converted_examination_id).
    let examId: number | null = null;

    // 1) Coba cocokkan sebagai No. Lab.
    const { data: byLab } = await supabaseAdmin
      .from("examinations")
      .select("id")
      .eq("lab_no", code)
      .maybeSingle();
    if (byLab) examId = byLab.id;

    // 2) Kalau tidak ketemu, cocokkan sebagai Kode Booking pendaftaran online.
    if (!examId) {
      const { data: byBooking } = await supabaseAdmin
        .from("online_registrations")
        .select("converted_examination_id")
        .eq("booking_code", code)
        .maybeSingle();
      if (byBooking?.converted_examination_id) examId = byBooking.converted_examination_id;
    }

    // Pesan generik supaya tidak membocorkan apakah kode/NIK yang salah.
    const notFound = () =>
      NextResponse.json(
        { success: false, error: "Data tidak ditemukan. Periksa kembali Kode/No. Lab dan NIK Anda." },
        { status: 404 }
      );

    if (!examId) return notFound();

    // Ambil pemeriksaan + pasien, verifikasi NIK cocok.
    const { data: exam, error: examErr } = await supabaseAdmin
      .from("examinations")
      .select(
        `id, lab_no, doctor_name, priority, status, clinical_notes, purpose, result_template,
         completed_at, validated_at, validator_name, created_at,
         patients!inner ( rm_no, nik, name, gender, dob, address, guarantee_type ),
         hospitals ( name )`
      )
      .eq("id", examId)
      .maybeSingle();
    if (examErr) throw examErr;
    if (!exam) return notFound();

    const patient: any = exam.patients || {};
    if (!patient.nik || String(patient.nik).trim() !== nik) return notFound();

    // Hasil hanya boleh dilihat publik setelah divalidasi PJ Lab.
    if (exam.status !== "VALIDA") {
      return NextResponse.json(
        {
          success: false,
          pending: true,
          error:
            "Hasil pemeriksaan Anda belum divalidasi oleh Penanggung Jawab Lab. Silakan cek kembali nanti.",
        },
        { status: 409 }
      );
    }

    // Ambil detail parameter.
    const { data: details, error: detErr } = await supabaseAdmin
      .from("examination_details")
      .select("*")
      .eq("examination_id", exam.id);
    if (detErr) throw detErr;

    const hospital: any = exam.hospitals || {};
    const result = {
      id: exam.id,
      labNo: exam.lab_no,
      patientRm: patient.rm_no,
      patientNik: patient.nik,
      patientName: patient.name,
      patientGender: patient.gender,
      patientDob: patient.dob,
      patientAddress: patient.address ?? null,
      guaranteeType: patient.guarantee_type,
      doctorName: exam.doctor_name,
      hospitalName: hospital.name ?? null,
      priority: exam.priority,
      status: exam.status,
      clinicalNotes: exam.clinical_notes,
      purpose: exam.purpose ?? null,
      resultTemplate: exam.result_template ?? "LAB",
      completedAt: exam.completed_at,
      validatedAt: exam.validated_at,
      validatorName: exam.validator_name,
      createdAt: exam.created_at,
      details: toCamel(details || []),
    };

    return NextResponse.json({ success: true, examination: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
