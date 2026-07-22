import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";

// Dashboard operasional. Semua angka dihitung dari data nyata (tanpa nilai palsu),
// supaya sinkron dengan halaman lain (pemeriksaan, validasi, pendaftaran online).
export async function GET() {
  try {
    await ensureSeedData();

    // Batas awal hari ini (waktu server).
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // 1. Total pasien terdaftar HARI INI (berdasarkan created_at).
    const { count: totalPatientsToday } = await supabaseAdmin
      .from("patients")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfToday);

    // Total pasien keseluruhan (kumulatif) sebagai konteks tambahan.
    const { count: totalPatientsAll } = await supabaseAdmin
      .from("patients")
      .select("id", { count: "exact", head: true });

    // 2. Pending validasi: sudah SELESAI tapi belum divalidasi PJ Lab.
    const { count: pendingValidationCount } = await supabaseAdmin
      .from("examinations")
      .select("id", { count: "exact", head: true })
      .eq("status", "SELESAI")
      .is("validated_at", null);

    // 3. Nilai kritis belum dikonfirmasi (butuh tindak lanjut).
    const { count: criticalCount } = await supabaseAdmin
      .from("critical_reports")
      .select("id", { count: "exact", head: true })
      .neq("status", "DIKONFIRMASI");

    // 4. Pendaftaran online menunggu verifikasi loket.
    const { count: pendingOnlineCount } = await supabaseAdmin
      .from("online_registrations")
      .select("id", { count: "exact", head: true })
      .eq("status", "MENUNGGU_VERIFIKASI");

    // 5. TAT rata-rata (menit) dari pemeriksaan yang sudah selesai.
    const { data: completedExams } = await supabaseAdmin
      .from("examinations")
      .select("sample_received_at, completed_at")
      .not("completed_at", "is", null);

    let avgTatMinutes = 0;
    if (completedExams && completedExams.length > 0) {
      const totalMin = completedExams.reduce((sum: number, e: any) => {
        const diff = new Date(e.completed_at).getTime() - new Date(e.sample_received_at).getTime();
        return sum + diff / 60000;
      }, 0);
      avgTatMinutes = Math.round(totalMin / completedExams.length);
    }

    // 6. Pie: Duplo vs Non-Duplo (angka nyata; kosong bila belum ada data).
    const { count: duploCount } = await supabaseAdmin
      .from("examination_details")
      .select("id", { count: "exact", head: true })
      .eq("is_duplo", true);

    const { count: totalDetails } = await supabaseAdmin
      .from("examination_details")
      .select("id", { count: "exact", head: true });

    const duploVal = duploCount ?? 0;
    const nonDuploCount = Math.max(0, (totalDetails ?? 0) - duploVal);

    const pieData = [
      { name: "Pemeriksaan Duplo", value: duploVal, fill: "#3B7DD8" },
      { name: "Non Duplo", value: nonDuploCount, fill: "#0F6E5A" },
    ];

    // 7. Bar: jumlah pemeriksaan per status (angka nyata apa adanya).
    const { data: statusRows } = await supabaseAdmin.from("examinations").select("status");
    const statusMap: Record<string, number> = { REGISTRASI: 0, PROSES: 0, SELESAI: 0, VALIDA: 0 };
    (statusRows || []).forEach((r: any) => {
      if (r.status in statusMap) statusMap[r.status] += 1;
    });

    const barData = [
      { status: "Registrasi", count: statusMap.REGISTRASI, color: "#3B7DD8" },
      { status: "Proses Lab", count: statusMap.PROSES, color: "#E8A33D" },
      { status: "Selesai (Blm Validasi)", count: statusMap.SELESAI, color: "#D64545" },
      { status: "Tervalidasi", count: statusMap.VALIDA, color: "#1B8A5A" },
    ];

    // 8. Widget CITO: sampel prioritas yang masih aktif (belum tervalidasi).
    const { data: citoRows } = await supabaseAdmin
      .from("examinations")
      .select(
        `id, lab_no, doctor_name, status, sample_received_at, clinical_notes,
         patients!inner ( name, rm_no )`
      )
      .eq("priority", "CITO")
      .neq("status", "VALIDA")
      .order("created_at", { ascending: false })
      .limit(6);

    const citoPatients = (citoRows || []).map((e: any) => ({
      id: e.id,
      labNo: e.lab_no,
      patientName: e.patients?.name,
      rmNo: e.patients?.rm_no,
      doctorName: e.doctor_name,
      status: e.status,
      sampleReceivedAt: e.sample_received_at,
      clinicalNotes: e.clinical_notes,
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalPatientsToday: totalPatientsToday ?? 0,
        totalPatientsAll: totalPatientsAll ?? 0,
        avgTatMinutes,
        criticalCount: criticalCount ?? 0,
        pendingValidationCount: pendingValidationCount ?? 0,
        pendingOnlineCount: pendingOnlineCount ?? 0,
      },
      pieData,
      barData,
      citoPatients,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
