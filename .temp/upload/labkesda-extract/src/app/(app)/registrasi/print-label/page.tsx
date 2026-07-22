"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Printer,
  CheckSquare,
  Square,
  Search,
  Flame,
  Tag,
  RefreshCw,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { Barcode } from "@/components/common/Barcode";
import { useUser } from "@/components/layout/AppLayout";
import { sampleTypesOf, type SampleType } from "@/lib/test-catalog";

interface LabelData {
  id: number;
  labNo: string;
  rmNo: string;
  patientName: string;
  gender: string;
  dob: string;
  priority: string;
  tests: string;
  date: string;
  sampleTypes: SampleType[];
}

function PrintLabelContent() {
  const searchParams = useSearchParams();
  const highlightRm = searchParams.get("rm");
  const { showToast } = useToast();
  const user = useUser();
  const role = user?.role || "";

  // Jenis spesimen yang boleh dicetak per role:
  //   Loket   -> URINE (sampel dikumpulkan pasien di loket)
  //   Analis  -> DARAH (sampel diambil analis saat flebotomi)
  //   Admin & lainnya -> semua (null = tanpa filter)
  const roleSampleType: SampleType | null =
    role === "PETUGAS_LOKET" ? "URINE" : role === "ANALIS_LAB" ? "DARAH" : null;

  const [samples, setSamples] = useState<LabelData[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch registered examinations
    fetch("/api/examinations")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.examinations) {
          const all: LabelData[] = data.examinations.map((item: any) => ({
            id: item.id,
            labNo: item.labNo,
            rmNo: item.patientRm || "RM-2026-00101",
            patientName: item.patientName,
            gender: item.patientGender || "L",
            dob: item.patientDob || "1990-01-01",
            priority: item.priority,
            tests: item.details?.map((d: any) => d.testName).join(", ") || "Hematologi Lengkap, Kimia",
            date: new Date(item.createdAt).toLocaleDateString("id-ID"),
            sampleTypes: sampleTypesOf(
              (item.details || []).map((d: any) => ({ category: d.category, testCode: d.testCode }))
            ),
          }));

          // Saring sesuai spesimen yang jadi tanggung jawab role ini.
          const formatted = roleSampleType
            ? all.filter((s) => s.sampleTypes.includes(roleSampleType))
            : all;

          setSamples(formatted);

          // Auto select highlighted RM if passed in query string
          if (highlightRm) {
            const found = formatted.filter((s: LabelData) => s.rmNo === highlightRm);
            if (found.length > 0) {
              setSelectedIds(found.map((s: LabelData) => s.id));
            } else if (formatted.length > 0) {
              setSelectedIds([formatted[0].id]);
            }
          } else if (formatted.length > 0) {
            setSelectedIds([formatted[0].id]);
          }
        }
      });
  }, [highlightRm, roleSampleType]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredSamples.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSamples.map((s) => s.id));
    }
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) {
      showToast({
        type: "warning",
        title: "Belum Ada Label Dipilih",
        description: "Pilih minimal 1 sampel pasien untuk mencetak label.",
      });
      return;
    }

    window.print();
    showToast({
      type: "success",
      title: "Perintah Cetak Berhasil Dikirim",
      description: `Mencetak ${selectedIds.length} label fisik ke printer barcode.`,
    });
  };

  const filteredSamples = samples.filter(
    (s) =>
      s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rmNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.labNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedSamples = samples.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">
            Print Label Barcode Sampel
            {roleSampleType === "URINE" && <span className="ml-2 text-sm font-semibold text-[#B45309]">— Sampel Urin</span>}
            {roleSampleType === "DARAH" && <span className="ml-2 text-sm font-semibold text-[#B91C1C]">— Sampel Darah</span>}
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            {roleSampleType === "URINE"
              ? "Loket mencetak label untuk spesimen urin (mis. tes narkoba & urinalisis) yang dikumpulkan pasien di loket."
              : roleSampleType === "DARAH"
              ? "Analis mencetak label untuk spesimen darah yang diambil saat flebotomi di ruang sampling."
              : "Cetak label barcode spesimen laboratorium (identitas pasien, barcode Code128, dan daftar pemeriksaan) secara batch atau tunggal."}
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak {selectedIds.length} Label Terpilih</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Table: Select Patient Samples */}
        <div className="lg:col-span-6 bg-white border border-[#E5E5E3] rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari sampel / nama pasien..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
              />
            </div>

            <button
              onClick={selectAll}
              className="text-xs text-[#0F6E5A] font-semibold hover:underline flex items-center gap-1"
            >
              {selectedIds.length === filteredSamples.length ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>Pilih Semua ({filteredSamples.length})</span>
            </button>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredSamples.map((s) => {
              const isSelected = selectedIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleSelect(s.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                    isSelected
                      ? "border-[#0F6E5A] bg-[#E4F2EE]"
                      : "border-[#E5E5E3] bg-[#F7F7F6] hover:bg-neutral-200/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="accent-[#0F6E5A] w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-[#1C1C1C] flex items-center gap-1.5">
                        {s.patientName}
                        {s.priority === "CITO" && (
                          <span className="px-1.5 py-0.2 bg-[#D64545] text-white text-[9px] font-extrabold rounded flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5" /> CITO
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6B6B6B] mt-0.5 tabular-nums">
                        No. Lab: {s.labNo} | No. RM: {s.rmNo}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {s.sampleTypes.map((t) => (
                          <span
                            key={t}
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                              t === "URINE" ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#FEE2E2] text-[#B91C1C]"
                            }`}
                          >
                            {t === "URINE" ? "URIN" : "DARAH"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] text-[#6B6B6B]">{s.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Accurate Scale Label Preview Container */}
        <div className="lg:col-span-6 bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
            <div className="flex items-center gap-2 text-[#0F6E5A] font-semibold text-sm">
              <Tag className="w-4 h-4" />
              Pratinjau Fisik Label Barcode Tabung ({selectedSamples.length} Terpilih)
            </div>
            <span className="text-[10px] text-[#6B6B6B] bg-[#F7F7F6] px-2 py-1 rounded border border-[#E5E5E3]">
              Label Barcode Spesimen
            </span>
          </div>

          <div id="printable-label-area" className="space-y-4 max-h-[460px] overflow-y-auto p-2 bg-[#F7F7F6] rounded-xl border border-[#E5E5E3] flex flex-col items-center">
            {selectedSamples.length > 0 ? (
              selectedSamples.map((s) => (
                <div
                  key={s.id}
                  className="label-card w-[300px] bg-white border border-[#1C1C1C] rounded-md shadow-sm font-sans text-black flex flex-col shrink-0 overflow-hidden"
                >
                  {/* Header institusi */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-black text-white">
                    <span className="text-[10px] font-extrabold tracking-wide uppercase">Labkesda Garut</span>
                    <span
                      className={`px-1.5 py-0.5 text-[8px] font-black rounded border ${
                        s.priority === "CITO" ? "bg-white text-black border-white" : "border-white/60 text-white"
                      }`}
                    >
                      {s.priority}
                    </span>
                  </div>

                  {/* Identitas pasien */}
                  <div className="px-3 pt-2 pb-1">
                    <div className="font-extrabold text-[13px] leading-tight uppercase truncate">
                      {s.patientName}
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 mt-0.5 text-[9px] font-medium leading-snug">
                      <span>No. RM: <span className="font-bold">{s.rmNo}</span></span>
                      <span>JK: <span className="font-bold">{s.gender}</span></span>
                      <span>Tgl Lahir: <span className="font-bold">{s.dob}</span></span>
                      <span>Reg: <span className="font-bold">{s.date}</span></span>
                    </div>
                  </div>

                  {/* Barcode Code128 asli (scannable) */}
                  <div className="px-3 pt-1 pb-2 flex flex-col items-center border-t border-dashed border-black/30 mt-1">
                    <Barcode value={s.labNo} height={38} moduleWidth={1.5} />
                  </div>

                  {/* Daftar tes + jenis spesimen */}
                  <div className="px-3 py-1.5 border-t border-black bg-[#F7F7F6]">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold uppercase text-black/60">Pemeriksaan</span>
                      <span className="text-[8px] font-black uppercase">
                        Spesimen: {s.sampleTypes.map((t) => (t === "URINE" ? "Urin" : "Darah")).join(" + ")}
                      </span>
                    </div>
                    <p className="text-[9px] font-semibold leading-snug">{s.tests}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-xs text-[#6B6B6B]">
                Pilih sampel pasien di sebelah kiri untuk melihat pratinjau label barcode.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrintLabelPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#6B6B6B]">Memuat pratinjau label barcode...</div>}>
      <PrintLabelContent />
    </Suspense>
  );
}
