"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
} from "lucide-react";

interface DuploTest {
  id: number;
  examinationId: number;
  patientName: string;
  labNo: string;
  testName: string;
  category: string;
  value1: string;
  value2: string;
  difference: string;
  isTolerated: boolean;
  unit: string;
  updatedAt: string;
}

export default function HasilDuploPage() {
  const [duploItems, setDuploItems] = useState<DuploTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchDuploData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/examinations");
      const data = await res.json();
      if (data.success && data.examinations) {
        const duplos: DuploTest[] = [];
        data.examinations.forEach((exam: any) => {
          exam.details?.forEach((d: any) => {
            if (d.isDuplo) {
              duplos.push({
                id: d.id,
                examinationId: exam.id,
                patientName: exam.patientName,
                labNo: exam.labNo,
                testName: d.testName,
                category: d.category,
                value1: d.value || "-",
                value2: d.duploValue || "-",
                difference: d.duploDifference || "0%",
                isTolerated: d.duploTolerated ?? true,
                unit: d.unit || "",
                updatedAt: new Date(exam.createdAt).toLocaleTimeString("id-ID"),
              });
            }
          });
        });
        setDuploItems(duplos);
      }
    } catch (e) {
      console.error("Fetch duplo error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuploData();
  }, []);

  const filtered = duploItems.filter(
    (item) =>
      item.patientName.toLowerCase().includes(search.toLowerCase()) ||
      item.labNo.toLowerCase().includes(search.toLowerCase()) ||
      item.testName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#1C1C1C]">Hasil Pemeriksaan Duplo</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#3B7DD8]/10 text-[#3B7DD8]">
              Quality Control Badge: #3B7DD8
            </span>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Komparasi berdampingan (side-by-side) dua pembacaan sampel yang sama untuk presisi & verifikasi hasil abnormal.
          </p>
        </div>

        <button
          onClick={fetchDuploData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs font-semibold rounded-lg text-[#1C1C1C]"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" />
          Reload Kontrol
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pasien atau parameter duplo..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
          />
        </div>

        <div className="text-xs text-[#6B6B6B]">
          Total Pengujian Duplo: <span className="font-bold text-[#1C1C1C]">{duploItems.length}</span>
        </div>
      </div>

      {/* Side-by-side Duplo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-white border border-[#E5E5E3] rounded-xl animate-pulse" />
          ))
        ) : filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-xl p-4 shadow-2xs flex flex-col justify-between space-y-3 ${
                !item.isTolerated ? "border-[#E8A33D]/50 bg-[#E8A33D]/5" : "border-[#E5E5E3]"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-[#E5E5E3] pb-2.5">
                <div>
                  <div className="font-bold text-xs text-[#1C1C1C]">{item.patientName}</div>
                  <div className="text-[11px] text-[#6B6B6B] mt-0.5">
                    {item.labNo} • Parameter: <span className="font-semibold text-[#1C1C1C]">{item.testName}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3B7DD8] text-white">
                  DUPLO QC
                </span>
              </div>

              {/* Side-by-Side Values Comparison */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F7F6] rounded-lg border border-[#E5E5E3]">
                <div className="p-2 bg-white rounded-md border border-[#E5E5E3] text-center">
                  <span className="text-[10px] font-semibold text-[#6B6B6B] block uppercase">
                    Pembacaan 1
                  </span>
                  <span className="text-base font-extrabold text-[#1C1C1C] tabular-nums block mt-1">
                    {item.value1} <span className="text-xs font-normal text-[#6B6B6B]">{item.unit}</span>
                  </span>
                </div>

                <div className="p-2 bg-white rounded-md border border-[#E5E5E3] text-center">
                  <span className="text-[10px] font-semibold text-[#3B7DD8] block uppercase">
                    Pembacaan 2 (Duplo)
                  </span>
                  <span className="text-base font-extrabold text-[#3B7DD8] tabular-nums block mt-1">
                    {item.value2} <span className="text-xs font-normal text-[#6B6B6B]">{item.unit}</span>
                  </span>
                </div>
              </div>

              {/* Difference & Tolerance Alert Badge */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#6B6B6B]">
                  Selisih Pembacaan: <span className="font-bold text-[#1C1C1C]">{item.difference}</span>
                </span>

                {item.isTolerated ? (
                  <span className="text-[11px] font-semibold text-[#1B8A5A] bg-[#1B8A5A]/10 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Dalam Toleransi
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-[#E8A33D] bg-[#E8A33D]/20 px-2 py-0.5 rounded flex items-center gap-1 border border-[#E8A33D]/40">
                    <AlertTriangle className="w-3 h-3" /> Peringatan Beda Toleransi
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-[#E5E5E3] text-xs text-[#6B6B6B]">
            Tidak ada data pemeriksaan duplo ditemukan.
          </div>
        )}
      </div>
    </div>
  );
}
