"use client";

import React, { useState, useEffect } from "react";
import {
  TestTube2,
  Search,
  Filter,
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Save,
  Lock,
  FlaskConical,
  FileText,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { computeFlag, type Flag } from "@/lib/test-catalog";

interface ExamDetail {
  id: number;
  category: string;
  testCode: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
  isDuplo?: boolean;
  duploValue?: string;
}

interface Examination {
  id: number;
  labNo: string;
  patientRm: string;
  patientName: string;
  patientGender: string;
  doctorName: string;
  hospitalName: string;
  priority: string;
  status: string;
  paymentGateStatus: string;
  queueNo?: string;
  createdAt: string;
  details: ExamDetail[];
}

export default function DetailPemeriksaanPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [examinations, setExaminations] = useState<Examination[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [expandedExamIds, setExpandedExamIds] = useState<number[]>([]);
  // Nilai hasil yang sedang diedit per detail: { [detailId]: value }
  const [editValues, setEditValues] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchExaminations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/examinations?priority=${priorityFilter}`);
      const data = await res.json();
      if (data.success) {
        setExaminations(data.examinations);
        // Expand all by default
        setExpandedExamIds(data.examinations.map((e: Examination) => e.id));
        // Seed nilai edit dari nilai tersimpan.
        const seed: Record<number, string> = {};
        data.examinations.forEach((e: Examination) =>
          e.details.forEach((d) => {
            seed[d.id] = d.value ?? "";
          })
        );
        setEditValues(seed);
      }
    } catch (e) {
      console.error("Fetch exam error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExaminations();
  }, [priorityFilter]);

  const toggleExpand = (id: number) => {
    setExpandedExamIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Apakah exam ini boleh diedit analis (gate pembayaran lolos + belum final).
  const isEditable = (exam: Examination) =>
    exam.paymentGateStatus === "LOLOS" &&
    (exam.status === "REGISTRASI" || exam.status === "PROSES");

  const callResults = async (
    exam: Examination,
    action: "start" | "save" | "complete" | "submit",
    details?: { id: number; value: string; referenceRange: string; testCode: string }[]
  ) => {
    setSavingId(exam.id);
    try {
      const res = await fetch(`/api/examinations/${exam.id}/results`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, details }),
      });
      const data = await res.json();
      if (data.success) {
        if (action === "save") {
          showToast({
            type: data.criticalCount ? "warning" : "success",
            title: "Draf Tersimpan",
            description: data.criticalCount
              ? `${data.criticalCount} nilai kritis terdeteksi — segera lapor.`
              : "Nilai parameter tersimpan sebagai draf.",
          });
        } else if (action === "submit") {
          showToast({
            type: data.criticalCount ? "warning" : "success",
            title: "Pemeriksaan Selesai",
            description: data.criticalCount
              ? `Selesai dengan ${data.criticalCount} nilai kritis — menunggu validasi PJ Lab.`
              : "Hasil terkirim, menunggu validasi PJ Lab.",
          });
        } else {
          showToast({ type: "success", title: "Berhasil", description: data.message });
        }
        await fetchExaminations();
      } else {
        showToast({ type: "error", title: "Gagal", description: data.error });
      }
    } catch (e: any) {
      showToast({ type: "error", title: "Error", description: e.message });
    } finally {
      setSavingId(null);
    }
  };

  const buildDetails = (exam: Examination) =>
    exam.details.map((d) => ({
      id: d.id,
      value: editValues[d.id] ?? "",
      referenceRange: d.referenceRange,
      testCode: d.testCode,
    }));

  const handleSaveDraft = (exam: Examination) => callResults(exam, "save", buildDetails(exam));

  const handleSubmit = (exam: Examination) => {
    const empty = exam.details.filter((d) => (editValues[d.id] ?? "").trim() === "");
    if (empty.length > 0) {
      showToast({
        type: "warning",
        title: "Nilai belum lengkap",
        description: `Masih ada ${empty.length} parameter kosong. Lengkapi semua nilai sebelum menyelesaikan.`,
      });
      return;
    }
    callResults(exam, "submit", buildDetails(exam));
  };

  // Flag pratinjau real-time saat analis mengetik (tanpa simpan ke server).
  const previewFlag = (d: ExamDetail): Flag => {
    const v = editValues[d.id];
    if (v === undefined || v === "") return "NORMAL";
    return computeFlag(v, d.referenceRange, d.testCode);
  };

  const filteredExams = examinations.filter((e) => {
    const matchSearch =
      !search ||
      e.patientName.toLowerCase().includes(search.toLowerCase()) ||
      e.labNo.toLowerCase().includes(search.toLowerCase()) ||
      e.patientRm.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Detail Data Pemeriksaan Lab</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Rincian parameter hasil laboratorium per spesimen, nilai rujukan, dan penandaan otomatis (flagging).
          </p>
        </div>

        <button
          onClick={fetchExaminations}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs font-semibold rounded-lg text-[#1C1C1C]"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" />
          Reload Hasil
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pasien, No. Lab, atau RM..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
            <Filter className="w-3.5 h-3.5" />
            <span>Prioritas:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="CITO">CITO (Urgent)</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Examinations List with Expandable Parameter Tables */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white border border-[#E5E5E3] rounded-xl p-4 animate-pulse" />
          ))
        ) : filteredExams.length > 0 ? (
          filteredExams.map((exam) => {
            const isExpanded = expandedExamIds.includes(exam.id);
            const hasCritical = exam.details.some((d) => d.flag === "CRITICAL");

            return (
              <div
                key={exam.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-2xs transition-all ${
                  hasCritical ? "border-[#D64545]/40" : "border-[#E5E5E3]"
                }`}
              >
                {/* Examination Card Top Info */}
                <div
                  onClick={() => toggleExpand(exam.id)}
                  className="p-4 bg-[#F7F7F6]/80 hover:bg-[#F7F7F6] border-b border-[#E5E5E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 text-[#6B6B6B]">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1C1C1C]">
                          {exam.patientName}
                        </span>
                        <span className="font-semibold text-xs text-[#0F6E5A] bg-[#E4F2EE] px-2 py-0.5 rounded tabular-nums">
                          {exam.labNo}
                        </span>
                        <span className="text-xs text-[#6B6B6B] tabular-nums">
                          ({exam.patientRm})
                        </span>
                        {exam.priority === "CITO" && (
                          <span className="px-1.5 py-0.2 bg-[#D64545] text-white text-[10px] font-extrabold rounded">
                            CITO
                          </span>
                        )}
                        {hasCritical && (
                          <span className="px-1.5 py-0.2 bg-[#D64545]/15 text-[#D64545] text-[10px] font-bold rounded border border-[#D64545]/30">
                            CRITICAL VALUE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6B6B6B] mt-0.5">
                        Dokter: {exam.doctorName} • RS: {exam.hospitalName || "RSUD dr. Slamet Garut"}
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 justify-between sm:justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {exam.queueNo && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#0F6E5A]/10 text-[#0F6E5A] tabular-nums">
                        {exam.queueNo}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-[#E5E5E3] text-[#1C1C1C]">
                      {exam.status}
                    </span>

                    {exam.paymentGateStatus !== "LOLOS" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8A33D]/15 text-[#B57917]">
                        <Lock className="w-3 h-3" /> Menunggu Kasir
                      </span>
                    ) : (exam.status === "REGISTRASI" || exam.status === "PROSES") ? (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSaveDraft(exam); }}
                          disabled={savingId === exam.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-[#0F6E5A] text-[#0F6E5A] hover:bg-[#E4F2EE] disabled:opacity-60"
                          title="Simpan nilai sementara tanpa menyelesaikan"
                        >
                          <Save className="w-3 h-3" /> Simpan Draf
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSubmit(exam); }}
                          disabled={savingId === exam.id}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0F6E5A] hover:bg-[#0B5445] text-white disabled:opacity-60"
                          title="Simpan semua nilai lalu kirim untuk divalidasi PJ Lab"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Simpan & Selesaikan
                        </button>
                      </>
                    ) : exam.status === "VALIDA" ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/pemeriksaan/hasil/${exam.id}`); }}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-[#0F6E5A] text-[#0F6E5A] hover:bg-[#E4F2EE]"
                      >
                        <FileText className="w-3 h-3" /> Cetak Surat Hasil
                      </button>
                    ) : exam.status === "SELESAI" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#3B7DD8]/15 text-[#3B7DD8]">
                        <Clock className="w-3 h-3" /> Menunggu Validasi PJ Lab
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Expanded Details Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
                          <th className="py-2.5 px-4">KATEGORI</th>
                          <th className="py-2.5 px-4">PARAMETER PEMERIKSAAN</th>
                          <th className="py-2.5 px-4 text-right">HASIL</th>
                          <th className="py-2.5 px-4">SATUAN</th>
                          <th className="py-2.5 px-4">NILAI RUJUKAN</th>
                          <th className="py-2.5 px-4 text-center">FLAG AUTO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E3]">
                        {exam.details.map((d) => {
                          const editable = isEditable(exam);
                          // Saat mengedit tampilkan flag pratinjau; jika tidak, flag tersimpan.
                          const activeFlag: Flag = editable ? previewFlag(d) : (d.flag as Flag);
                          const isCritical = activeFlag === "CRITICAL";
                          const isHigh = activeFlag === "HIGH";
                          const isLow = activeFlag === "LOW";

                          return (
                            <tr
                              key={d.id}
                              className={isCritical ? "bg-[#FDECEC]" : "hover:bg-[#F7F7F6]"}
                            >
                              <td className="py-2.5 px-4 font-semibold text-[#6B6B6B]">
                                {d.category}
                              </td>
                              <td className="py-2.5 px-4 font-bold text-[#1C1C1C]">
                                {d.testName}
                                {d.isDuplo && (
                                  <span className="ml-2 px-1.5 py-0.2 bg-[#3B7DD8]/15 text-[#3B7DD8] font-bold text-[10px] rounded">
                                    Duplo
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right">
                                {editable ? (
                                  <input
                                    type="text"
                                    value={editValues[d.id] ?? ""}
                                    onChange={(e) =>
                                      setEditValues((prev) => ({ ...prev, [d.id]: e.target.value }))
                                    }
                                    placeholder="—"
                                    className={`w-24 h-8 px-2 text-right font-bold tabular-nums bg-white border rounded-lg focus:outline-none focus:border-[#0F6E5A] ${
                                      isCritical || isHigh
                                        ? "text-[#D64545] border-[#D64545]/40"
                                        : isLow
                                          ? "text-[#3B7DD8] border-[#3B7DD8]/40"
                                          : "text-[#1C1C1C] border-[#E5E5E3]"
                                    }`}
                                  />
                                ) : (
                                  <span
                                    className={`font-bold tabular-nums ${
                                      isCritical || isHigh
                                        ? "text-[#D64545] text-sm"
                                        : isLow
                                          ? "text-[#3B7DD8]"
                                          : "text-[#1C1C1C]"
                                    }`}
                                  >
                                    {d.value ?? "—"}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-[#6B6B6B]">{d.unit}</td>
                              <td className="py-2.5 px-4 text-[#6B6B6B] tabular-nums">{d.referenceRange}</td>
                              <td className="py-2.5 px-4 text-center">
                                {isCritical && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#D64545] text-white animate-pulse inline-block">
                                    KRITIS
                                  </span>
                                )}
                                {isHigh && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D64545]/15 text-[#D64545]">
                                    TINGGI (H)
                                  </span>
                                )}
                                {isLow && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3B7DD8]/15 text-[#3B7DD8]">
                                    RENDAH (L)
                                  </span>
                                )}
                                {activeFlag === "NORMAL" &&
                                  (editable && (editValues[d.id] ?? "") === "" ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E5E5E3] text-[#6B6B6B]">
                                      BELUM DIISI
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1B8A5A]/15 text-[#1B8A5A]">
                                      NORMAL
                                    </span>
                                  ))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-[#E5E5E3] text-xs text-[#6B6B6B]">
            Tidak ada data pemeriksaan ditemukan.
          </div>
        )}
      </div>
    </div>
  );
}
