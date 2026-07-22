import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";
import { expandTestPackages } from "@/lib/test-catalog";
import { generateQueueNo } from "@/lib/queue";
import { notifyPatient } from "@/lib/push";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;
    const body = await req.json();
    const verifiedBy = body.verifiedBy || "Petugas LIS (Admin Verifikasi)";

    const { data: reg, error: findErr } = await supabaseAdmin
      .from("online_registrations")
      .select("*")
      .eq("id", parseInt(id))
      .maybeSingle();
    if (findErr) throw findErr;

    if (!reg) {
      return NextResponse.json({ success: false, error: "Pendaftaran tidak ditemukan" }, { status: 404 });
    }

    if (reg.status !== "MENUNGGU_VERIFIKASI") {
      return NextResponse.json({ success: false, error: `Pendaftaran sudah berstatus: ${reg.status}` }, { status: 400 });
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    // Generate RM Number
    const { count: patientCount } = await supabaseAdmin
      .from("patients")
      .select("id", { count: "exact", head: true });
    const rmSeq = (patientCount || 0) + 1;
    const rmNo = `RM-${year}${month}${day}-${String(rmSeq).padStart(5, "0")}`;

    // Generate Lab No
    const { count: examCount } = await supabaseAdmin
      .from("examinations")
      .select("id", { count: "exact", head: true });
    const labSeq = (examCount || 0) + 1;
    const labNo = `LAB-${year}${month}${day}-${String(labSeq).padStart(3, "0")}`;

    // 1. Create Patient record
    const { data: newPatient, error: pErr } = await supabaseAdmin
      .from("patients")
      .insert({
        rm_no: rmNo,
        nik: reg.nik || null,
        name: reg.name,
        gender: reg.gender,
        dob: reg.dob,
        phone: reg.phone,
        address: reg.address || null,
        guarantee_type: "UMUM",
        source_channel: "ONLINE",
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .single();
    if (pErr) throw pErr;

    // 2. Create Examination record (+ nomor antrian online)
    const queueNo = await generateQueueNo("ONLINE", "NORMAL");
    const { data: newExam, error: exErr } = await supabaseAdmin
      .from("examinations")
      .insert({
        lab_no: labNo,
        patient_id: newPatient.id,
        // Pasien daftar mandiri lewat online — tidak ada dokter/faskes perujuk.
        doctor_name: null,
        hospital_id: null,
        priority: "NORMAL",
        status: "REGISTRASI",
        clinical_notes: `[Pendaftaran mandiri online — tanpa rujukan dokter] Kode Booking: ${reg.booking_code}. ${reg.notes || ""}`,
        purpose: reg.purpose || null,
        result_template: reg.result_template || "LAB",
        source_channel: "ONLINE",
        queue_no: queueNo,
        queue_channel: "ONLINE",
        sample_received_at: nowIso,
        created_at: nowIso,
      })
      .select()
      .single();
    if (exErr) throw exErr;

    // 2b. Expand paket yang diminta -> baris parameter kosong siap diisi analis.
    let requestedPackages: string[] = [];
    try {
      const parsed = JSON.parse(reg.requested_tests);
      if (Array.isArray(parsed)) requestedPackages = parsed;
    } catch {
      requestedPackages = [];
    }
    const params2 = expandTestPackages(requestedPackages);
    if (params2.length > 0) {
      const rows = params2.map((p) => ({
        examination_id: newExam.id,
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

    // 3. Update online_registrations status
    const { error: updErr } = await supabaseAdmin
      .from("online_registrations")
      .update({
        status: "TERVERIFIKASI",
        converted_patient_id: newPatient.id,
        converted_examination_id: newExam.id,
        verified_by: verifiedBy,
        verified_at: nowIso,
      })
      .eq("id", reg.id);
    if (updErr) throw updErr;

    // 4. Audit Trail
    await supabaseAdmin.from("audit_trails").insert({
      patient_id: newPatient.id,
      patient_rm: rmNo,
      entity_type: "PASIEN",
      action: "CREATE",
      changed_by: verifiedBy,
      details: `Verifikasi pendaftaran online ${reg.booking_code} - ${reg.name}. RM: ${rmNo}, Lab: ${labNo}`,
      created_at: nowIso,
    });

    // 5. Push + inbox notifikasi ke aplikasi pasien (no-op bila pasien belum punya akun)
    await notifyPatient({
      nik: reg.nik,
      title: "Pendaftaran Terverifikasi",
      body: `Pendaftaran ${reg.booking_code} telah diverifikasi. Nomor antrian Anda: ${queueNo}. Silakan menuju kasir.`,
      type: "REGISTRASI",
      referenceId: reg.id,
    });

    return NextResponse.json({
      success: true,
      message: `Pendaftaran online terverifikasi! No. Antrian: ${queueNo} — RM: ${rmNo} — Lab: ${labNo}`,
      patient: toCamel(newPatient),
      examination: toCamel(newExam),
      bookingCode: reg.booking_code,
      queueNo,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
