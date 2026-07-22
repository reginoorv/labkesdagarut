"use client";

import React, { useState, useEffect } from "react";
import {
  AlertOctagon,
  ArrowUpDown,
  Search,
  Filter,
  RefreshCw,
  PhoneCall,
} from "lucide-react";
import Link from "next/link";

interface FlaggedResult {
  id: number;
  labNo: string;
  patientName: string;
  patientRm: string;
  doctorName: string;
  category: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: "CRITICAL" | "HIGH" | "LOW";
  priority: string;
}

export default function AutoFlaggingPage() {
  const [flaggedData, setFlaggedData] = useState<FlaggedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [flagFilter, setFlagFilter] = useState("ALL");

  const fetchAutoFlagging = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/examinations");
      const data = await res.json();
      if (data.success && data.examinations) {
        const abnormalList: FlaggedResult[] = [];

        data.examinations.forEach((exam: any) => {
          exam.details?.forEach((d: any) => {
            if (d.flag && d.flag !== "NORMAL") {
              abnormalList.push({
                id: d.id,
                labNo: exam.labNo,
                patientName: exam.patientName,
                patientRm: exam.patientRm,
                doctorName: exam.doctorName,
                category: d.category,
                testName: d.testName,
                value: d.value,
                unit: d.unit,
                referenceRange: d.referenceRange,
                flag: d.flag,
                priority: exam.priority,
              });
            }
          });
        });

        // Sort by severity: CRITICAL first, then HIGH/LOW
        const severityRank = { CRITICAL: 1, HIGH: 2, LOW: 3 };
        abnormalList.sort((a, b) => severityRank[a.flag] - severityRank[b.flag]);

        setFlaggedData(abnormalList);
      }
    } catch (e) {
      console.error("Auto flagging fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutoFlagging();
  }, []);

  const filtered = flaggedData.filter((item) => {
    const matchSearch =
      item.patientName.toLowerCase().includes(search.toLowerCase()) ||
      item.labNo.toLowerCase().includes(search.toLowerCase()) ||
      item.testName.toLowerCase().includes(search.toLowerCase());
    const matchFlag = flagFilter === "ALL" || item.flag === flagFilter;
    return matchSearch && matchFlag;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Auto Flagging Hasil Abnormal</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Daftar penandaan otomatis hasil tes di luar nilai rujukan normal, diurutkan berdasarkan tingkat keparahan.
          </p>
        </div>

        <button
          onClick={fetchAutoFlagging}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs font-semibold rounded-lg text-[#1C1C1C]"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" />
          Reload Flagging
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pasien, parameter, No. Lab..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
            <Filter className="w-3.5 h-3.5" />
            <span>Tingkat Severity:</span>
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              className="h-8 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
            >
              <option value="ALL">Semua Abnormal</option>
              <option value="CRITICAL">Hanya Nilai Kritis</option>
              <option value="HIGH">Tinggi (HIGH)</option>
              <option value="LOW">Rendah (LOW)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Auto Flagging Data Table */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
                <th className="py-3 px-4">STATUS FLAG</th>
                <th className="py-3 px-4">PASIEN & NO. LAB</th>
                <th className="py-3 px-4">PARAMETER</th>
                <th className="py-3 px-4 text-right">HASIL</th>
                <th className="py-3 px-4">NILAI RUJUKAN</th>
                <th className="py-3 px-4">DOKTER PENGIRIM</th>
                <th className="py-3 px-4 text-right">AKSI SOP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((item) => {
                  const isCritical = item.flag === "CRITICAL";

                  return (
                    <tr
                      key={item.id}
                      className={isCritical ? "bg-[#FDECEC]/80 hover:bg-[#FDECEC]" : "hover:bg-[#F7F7F6]"}
                    >
                      <td className="py-3 px-4">
                        {isCritical ? (
                          <span className="px-2.5 py-1 rounded text-[10px] font-extrabold bg-[#D64545] text-white inline-flex items-center gap-1 shadow-xs pulse-critical">
                            <AlertOctagon className="w-3 h-3" /> KRITIS
                          </span>
                        ) : item.flag === "HIGH" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D64545]/15 text-[#D64545]">
                            TINGGI (H)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3B7DD8]/15 text-[#3B7DD8]">
                            RENDAH (L)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1C1C1C]">{item.patientName}</div>
                        <div className="text-[11px] text-[#6B6B6B] tabular-nums mt-0.5">
                          {item.labNo} • {item.patientRm}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#1C1C1C]">
                        {item.testName}
                        <span className="block text-[10px] text-[#6B6B6B] font-normal">
                          {item.category}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-bold tabular-nums text-sm ${
                        isCritical ? "text-[#D64545]" : item.flag === "HIGH" ? "text-[#D64545]" : "text-[#3B7DD8]"
                      }`}>
                        {item.value} <span className="text-xs font-normal text-[#6B6B6B]">{item.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-[#6B6B6B] tabular-nums">{item.referenceRange}</td>
                      <td className="py-3 px-4 text-[#1C1C1C]">{item.doctorName}</td>
                      <td className="py-3 px-4 text-right">
                        {isCritical ? (
                          <Link
                            href="/pemeriksaan/nilai-kritis"
                            className="px-2.5 py-1 bg-[#D64545] hover:bg-[#b83838] text-white rounded-md text-[11px] font-bold inline-flex items-center gap-1 shadow-xs"
                          >
                            <PhoneCall className="w-3 h-3" /> Lapor Nilai Kritis
                          </Link>
                        ) : (
                          <span className="text-[11px] text-[#6B6B6B]">Auto Flagging Done</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B6B6B]">
                    Tidak ada parameter hasil abnormal yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
