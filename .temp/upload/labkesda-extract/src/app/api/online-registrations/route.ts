import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";
import { resultDocTypeFromCategories, expandTestPackages } from "@/lib/test-catalog";

function generateBookingCode(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `REG-${y}${m}${d}-${rand}`;
}

// GET: List for staff (with filters)
export async function GET(req: Request) {
  try {
    await ensureSeedData();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "ALL";
    const visitDate = searchParams.get("visitDate") || "";

    let query = supabaseAdmin.from("online_registrations").select("*").order("created_at", { ascending: false });
    if (status && status !== "ALL") query = query.eq("status", status);
    if (visitDate) query = query.eq("visit_date", visitDate);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true, registrations: toCamel(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Public submit (no auth)
export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { name, nik, dob, gender, phone, address, guaranteeType, visitDate, requestedTests, referralFileUrl, notes, purpose } = body;

    if (!name || !nik || !dob || !gender || !phone || !address || !visitDate || !requestedTests) {
      return NextResponse.json({ success: false, error: "Data pendaftaran belum lengkap. Harap isi semua field wajib (termasuk NIK & alamat)." }, { status: 400 });
    }

    // Tentukan template surat dari kategori paket yang diminta.
    const cats = expandTestPackages(Array.isArray(requestedTests) ? requestedTests : []).map((p) => p.category);
    const resultTemplate = resultDocTypeFromCategories(cats);

    // Generate booking code unik
    let bookingCode = generateBookingCode();
    let { data: existing } = await supabaseAdmin
      .from("online_registrations")
      .select("id")
      .eq("booking_code", bookingCode)
      .maybeSingle();
    while (existing) {
      bookingCode = generateBookingCode();
      ({ data: existing } = await supabaseAdmin
        .from("online_registrations")
        .select("id")
        .eq("booking_code", bookingCode)
        .maybeSingle());
    }

    const { data: registration, error } = await supabaseAdmin
      .from("online_registrations")
      .insert({
        booking_code: bookingCode,
        name,
        nik: nik || null,
        dob,
        gender,
        phone,
        address: address || null,
        guarantee_type: guaranteeType || "UMUM",
        visit_date: visitDate,
        requested_tests: JSON.stringify(requestedTests),
        referral_file_url: referralFileUrl || null,
        notes: notes || null,
        purpose: purpose || null,
        result_template: resultTemplate,
        status: "MENUNGGU_VERIFIKASI",
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({
      success: true,
      registration: toCamel(registration),
      message: "Pendaftaran online berhasil! Simpan kode booking Anda.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
