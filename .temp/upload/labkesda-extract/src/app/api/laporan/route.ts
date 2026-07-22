import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { getSession } from "@/lib/auth";

// Laporan agregat khusus Administrator Sistem.
//   type = keuangan  -> rekap pendapatan dari tabel payments
//   type = kunjungan -> volume pasien & pemeriksaan
//   type = tat       -> rekap Turn Around Time & mutu (nilai kritis)
//   type = audit     -> rekap aktivitas dari audit_trails

const RANGE_DAYS: Record<string, number> = { HARIAN: 1, MINGGUAN: 7, BULANAN: 30, TAHUNAN: 365 };

function fmtRp(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
function toNum(v: any) {
  const n = Number(String(v ?? "0").replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

export async function GET(request: NextRequest) {
  try {
    await ensureSeedData();

    // Hanya admin yang boleh mengakses laporan menyeluruh.
    const session = await getSession();
    if (!session || session.role !== "ADMIN_SISTEM") {
      return NextResponse.json({ success: false, error: "Akses ditolak. Hanya Administrator Sistem." }, { status: 403 });
    }

    const type = (request.nextUrl.searchParams.get("type") || "keuangan").toLowerCase();
    const period = (request.nextUrl.searchParams.get("period") || "BULANAN").toUpperCase();
    const days = RANGE_DAYS[period] ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceIso = since.toISOString();

    if (type === "keuangan") {
      const { data: payments, error } = await supabaseAdmin
        .from("payments")
        .select("invoice_no, guarantee_type, total_amount, payment_method, status, processed_by, paid_at")
        .gte("paid_at", sinceIso)
        .order("paid_at", { ascending: false });
      if (error) throw error;

      const rows = payments || [];
      const total = rows.reduce((s: number, p: any) => s + toNum(p.total_amount), 0);
      const lunas = rows.filter((p: any) => p.status === "LUNAS");
      const totalLunas = lunas.reduce((s: number, p: any) => s + toNum(p.total_amount), 0);

      const byMethod: Record<string, number> = {};
      const byGuarantee: Record<string, number> = {};
      rows.forEach((p: any) => {
        byMethod[p.payment_method || "LAINNYA"] = (byMethod[p.payment_method || "LAINNYA"] || 0) + toNum(p.total_amount);
        byGuarantee[p.guarantee_type || "UMUM"] = (byGuarantee[p.guarantee_type || "UMUM"] || 0) + toNum(p.total_amount);
      });

      return NextResponse.json({
        success: true,
        type,
        period,
        summary: [
          { label: "Total Transaksi", value: String(rows.length) },
          { label: "Total Pendapatan", value: fmtRp(total) },
          { label: "Transaksi Lunas", value: String(lunas.length) },
          { label: "Pendapatan Lunas", value: fmtRp(totalLunas) },
        ],
        breakdowns: [
          { title: "Pendapatan per Metode Bayar", items: Object.entries(byMethod).map(([k, v]) => ({ label: k, value: fmtRp(v), raw: v })) },
          { title: "Pendapatan per Penjamin", items: Object.entries(byGuarantee).map(([k, v]) => ({ label: k, value: fmtRp(v), raw: v })) },
        ],
        table: {
          columns: ["No. Invoice", "Penjamin", "Metode", "Status", "Nominal", "Kasir", "Waktu"],
          rows: rows.map((p: any) => [
            p.invoice_no, p.guarantee_type || "-", p.payment_method || "-", p.status || "-",
            fmtRp(toNum(p.total_amount)), p.processed_by || "-",
            p.paid_at ? new Date(p.paid_at).toLocaleString("id-ID") : "-",
          ]),
        },
      });
    }

    if (type === "kunjungan") {
      const { data: exams, error } = await supabaseAdmin
        .from("examinations")
        .select("id, lab_no, priority, source_channel, status, created_at, hospital_id, patient_id, patients!inner(name, guarantee_type), hospitals(name)")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = exams || [];

      const byPriority: Record<string, number> = {};
      const byChannel: Record<string, number> = {};
      const byHospital: Record<string, number> = {};
      const byGuarantee: Record<string, number> = {};
      rows.forEach((e: any) => {
        byPriority[e.priority || "NORMAL"] = (byPriority[e.priority || "NORMAL"] || 0) + 1;
        byChannel[e.source_channel || "LOKET"] = (byChannel[e.source_channel || "LOKET"] || 0) + 1;
        const hosp = e.hospitals?.name || "Mandiri / Umum";
        byHospital[hosp] = (byHospital[hosp] || 0) + 1;
        const g = e.patients?.guarantee_type || "UMUM";
        byGuarantee[g] = (byGuarantee[g] || 0) + 1;
      });
      const uniquePatients = new Set(rows.map((e: any) => e.patient_id)).size;

      return NextResponse.json({
        success: true,
        type,
        period,
        summary: [
          { label: "Total Pemeriksaan", value: String(rows.length) },
          { label: "Pasien Unik", value: String(uniquePatients) },
          { label: "CITO", value: String(byPriority["CITO"] || 0) },
          { label: "Normal", value: String(byPriority["NORMAL"] || 0) },
        ],
        breakdowns: [
          { title: "Per Faskes Perujuk", items: Object.entries(byHospital).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, value: String(v), raw: v })) },
          { title: "Per Kanal Pendaftaran", items: Object.entries(byChannel).map(([k, v]) => ({ label: k, value: String(v), raw: v })) },
          { title: "Per Penjamin", items: Object.entries(byGuarantee).map(([k, v]) => ({ label: k, value: String(v), raw: v })) },
        ],
        table: {
          columns: ["No. Lab", "Pasien", "Prioritas", "Kanal", "Faskes", "Status", "Tanggal"],
          rows: rows.map((e: any) => [
            e.lab_no, e.patients?.name || "-", e.priority || "-", e.source_channel || "-",
            e.hospitals?.name || "Mandiri / Umum", e.status || "-",
            e.created_at ? new Date(e.created_at).toLocaleDateString("id-ID") : "-",
          ]),
        },
      });
    }

    if (type === "tat") {
      const { data: exams, error } = await supabaseAdmin
        .from("examinations")
        .select("id, lab_no, sample_received_at, completed_at, target_tat_minutes, priority")
        .not("completed_at", "is", null)
        .gte("completed_at", sinceIso);
      if (error) throw error;
      const rows = exams || [];

      const tats = rows.map((e: any) => ({
        ...e,
        tat: (new Date(e.completed_at).getTime() - new Date(e.sample_received_at).getTime()) / 60000,
      }));
      const avg = tats.length ? Math.round(tats.reduce((s, e) => s + e.tat, 0) / tats.length) : 0;
      const onTarget = tats.filter((e) => e.tat <= (e.target_tat_minutes || 120)).length;
      const compliance = tats.length ? Math.round((onTarget / tats.length) * 100) : 0;

      const { count: criticalTotal } = await supabaseAdmin
        .from("critical_reports")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceIso);
      const { count: criticalConfirmed } = await supabaseAdmin
        .from("critical_reports")
        .select("id", { count: "exact", head: true })
        .eq("status", "DIKONFIRMASI")
        .gte("created_at", sinceIso);

      return NextResponse.json({
        success: true,
        type,
        period,
        summary: [
          { label: "Pemeriksaan Selesai", value: String(rows.length) },
          { label: "TAT Rata-rata", value: `${avg} mnt` },
          { label: "Kepatuhan Target", value: `${compliance}%` },
          { label: "Nilai Kritis", value: String(criticalTotal ?? 0) },
        ],
        breakdowns: [
          {
            title: "Mutu Pelaporan Nilai Kritis",
            items: [
              { label: "Total nilai kritis", value: String(criticalTotal ?? 0), raw: criticalTotal ?? 0 },
              { label: "Sudah dikonfirmasi", value: String(criticalConfirmed ?? 0), raw: criticalConfirmed ?? 0 },
              { label: "Belum dikonfirmasi", value: String((criticalTotal ?? 0) - (criticalConfirmed ?? 0)), raw: (criticalTotal ?? 0) - (criticalConfirmed ?? 0) },
            ],
          },
        ],
        table: {
          columns: ["No. Lab", "Prioritas", "TAT (menit)", "Target", "Status"],
          rows: tats
            .sort((a, b) => b.tat - a.tat)
            .map((e: any) => [
              e.lab_no, e.priority || "-", String(Math.round(e.tat)),
              String(e.target_tat_minutes || 120),
              e.tat <= (e.target_tat_minutes || 120) ? "Tercapai" : "Terlambat",
            ]),
        },
      });
    }

    if (type === "audit") {
      const { data: logs, error } = await supabaseAdmin
        .from("audit_trails")
        .select("entity_type, action, changed_by, details, patient_rm, created_at")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const rows = logs || [];

      const byAction: Record<string, number> = {};
      const byUser: Record<string, number> = {};
      rows.forEach((l: any) => {
        byAction[l.action || "LAINNYA"] = (byAction[l.action || "LAINNYA"] || 0) + 1;
        byUser[l.changed_by || "Sistem"] = (byUser[l.changed_by || "Sistem"] || 0) + 1;
      });

      return NextResponse.json({
        success: true,
        type,
        period,
        summary: [
          { label: "Total Aktivitas", value: String(rows.length) },
          { label: "Jenis Aksi", value: String(Object.keys(byAction).length) },
          { label: "Pengguna Aktif", value: String(Object.keys(byUser).length) },
        ],
        breakdowns: [
          { title: "Per Jenis Aksi", items: Object.entries(byAction).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, value: String(v), raw: v })) },
          { title: "Per Pengguna", items: Object.entries(byUser).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, value: String(v), raw: v })) },
        ],
        table: {
          columns: ["Waktu", "Entitas", "Aksi", "Oleh", "No. RM", "Keterangan"],
          rows: rows.map((l: any) => [
            l.created_at ? new Date(l.created_at).toLocaleString("id-ID") : "-",
            l.entity_type || "-", l.action || "-", l.changed_by || "-",
            l.patient_rm || "-", l.details || "-",
          ]),
        },
      });
    }

    return NextResponse.json({ success: false, error: "Jenis laporan tidak dikenal." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
