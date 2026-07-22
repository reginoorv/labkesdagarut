"use client";

import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Square,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

interface Examination {
  id: number;
  labNo: string;
  patientRm: string;
  patientName: string;
  patientGender: string;
  doctorName: string;
  priority: string;
  status: string;
  sampleReceivedAt: string;
  validatedAt?: string;
  details: Array<{
    id: number;
    testName: string;
    value: string;
    unit: string;
    referenceRange: string;
    flag: string;
  }>;
}

export default function ValidasiPasienPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [pendingExams, setPendingExams] = useState<Examination[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const fetchUnvalidated = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/examinations");
      const data = await res.json();
      if (data.success) {
        // Hanya sampel berstatus SELESAI (sudah diinput analis, belum divalidasi).
        // Yang masih REGISTRASI/PROSES belum boleh divalidasi PJ Lab.
        const unvalidated = data.examinations.filter(
          (e: Examination) => e.status === "SELESAI"
        );
        setPendingExams(unvalidated);
        setSelectedIds([]);
        setExpandedIds([]);
      }
    } catch (e) {
      console.error("Fetch pending validation error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnvalidated();
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === pendingExams.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingExams.map((e) => e.id));
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchValidate = async () => {
    if (selectedIds.length === 0) {
      showToast({
        type: "warning",
        title: "Pilih Minimal Satu Hasil",
        description: "Beri tanda centang pada sampel yang ingin divalidasi.",
      });
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch("/api/examinations/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examinationIds: selectedIds,
          validatorName: "Kurnia, A.Md.AK (Analis Utama)",
        }),
      });
      const data = await res.json();

      if (data.success) {
        const validatedIds = [...selectedIds];
        showToast({
          type: "success",
          title: "Validasi Massal Berhasil",
          description:
            validatedIds.length === 1
              ? "Hasil disahkan. Membuka surat hasil untuk dicetak..."
              : `${validatedIds.length} sampel hasil laboratorium telah disahkan. Cetak surat hasil dari menu Detail Data Pemeriksaan.`,
        });
        fetchUnvalidated();
        // Jika hanya satu sampel, langsung arahkan ke surat hasil siap cetak.
        if (validatedIds.length === 1) {
          router.push(`/pemeriksaan/hasil/${validatedIds[0]}`);
        }
      } else {
        showToast({
          type: "error",
          title: "Gagal Mengesahkan",
          description: data.error,
        });
      }
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Koneksi Terputus",
        description: e.message,
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Validasi Pasien & Hasil Lab</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Verifikasi dan pengesahan resmi hasil analisis spesimen oleh Penanggung Jawab Lab / Analis Utama.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUnvalidated}
            className="p-2 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs rounded-lg text-[#1C1C1C]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" />
          </button>
          <button
            onClick={handleBatchValidate}
            disabled={isValidating || selectedIds.length === 0}
            className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center gap-2 ${
              selectedIds.length > 0
                ? "bg-[#1B8A5A] hover:bg-[#156e48] text-white"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validasi Terpilih ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* Control Selection Strip */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
        <button
          onClick={selectAll}
          className="text-xs text-[#0F6E5A] font-semibold hover:underline flex items-center gap-2"
        >
          {selectedIds.length === pendingExams.length && pendingExams.length > 0 ? (
            <CheckSquare className="w-4 h-4 text-[#0F6E5A]" />
          ) : (
            <Square className="w-4 h-4 text-[#6B6B6B]" />
          )}
          <span>
            {selectedIds.length === pendingExams.length && pendingExams.length > 0
              ? "Batalkan Semua Pilihan"
              : `Pilih Semua Sampel (${pendingExams.length})`}
          </span>
        </button>

        <div className="text-xs text-[#6B6B6B]">
          Menampilkan <span className="font-bold text-[#1C1C1C]">{pendingExams.length}</span> antrean yang menunggu validasi
        </div>
      </div>

      {/* Validation Queue Accordion List */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 bg-white border border-[#E5E5E3] rounded-xl animate-pulse" />
          ))
        ) : pendingExams.length > 0 ? (
          pendingExams.map((exam) => {
            const isSelected = selectedIds.includes(exam.id);
            const isExpanded = expandedIds.includes(exam.id);
            const hasCritical = exam.details.some((d) => d.flag === "CRITICAL");

            return (
              <div
                key={exam.id}
                className={`bg-white border rounded-xl overflow-hidden transition-all shadow-2xs ${
                  isSelected
                    ? "border-[#1B8A5A] bg-[#1B8A5A]/5"
                    : hasCritical
                    ? "border-[#D64545]/40"
                    : "border-[#E5E5E3]"
                }`}
              >
                {/* Header Strip */}
                <div className="p-3.5 flex items-center justify-between gap-3 border-b border-[#E5E5E3] bg-white">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(exam.id)}
                      className="w-4 h-4 accent-[#1B8A5A] cursor-pointer"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#1C1C1C]">{exam.patientName}</span>
                        <span className="text-[11px] font-bold text-[#0F6E5A] bg-[#E4F2EE] px-2 py-0.5 rounded">
                          {exam.labNo}
                        </span>
                        <span className="text-[11px] text-[#6B6B6B]">({exam.patientRm})</span>
                        {exam.priority === "CITO" && (
                          <span className="px-1.5 py-0.2 bg-[#D64545] text-white text-[9px] font-bold rounded">
                            CITO
                          </span>
                        )}
                        {hasCritical && (
                          <span className="px-1.5 py-0.2 bg-[#D64545]/15 text-[#D64545] text-[9px] font-bold rounded flex items-center gap-1 border border-[#D64545]/30">
                            <AlertTriangle className="w-2.5 h-2.5" /> Nilai Kritis
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6B6B6B] mt-0.5">
                        Dokter Pengirim: {exam.doctorName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpand(exam.id)}
                      className="px-2.5 py-1 bg-[#F7F7F6] hover:bg-neutral-200/60 border border-[#E5E5E3] rounded-md text-[11px] font-medium text-[#1C1C1C] flex items-center gap-1"
                    >
                      {isExpanded ? "Tutup Detail" : "Pratinjau Parameter"}
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Parameter Details Table */}
                {isExpanded && (
                  <div className="p-3 bg-[#F7F7F6] border-t border-[#E5E5E3]">
                    <table className="w-full text-left text-xs bg-white rounded-lg overflow-hidden border border-[#E5E5E3]">
                      <thead>
                        <tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
                          <th className="py-2 px-3">PARAMETER</th>
                          <th className="py-2 px-3 text-right">HASIL</th>
                          <th className="py-2 px-3">SATUAN</th>
                          <th className="py-2 px-3">RUJUKAN</th>
                          <th className="py-2 px-3 text-center">FLAG</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E3]">
                        {exam.details.map((d) => (
                          <tr
                            key={d.id}
                            className={d.flag === "CRITICAL" ? "bg-[#FDECEC]" : "hover:bg-[#F7F7F6]"}
                          >
                            <td className="py-2 px-3 font-semibold text-[#1C1C1C]">{d.testName}</td>
                            <td className="py-2 px-3 text-right font-bold tabular-nums">{d.value}</td>
                            <td className="py-2 px-3 text-[#6B6B6B]">{d.unit}</td>
                            <td className="py-2 px-3 text-[#6B6B6B]">{d.referenceRange}</td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  d.flag === "CRITICAL"
                                    ? "bg-[#D64545] text-white"
                                    : d.flag === "HIGH"
                                    ? "bg-[#D64545]/15 text-[#D64545]"
                                    : d.flag === "LOW"
                                    ? "bg-[#3B7DD8]/15 text-[#3B7DD8]"
                                    : "bg-[#1B8A5A]/15 text-[#1B8A5A]"
                                }`}
                              >
                                {d.flag}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white rounded-xl border border-[#E5E5E3] text-xs text-[#6B6B6B]">
            Semua hasil pemeriksaan telah divalidasi. Tidak ada antrean pending saat ini.
          </div>
        )}
      </div>
    </div>
  );
}
