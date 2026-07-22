import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import bcrypt from "bcryptjs";
import { createPatientToken } from "@/lib/patient-auth";

// POST /api/patient-auth/login
// Body: { nik, pin }
export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const nik = String(body.nik || "").trim();
    const pin = String(body.pin || "").trim();

    if (!nik || !pin) {
      return NextResponse.json({ success: false, error: "NIK dan PIN wajib diisi." }, { status: 400 });
    }

    const { data: account } = await supabaseAdmin
      .from("patient_accounts")
      .select("*")
      .eq("nik", nik)
      .eq("is_active", true)
      .maybeSingle();

    if (!account) {
      return NextResponse.json({ success: false, error: "Akun tidak ditemukan. Silakan daftar terlebih dahulu." }, { status: 404 });
    }

    const match = await bcrypt.compare(pin, account.pin_hash);
    if (!match) {
      return NextResponse.json({ success: false, error: "PIN salah." }, { status: 401 });
    }

    const token = await createPatientToken({
      accountId: account.id,
      nik: account.nik,
      phone: account.phone,
      patientId: account.patient_id,
    });

    // Ambil nama pasien untuk greeting di app
    let name: string | null = null;
    if (account.patient_id) {
      const { data: patient } = await supabaseAdmin
        .from("patients")
        .select("name")
        .eq("id", account.patient_id)
        .maybeSingle();
      name = patient?.name ?? null;
    }

    return NextResponse.json({
      success: true,
      token,
      account: { id: account.id, nik: account.nik, phone: account.phone, patientId: account.patient_id, name },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
