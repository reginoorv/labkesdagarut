import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";

export async function GET(req: Request) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(req.url);
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");

    // Ambil examinations + join patient & hospital lewat embedding PostgREST.
    const { data: examRows, error: examErr } = await supabaseAdmin
      .from("examinations")
      .select(
        `id, lab_no, patient_id, doctor_name, priority, status, clinical_notes,
         sample_received_at, target_tat_minutes, completed_at, validated_at,
         validator_name, payment_gate_status, queue_no, purpose, result_template, created_at,
         patients!inner ( rm_no, nik, name, gender, dob, address, guarantee_type ),
         hospitals ( name )`
      )
      .order("id", { ascending: false });
    if (examErr) throw examErr;

    // Ambil semua detail parameter, lalu kelompokkan per examination.
    const { data: detailsList, error: detErr } = await supabaseAdmin.from("examination_details").select("*");
    if (detErr) throw detErr;

    const detailsMap: Record<number, any[]> = {};
    (detailsList || []).forEach((detail: any) => {
      if (!detailsMap[detail.examination_id]) detailsMap[detail.examination_id] = [];
      detailsMap[detail.examination_id].push(detail);
    });

    // Flatten hasil join ke bentuk datar yang dipakai frontend (camelCase).
    const combined = (examRows || []).map((exam: any) => {
      const patient = exam.patients || {};
      const hospital = exam.hospitals || {};
      return {
        id: exam.id,
        labNo: exam.lab_no,
        patientId: exam.patient_id,
        patientRm: patient.rm_no,
        patientNik: patient.nik ?? null,
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
        sampleReceivedAt: exam.sample_received_at,
        targetTatMinutes: exam.target_tat_minutes,
        completedAt: exam.completed_at,
        validatedAt: exam.validated_at,
        validatorName: exam.validator_name,
        paymentGateStatus: exam.payment_gate_status,
        queueNo: exam.queue_no,
        purpose: exam.purpose ?? null,
        resultTemplate: exam.result_template ?? "LAB",
        createdAt: exam.created_at,
        details: toCamel(detailsMap[exam.id] || []),
      };
    });

    let filtered = combined;
    if (priority && priority !== "ALL") filtered = filtered.filter((e) => e.priority === priority);
    if (status && status !== "ALL") filtered = filtered.filter((e) => e.status === status);

    return NextResponse.json({ success: true, examinations: filtered });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { patientId, doctorName, hospitalId, priority, clinicalNotes, tests } = body;

    if (!patientId || !doctorName) {
      return NextResponse.json({ success: false, error: "Data permintaan tidak lengkap" }, { status: 400 });
    }

    const labNo = `LAB-26${Math.floor(100000 + Math.random() * 900000)}`;

    const { data: newExam, error: exErr } = await supabaseAdmin
      .from("examinations")
      .insert({
        lab_no: labNo,
        patient_id: parseInt(patientId),
        doctor_name: doctorName,
        hospital_id: hospitalId ? parseInt(hospitalId) : null,
        priority: priority || "NORMAL",
        status: "REGISTRASI",
        clinical_notes: clinicalNotes || null,
      })
      .select()
      .single();
    if (exErr) throw exErr;

    if (tests && Array.isArray(tests) && tests.length > 0) {
      const rows = tests.map((t: any) => ({
        examination_id: newExam.id,
        category: t.category || "General",
        test_code: t.testCode || "TEST",
        test_name: t.testName || "Pemeriksaan",
        value: t.value || "-",
        unit: t.unit || "-",
        reference_range: t.referenceRange || "-",
        flag: t.flag || "NORMAL",
        is_duplo: t.isDuplo || false,
        duplo_value: t.duploValue || null,
        duplo_difference: t.duploDifference || null,
      }));
      const { error: detErr } = await supabaseAdmin.from("examination_details").insert(rows);
      if (detErr) throw detErr;
    }

    return NextResponse.json({ success: true, examination: toCamel(newExam) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
