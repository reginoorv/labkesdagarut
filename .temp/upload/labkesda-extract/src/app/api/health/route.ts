import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await supabaseAdmin.from("hospitals").select("id", { head: true, count: "exact" });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
