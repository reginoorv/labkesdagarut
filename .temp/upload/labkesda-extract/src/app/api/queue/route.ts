import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";

// Papan antrian hari ini. Setiap examination yang punya queue_no ditampilkan
// beserta "stage" turunannya:
//   - MENUNGGU_BAYAR : payment_gate_status = MENUNGGU_PEMBAYARAN
//   - DI_LAB         : sudah LOLOS, status REGISTRASI/PROSES
//   - SELESAI        : status SELESAI/VALIDA
export async function GET() {
  try {
    await ensureSeedData();

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

    const { data: rows, error } = await supabaseAdmin
      .from("examinations")
      .select(
        `id, lab_no, queue_no, queue_channel, priority, status, payment_gate_status,
         created_at, patients!inner ( name, rm_no )`
      )
      .not("queue_no", "is", null)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true });
    if (error) throw error;

    const stageOf = (e: any): "MENUNGGU_BAYAR" | "DI_LAB" | "SELESAI" => {
      if (e.status === "SELESAI" || e.status === "VALIDA") return "SELESAI";
      if (e.payment_gate_status === "LOLOS") return "DI_LAB";
      return "MENUNGGU_BAYAR";
    };

    const items = (rows || []).map((e: any) => ({
      id: e.id,
      queueNo: e.queue_no,
      queueChannel: e.queue_channel,
      labNo: e.lab_no,
      patientName: e.patients?.name,
      patientRm: e.patients?.rm_no,
      priority: e.priority,
      status: e.status,
      paymentGateStatus: e.payment_gate_status,
      stage: stageOf(e),
      createdAt: e.created_at,
    }));

    // Urut: CITO dulu, lalu urutan kedatangan.
    items.sort((a, b) => {
      if (a.priority === "CITO" && b.priority !== "CITO") return -1;
      if (a.priority !== "CITO" && b.priority === "CITO") return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const summary = {
      menungguBayar: items.filter((i) => i.stage === "MENUNGGU_BAYAR").length,
      diLab: items.filter((i) => i.stage === "DI_LAB").length,
      selesai: items.filter((i) => i.stage === "SELESAI").length,
      total: items.length,
    };

    return NextResponse.json({ success: true, items, summary });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
