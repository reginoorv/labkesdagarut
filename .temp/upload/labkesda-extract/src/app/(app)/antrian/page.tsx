"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Flame, CreditCard, TestTube2, CheckCircle2, Users } from "lucide-react";

interface QueueItem {
  id: number;
  queueNo: string;
  queueChannel: string;
  labNo: string;
  patientName: string;
  patientRm: string;
  priority: string;
  status: string;
  paymentGateStatus: string;
  stage: "MENUNGGU_BAYAR" | "DI_LAB" | "SELESAI";
}

interface Summary {
  menungguBayar: number;
  diLab: number;
  selesai: number;
  total: number;
}

const STAGE_META: Record<QueueItem["stage"], { label: string; cls: string }> = {
  MENUNGGU_BAYAR: { label: "Menunggu Kasir", cls: "bg-[#E8A33D]/15 text-[#B57917]" },
  DI_LAB: { label: "Diproses Lab", cls: "bg-[#3B7DD8]/15 text-[#3B7DD8]" },
  SELESAI: { label: "Selesai", cls: "bg-[#1B8A5A]/15 text-[#1B8A5A]" },
};

export default function AntrianPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [summary, setSummary] = useState<Summary>({ menungguBayar: 0, diLab: 0, selesai: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/queue");
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setSummary(data.summary);
      }
    } catch (e) {
      console.error("Queue fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Auto-refresh tiap 15 detik agar papan antrian tetap segar.
    const t = setInterval(fetchQueue, 15000);
    return () => clearInterval(t);
  }, []);

  const waiting = items.filter((i) => i.stage === "MENUNGGU_BAYAR");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Antrian Pasien Hari Ini</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Nomor antrian per kanal (A = loket, O = online, C = CITO). Kasir memanggil berdasarkan nomor.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="px-3 py-2 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs font-semibold rounded-lg text-[#1C1C1C] inline-flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Segarkan
        </button>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={<Users className="w-4 h-4" />} label="Total Antrian" value={summary.total} cls="text-[#0F6E5A]" />
        <SummaryCard icon={<CreditCard className="w-4 h-4" />} label="Menunggu Kasir" value={summary.menungguBayar} cls="text-[#B57917]" />
        <SummaryCard icon={<TestTube2 className="w-4 h-4" />} label="Diproses Lab" value={summary.diLab} cls="text-[#3B7DD8]" />
        <SummaryCard icon={<CheckCircle2 className="w-4 h-4" />} label="Selesai" value={summary.selesai} cls="text-[#1B8A5A]" />
      </div>

      {/* Panggilan berikutnya di kasir */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 shadow-2xs">
        <p className="text-xs font-semibold text-[#6B6B6B] mb-2">Berikutnya dipanggil ke Kasir</p>
        {waiting.length === 0 ? (
          <p className="text-xs text-[#6B6B6B] py-4 text-center">Tidak ada antrian menunggu pembayaran.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {waiting.slice(0, 8).map((i) => (
              <div
                key={i.id}
                className={`px-3 py-2 rounded-xl border text-center ${
                  i.priority === "CITO" ? "border-[#D64545] bg-[#D64545]/5" : "border-[#0F6E5A]/30 bg-[#0F6E5A]/5"
                }`}
              >
                <div className={`text-lg font-extrabold tabular-nums ${i.priority === "CITO" ? "text-[#D64545]" : "text-[#0F6E5A]"}`}>
                  {i.queueNo}
                </div>
                <div className="text-[10px] text-[#6B6B6B] max-w-[90px] truncate">{i.patientName}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabel lengkap */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-xs">
          <thead className="bg-[#F7F7F6] text-[#6B6B6B]">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5">No. Antrian</th>
              <th className="text-left font-semibold px-4 py-2.5">Pasien</th>
              <th className="text-left font-semibold px-4 py-2.5">No. Lab</th>
              <th className="text-left font-semibold px-4 py-2.5">Prioritas</th>
              <th className="text-left font-semibold px-4 py-2.5">Tahap</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#6B6B6B]">
                  {loading ? "Memuat antrian..." : "Belum ada antrian hari ini."}
                </td>
              </tr>
            ) : (
              items.map((i) => (
                <tr key={i.id} className="border-t border-[#E5E5E3]">
                  <td className="px-4 py-2.5">
                    <span className={`font-extrabold tabular-nums ${i.priority === "CITO" ? "text-[#D64545]" : "text-[#0F6E5A]"}`}>
                      {i.queueNo}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-[#1C1C1C]">{i.patientName}</div>
                    <div className="text-[10px] text-[#6B6B6B] tabular-nums">{i.patientRm}</div>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-[#1C1C1C]">{i.labNo}</td>
                  <td className="px-4 py-2.5">
                    {i.priority === "CITO" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#D64545]/15 text-[#D64545]">
                        <Flame className="w-3 h-3" /> CITO
                      </span>
                    ) : (
                      <span className="text-[#6B6B6B]">Normal</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STAGE_META[i.stage].cls}`}>
                      {STAGE_META[i.stage].label}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, cls }: { icon: React.ReactNode; label: string; value: number; cls: string }) {
  return (
    <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs">
      <div className={`flex items-center gap-1.5 text-[11px] font-medium ${cls}`}>
        {icon} {label}
      </div>
      <div className="text-2xl font-extrabold text-[#1C1C1C] mt-1 tabular-nums">{value}</div>
    </div>
  );
}
