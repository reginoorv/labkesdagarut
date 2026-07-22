import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { toCamel } from "@/lib/case";

export async function POST(req: Request, { params }: { params: Promise<{ examinationId: string }> }) {
  try {
    const session = await getSession();
    const { examinationId } = await params;
    const examId = parseInt(examinationId);
    const body = await req.json();

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const rand = String(Math.floor(1000 + Math.random() * 9000));
    const invoiceNo = `VRF-${y}${m}${d}-${rand}`;

    const { data: payment, error: payErr } = await supabaseAdmin
      .from("payments")
      .insert({
        examination_id: examId,
        invoice_no: invoiceNo,
        guarantee_type: body.guaranteeType || "BPJS",
        total_amount: body.totalAmount || "0",
        payment_method: "GRATIS_PROGRAM",
        status: "GRATIS_TERVERIFIKASI",
        eligibility_note: body.eligibilityNote || "",
        processed_by: session?.fullName || "Kasir",
        paid_at: now.toISOString(),
      })
      .select()
      .single();
    if (payErr) throw payErr;

    const { error: updErr } = await supabaseAdmin
      .from("examinations")
      .update({ payment_gate_status: "LOLOS" })
      .eq("id", examId);
    if (updErr) throw updErr;

    return NextResponse.json({ success: true, payment: toCamel(payment), message: `Eligibilitas terverifikasi! Ref: ${invoiceNo}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
