import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { notifyPatient } from "@/lib/push";

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { examinationIds, validatorName } = body;

    if (!examinationIds || !Array.isArray(examinationIds) || examinationIds.length === 0) {
      return NextResponse.json({ success: false, error: "Pilih minimal satu sampel untuk divalidasi" }, { status: 400 });
    }

    const valName = validatorName || "Apoteker / Analis Sp.PK";
    const now = new Date().toISOString();

    // Guard: hanya sampel berstatus SELESAI (hasil sudah diinput analis) yang
    // boleh divalidasi. Tolak bila ada yang masih REGISTRASI/PROSES/sudah VALIDA.
    const { data: targets, error: chkErr } = await supabaseAdmin
      .from("examinations")
      .select("id, lab_no, status")
      .in("id", examinationIds);
    if (chkErr) throw chkErr;

    const notReady = (targets || []).filter((e: any) => e.status !== "SELESAI");
    if (notReady.length > 0) {
      const labels = notReady.map((e: any) => `${e.lab_no} (${e.status})`).join(", ");
      return NextResponse.json(
        {
          success: false,
          error: `Tidak dapat memvalidasi: ${notReady.length} sampel belum berstatus SELESAI — ${labels}. Analis harus menyelesaikan input hasil terlebih dahulu.`,
        },
        { status: 409 }
      );
    }

    const { error: updErr } = await supabaseAdmin
      .from("examinations")
      .update({
        status: "VALIDA",
        validated_at: now,
        validator_name: valName,
      })
      .in("id", examinationIds)
      .eq("status", "SELESAI");
    if (updErr) throw updErr;

    // Write audit trail entry
    const { error: auditErr } = await supabaseAdmin.from("audit_trails").insert({
      entity_type: "VALIDASI",
      action: "VALIDATE_MASS",
      changed_by: valName,
      details: `Melakukan validasi hasil untuk ${examinationIds.length} sampel pemeriksaan ID: ${examinationIds.join(", ")}`,
    });
    if (auditErr) throw auditErr;

    // Notifikasi ke aplikasi pasien untuk setiap pemeriksaan yang divalidasi
    const { data: validated } = await supabaseAdmin
      .from("examinations")
      .select("id, lab_no, patients(nik)")
      .in("id", examinationIds);
    for (const exam of validated || []) {
      const nik = (exam as any)?.patients?.nik;
      if (nik) {
        await notifyPatient({
          nik,
          title: "Hasil Lab Tersedia",
          body: `Hasil pemeriksaan ${exam.lab_no} Anda sudah tervalidasi dan dapat dilihat.`,
          type: "HASIL",
          referenceId: exam.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      validatedCount: examinationIds.length,
      message: `${examinationIds.length} pemeriksaan laboratorium berhasil divalidasi!`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
