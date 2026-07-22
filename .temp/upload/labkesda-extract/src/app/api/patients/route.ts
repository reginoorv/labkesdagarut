import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";
import { expandTestPackages, resultDocTypeFromCategories } from "@/lib/test-catalog";
import { generateQueueNo } from "@/lib/queue";

export async function GET(req: Request) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const guarantee = searchParams.get("guarantee") || "";

    const { data: rows, error } = await supabaseAdmin
      .from("patients")
      .select(
        `id, rm_no, nik, name, gender, dob, phone, address, guarantee_type,
         hospital_id, created_at, hospitals ( name )`
      )
      .order("id", { ascending: false });
    if (error) throw error;

    let list = (rows || []).map((p: any) => ({
      id: p.id,
      rmNo: p.rm_no,
      nik: p.nik,
      name: p.name,
      gender: p.gender,
      dob: p.dob,
      phone: p.phone,
      address: p.address,
      guaranteeType: p.guarantee_type,
      hospitalId: p.hospital_id,
      hospitalName: p.hospitals?.name ?? null,
      createdAt: p.created_at,
    }));

    // Filter (client-side helper, sama seperti versi sebelumnya)
    list = list.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.rmNo.toLowerCase().includes(search.toLowerCase()) ||
        (p.nik && p.nik.includes(search));
      const matchGuarantee = !guarantee || guarantee === "ALL" || p.guaranteeType === guarantee;
      return matchSearch && matchGuarantee;
    });

    return NextResponse.json({ success: true, patients: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();

    const {
      rmNo,
      nik,
      name,
      gender,
      dob,
      phone,
      address,
      guaranteeType,
      hospitalId,
      doctorName,
      priority,
      clinicalNotes,
      purpose,
    } = body;

    // Frontend registrasi loket mengirim "testCategories"; terima juga
    // "selectedTests" demi kompatibilitas payload lama.
    const testPackages: string[] = Array.isArray(body.testCategories)
      ? body.testCategories
      : Array.isArray(body.selectedTests)
        ? body.selectedTests
        : [];

    if (!name || !gender || !dob) {
      return NextResponse.json({ success: false, error: "Data pasien tidak lengkap" }, { status: 400 });
    }

    // ── Cegah duplikat rm_no ──────────────────────────────────────────
    // 1) Kalau frontend mengirim NIK, cari dulu pasien existing dengan NIK
    //    itu. Bila ada, kita UPDATE record lama (bukan INSERT baru) supaya
    //    tidak melanggar unique constraint patients.rm_no (alias error
    //    "duplicate key value violates unique constraint ..._rm_no_key").
    //    Flag `existingPatientId` dari frontend NIK-lookup juga diperhatikan.
    // 2) rm_no dibuat berurutan & dijamin unik (count+1 + pengecekan bentrok),
    //    bukan random 3-digit yang rentan tabrakan di antar request.
    let existingPatientId: number | null = null;
    let newPatient: any;
    const bodyExistingId = body.existingPatientId;
    if (bodyExistingId) {
      existingPatientId = parseInt(bodyExistingId);
    } else if (nik) {
      const { data: matchByNik } = await supabaseAdmin
        .from("patients")
        .select("id")
        .eq("nik", nik)
        .maybeSingle();
      if (matchByNik) existingPatientId = matchByNik.id;
    }

    // Generator rm_no unik: RM-YYYYMM-NNNNN, sequence = jumlah pasien + 1,
    // dicegah bentrok dengan retry bila nomor ternyata sudah dipakai.
    const buildRmNo = (seq: number) => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      return `RM-${y}${m}-${String(seq).padStart(5, "0")}`;
    };
    const generateUniqueRm = async (): Promise<string> => {
      // Pakai rmNo yang dikirim HANYA bila tidak dipakai pasien lain.
      if (rmNo) {
        const { data: taken } = await supabaseAdmin
          .from("patients")
          .select("id")
          .eq("rm_no", rmNo)
          .maybeSingle();
        if (!taken) return rmNo;
      }
      const { count } = await supabaseAdmin
        .from("patients")
        .select("id", { count: "exact", head: true });
      let seq = (count || 0) + 1;
      let candidate = buildRmNo(seq);
      // Cek bentrok maks. 5x (aman dari race).
      for (let i = 0; i < 5; i++) {
        const { data: clash } = await supabaseAdmin
          .from("patients")
          .select("id")
          .eq("rm_no", candidate)
          .maybeSingle();
        if (!clash) return candidate;
        seq += 1;
        candidate = buildRmNo(seq);
      }
      return candidate;
    };

    // Masih ada existingPatient? UPDATE saja record-nya.
    if (existingPatientId) {
      const { data: updated, error: uErr } = await supabaseAdmin
        .from("patients")
        .update({
          name,
          gender,
          dob,
          phone: phone || null,
          address: address || null,
          guarantee_type: guaranteeType || "UMUM",
          hospital_id: hospitalId ? parseInt(hospitalId) : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPatientId)
        .select()
        .single();
      if (uErr) throw uErr;

      await supabaseAdmin.from("audit_trails").insert({
        patient_id: updated.id,
        patient_rm: updated.rm_no,
        entity_type: "PASIEN",
        action: "UPDATE",
        changed_by: "Petugas Registrasi LIS",
        details: `Registrasi ulang pasien existing ${updated.name} (${updated.rm_no}) via loket/online.`,
      });

      // Lanjut buat lab order bila ada paket tes dipilih (lihat blok di bawah).
      newPatient = updated;
    } else {
      const finalRm = await generateUniqueRm();

      const { data: inserted, error: pErr } = await supabaseAdmin
        .from("patients")
        .insert({
          rm_no: finalRm,
          nik: nik || null,
          name,
          gender,
          dob,
          phone: phone || null,
          address: address || null,
          guarantee_type: guaranteeType || "UMUM",
          hospital_id: hospitalId ? parseInt(hospitalId) : null,
          source_channel: "LOKET",
        })
        .select()
        .single();
      if (pErr) throw pErr;

      await supabaseAdmin.from("audit_trails").insert({
        patient_id: inserted.id,
        patient_rm: inserted.rm_no,
        entity_type: "PASIEN",
        action: "CREATE",
        changed_by: "Petugas Registrasi LIS",
        details: `Pendaftaran pasien baru ${inserted.name} (${inserted.rm_no})`,
      });

      newPatient = inserted;
    }

    // Create lab order (+ parameter kosong) bila ada paket tes dipilih.
    let labOrder = null;
    let queueNo: string | null = null;
    if (testPackages.length > 0) {
      const now = new Date();
      const y = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const { count: examCount } = await supabaseAdmin
        .from("examinations")
        .select("id", { count: "exact", head: true });
      const labNo = `LAB-${y}${mm}${dd}-${String((examCount || 0) + 1).padStart(3, "0")}`;

      queueNo = await generateQueueNo("LOKET", priority);

      // Tentukan template surat dari kategori paket yang dipilih.
      const cats = expandTestPackages(testPackages).map((p) => p.category);
      const resultTemplate = resultDocTypeFromCategories(cats);

      const { data: exam, error: exErr } = await supabaseAdmin
        .from("examinations")
        .insert({
          lab_no: labNo,
          patient_id: newPatient.id,
          doctor_name: doctorName || null,
          hospital_id: hospitalId ? parseInt(hospitalId) : null,
          priority: priority || "NORMAL",
          status: "REGISTRASI",
          clinical_notes: clinicalNotes || null,
          purpose: purpose || null,
          result_template: resultTemplate,
          source_channel: "LOKET",
          queue_no: queueNo,
          queue_channel: priority === "CITO" ? "CITO" : "LOKET",
        })
        .select()
        .single();
      if (exErr) throw exErr;
      labOrder = toCamel(exam);

      // Expand paket -> baris parameter kosong siap diisi analis.
      const params = expandTestPackages(testPackages);
      if (params.length > 0) {
        const rows = params.map((p) => ({
          examination_id: exam.id,
          category: p.category,
          test_code: p.testCode,
          test_name: p.testName,
          value: null,
          unit: p.unit,
          reference_range: p.referenceRange,
          flag: "NORMAL",
          is_duplo: false,
        }));
        const { error: dErr } = await supabaseAdmin.from("examination_details").insert(rows);
        if (dErr) throw dErr;
      }
    }

    return NextResponse.json({
      success: true,
      patient: toCamel(newPatient),
      labOrder,
      queueNo,
      message: "Pasien berhasil terdaftar!",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { id, name, gender, dob, phone, address, guaranteeType, hospitalId, updatedBy } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Patient ID missing" }, { status: 400 });
    }

    const { data: updatedPatient, error: uErr } = await supabaseAdmin
      .from("patients")
      .update({
        name,
        gender,
        dob,
        phone,
        address,
        guarantee_type: guaranteeType,
        hospital_id: hospitalId ? parseInt(hospitalId) : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (uErr) throw uErr;

    // Insert Audit Trail for update
    await supabaseAdmin.from("audit_trails").insert({
      patient_id: updatedPatient.id,
      patient_rm: updatedPatient.rm_no,
      entity_type: "PASIEN",
      action: "UPDATE",
      changed_by: updatedBy || "Analis / Petugas Edit",
      details: `Pembaruan identitas/data penjamin pasien ${updatedPatient.name} (${updatedPatient.rm_no})`,
    });

    return NextResponse.json({ success: true, patient: toCamel(updatedPatient) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
