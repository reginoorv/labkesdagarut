"use client";

import React, { useEffect, useState } from "react";
import {
  Download,
  FileSpreadsheet,
  Filter,
  CheckCircle2,
  RefreshCw,
  Inbox,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useToast } from "@/components/ui/ToastProvider";

type TrendPoint = { day: string; tat: number; target: number };
type CategoryRow = {
  category: string;
  count: number;
  avgTat: number;
  compliance: string;
  compliant: boolean;
};
type TatReport = {
  trend: TrendPoint[];
  categoryBreakdown: CategoryRow[];
  summary: { totalCompleted: number; overallAvgTat: number; overallCompliance: string };
};

export default function LaporanTatPage() {
  const { showToast } = useToast();
  const [period, setPeriod] = useState("MINGGUAN");
  const [data, setData] = useState<TatReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/tat-report?period=${period}`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setData({
            trend: res.trend,
            categoryBreakdown: res.categoryBreakdown,
            summary: res.summary,
          });
        } else {
          showToast({ type: "error", title: "Gagal memuat", description: res.error || "Data TAT tidak tersedia." });
        }
      })
      .catch(() => {
        if (!cancelled) showToast({ type: "error", title: "Koneksi gagal", description: "Tidak bisa memuat laporan TAT." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, showToast]);

  const trend = data?.trend ?? [];
  const categoryBreakdown = data?.categoryBreakdown ?? [];
  const overallAvgTat = data?.summary.overallAvgTat ?? 0;
  const overallCompliance = data?.summary.overallCompliance ?? "0.0%";

  const handleExportExcel = () => {
    showToast({
      type: "success",
      title: "Export Excel Berhasil",
      description: "Laporan TAT rekapitulasi di-download (.xlsx).",
    });
  };

  const handleExportPdf = () => {
    showToast({
      type: "info",
      title: "Export PDF Siap",
      description: "Dokumen PDF Laporan TAT resmi ter-generate.",
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Laporan & Rekapitulasi TAT</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Analisis tren pencapaian Turn Around Time per kategori pemeriksaan dan periode evaluasi mutu LIS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs font-semibold rounded-lg text-[#1C1C1C] inline-flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#1B8A5A]" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3.5 py-1.5 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF Resmi</span>
          </button>
        </div>
      </div>

      {/* Filter Period Toolbar */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6B6B6B]" />
          <span className="text-xs font-semibold text-[#1C1C1C]">Periode Laporan:</span>
          <div className="flex items-center gap-1 bg-[#F7F7F6] p-1 rounded-lg border border-[#E5E5E3]">
            {["HARIAN", "MINGGUAN", "BULANAN"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                  period === p
                    ? "bg-[#0F6E5A] text-white shadow-xs"
                    : "text-[#6B6B6B] hover:text-[#1C1C1C]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-[#6B6B6B] flex items-center gap-2">
          {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0F6E5A]" />}
          Rata-rata TAT Keseluruhan:{" "}
          <span className="font-bold text-[#0F6E5A] tabular-nums">{overallAvgTat} Menit</span>
        </div>
      </div>

      {/* Recharts Line Chart Trend */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
          <div>
            <h3 className="text-sm font-bold text-[#1C1C1C]">Grafik Tren Rata-rata TAT (Menit)</h3>
            <p className="text-[11px] text-[#6B6B6B]">Target acuan standar pelaporan: ≤ 120 menit</p>
          </div>
          <span className="text-xs text-[#1B8A5A] bg-[#1B8A5A]/10 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Kepatuhan TAT {overallCompliance}
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          {trend.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#6B6B6B] gap-2">
              <Inbox className="w-8 h-8 text-[#E5E5E3]" />
              <p className="text-xs">{loading ? "Memuat data..." : "Belum ada pemeriksaan selesai pada periode ini."}</p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tickLine={false} fontSize={11} stroke="#6B6B6B" />
              <YAxis tickLine={false} fontSize={11} stroke="#6B6B6B" unit="m" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderColor: "#E5E5E3",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="tat"
                name="Rata-rata TAT (Mins)"
                stroke="#0F6E5A"
                strokeWidth={3}
                dot={{ r: 4, fill: "#0F6E5A" }}
              />
              <Line
                type="monotone"
                dataKey="target"
                name="Target Maksimum (120m)"
                stroke="#D64545"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Breakdown per Category Table */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E3] bg-[#F7F7F6]">
          <h3 className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wider">
            Breakdown TAT Berdasarkan Kategori Lab
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
                <th className="py-3 px-4">KATEGORI PEMERIKSAAN</th>
                <th className="py-3 px-4 text-center">JUMLAH SPESIMEN</th>
                <th className="py-3 px-4 text-center">RATA-RATA TAT (MINS)</th>
                <th className="py-3 px-4 text-center">KEPATUHAN TARGET</th>
                <th className="py-3 px-4 text-right">STATUS MUTU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {categoryBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-[#6B6B6B]">
                    {loading ? "Memuat data..." : "Belum ada data pemeriksaan selesai pada periode ini."}
                  </td>
                </tr>
              ) : (
                categoryBreakdown.map((cat, i) => (
                  <tr key={i} className="hover:bg-[#F7F7F6]">
                    <td className="py-3 px-4 font-bold text-[#1C1C1C]">{cat.category}</td>
                    <td className="py-3 px-4 text-center tabular-nums text-[#1C1C1C] font-semibold">
                      {cat.count} Pasien
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums font-bold text-[#0F6E5A]">
                      {cat.avgTat} Menit
                    </td>
                    <td
                      className={`py-3 px-4 text-center tabular-nums font-semibold ${
                        cat.compliant ? "text-[#1B8A5A]" : "text-[#E8A33D]"
                      }`}
                    >
                      {cat.compliance}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          cat.compliant
                            ? "bg-[#1B8A5A]/10 text-[#1B8A5A]"
                            : "bg-[#E8A33D]/10 text-[#E8A33D]"
                        }`}
                      >
                        {cat.compliant ? "Memenuhi Standar" : "Perlu Perhatian"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
