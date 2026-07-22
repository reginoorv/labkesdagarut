import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";

// POST /api/patient-auth/register
// Body: { nik, name, dob, gender, phone, address?, province?, city?, district?, village?, rtRw? }
// Alur:
//   1. Validasi NIK 16 digit + no HP
//   2. Cek NIK di tabel patients -> auto-link rekam medis lama (patient_id)
//   3. Tolak jika akun dengan NIK ini sudah ada & aktif
//   4. Buat OTP 6 digit (10 menit) — siap dihubungkan ke Firebase Phone Auth /
//      WA gateway. Sementara ini OTP disimpan server-side; pengiriman SMS/WA
//      dilakukan di layer pengirim (lihat sendOtp()).
export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const nik = String(body.nik || "").trim();
    const phone = String(body.phone || "").trim();

    if (!/^\d{16}$/.test(nik)) {
      return NextResponse.json({ success: false, error: "NIK harus 16 digit angka." }, { status: 400 });
    }
    if (phone.length < 9) {
      return NextResponse.json({ success: false, error: "Nomor HP tidak valid." }, { status: 400 });
    }

    // Akun sudah ada?
    const { data: existing } = await supabaseAdmin
      .from("patient_accounts")
      .select("id, is_active")
      .eq("nik", nik)
      .maybeSingle();
    if (existing?.is_active) {
      return NextResponse.json(
        { success: false, error: "NIK sudah terdaftar. Silakan login atau gunakan Lupa PIN." },
        { status: 409 }
      );
    }

    // Link ke rekam medis lama (jika NIK pernah tercatat sebagai pasien)
    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("id, name, dob, gender, phone, address")
      .eq("nik", nik)
      .maybeSingle();

    // Buat OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from("patient_otps")
      .update({ verified: true }) // matikan OTP lama yang belum dipakai
      .eq("phone", phone)
      .eq("verified", false);

    const { error: otpErr } = await supabaseAdmin.from("patient_otps").insert({
      phone,
      otp_code: otp,
      purpose: "REGISTER",
      expires_at: expiresAt,
    });
    if (otpErr) throw otpErr;

    await sendOtp(phone, otp);

    return NextResponse.json({
      success: true,
      linkedExistingPatient: !!patient,
      patient: patient ? toCamel(patient) : null,
      message: "Kode OTP telah dikirim ke nomor Anda.",
      // DEV ONLY: memudahkan uji sebelum gateway SMS/WA aktif. Hapus di produksi.
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Pengiriman OTP. Urutan strategi (semua gratis tier):
//   1. WA gateway (WA_GATEWAY_URL) — mis. Fonnte/Baileys self-hosted
//   2. Firebase Phone Auth dilakukan penuh di sisi app (client SDK);
//      endpoint ini hanya fallback server-side OTP.
async function sendOtp(phone: string, otp: string) {
  const waUrl = process.env.WA_GATEWAY_URL;
  if (!waUrl) return; // belum dikonfigurasi — OTP tetap tersimpan & bisa diverifikasi
  try {
    await fetch(waUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: phone,
        message: `Kode OTP Labkesda Garut Anda: ${otp}. Berlaku 10 menit. Jangan berikan ke siapa pun.`,
      }),
    });
  } catch (err) {
    console.error("sendOtp WA error:", err);
  }
}
