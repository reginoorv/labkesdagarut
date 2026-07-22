import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";

export async function GET() {
  try {
    await ensureSeedData();
    const { data, error } = await supabaseAdmin.from("hospitals").select("*").order("id", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, hospitals: toCamel(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { code, name, type, phone, address, contactPerson, cooperationType } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ success: false, error: "Kode, nama, dan tipe RS wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("hospitals")
      .insert({
        code,
        name,
        type,
        phone: phone || null,
        address: address || null,
        contact_person: contactPerson || null,
        cooperation_type: cooperationType || "Mandiri",
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, hospital: toCamel(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { id, name, type, phone, address, contactPerson, cooperationType, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Hospital ID required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("hospitals")
      .update({
        name,
        type,
        phone,
        address,
        contact_person: contactPerson,
        cooperation_type: cooperationType,
        is_active: isActive,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, hospital: toCamel(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
