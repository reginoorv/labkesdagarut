import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";

export async function GET(req: Request) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";

    const { data: examRows, error: examErr } = await supabaseAdmin
      .from("examinations")
      .select(
        `id, lab_no, queue_no, priority, payment_gate_status, status, created_at,
         patients!inner ( name, rm_no, guarantee_type )`
      )
      .order("id", { ascending: false });
    if (examErr) throw examErr;

    let exams = (examRows || []).map((e: any) => ({
      id: e.id,
      labNo: e.lab_no,
      queueNo: e.queue_no,
      patientName: e.patients?.name,
      patientRm: e.patients?.rm_no,
      guaranteeType: e.patients?.guarantee_type,
      priority: e.priority,
      paymentGateStatus: e.payment_gate_status,
      status: e.status,
      createdAt: e.created_at,
    }));

    if (status === "MENUNGGU_PEMBAYARAN") {
      exams = exams.filter((e) => e.paymentGateStatus === "MENUNGGU_PEMBAYARAN");
    } else if (status === "LOLOS") {
      exams = exams.filter((e) => e.paymentGateStatus === "LOLOS");
    }

    // Ambil info pembayaran per exam
    const { data: allPayments, error: payErr } = await supabaseAdmin.from("payments").select("*");
    if (payErr) throw payErr;

    const paymentMap = new Map<number, any>();
    (allPayments || []).forEach((p: any) => paymentMap.set(p.examination_id, p));

    const result = exams.map((e) => ({
      ...e,
      payment: paymentMap.has(e.id) ? toCamel(paymentMap.get(e.id)) : null,
    }));

    return NextResponse.json({ success: true, items: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
