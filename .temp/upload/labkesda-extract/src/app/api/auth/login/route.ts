import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { ensureSeedData } from "@/db/seed";

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username dan password wajib diisi" }, { status: 400 });
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("username", username)
      .limit(1)
      .maybeSingle();

    if (!user || !user.is_active) {
      return NextResponse.json({ success: false, error: "Username atau password salah" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ success: false, error: "Username atau password salah" }, { status: 401 });
    }

    // Update last login
    await supabaseAdmin.from("users").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);

    await createSession({
      userId: user.id,
      username: user.username,
      fullName: user.full_name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, fullName: user.full_name, role: user.role },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
