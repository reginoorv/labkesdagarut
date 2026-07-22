import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";

export async function GET(req: Request, { params }: { params: Promise<{ examinationId: string }> }) {
  try {
    await ensureSeedData();
    const { examinationId } = await params;
    const examId = parseInt(examinationId);

    const { data: exam, error: exErr } = await supabaseAdmin
      .from("examinations")
      .select("*")
      .eq("id", examId)
      .maybeSingle();
    if (exErr) throw exErr;
    if (!exam) return NextResponse.json({ success: false, error: "Pemeriksaan tidak ditemukan" }, { status: 404 });

    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("id", exam.patient_id)
      .maybeSingle();

    const { data: details } = await supabaseAdmin
      .from("examination_details")
      .select("*")
      .eq("examination_id", examId);

    const { data: allTariffs } = await supabaseAdmin
      .from("tariffs")
      .select("*")
      .eq("is_active", true);

    const tariffs = allTariffs || [];

    // Match details to tariffs by code/category
    const items = (details || []).map((d: any) => {
      const tariff =
        tariffs.find((t: any) => t.test_code === d.test_code) ||
        tariffs.find((t: any) => t.category === d.category);
      return {
        testName: d.test_name,
        category: d.category,
        price: tariff ? parseFloat(tariff.price) : 25000,
        tariffId: tariff?.id || null,
      };
    });

    // If no details yet, estimate from category
    if (items.length === 0) {
      items.push({ testName: "Pemeriksaan Umum (estimasi)", category: "Hematologi", price: 75000, tariffId: null });
    }

    const totalAmount = items.reduce((sum, i) => sum + i.price, 0);

    const { data: existingPayment } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("examination_id", examId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      exam: toCamel(exam),
      patient: toCamel(patient),
      items,
      totalAmount,
      existingPayment: existingPayment ? toCamel(existingPayment) : null,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
