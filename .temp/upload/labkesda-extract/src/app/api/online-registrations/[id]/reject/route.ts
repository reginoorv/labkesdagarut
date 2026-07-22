import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { ensureSeedData } from "@/db/seed";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSeedData();
    const { id } = await params;
    const body = await req.json();
    const rejectionReason = body.rejectionReason || "Tidak ada alasan yang diberikan.";

    if (!rejectionReason || rejectionReason.trim().length < 3) {
      return NextResponse.json({ success: false, error: "Alasan penolakan wajib diisi minimal 3 karakter." }, { status: 400 });
    }

    const { data: reg, error: findErr } = await supabaseAdmin
      .from("online_registrations")
      .select("*")
      .eq("id", parseInt(id))
      .maybeSingle();
    if (findErr) throw findErr;

    if (!reg) {
      return NextResponse.json({ success: false, error: "Pendaftaran tidak ditemukan" }, { status: 404 });
    }

    if (reg.status !== "MENUNGGU_VERIFIKASI") {
      return NextResponse.json({ success: false, error: `Pendaftaran sudah berstatus: ${reg.status}` }, { status: 400 });
    }

    const { error: updErr } = await supabaseAdmin
      .from("online_registrations")
      .update({ status: "DITOLAK", rejection_reason: rejectionReason })
      .eq("id", reg.id);
    if (updErr) throw updErr;

    return NextResponse.json({
      success: true,
      message: `Pendaftaran ${reg.booking_code} (${reg.name}) telah ditolak.`,
      bookingCode: reg.booking_code,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
