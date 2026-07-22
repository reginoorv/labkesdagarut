"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, RefreshCw, Wallet, Users, Timer, ShieldAlert, Download } from "lucide-react";

type ReportType = "keuangan" | "kunjungan" | "tat" | "audit";

interface ReportData {
  summary: { label: string; value: string }[];
  breakdowns: { title: string; items: { label: string; value: string; raw: number }[] }[];
  table: { columns: string[]; rows: string[][] };
}

const TABS: { key: ReportType; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "keuangan", label: "Keuangan", icon: <Wallet className="w-4 h-4" />, desc: "Rekapitulasi pendapatan & transaksi pembayaran" },
  { key: "kunjungan", label: "Kunjungan & Volume", icon: <Users className="w-4 h-4" />, desc: "Volume pasien, faskes perujuk, dan kanal pendaftaran" },
  { key: "tat", label: "TAT & Mutu", icon: <Timer className="w-4 h-4" />, desc: "Turn Around Time dan mutu pelaporan nilai kritis" },
  { key: "audit", label: "Aktivitas & Audit", icon: <ShieldAlert className="w-4 h-4" />, desc: "Jejak aktivitas pengguna sistem" },
];

const PERIODS = [
  { key: "HARIAN", label: "Hari Ini" },
  { key: "MINGGUAN", label: "7 Hari" },
  { key: "BULANAN", label: "30 Hari" },
  { key: "TAHUNAN", label: "1 Tahun" },
];

export default function LaporanPage() {
  const [tab, setTab] = useState<ReportType>("keuangan");
  const [period, setPeriod] = useState("BULANAN");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/laporan?type=${tab}&period=${period}`);
      const json = await res.json();
      if (json.success) setData(json);
      else setError(json.error || "Gagal memuat laporan.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, period]);

  const exportCsv = () => {
    if (!data) return;
    const { columns, rows } = data.table;
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [columns.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${tab}-${period.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E5E3]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#0F6E5A] text-white rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#1C1C1C] tracking-tight">Laporan & Rekapitulasi</h1>
            <p className="text-xs text-[#6B6B6B] mt-0.5">Laporan operasional menyeluruh — khusus Administrator Sistem.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] rounded-lg text-xs font-semibold text-[#1C1C1C] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0F6E5A] ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={!data || data.table.rows.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F6E5A] hover:bg-[#0B5445] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* Tabs + Period */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                tab === t.key
                  ? "bg-[#E4F2EE] border-[#0F6E5A]/30 text-[#0F6E5A]"
                  : "bg-white border-[#E5E5E3] text-[#6B6B6B] hover:bg-[#F7F7F6]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white border border-[#E5E5E3] rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                period === p.key ? "bg-[#0F6E5A] text-white" : "text-[#6B6B6B] hover:bg-neutral-100"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-[#6B6B6B] -mt-2">{activeTab.desc}</p>

      {error && (
        <div className="p-4 rounded-lg bg-[#D64545]/10 border border-[#D64545]/30 text-sm text-[#D64545]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-white border border-[#E5E5E3] rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white border border-[#E5E5E3] rounded-xl animate-pulse" />
        </div>
      ) : data ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {data.summary.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="bg-white border border-[#E5E5E3] rounded-xl p-4 shadow-2xs"
              >
                <span className="text-xs font-medium text-[#6B6B6B]">{s.label}</span>
                <div className="mt-1.5 text-xl font-bold text-[#1C1C1C] tabular-nums break-words">{s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Breakdowns */}
          {data.breakdowns.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {data.breakdowns.map((b) => {
                const max = Math.max(...b.items.map((i) => i.raw), 1);
                return (
                  <div key={b.title} className="bg-white border border-[#E5E5E3] rounded-xl p-4 shadow-2xs">
                    <h3 className="text-sm font-bold text-[#1C1C1C] pb-2 mb-2 border-b border-[#E5E5E3]">{b.title}</h3>
                    <div className="space-y-2.5">
                      {b.items.length === 0 && <p className="text-xs text-[#6B6B6B]">Tidak ada data.</p>}
                      {b.items.map((it) => (
                        <div key={it.label}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-[#1C1C1C] font-medium truncate pr-2">{it.label}</span>
                            <span className="text-[#6B6B6B] tabular-nums shrink-0">{it.value}</span>
                          </div>
                          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#0F6E5A] rounded-full" style={{ width: `${(it.raw / max) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl shadow-2xs overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E5E3] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#1C1C1C]">Rincian Data</h3>
              <span className="text-[11px] text-[#6B6B6B]">{data.table.rows.length} baris</span>
            </div>
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-xs">
                <thead className="bg-[#F7F7F6] sticky top-0">
                  <tr>
                    {data.table.columns.map((c) => (
                      <th key={c} className="px-3 py-2 text-left font-semibold text-[#6B6B6B] whitespace-nowrap">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.table.rows.length === 0 ? (
                    <tr>
                      <td colSpan={data.table.columns.length} className="px-3 py-8 text-center text-[#6B6B6B]">
                        Tidak ada data pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    data.table.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-[#E5E5E3] hover:bg-[#F7F7F6]">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-3 py-2 text-[#1C1C1C] whitespace-nowrap max-w-[280px] truncate" title={cell}>{cell}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
