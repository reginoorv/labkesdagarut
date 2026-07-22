import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";

// Rentang hari berdasarkan periode yang dipilih di UI.
const RANGE_DAYS: Record<string, number> = {
  HARIAN: 1,
  MINGGUAN: 7,
  BULANAN: 30,
};

const DAY_LABELS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function tatMinutes(received: string, completed: string): number {
  return (new Date(completed).getTime() - new Date(received).getTime()) / 60000;
}

export async function GET(request: NextRequest) {
  try {
    await ensureSeedData();

    const period = (request.nextUrl.searchParams.get("period") || "MINGGUAN").toUpperCase();
    const days = RANGE_DAYS[period] ?? 7;

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceIso = since.toISOString();

    // Ambil semua pemeriksaan yang sudah selesai dalam rentang periode.
    const { data: exams, error: examErr } = await supabaseAdmin
      .from("examinations")
      .select("id, sample_received_at, completed_at, target_tat_minutes")
      .not("completed_at", "is", null)
      .gte("completed_at", sinceIso);

    if (examErr) throw examErr;

    const examList = exams || [];
    const examIds = examList.map((e: any) => e.id);

    // Peta TAT & target per examination.
    const tatById = new Map<number, { tat: number; target: number }>();
    for (const e of examList) {
      tatById.set(e.id, {
        tat: tatMinutes(e.sample_received_at, e.completed_at),
        target: e.target_tat_minutes ?? 120,
      });
    }

    // Ambil detail (kategori) untuk exam-exam tersebut.
    let details: any[] = [];
    if (examIds.length > 0) {
      const { data: detailRows, error: detailErr } = await supabaseAdmin
        .from("examination_details")
        .select("examination_id, category")
        .in("examination_id", examIds);
      if (detailErr) throw detailErr;
      details = detailRows || [];
    }

    // === Tren TAT harian (rata-rata per hari, dalam rentang periode) ===
    const perDay = new Map<string, { sum: number; n: number; targetSum: number; label: string }>();
    for (const e of examList) {
      const d = new Date(e.completed_at);
      const key = d.toISOString().split("T")[0];
      const t = tatById.get(e.id)!;
      const cur = perDay.get(key) || { sum: 0, n: 0, targetSum: 0, label: DAY_LABELS[d.getDay()] };
      cur.sum += t.tat;
      cur.n += 1;
      cur.targetSum += t.target;
      perDay.set(key, cur);
    }

    const trend = Array.from(perDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        day: v.label,
        tat: Math.round(v.sum / v.n),
        target: Math.round(v.targetSum / v.n),
      }));

    // === Breakdown per kategori ===
    // Satu kategori bisa dimiliki banyak exam. Kumpulkan TAT unik per exam per kategori.
    const perCategory = new Map<string, Map<number, { tat: number; target: number }>>();
    for (const row of details) {
      const t = tatById.get(row.examination_id);
      if (!t) continue;
      if (!perCategory.has(row.category)) perCategory.set(row.category, new Map());
      perCategory.get(row.category)!.set(row.examination_id, t);
    }

    const categoryBreakdown = Array.from(perCategory.entries())
      .map(([category, examMap]) => {
        const vals = Array.from(examMap.values());
        const count = vals.length;
        const avgTat = Math.round(vals.reduce((s, v) => s + v.tat, 0) / count);
        const compliant = vals.filter((v) => v.tat <= v.target).length;
        const compliancePct = (compliant / count) * 100;
        return {
          category,
          count,
          avgTat,
          compliance: compliancePct.toFixed(1) + "%",
          compliant: compliancePct >= 90,
        };
      })
      .sort((a, b) => b.count - a.count);

    // === Statistik keseluruhan ===
    const allTats = Array.from(tatById.values());
    const overallAvgTat =
      allTats.length > 0 ? Math.round(allTats.reduce((s, v) => s + v.tat, 0) / allTats.length) : 0;
    const overallCompliant = allTats.filter((v) => v.tat <= v.target).length;
    const overallCompliance =
      allTats.length > 0 ? ((overallCompliant / allTats.length) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      success: true,
      period,
      trend,
      categoryBreakdown,
      summary: {
        totalCompleted: allTats.length,
        overallAvgTat,
        overallCompliance: overallCompliance + "%",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
