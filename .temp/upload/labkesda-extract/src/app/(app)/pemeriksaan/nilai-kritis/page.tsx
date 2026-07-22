"use client";

import React, { useState, useEffect } from "react";
import {
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useToast } from "@/components/ui/ToastProvider";

interface CriticalReport {
  id: number;
  examinationId: number;
  patientName: string;
  labNo: string;
  parameterName: string;
  criticalValue: string;
  reportedBy: string;
  reportedTo: string;
  doctorPhone?: string;
  responseTimeMinutes: number;
  status: "BELUM_DILAPORKAN" | "SUDAH_DILAPORKAN" | "DIKONFIRMASI";
  notes?: string;
  reportedAt: string;
}

export default function NilaiKritisPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<CriticalReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state for creating new critical report log
  const [newForm, setNewForm] = useState({
    patientName: "",
    labNo: "LAB-260515-001",
    parameterName: "Hemoglobin (Hb)",
    criticalValue: "4.2 g/dL",
    reportedBy: "Kurnia, A.Md.AK",
    reportedTo: "dr. Asep Supriatna, Sp.PD",
    doctorPhone: "081299887766",
    status: "SUDAH_DILAPORKAN",
    notes: "Telah ditelepon & dikonfirmasi dr. Jaga",
  });

  const fetchCriticalReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/critical-reports");
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      }
    } catch (e) {
      console.error("Critical report fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriticalReports();
  }, []);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/critical-reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({
          type: "success",
          title: "Status Pelaporan Diperbarui",
          description: `Status telah diubah menjadi: ${newStatus}`,
        });
        fetchCriticalReports();
      }
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Gagal Update Status",
        description: e.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/critical-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast({
          type: "success",
          title: "Pencatatan SOP Kritis Tersimpan",
          description: `Laporan untuk ${newForm.patientName} berhasil dicatat.`,
        });
        setIsDialogOpen(false);
        fetchCriticalReports();
      }
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Gagal Menyimpan",
        description: e.message,
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Pelaporan Nilai Kritis SOP</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Log dan bukti pencatatan komunikasi hasil kritis ke dokter pengirim sesuai standar akreditasi fasilitas kesehatan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCriticalReports}
            className="p-2 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs rounded-lg text-[#1C1C1C]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" />
          </button>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="px-3.5 py-1.5 bg-[#D64545] hover:bg-[#b83838] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pelaporan Baru</span>
          </button>
        </div>
      </div>

      {/* Critical SOP Table */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
                <th className="py-3 px-4">STATUS SOP</th>
                <th className="py-3 px-4">PASIEN & NO. LAB</th>
                <th className="py-3 px-4">PARAMETER & NILAI KRITIS</th>
                <th className="py-3 px-4">PELAPOR (ANALIS)</th>
                <th className="py-3 px-4">DOKTER PENERIMA</th>
                <th className="py-3 px-4 text-center">WAKTU RESPON</th>
                <th className="py-3 px-4 text-right">AKSI VERIFIKASI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : reports.length > 0 ? (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F7F7F6]">
                    <td className="py-3 px-4">
                      {r.status === "BELUM_DILAPORKAN" && (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#E8A33D] text-white inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Belum Dilaporkan
                        </span>
                      )}
                      {r.status === "SUDAH_DILAPORKAN" && (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#3B7DD8] text-white inline-flex items-center gap-1">
                          <PhoneCall className="w-3 h-3" /> Sudah Dilaporkan
                        </span>
                      )}
                      {r.status === "DIKONFIRMASI" && (
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-[#1B8A5A] text-white inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Dikonfirmasi Dokter
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1C1C1C]">{r.patientName}</div>
                      <div className="text-[11px] text-[#6B6B6B] tabular-nums mt-0.5">{r.labNo}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#D64545]">{r.parameterName}</div>
                      <div className="text-[11px] font-extrabold text-[#D64545] tabular-nums mt-0.5">
                        {r.criticalValue}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#1C1C1C]">{r.reportedBy}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#1C1C1C]">{r.reportedTo}</div>
                      <div className="text-[10px] text-[#6B6B6B] tabular-nums mt-0.5">
                        {r.doctorPhone || "-"}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#1C1C1C] tabular-nums">
                      <span className="inline-flex items-center gap-1 bg-[#F7F7F6] px-2 py-0.5 rounded border border-[#E5E5E3]">
                        <Clock className="w-3 h-3 text-[#0F6E5A]" /> {r.responseTimeMinutes} m
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status !== "DIKONFIRMASI" ? (
                        <button
                          onClick={() => handleUpdateStatus(r.id, "DIKONFIRMASI")}
                          disabled={isUpdating}
                          className="px-2.5 py-1 bg-[#1B8A5A] hover:bg-[#156e48] text-white rounded-md text-[11px] font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <UserCheck className="w-3 h-3" /> Konfirmasi Dokter
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#1B8A5A] font-semibold">Telah Tuntas SOP</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B6B6B]">
                    Belum ada riwayat pelaporan nilai kritis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for New Critical Report Record */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-xl border border-[#E5E5E3] shadow-2xl focus:outline-none">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-4">
              <h2 className="text-base font-bold text-[#1C1C1C] flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#D64545]" />
                Catat Bukti Pelaporan Nilai Kritis
              </h2>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#1C1C1C] mb-1">Nama Pasien</label>
                <input
                  type="text"
                  required
                  value={newForm.patientName}
                  onChange={(e) => setNewForm({ ...newForm, patientName: e.target.value })}
                  placeholder="Nama Pasien Kritis"
                  className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1C1C] mb-1">Parameter Kritis</label>
                  <input
                    type="text"
                    required
                    value={newForm.parameterName}
                    onChange={(e) => setNewForm({ ...newForm, parameterName: e.target.value })}
                    className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1C] mb-1">Nilai Kritis Hasil</label>
                  <input
                    type="text"
                    required
                    value={newForm.criticalValue}
                    onChange={(e) => setNewForm({ ...newForm, criticalValue: e.target.value })}
                    className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none font-bold text-[#D64545]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1C1C] mb-1">Petugas Analis (Pelapor)</label>
                  <input
                    type="text"
                    required
                    value={newForm.reportedBy}
                    onChange={(e) => setNewForm({ ...newForm, reportedBy: e.target.value })}
                    className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1C] mb-1">Dokter Penerima Telepon</label>
                  <input
                    type="text"
                    required
                    value={newForm.reportedTo}
                    onChange={(e) => setNewForm({ ...newForm, reportedTo: e.target.value })}
                    className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1C] mb-1">Status SOP</label>
                <select
                  value={newForm.status}
                  onChange={(e) => setNewForm({ ...newForm, status: e.target.value as any })}
                  className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                >
                  <option value="BELUM_DILAPORKAN">Belum Dilaporkan</option>
                  <option value="SUDAH_DILAPORKAN">Sudah Dilaporkan</option>
                  <option value="DIKONFIRMASI">Dikonfirmasi Dokter</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1C] mb-1">Catatan Respon Dokter</label>
                <textarea
                  rows={2}
                  value={newForm.notes}
                  onChange={(e) => setNewForm({ ...newForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E3]">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 bg-white border border-[#E5E5E3] text-xs font-semibold rounded-lg text-[#6B6B6B]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#D64545] hover:bg-[#b83838] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Bukti Pelaporan
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
