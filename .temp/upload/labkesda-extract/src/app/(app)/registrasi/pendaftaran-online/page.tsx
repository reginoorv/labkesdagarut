"use client";

import React, { useState, useEffect } from "react";
import {
  Inbox,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  UserCheck,
  FileText,
  Phone,
  Calendar,
  FlaskConical,
  Printer,
  AlertTriangle,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useToast } from "@/components/ui/ToastProvider";
import Link from "next/link";

interface OnlineRegistration {
  id: number;
  bookingCode: string;
  name: string;
  nik?: string;
  dob: string;
  gender: string;
  phone: string;
  address?: string;
  guaranteeType: string;
  visitDate: string;
  requestedTests: string;
  referralFileUrl?: string;
  notes?: string;
  status: "MENUNGGU_VERIFIKASI" | "TERVERIFIKASI" | "DITOLAK";
  rejectionReason?: string;
  convertedPatientId?: number;
  convertedExaminationId?: number;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

export default function PendaftaranOnlinePage() {
  const { showToast } = useToast();
  const [registrations, setRegistrations] = useState<OnlineRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedReg, setSelectedReg] = useState<OnlineRegistration | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/online-registrations?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations);
      }
    } catch (e) {
      console.error("Fetch registrations error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter]);

  const openDetail = (reg: OnlineRegistration) => {
    setSelectedReg(reg);
    setIsDetailOpen(true);
  };

  const handleVerify = async () => {
    if (!selectedReg) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/online-registrations/${selectedReg.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedBy: "Petugas Loket (Verifikasi Online)" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({
          type: "success",
          title: "Verifikasi Berhasil!",
          description: data.message,
        });
        setIsDetailOpen(false);
        fetchRegistrations();
      } else {
        showToast({ type: "error", title: "Gagal Verifikasi", description: data.error });
      }
    } catch (e: any) {
      showToast({ type: "error", title: "Koneksi Error", description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReg || !rejectionReason.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/online-registrations/${selectedReg.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({
          type: "success",
          title: "Pendaftaran Ditolak",
          description: data.message,
        });
        setIsRejectOpen(false);
        setIsDetailOpen(false);
        setRejectionReason("");
        fetchRegistrations();
      } else {
        showToast({ type: "error", title: "Gagal", description: data.error });
      }
    } catch (e: any) {
      showToast({ type: "error", title: "Koneksi Error", description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = registrations.filter((r) => r.status === "MENUNGGU_VERIFIKASI").length;

  const filtered = registrations.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.bookingCode.toLowerCase().includes(q) ||
        r.phone.includes(search)
      );
    }
    return true;
  });

  const statusBadge = (status: string) => {
    if (status === "MENUNGGU_VERIFIKASI")
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E8A33D]/15 text-[#E8A33D] border border-[#E8A33D]/30 inline-flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Menunggu Verifikasi
        </span>
      );
    if (status === "TERVERIFIKASI")
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1B8A5A]/15 text-[#1B8A5A] inline-flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Terverifikasi
        </span>
      );
    return (
      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D64545]/15 text-[#D64545] inline-flex items-center gap-1">
        <XCircle className="w-3 h-3" /> Ditolak
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#1C1C1C]">Pendaftaran Online</h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 bg-[#E8A33D] text-white text-[10px] font-extrabold rounded-full animate-pulse">
                {pendingCount} Baru
              </span>
            )}
          </div>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Verifikasi pendaftaran pasien online dan konversi ke data master laboratorium.
          </p>
        </div>
        <button
          onClick={fetchRegistrations}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs font-semibold rounded-lg text-[#1C1C1C]"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode booking, nama, atau No. HP..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#6B6B6B]" />
          <span className="text-xs text-[#6B6B6B]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
            <option value="TERVERIFIKASI">Terverifikasi</option>
            <option value="DITOLAK">Ditolak</option>
          </select>
        </div>
      </div>

      {/* DataTable */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
                <th className="py-3 px-4">KODE BOOKING</th>
                <th className="py-3 px-4">NAMA PASIEN</th>
                <th className="py-3 px-4">TANGGAL KUNJUNGAN</th>
                <th className="py-3 px-4">No. HP</th>
                <th className="py-3 px-4">JENIS PEMERIKSAAN</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">TANGGAL DAFTAR</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => openDetail(r)}
                    className={`hover:bg-[#F7F7F6] cursor-pointer transition-colors ${
                      r.status === "MENUNGGU_VERIFIKASI" ? "bg-[#E8A33D]/5" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-[#0F6E5A] tabular-nums">
                      {r.bookingCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1C1C1C]">{r.name}</td>
                    <td className="py-3 px-4 tabular-nums">
                      {new Date(r.visitDate + "T00:00:00").toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-[#6B6B6B] tabular-nums">{r.phone}</td>
                    <td className="py-3 px-4 max-w-[160px] truncate">
                      {(() => {
                        try {
                          return JSON.parse(r.requestedTests).join(", ");
                        } catch {
                          return r.requestedTests;
                        }
                      })()}
                    </td>
                    <td className="py-3 px-4">{statusBadge(r.status)}</td>
                    <td className="py-3 px-4 text-[#6B6B6B] tabular-nums">
                      {new Date(r.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 bg-[#E4F2EE] hover:bg-[#0F6E5A] hover:text-white text-[#0F6E5A] rounded-md text-[11px] font-semibold transition-colors inline-flex items-center gap-1">
                        Detail <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-[#6B6B6B]">
                    Tidak ada data pendaftaran online ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Sheet */}
      <Dialog.Root open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-50" />
          <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-[#E5E5E3] p-6 overflow-y-auto focus:outline-none flex flex-col justify-between">
            <div>
              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E3] mb-4">
                <div>
                  <h2 className="text-base font-bold text-[#1C1C1C] flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-[#0F6E5A]" />
                    Detail Pendaftaran — {selectedReg?.bookingCode}
                  </h2>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    {selectedReg && statusBadge(selectedReg.status)}
                  </p>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-1.5 text-[#6B6B6B] hover:text-[#1C1C1C] rounded-md hover:bg-neutral-100"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>

              {selectedReg && (
                <div className="space-y-4 text-xs">
                  {/* Data Diri */}
                  <div className="bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl p-4 space-y-2.5">
                    <h3 className="text-xs font-bold text-[#0F6E5A] uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> Data Diri Pasien
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[#6B6B6B] block">Nama Lengkap</span>
                        <span className="font-bold text-[#1C1C1C]">{selectedReg.name}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] block">NIK</span>
                        <span className="font-semibold">{selectedReg.nik || "-"}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] block">Jenis Kelamin</span>
                        <span className="font-semibold">{selectedReg.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                      </div>
                      <div>
                        <span className="text-[#6B6B6B] block">Tanggal Lahir</span>
                        <span className="font-semibold">{selectedReg.dob}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-[#6B6B6B]" />
                      <span className="font-semibold">{selectedReg.phone}</span>
                    </div>
                    {selectedReg.address && (
                      <div>
                        <span className="text-[#6B6B6B] block">Alamat</span>
                        <span className="font-semibold">{selectedReg.address}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-[#6B6B6B] block">Penjamin</span>
                      <span className="px-2 py-0.5 bg-[#E4F2EE] text-[#0F6E5A] font-semibold rounded text-[11px]">
                        {selectedReg.guaranteeType}
                      </span>
                    </div>
                  </div>

                  {/* Detail Pemeriksaan */}
                  <div className="bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl p-4 space-y-2.5">
                    <h3 className="text-xs font-bold text-[#0F6E5A] uppercase tracking-wider flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5" /> Detail Pemeriksaan
                    </h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-[#6B6B6B]" />
                      <span className="font-semibold">
                        Jadwal Kunjungan:{" "}
                        {new Date(selectedReg.visitDate + "T00:00:00").toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B6B6B] block mb-1">Pemeriksaan yang Diminta:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          try {
                            return JSON.parse(selectedReg.requestedTests).map((t: string) => (
                              <span key={t} className="px-2 py-0.5 bg-white border border-[#E5E5E3] rounded text-[11px] font-semibold text-[#1C1C1C]">
                                {t}
                              </span>
                            ));
                          } catch {
                            return <span className="font-semibold">{selectedReg.requestedTests}</span>;
                          }
                        })()}
                      </div>
                    </div>
                    {selectedReg.notes && (
                      <div>
                        <span className="text-[#6B6B6B] block">Catatan Pasien:</span>
                        <span className="font-semibold">{selectedReg.notes}</span>
                      </div>
                    )}
                    {selectedReg.referralFileUrl && (
                      <div className="flex items-center gap-2 p-2 bg-white border border-[#E5E5E3] rounded-lg">
                        <FileText className="w-4 h-4 text-[#3B7DD8]" />
                        <span className="font-semibold text-[#0F6E5A]">File Rujukan Terlampir</span>
                      </div>
                    )}
                  </div>

                  {/* If rejected, show reason */}
                  {selectedReg.status === "DITOLAK" && selectedReg.rejectionReason && (
                    <div className="p-3 bg-[#D64545]/10 border border-[#D64545]/30 rounded-xl">
                      <span className="font-bold text-[#D64545] text-[11px] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Alasan Penolakan:
                      </span>
                      <p className="mt-1 text-[#1C1C1C]">{selectedReg.rejectionReason}</p>
                    </div>
                  )}

                  {/* If verified, show result */}
                  {selectedReg.status === "TERVERIFIKASI" && (
                    <div className="p-3 bg-[#1B8A5A]/10 border border-[#1B8A5A]/30 rounded-xl space-y-1">
                      <span className="font-bold text-[#1B8A5A] text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi oleh {selectedReg.verifiedBy}
                      </span>
                      {selectedReg.verifiedAt && (
                        <p className="text-[11px] text-[#6B6B6B]">
                          {new Date(selectedReg.verifiedAt).toLocaleString("id-ID")}
                        </p>
                      )}
                      {selectedReg.convertedPatientId && (
                        <Link
                          href={`/registrasi/edit`}
                          className="text-[11px] text-[#0F6E5A] font-semibold hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Lihat data pasien terkait
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#E5E5E3] flex items-center justify-end gap-3 mt-4">
              {selectedReg?.status === "MENUNGGU_VERIFIKASI" && (
                <>
                  <button
                    onClick={() => setIsRejectOpen(true)}
                    className="px-4 py-2 bg-white border border-[#D64545]/30 text-[#D64545] text-xs font-semibold rounded-lg hover:bg-[#D64545]/10 transition-colors"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={isProcessing}
                    className="px-5 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {isProcessing ? "Memproses..." : "Verifikasi & Buat RM"}
                  </button>
                </>
              )}
              {selectedReg?.status === "TERVERIFIKASI" && selectedReg.convertedExaminationId && (
                <Link
                  href={`/registrasi/print-label?rm=${selectedReg.bookingCode}`}
                  className="px-4 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Label
                </Link>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Reject Modal */}
      <Dialog.Root open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-xl border border-[#E5E5E3] shadow-2xl focus:outline-none">
            <h2 className="text-base font-bold text-[#1C1C1C] mb-1">Tolak Pendaftaran</h2>
            <p className="text-xs text-[#6B6B6B] mb-4">
              Masukkan alasan penolakan untuk <strong>{selectedReg?.name}</strong> ({selectedReg?.bookingCode})
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contoh: Data tidak lengkap, foto KTP tidak jelas..."
              className="w-full p-3 text-sm bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A]"
            />
            <p className="text-[10px] text-[#6B6B6B] mt-1">
              Alasan akan tercatat di log pendaftaran. Opsional: notifikasi akan dikirim ke pasien via WhatsApp (placeholder).
            </p>

            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[#E5E5E3]">
              <button
                onClick={() => { setIsRejectOpen(false); setRejectionReason(""); }}
                className="px-4 py-2 bg-white border border-[#E5E5E3] text-xs font-semibold rounded-lg text-[#6B6B6B]"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                className="px-4 py-2 bg-[#D64545] hover:bg-[#b83838] text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
              >
                {isProcessing ? "Memproses..." : "Tolak Pendaftaran"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
