import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";

// GET: Detail one registration
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;
    const { data: reg, error } = await supabaseAdmin
      .from("online_registrations")
      .select("*")
      .eq("id", parseInt(id))
      .maybeSingle();
    if (error) throw error;

    if (!reg) {
      return NextResponse.json({ success: false, error: "Pendaftaran tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration: toCamel(reg) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
