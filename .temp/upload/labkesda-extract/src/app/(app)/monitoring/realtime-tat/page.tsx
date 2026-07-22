"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Clock,
  RefreshCw,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface ActiveTatPatient {
  id: number;
  labNo: string;
  patientName: string;
  patientRm: string;
  doctorName: string;
  priority: string;
  status: string;
  sampleReceivedAt: string;
  targetMinutes: number;
  elapsedMinutes: number;
}

// Hanya sampel yang masih dalam proses yang dimonitor TAT-nya (jam terus berjalan).
// Sampel SELESAI/VALIDA sudah berhenti (TAT final) → tampil di Laporan TAT, bukan di sini.
const ACTIVE_STATUSES = ["REGISTRASI", "PROSES"];

export default function RealtimeTatPage() {
  const [activePatients, setActivePatients] = useState<ActiveTatPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchRealtimeData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/examinations");
      const data = await res.json();
      if (data.success && data.examinations) {
        const now = new Date();
        const list: ActiveTatPatient[] = data.examinations
          // Hanya sampel aktif (masih diproses) — sinkron dengan status pemeriksaan.
          .filter((exam: any) => ACTIVE_STATUSES.includes(exam.status))
          .map((exam: any) => {
            const recAt = new Date(exam.sampleReceivedAt || exam.createdAt);
            const elapsed = Math.max(
              1,
              Math.floor((now.getTime() - recAt.getTime()) / (1000 * 60))
            );
            // Target TAT diambil dari DB (sinkron dengan Laporan TAT); fallback per prioritas.
            const target = exam.targetTatMinutes ?? (exam.priority === "CITO" ? 60 : 120);

            return {
              id: exam.id,
              labNo: exam.labNo,
              patientName: exam.patientName,
              patientRm: exam.patientRm,
              doctorName: exam.doctorName,
              priority: exam.priority,
              status: exam.status,
              sampleReceivedAt: recAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
              targetMinutes: target,
              elapsedMinutes: elapsed,
            };
          })
          // Yang paling mendesak (persentase TAT tertinggi) di atas.
          .sort((a: ActiveTatPatient, b: ActiveTatPatient) =>
            b.elapsedMinutes / b.targetMinutes - a.elapsedMinutes / a.targetMinutes
          );

        setActivePatients(list);
        setLastUpdated(now.toLocaleTimeString("id-ID"));
      }
    } catch (e) {
      console.error("TAT fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeData();
    const interval = setInterval(fetchRealtimeData, 15000); // 15s auto refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1C1C1C]">Monitoring Real Time TAT Pasien</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#1B8A5A]/10 border border-[#1B8A5A]/30 text-[11px] font-semibold text-[#1B8A5A]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1B8A5A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1B8A5A]"></span>
              </span>
              <span>Live Monitor Auto-Refresh (15s)</span>
            </div>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Indikator progres waktu proses sampel (Turn Around Time) sejak penerimaan hingga pengesahan.
          </p>
        </div>

        <button
          onClick={fetchRealtimeData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs font-semibold rounded-lg text-[#1C1C1C]"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" />
          <span>Update Sekarang ({lastUpdated})</span>
        </button>
      </div>

      {/* Patients Active TAT Cards */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-[#E5E5E3] rounded-xl p-4 animate-pulse" />
          ))
        ) : activePatients.length > 0 ? (
          activePatients.map((p) => {
            const percentage = Math.min(100, Math.round((p.elapsedMinutes / p.targetMinutes) * 100));
            let colorClass = "bg-[#1B8A5A]";
            let borderClass = "border-[#E5E5E3]";
            let statusBadge = "Target Aman";

            if (percentage >= 85) {
              colorClass = "bg-[#D64545]";
              borderClass = "border-[#D64545]/40 bg-[#D64545]/5";
              statusBadge = "Mendekati / Melewati Target!";
            } else if (percentage >= 60) {
              colorClass = "bg-[#E8A33D]";
              borderClass = "border-[#E8A33D]/30";
              statusBadge = "Perhatian TAT";
            }

            return (
              <div
                key={p.id}
                className={`bg-white border rounded-xl p-4 shadow-2xs space-y-3 transition-colors ${borderClass}`}
              >
                {/* Patient Row Top */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-[#1C1C1C]">{p.patientName}</span>
                    <span className="font-bold text-xs text-[#0F6E5A] bg-[#E4F2EE] px-2 py-0.5 rounded tabular-nums">
                      {p.labNo}
                    </span>
                    <span className="text-xs text-[#6B6B6B] tabular-nums">({p.patientRm})</span>
                    {p.priority === "CITO" && (
                      <span className="px-2 py-0.5 bg-[#D64545] text-white text-[10px] font-extrabold rounded flex items-center gap-1">
                        <Flame className="w-3 h-3" /> CITO (Target {p.targetMinutes}m)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[#6B6B6B]">Masuk: <span className="font-bold text-[#1C1C1C]">{p.sampleReceivedAt} WIB</span></span>
                    <span className="font-bold text-[#1C1C1C] tabular-nums bg-[#F7F7F6] px-2.5 py-1 rounded border border-[#E5E5E3]">
                      Waktu Berjalan: {p.elapsedMinutes} / {p.targetMinutes} Mins
                    </span>
                  </div>
                </div>

                {/* Dynamic TAT Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#6B6B6B]">Progres TAT: <strong className="text-[#1C1C1C]">{percentage}%</strong></span>
                    <span className={`font-bold ${percentage >= 85 ? "text-[#D64545]" : percentage >= 60 ? "text-[#E8A33D]" : "text-[#1B8A5A]"}`}>
                      {statusBadge}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white rounded-xl border border-[#E5E5E3] text-xs text-[#6B6B6B]">
            Tidak ada sampel aktif dalam monitoring TAT.
          </div>
        )}
      </div>
    </div>
  );
}
