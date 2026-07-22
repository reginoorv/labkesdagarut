import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";
import { getPatientFromRequest } from "@/lib/patient-auth";

// POST /api/patient/me/device-token
// Body: { fcmToken } — simpan token FCM perangkat untuk push notification.
export async function POST(req: Request) {
  try {
    await ensureSeedData();
    const me = await getPatientFromRequest(req);
    if (!me) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const fcmToken = String(body.fcmToken || "").trim();
    if (!fcmToken) {
      return NextResponse.json({ success: false, error: "fcmToken wajib diisi." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("patient_accounts")
      .update({ fcm_token: fcmToken, updated_at: new Date().toISOString() })
      .eq("id", me.accountId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
