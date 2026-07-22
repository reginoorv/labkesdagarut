import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";

export async function GET() {
  try {
    await ensureSeedData();
    const { data, error } = await supabaseAdmin.from("tariffs").select("*").order("id", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, tariffs: toCamel(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("tariffs")
      .insert({
        category: body.category,
        test_code: body.testCode,
        test_name: body.testName,
        price: body.price,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, tariff: toCamel(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from("tariffs")
      .update({
        category: body.category,
        test_code: body.testCode,
        test_name: body.testName,
        price: body.price,
        is_active: body.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, tariff: toCamel(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
