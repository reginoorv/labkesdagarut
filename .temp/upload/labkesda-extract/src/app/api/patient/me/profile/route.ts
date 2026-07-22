import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";
import { getPatientFromRequest } from "@/lib/patient-auth";
import bcrypt from "bcryptjs";

// GET /api/patient/me/profile   -> profil akun + data pasien + dependen
// PUT /api/patient/me/profile   -> update no HP / alamat / ganti PIN / kelola dependen
//   Body opsional: { phone?, address?, province?, city?, district?, village?, rtRw?,
//                    oldPin?, newPin?,
//                    dependent?: { id?, nik?, name, dob?, gender?, relation, _delete? } }
export async function GET(req: Request) {
  try {
    await ensureSeedData();
    const me = await getPatientFromRequest(req);
    if (!me) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: account } = await supabaseAdmin
      .from("patient_accounts")
      .select("id, nik, phone, patient_id, created_at")
      .eq("id", me.accountId)
      .maybeSingle();

    let patient = null;
    if (account?.patient_id) {
      const { data } = await supabaseAdmin.from("patients").select("*").eq("id", account.patient_id).maybeSingle();
      patient = data;
    }

    const { data: dependents } = await supabaseAdmin
      .from("patient_dependents")
      .select("*")
      .eq("account_id", me.accountId)
      .order("id", { ascending: true });

    return NextResponse.json({
      success: true,
      account: toCamel(account),
      patient: patient ? toCamel(patient) : null,
      dependents: toCamel(dependents || []),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureSeedData();
    const me = await getPatientFromRequest(req);
    if (!me) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();

    // --- Ganti PIN ---
    if (body.newPin) {
      if (!/^\d{6}$/.test(String(body.newPin))) {
        return NextResponse.json({ success: false, error: "PIN baru harus 6 digit angka." }, { status: 400 });
      }
      const { data: account } = await supabaseAdmin
        .from("patient_accounts")
        .select("pin_hash")
        .eq("id", me.accountId)
        .maybeSingle();
      const ok = account && (await bcrypt.compare(String(body.oldPin || ""), account.pin_hash));
      if (!ok) {
        return NextResponse.json({ success: false, error: "PIN lama salah." }, { status: 401 });
      }
      const pinHash = await bcrypt.hash(String(body.newPin), 10);
      await supabaseAdmin
        .from("patient_accounts")
        .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
        .eq("id", me.accountId);
    }

    // --- Update no HP akun ---
    if (body.phone) {
      await supabaseAdmin
        .from("patient_accounts")
        .update({ phone: String(body.phone), updated_at: new Date().toISOString() })
        .eq("id", me.accountId);
    }

    // --- Update alamat di record pasien (jika ter-link) ---
    if (me.patientId && (body.address || body.province || body.city || body.district || body.village || body.rtRw)) {
      await supabaseAdmin
        .from("patients")
        .update({
          address: body.address,
          province: body.province,
          city: body.city,
          district: body.district,
          village: body.village,
          rt_rw: body.rtRw,
        })
        .eq("id", me.patientId);
    }

    // --- Kelola dependen (tambah/edit/hapus satu per request) ---
    if (body.dependent) {
      const d = body.dependent;
      if (d._delete && d.id) {
        await supabaseAdmin.from("patient_dependents").delete().eq("id", d.id).eq("account_id", me.accountId);
      } else if (d.id) {
        await supabaseAdmin
          .from("patient_dependents")
          .update({ nik: d.nik, name: d.name, dob: d.dob, gender: d.gender, relation: d.relation })
          .eq("id", d.id)
          .eq("account_id", me.accountId);
      } else {
        if (!d.name || !d.relation) {
          return NextResponse.json({ success: false, error: "Nama dan hubungan dependen wajib diisi." }, { status: 400 });
        }
        await supabaseAdmin.from("patient_dependents").insert({
          account_id: me.accountId,
          nik: d.nik || null,
          name: d.name,
          dob: d.dob || null,
          gender: d.gender || null,
          relation: d.relation,
        });
      }
    }

    return NextResponse.json({ success: true, message: "Profil diperbarui." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
