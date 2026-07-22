import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";

// Pengaturan kop surat instansi (dipakai di surat hasil lab & dokumen cetak).
// Nilai default dipakai bila belum ada baris di database.
const DEFAULTS = {
  line1: "Pemerintah Kabupaten Garut",
  line2: "Dinas Kesehatan",
  line3: "Laboratorium Kesehatan Daerah",
  address: "Jl. Proklamasi No. 2, Tarogong Kidul, Garut 44151, Jawa Barat",
  contact: "Telp. (0262) 232720 • Email: labkesda@garutkab.go.id",
  logoUrl: "",
};

export async function GET() {
  try {
    await ensureSeedData();
    const { data: row } = await supabaseAdmin
      .from("letterhead_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    const settings = row ? toCamel(row) : DEFAULTS;
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureSeedData();

    // Hanya admin yang boleh mengubah kop surat.
    const session = await getSession();
    if (!session || session.role !== "ADMIN_SISTEM") {
      return NextResponse.json({ success: false, error: "Akses ditolak. Hanya Administrator." }, { status: 403 });
    }

    const body = await req.json();
    const payload = {
      line1: body.line1 ?? DEFAULTS.line1,
      line2: body.line2 ?? DEFAULTS.line2,
      line3: body.line3 ?? DEFAULTS.line3,
      address: body.address ?? DEFAULTS.address,
      contact: body.contact ?? DEFAULTS.contact,
      logo_url: body.logoUrl ?? "",
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabaseAdmin
      .from("letterhead_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    let saved;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from("letterhead_settings")
        .update(payload)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      saved = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("letterhead_settings")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      saved = data;
    }

    return NextResponse.json({ success: true, settings: toCamel(saved) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
