import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";

export async function GET() {
  try {
    await ensureSeedData();
    const { data, error } = await supabaseAdmin.from("critical_reports").select("*").order("id", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, reports: toCamel(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const {
      examinationId,
      patientName,
      labNo,
      parameterName,
      criticalValue,
      reportedBy,
      reportedTo,
      doctorPhone,
      status,
      notes,
    } = body;

    if (!patientName || !parameterName || !criticalValue) {
      return NextResponse.json({ success: false, error: "Data nilai kritis belum lengkap" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("critical_reports")
      .insert({
        examination_id: examinationId || 1,
        patient_name: patientName,
        lab_no: labNo || "LAB-MANUAL",
        parameter_name: parameterName,
        critical_value: criticalValue,
        reported_by: reportedBy || "Analis Jaga",
        reported_to: reportedTo || "Dokter Pengirim",
        doctor_phone: doctorPhone || null,
        response_time_minutes: 3,
        status: status || "SUDAH_DILAPORKAN",
        notes: notes || null,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, report: toCamel(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { id, status, reportedTo, notes, responseTimeMinutes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Report ID required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { status };
    if (reportedTo) updates.reported_to = reportedTo;
    if (notes) updates.notes = notes;
    if (responseTimeMinutes) updates.response_time_minutes = responseTimeMinutes;

    const { data, error } = await supabaseAdmin
      .from("critical_reports")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, report: toCamel(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
