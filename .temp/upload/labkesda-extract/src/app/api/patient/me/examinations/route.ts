import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";
import { getPatientFromRequest } from "@/lib/patient-auth";

// GET /api/patient/me/examinations
// Riwayat pemeriksaan pasien login + detail hasil (parameter, nilai, flag).
// Hasil lengkap hanya untuk pemeriksaan berstatus VALIDA (sudah divalidasi PJ Lab),
// selaras dengan aturan /cek-hasil publik.
export async function GET(req: Request) {
  try {
    await ensureSeedData();
    const me = await getPatientFromRequest(req);
    if (!me) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("id");

    // Detail satu pemeriksaan + hasil
    if (examId) {
      const { data: exam, error: exErr } = await supabaseAdmin
        .from("examinations")
        .select("*, patients!inner(nik)")
        .eq("id", parseInt(examId))
        .eq("patients.nik", me.nik)
        .maybeSingle();
      if (exErr) throw exErr;
      if (!exam) {
        return NextResponse.json({ success: false, error: "Pemeriksaan tidak ditemukan." }, { status: 404 });
      }

      let details: any[] = [];
      if (exam.status === "VALIDA") {
        const { data } = await supabaseAdmin
          .from("examination_details")
          .select("*")
          .eq("examination_id", exam.id)
          .order("id", { ascending: true });
        details = data || [];
      }

      return NextResponse.json({
        success: true,
        examination: toCamel(exam),
        details: toCamel(details),
        resultVisible: exam.status === "VALIDA",
      });
    }

    // List riwayat
    const { data: exams, error } = await supabaseAdmin
      .from("examinations")
      .select("id, lab_no, queue_no, priority, status, payment_gate_status, completed_at, validated_at, created_at, patients!inner(name, nik)")
      .eq("patients.nik", me.nik)
      .order("id", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ success: true, examinations: toCamel(exams || []) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
