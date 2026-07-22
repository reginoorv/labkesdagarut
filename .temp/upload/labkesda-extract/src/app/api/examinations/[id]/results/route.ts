import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";
import { computeFlag } from "@/lib/test-catalog";

// Input hasil oleh analis.
//   action = "start"    -> mulai proses (REGISTRASI -> PROSES), butuh pembayaran LOLOS
//   action = "save"     -> simpan nilai parameter + auto-flag (draf, status -> PROSES)
//   action = "complete" -> selesaikan (PROSES -> SELESAI), set completed_at
//   action = "submit"   -> simpan nilai + langsung selesaikan (REGISTRASI/PROSES -> SELESAI)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;
    const examId = parseInt(id);
    if (!examId || isNaN(examId)) {
      return NextResponse.json({ success: false, error: "ID pemeriksaan tidak valid" }, { status: 400 });
    }

    const body = await req.json();
    const { action, details, analystName } = body;
    const analyst = analystName || "Analis Laboratorium";

    // Ambil examination + patient untuk validasi gate & audit.
    const { data: exam, error: exErr } = await supabaseAdmin
      .from("examinations")
      .select("id, lab_no, status, payment_gate_status, patient_id, patients ( name, rm_no )")
      .eq("id", examId)
      .single();
    if (exErr || !exam) {
      return NextResponse.json({ success: false, error: "Pemeriksaan tidak ditemukan" }, { status: 404 });
    }

    const patient: any = Array.isArray(exam.patients) ? exam.patients[0] : exam.patients;

    // Gate pembayaran: input hasil hanya boleh setelah pembayaran/eligibilitas LOLOS.
    if ((action === "start" || action === "save" || action === "complete") && exam.payment_gate_status !== "LOLOS") {
      return NextResponse.json(
        { success: false, error: "Menunggu pembayaran/verifikasi kasir sebelum hasil dapat diinput." },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();

    if (action === "start") {
      if (exam.status !== "REGISTRASI") {
        return NextResponse.json({ success: false, error: `Status saat ini "${exam.status}", tidak dapat dimulai.` }, { status: 409 });
      }
      const { error } = await supabaseAdmin.from("examinations").update({ status: "PROSES" }).eq("id", examId);
      if (error) throw error;

      await supabaseAdmin.from("audit_trails").insert({
        patient_id: exam.patient_id,
        patient_rm: patient?.rm_no || null,
        entity_type: "PEMERIKSAAN",
        action: "START_PROCESS",
        changed_by: analyst,
        details: `Memulai proses pemeriksaan ${exam.lab_no}`,
      });

      return NextResponse.json({ success: true, status: "PROSES", message: "Pemeriksaan dimulai." });
    }

    if (action === "save") {
      if (!Array.isArray(details)) {
        return NextResponse.json({ success: false, error: "Data hasil tidak valid" }, { status: 400 });
      }

      // Update tiap parameter + hitung flag otomatis.
      let criticalCount = 0;
      for (const d of details) {
        if (!d.id) continue;
        const value = d.value ?? "";
        const referenceRange = d.referenceRange ?? "";
        const flag = computeFlag(String(value), String(referenceRange), d.testCode);
        if (flag === "CRITICAL") criticalCount++;

        const { error } = await supabaseAdmin
          .from("examination_details")
          .update({
            value: value === "" ? null : String(value),
            flag,
            updated_at: nowIso,
          })
          .eq("id", d.id)
          .eq("examination_id", examId); // pastikan detail milik exam ini
        if (error) throw error;
      }

      // Naikkan status ke PROSES bila masih REGISTRASI (analis langsung mengisi).
      if (exam.status === "REGISTRASI") {
        await supabaseAdmin.from("examinations").update({ status: "PROSES" }).eq("id", examId);
      }

      await supabaseAdmin.from("audit_trails").insert({
        patient_id: exam.patient_id,
        patient_rm: patient?.rm_no || null,
        entity_type: "PEMERIKSAAN",
        action: "SAVE_RESULT",
        changed_by: analyst,
        details: `Menyimpan ${details.length} hasil parameter untuk ${exam.lab_no}${criticalCount ? ` (${criticalCount} nilai kritis)` : ""}`,
      });

      return NextResponse.json({ success: true, criticalCount, message: "Hasil tersimpan." });
    }

    if (action === "submit") {
      // Simpan nilai lalu selesaikan dalam satu langkah — analis cukup satu klik.
      if (exam.status !== "REGISTRASI" && exam.status !== "PROSES") {
        return NextResponse.json({ success: false, error: `Status saat ini "${exam.status}", tidak dapat diselesaikan.` }, { status: 409 });
      }
      if (!Array.isArray(details)) {
        return NextResponse.json({ success: false, error: "Data hasil tidak valid" }, { status: 400 });
      }

      // Update tiap parameter + hitung flag otomatis.
      let criticalCount = 0;
      for (const d of details) {
        if (!d.id) continue;
        const value = d.value ?? "";
        const referenceRange = d.referenceRange ?? "";
        const flag = computeFlag(String(value), String(referenceRange), d.testCode);
        if (flag === "CRITICAL") criticalCount++;

        const { error } = await supabaseAdmin
          .from("examination_details")
          .update({
            value: value === "" ? null : String(value),
            flag,
            updated_at: nowIso,
          })
          .eq("id", d.id)
          .eq("examination_id", examId);
        if (error) throw error;
      }

      // Wajib semua parameter terisi sebelum diselesaikan.
      const { data: dets, error: dErr } = await supabaseAdmin
        .from("examination_details")
        .select("id, value")
        .eq("examination_id", examId);
      if (dErr) throw dErr;
      const empty = (dets || []).filter((d: any) => d.value === null || String(d.value).trim() === "");
      if (empty.length > 0) {
        return NextResponse.json(
          { success: false, error: `Masih ada ${empty.length} parameter belum diisi. Lengkapi semua nilai sebelum menyelesaikan.` },
          { status: 400 }
        );
      }

      const { error: updErr } = await supabaseAdmin
        .from("examinations")
        .update({ status: "SELESAI", completed_at: nowIso })
        .eq("id", examId);
      if (updErr) throw updErr;

      await supabaseAdmin.from("audit_trails").insert({
        patient_id: exam.patient_id,
        patient_rm: patient?.rm_no || null,
        entity_type: "PEMERIKSAAN",
        action: "SUBMIT_RESULT",
        changed_by: analyst,
        details: `Menyimpan & menyelesaikan ${details.length} hasil parameter untuk ${exam.lab_no}${criticalCount ? ` (${criticalCount} nilai kritis)` : ""}, menunggu validasi PJ Lab`,
      });

      return NextResponse.json({ success: true, status: "SELESAI", criticalCount, message: "Hasil disimpan & pemeriksaan selesai, menunggu validasi PJ Lab." });
    }

    if (action === "complete") {
      if (exam.status !== "PROSES") {
        return NextResponse.json({ success: false, error: `Status saat ini "${exam.status}", tidak dapat diselesaikan.` }, { status: 409 });
      }

      // Pastikan semua parameter sudah terisi.
      const { data: dets, error: dErr } = await supabaseAdmin
        .from("examination_details")
        .select("id, value")
        .eq("examination_id", examId);
      if (dErr) throw dErr;
      const empty = (dets || []).filter((d: any) => d.value === null || String(d.value).trim() === "");
      if (empty.length > 0) {
        return NextResponse.json(
          { success: false, error: `Masih ada ${empty.length} parameter belum diisi.` },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin
        .from("examinations")
        .update({ status: "SELESAI", completed_at: nowIso })
        .eq("id", examId);
      if (error) throw error;

      await supabaseAdmin.from("audit_trails").insert({
        patient_id: exam.patient_id,
        patient_rm: patient?.rm_no || null,
        entity_type: "PEMERIKSAAN",
        action: "COMPLETE",
        changed_by: analyst,
        details: `Menyelesaikan pemeriksaan ${exam.lab_no}, menunggu validasi PJ Lab`,
      });

      return NextResponse.json({ success: true, status: "SELESAI", message: "Pemeriksaan selesai, menunggu validasi." });
    }

    return NextResponse.json({ success: false, error: "Action tidak dikenali" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
