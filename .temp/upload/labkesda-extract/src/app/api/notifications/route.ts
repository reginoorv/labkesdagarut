import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { ensureSeedData } from "@/db/seed";

// Notifikasi sistem LIS per-role, diturunkan dari data nyata.
// Setiap role hanya melihat notifikasi yang relevan dengan tugasnya.
//   PETUGAS_LOKET : pendaftaran online menunggu verifikasi
//   KASIR         : pasien menunggu pembayaran / verifikasi jaminan
//   ANALIS_LAB    : sampel siap diproses + nilai kritis baru
//   PJ_LAB        : hasil menunggu validasi + nilai kritis belum dikonfirmasi
//   ADMIN_SISTEM  : gabungan semua di atas
export async function GET() {
  try {
    await ensureSeedData();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, notifications: [] }, { status: 401 });
    }

    const role = session.role;
    const isAdmin = role === "ADMIN_SISTEM";
    const notifications: Array<{
      id: string;
      title: string;
      desc: string;
      type: "critical" | "warning" | "info";
      href: string;
      count: number;
    }> = [];

    // — Pendaftaran online menunggu verifikasi (Loket / Admin) —
    if (isAdmin || role === "PETUGAS_LOKET") {
      const { data: rows } = await supabaseAdmin
        .from("online_registrations")
        .select("name, booking_code")
        .eq("status", "MENUNGGU_VERIFIKASI")
        .order("created_at", { ascending: false });
      const list = rows || [];
      if (list.length > 0) {
        notifications.push({
          id: "online-pending",
          title: `${list.length} Pendaftaran Online Menunggu`,
          desc: `Terbaru: ${list[0].name} (${list[0].booking_code}). Perlu verifikasi loket.`,
          type: "warning",
          href: "/registrasi/pendaftaran-online",
          count: list.length,
        });
      }
    }

    // — Pasien menunggu pembayaran (Kasir / Admin) —
    if (isAdmin || role === "KASIR") {
      const { data: rows } = await supabaseAdmin
        .from("examinations")
        .select("lab_no, priority, payment_gate_status, patients!inner(name)")
        .eq("payment_gate_status", "MENUNGGU_PEMBAYARAN")
        .order("created_at", { ascending: false });
      const list = rows || [];
      if (list.length > 0) {
        const cito = list.filter((e: any) => e.priority === "CITO").length;
        notifications.push({
          id: "kasir-pending",
          title: `${list.length} Pasien Menunggu Pembayaran`,
          desc: `${(list[0] as any).patients?.name || "-"} (${list[0].lab_no})${cito ? ` • ${cito} CITO` : ""}.`,
          type: cito > 0 ? "warning" : "info",
          href: "/kasir/pembayaran",
          count: list.length,
        });
      }
    }

    // — Sampel siap diproses analis (Analis / Admin) —
    if (isAdmin || role === "ANALIS_LAB") {
      const { data: rows } = await supabaseAdmin
        .from("examinations")
        .select("lab_no, status, payment_gate_status, patients!inner(name)")
        .eq("payment_gate_status", "LOLOS")
        .in("status", ["REGISTRASI", "PROSES"])
        .order("created_at", { ascending: false });
      const list = rows || [];
      if (list.length > 0) {
        notifications.push({
          id: "analis-worklist",
          title: `${list.length} Sampel Siap Diproses`,
          desc: `${(list[0] as any).patients?.name || "-"} (${list[0].lab_no}) menunggu input hasil.`,
          type: "info",
          href: "/pemeriksaan",
          count: list.length,
        });
      }
    }

    // — Hasil menunggu validasi (PJ Lab / Admin) —
    if (isAdmin || role === "PJ_LAB") {
      const { data: rows } = await supabaseAdmin
        .from("examinations")
        .select("lab_no, status, validated_at, patients!inner(name)")
        .eq("status", "SELESAI")
        .is("validated_at", null)
        .order("completed_at", { ascending: false });
      const list = rows || [];
      if (list.length > 0) {
        notifications.push({
          id: "validasi-pending",
          title: `${list.length} Hasil Menunggu Validasi`,
          desc: `${(list[0] as any).patients?.name || "-"} (${list[0].lab_no}) siap divalidasi.`,
          type: "warning",
          href: "/pemeriksaan/validasi",
          count: list.length,
        });
      }
    }

    // — Nilai kritis belum dikonfirmasi (Analis / PJ Lab / Admin) —
    if (isAdmin || role === "ANALIS_LAB" || role === "PJ_LAB") {
      const { data: rows } = await supabaseAdmin
        .from("critical_reports")
        .select("patient_name, parameter_name, critical_value, status")
        .neq("status", "DIKONFIRMASI")
        .order("created_at", { ascending: false });
      const list = rows || [];
      if (list.length > 0) {
        notifications.push({
          id: "critical-pending",
          title: `${list.length} Nilai Kritis Perlu Tindak Lanjut`,
          desc: `${list[0].patient_name} — ${list[0].parameter_name}: ${list[0].critical_value}.`,
          type: "critical",
          href: "/pemeriksaan/nilai-kritis",
          count: list.length,
        });
      }
    }

    // Notifikasi kritis tampil paling atas.
    const order = { critical: 0, warning: 1, info: 2 } as const;
    notifications.sort((a, b) => order[a.type] - order[b.type]);

    return NextResponse.json({ authenticated: true, notifications });
  } catch (error: any) {
    return NextResponse.json({ authenticated: true, notifications: [], error: error.message });
  }
}
