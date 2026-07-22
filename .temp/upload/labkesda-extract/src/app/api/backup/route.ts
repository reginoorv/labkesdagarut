import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";

export async function GET() {
  try {
    await ensureSeedData();
    const { data: logs, error: logErr } = await supabaseAdmin
      .from("backup_logs")
      .select("*")
      .order("id", { ascending: false });
    if (logErr) throw logErr;

    const { data: settingsRow, error: setErr } = await supabaseAdmin
      .from("backup_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (setErr) throw setErr;

    const settings = settingsRow
      ? toCamel(settingsRow)
      : {
          autoBackupEnabled: true,
          scheduleFrequency: "HARIAN",
          scheduleTime: "23:00",
          retentionDays: 30,
          destinationFolder: "/var/backups/labkesda_garut",
        };

    return NextResponse.json({ success: true, logs: toCamel(logs), settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Ekspor data nyata. Aplikasi ini memakai Supabase (PostgreSQL cloud),
// sehingga dump .sql langsung dari dalam app tidak memungkinkan. Sebagai
// gantinya kita ekspor seluruh tabel penting ke satu berkas JSON yang bisa
// diunduh & diarsipkan. Berkas dikembalikan ke klien untuk di-download.
const EXPORT_TABLES = [
  "hospitals", "patients", "examinations", "examination_details",
  "critical_reports", "tariffs", "payments", "payment_items",
  "online_registrations", "audit_trails", "users",
];

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json().catch(() => ({}));
    const { createdBy } = body;

    const startedAt = Date.now();
    const dump: Record<string, any[]> = {};
    let totalRows = 0;

    for (const table of EXPORT_TABLES) {
      const { data: rows, error } = await supabaseAdmin.from(table).select("*");
      if (error) throw error;
      // Jangan ekspor hash password.
      const cleaned = table === "users"
        ? (rows || []).map(({ password_hash, ...rest }: any) => rest)
        : (rows || []);
      dump[table] = cleaned;
      totalRows += cleaned.length;
    }

    const exportObj = {
      meta: {
        app: "LIS Labkesda Garut",
        generatedAt: new Date().toISOString(),
        totalRows,
        tables: EXPORT_TABLES,
      },
      data: dump,
    };

    const json = JSON.stringify(exportObj, null, 2);
    const bytes = Buffer.byteLength(json, "utf8");
    const fileSizeMb = (bytes / (1024 * 1024)).toFixed(2);
    const durationSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

    const dateStr = new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14);
    const filename = `backup_labkesda_${dateStr}.json`;

    const { data, error } = await supabaseAdmin
      .from("backup_logs")
      .insert({
        backup_type: "MANUAL",
        status: "SUKSES",
        filename,
        file_size_mb: fileSizeMb,
        duration_seconds: durationSeconds,
        created_by: createdBy || "Administrator Sistem",
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      log: toCamel(data),
      filename,
      // Konten dikirim ke klien agar bisa diunduh sebagai berkas.
      content: json,
      message: `Ekspor '${filename}' berhasil: ${totalRows} baris dari ${EXPORT_TABLES.length} tabel (${fileSizeMb} MB).`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { autoBackupEnabled, scheduleFrequency, scheduleTime, retentionDays, destinationFolder } = body;

    const { data: existing } = await supabaseAdmin
      .from("backup_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("backup_settings")
        .update({
          auto_backup_enabled: autoBackupEnabled,
          schedule_frequency: scheduleFrequency,
          schedule_time: scheduleTime,
          retention_days: parseInt(retentionDays) || 30,
          destination_folder: destinationFolder,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, settings: toCamel(data) });
    } else {
      const { data, error } = await supabaseAdmin
        .from("backup_settings")
        .insert({
          auto_backup_enabled: autoBackupEnabled,
          schedule_frequency: scheduleFrequency,
          schedule_time: scheduleTime,
          retention_days: parseInt(retentionDays) || 30,
          destination_folder: destinationFolder || "/var/backups/labkesda_garut",
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, settings: toCamel(data) });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
