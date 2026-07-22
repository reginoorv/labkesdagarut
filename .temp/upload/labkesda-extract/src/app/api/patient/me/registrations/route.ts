import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";
import { getPatientFromRequest } from "@/lib/patient-auth";

// GET /api/patient/me/registrations
// Daftar pendaftaran online milik pasien yang sedang login (berdasarkan NIK akun).
// Termasuk status tracking: pendaftaran -> verifikasi -> pemeriksaan terkait.
export async function GET(req: Request) {
  try {
    await ensureSeedData();
    const me = await getPatientFromRequest(req);
    if (!me) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: regs, error } = await supabaseAdmin
      .from("online_registrations")
      .select("*")
      .eq("nik", me.nik)
      .order("id", { ascending: false });
    if (error) throw error;

    // Kumpulkan examination terkait (untuk status lab & nomor antrian) by NIK pasien
    const { data: exams } = await supabaseAdmin
      .from("examinations")
      .select("id, lab_no, queue_no, status, payment_gate_status, created_at, patients!inner(nik)")
      .eq("patients.nik", me.nik)
      .order("id", { ascending: false });

    return NextResponse.json({
      success: true,
      registrations: toCamel(regs || []),
      examinations: toCamel(exams || []),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
