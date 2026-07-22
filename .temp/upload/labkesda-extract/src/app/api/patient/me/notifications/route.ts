import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { toCamel } from "@/lib/case";
import { getPatientFromRequest } from "@/lib/patient-auth";

// GET  /api/patient/me/notifications        -> inbox notifikasi pasien
// POST /api/patient/me/notifications        -> tandai terbaca { ids?: number[], all?: boolean }
export async function GET(req: Request) {
  try {
    await ensureSeedData();
    const me = await getPatientFromRequest(req);
    if (!me) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("notifications_patient")
      .select("*")
      .eq("account_id", me.accountId)
      .order("id", { ascending: false })
      .limit(100);
    if (error) throw error;

    const unread = (data || []).filter((n: any) => !n.is_read).length;

    return NextResponse.json({ success: true, notifications: toCamel(data || []), unreadCount: unread });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const me = await getPatientFromRequest(req);
    if (!me) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    let query = supabaseAdmin
      .from("notifications_patient")
      .update({ is_read: true })
      .eq("account_id", me.accountId);

    if (!body.all && Array.isArray(body.ids) && body.ids.length > 0) {
      query = query.in("id", body.ids);
    }
    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
