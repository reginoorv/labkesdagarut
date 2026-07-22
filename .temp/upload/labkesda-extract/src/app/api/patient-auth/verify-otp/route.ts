import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import bcrypt from "bcryptjs";
import { createPatientToken } from "@/lib/patient-auth";

// POST /api/patient-auth/verify-otp
// Body: { nik, phone, otp, pin }  — pin = 6 digit, dibuat saat register
// Memverifikasi OTP, membuat/aktifkan akun pasien, lalu menerbitkan JWT.
export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const nik = String(body.nik || "").trim();
    const phone = String(body.phone || "").trim();
    const otp = String(body.otp || "").trim();
    const pin = String(body.pin || "").trim();

    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json({ success: false, error: "PIN harus 6 digit angka." }, { status: 400 });
    }

    // Ambil OTP aktif terbaru untuk nomor ini
    const { data: otpRow } = await supabaseAdmin
      .from("patient_otps")
      .select("*")
      .eq("phone", phone)
      .eq("verified", false)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRow || otpRow.otp_code !== otp) {
      return NextResponse.json({ success: false, error: "Kode OTP salah." }, { status: 400 });
    }
    if (new Date(otpRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: "Kode OTP sudah kedaluwarsa. Minta kode baru." }, { status: 400 });
    }

    // Tandai OTP terpakai
    await supabaseAdmin.from("patient_otps").update({ verified: true }).eq("id", otpRow.id);

    // Link pasien lama by NIK
    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("nik", nik)
      .maybeSingle();

    const pinHash = await bcrypt.hash(pin, 10);

    // Buat atau reaktivasi akun
    const { data: existing } = await supabaseAdmin
      .from("patient_accounts")
      .select("id")
      .eq("nik", nik)
      .maybeSingle();

    let account;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("patient_accounts")
        .update({
          phone,
          pin_hash: pinHash,
          patient_id: patient?.id ?? null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      account = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("patient_accounts")
        .insert({ nik, phone, pin_hash: pinHash, patient_id: patient?.id ?? null })
        .select()
        .single();
      if (error) throw error;
      account = data;
    }

    const token = await createPatientToken({
      accountId: account.id,
      nik,
      phone,
      patientId: account.patient_id,
    });

    return NextResponse.json({
      success: true,
      token,
      account: { id: account.id, nik, phone, patientId: account.patient_id },
      message: "Akun berhasil dibuat.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
