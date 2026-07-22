import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { toCamel } from "@/lib/case";
import { notifyPatient } from "@/lib/push";

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
    const invoiceNo = `INV-${y}${m}${d}-${rand}`;

    const { data: payment, error: payErr } = await supabaseAdmin
      .from("payments")
      .insert({
        examination_id: examId,
        invoice_no: invoiceNo,
        guarantee_type: body.guaranteeType || "UMUM",
        total_amount: body.totalAmount || "0",
        payment_method: body.paymentMethod || "TUNAI",
        status: "LUNAS",
        processed_by: session?.fullName || "Kasir",
        paid_at: now.toISOString(),
      })
      .select()
      .single();
    if (payErr) throw payErr;

    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const rows = body.items.map((item: any) => ({
        payment_id: payment.id,
        tariff_id: item.tariffId || null,
        test_name: item.testName,
        price: String(item.price),
      }));
      const { error: itemErr } = await supabaseAdmin.from("payment_items").insert(rows);
      if (itemErr) throw itemErr;
    }

    const { error: updErr } = await supabaseAdmin
      .from("examinations")
      .update({ payment_gate_status: "LOLOS" })
      .eq("id", examId);
    if (updErr) throw updErr;

    // Notifikasi ke aplikasi pasien: cari NIK pasien dari pemeriksaan ini
    const { data: exam } = await supabaseAdmin
      .from("examinations")
      .select("lab_no, queue_no, patients(nik)")
      .eq("id", examId)
      .maybeSingle();
    const nik = (exam as any)?.patients?.nik;
    if (nik) {
      await notifyPatient({
        nik,
        title: "Pembayaran Lunas",
        body: `Pembayaran untuk ${exam?.lab_no} telah diterima (${invoiceNo}). Silakan lanjut ke pengambilan sampel.`,
        type: "PEMBAYARAN",
        referenceId: examId,
      });
    }

    return NextResponse.json({ success: true, payment: toCamel(payment), message: `Pembayaran lunas! Invoice: ${invoiceNo}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
