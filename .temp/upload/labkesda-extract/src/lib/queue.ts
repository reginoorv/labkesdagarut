// Penomoran antrian harian.
//
// Format: <PREFIX>-<NNN> dengan urutan direset per hari (berdasar created_at).
//   - CITO (prioritas urgent) .......... C-001, C-002, ...
//   - Offline / loket normal ........... A-001, A-002, ...
//   - Online (terverifikasi loket) ..... O-001, O-002, ...
//
// Nomor dihitung dari jumlah examinations pada channel yang sama di hari ini.
// Cukup untuk skala Labkesda; bukan penomoran transaksional beruntun ketat.

import { supabaseAdmin } from "@/lib/supabase";

export type QueueChannel = "LOKET" | "ONLINE" | "CITO";

const PREFIX: Record<QueueChannel, string> = {
  CITO: "C",
  LOKET: "A",
  ONLINE: "O",
};

// Batas awal & akhir hari ini (waktu server) dalam ISO.
function todayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

// Hasilkan nomor antrian berikutnya untuk channel tertentu.
// priority "CITO" selalu memakai antrean C- apa pun channel-nya.
export async function generateQueueNo(
  channel: QueueChannel,
  priority?: string
): Promise<string> {
  const effective: QueueChannel = priority === "CITO" ? "CITO" : channel;
  const prefix = PREFIX[effective];
  const { start, end } = todayRange();

  // Hitung berapa exam pada channel efektif ini yang sudah punya queue_no hari ini.
  const { count } = await supabaseAdmin
    .from("examinations")
    .select("id", { count: "exact", head: true })
    .eq("queue_channel", effective)
    .gte("created_at", start)
    .lt("created_at", end);

  const seq = (count || 0) + 1;
  return `${prefix}-${String(seq).padStart(3, "0")}`;
}
