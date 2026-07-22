import { supabaseAdmin } from "@/lib/supabase";

// Helper push notification ke aplikasi pasien via Firebase Cloud Messaging.
// Graceful: kalau FCM_SERVER_KEY belum di-set, notifikasi tetap tersimpan di
// tabel notifications_patient (inbox app) dan push dilewati tanpa error.
//
// Dipanggil dari 3 titik di flow staff (web existing):
//   1. online-registrations/[id]/verify   -> "Pendaftaran Terverifikasi"
//   2. payments/[examinationId]/pay       -> "Silakan lanjut ke pengambilan sampel"
//   3. examinations/validate              -> "Hasil lab Anda sudah tersedia"

export type PatientNotifType = "REGISTRASI" | "ANTRIAN" | "HASIL" | "PEMBAYARAN" | "PENGUMUMAN";

interface NotifyOptions {
  accountId?: number | null;   // jika diketahui langsung
  nik?: string | null;         // alternatif: cari account by NIK
  title: string;
  body: string;
  type?: PatientNotifType;
  referenceId?: number | null;
}

export async function notifyPatient(opts: NotifyOptions): Promise<void> {
  try {
    // 1. Tentukan akun pasien tujuan
    let accountId = opts.accountId ?? null;
    if (!accountId && opts.nik) {
      const { data: acc } = await supabaseAdmin
        .from("patient_accounts")
        .select("id")
        .eq("nik", opts.nik)
        .eq("is_active", true)
        .maybeSingle();
      accountId = acc?.id ?? null;
    }
    if (!accountId) return; // pasien belum punya akun app — skip

    // 2. Simpan ke inbox notifikasi (selalu, meski push gagal)
    await supabaseAdmin.from("notifications_patient").insert({
      account_id: accountId,
      title: opts.title,
      body: opts.body,
      type: opts.type ?? "INFO",
      reference_id: opts.referenceId ?? null,
    });

    // 3. Kirim push FCM bila server key tersedia
    const serverKey = process.env.FCM_SERVER_KEY;
    if (!serverKey) return;

    const { data: acc } = await supabaseAdmin
      .from("patient_accounts")
      .select("fcm_token")
      .eq("id", accountId)
      .maybeSingle();
    const token = acc?.fcm_token;
    if (!token) return;

    await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `key=${serverKey}`,
      },
      body: JSON.stringify({
        to: token,
        notification: { title: opts.title, body: opts.body },
        data: { type: opts.type ?? "INFO", referenceId: String(opts.referenceId ?? "") },
      }),
    });
  } catch (err) {
    // Jangan pernah ganggu flow staff hanya karena notifikasi gagal
    console.error("notifyPatient error:", err);
  }
}
