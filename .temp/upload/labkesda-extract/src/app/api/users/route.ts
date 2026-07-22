import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await ensureSeedData();
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, username, full_name, role, is_active, last_login_at, created_at")
      .order("id", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, users: toCamel(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const body = await req.json();
    const hash = await bcrypt.hash(body.password || "password123", 10);
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        username: body.username,
        password_hash: hash,
        full_name: body.fullName,
        role: body.role,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, user: { id: data.id, username: data.username } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {
      full_name: body.fullName,
      role: body.role,
      is_active: body.isActive,
    };
    if (body.password) {
      updates.password_hash = await bcrypt.hash(body.password, 10);
    }
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", body.id)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, user: { id: data.id, username: data.username } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
