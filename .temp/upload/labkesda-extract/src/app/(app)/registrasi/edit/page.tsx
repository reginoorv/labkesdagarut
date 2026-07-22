"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  UserCog,
  History,
  Save,
  X,
  Filter,
  Building,
  RefreshCw,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useToast } from "@/components/ui/ToastProvider";

interface Patient {
  id: number;
  rmNo: string;
  nik?: string;
  name: string;
  gender: string;
  dob: string;
  phone?: string;
  address?: string;
  guaranteeType: string;
  hospitalId?: number;
  hospitalName?: string;
  createdAt: string;
}

export default function EditPasienPage() {
  const { showToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [guaranteeFilter, setGuaranteeFilter] = useState("ALL");

  // Selected Patient for Sheet Editing
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    gender: "L",
    dob: "",
    phone: "",
    address: "",
    guaranteeType: "BPJS",
  });

  // Mock Audit Trails for the patient
  const [auditLogs, setAuditLogs] = useState<Array<{ id: number; action: string; details: string; date: string; user: string }>>([]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(search)}&guarantee=${guaranteeFilter}`);
      const data = await res.json();
      if (data.success) {
        setPatients(data.patients);
      }
    } catch (e) {
      console.error("Patient fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search, guaranteeFilter]);

  const handleRowClick = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditForm({
      name: patient.name,
      gender: patient.gender,
      dob: patient.dob,
      phone: patient.phone || "",
      address: patient.address || "",
      guaranteeType: patient.guaranteeType,
    });

    // Dummy audit logs
    setAuditLogs([
      {
        id: 1,
        action: "Pendaftaran Pasien",
        details: `Registrasi awal dibuat dengan No. RM ${patient.rmNo}`,
        date: new Date(patient.createdAt).toLocaleString("id-ID"),
        user: "Petugas Registrasi LIS",
      },
      {
        id: 2,
        action: "Verifikasi Penjamin",
        details: `Status penjamin ditetapkan: ${patient.guaranteeType}`,
        date: new Date(patient.createdAt).toLocaleString("id-ID"),
        user: "Sistem LIS",
      },
    ]);

    setIsSheetOpen(true);
  };

  const handleSave = async () => {
    if (!selectedPatient) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/patients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPatient.id,
          ...editForm,
          updatedBy: "Analis Utama / Petugas LIS",
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast({
          type: "success",
          title: "Data Pasien Berhasil Diperbarui",
          description: `Perubahan data pasien ${editForm.name} tersimpan.`,
        });
        setIsSheetOpen(false);
        fetchPatients();
      } else {
        showToast({
          type: "error",
          title: "Gagal Mengubah Data",
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
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Edit Data Pasien & Audit Trail</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Pencarian master data pasien, pengubahan identitas, dan rekam jejak riwayat perubahan data.
          </p>
        </div>
        <button
          onClick={fetchPatients}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs font-semibold rounded-lg text-[#1C1C1C]"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" />
          Reload List
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#6B6B6B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Nama Pasien, No. RM, atau NIK..."
            className="w-full h-9 pl-9 pr-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-[#6B6B6B]" />
          <span className="text-xs text-[#6B6B6B]">Penjamin:</span>
          <select
            value={guaranteeFilter}
            onChange={(e) => setGuaranteeFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
          >
            <option value="ALL">Semua Penjamin</option>
            <option value="UMUM">Umum / Mandiri</option>
          </select>
        </div>
      </div>

      {/* Patients Data Table */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
                <th className="py-3 px-4">NO. RM</th>
                <th className="py-3 px-4">NAMA PASIEN</th>
                <th className="py-3 px-4">NIK</th>
                <th className="py-3 px-4">GENDER / TGL LAHIR</th>
                <th className="py-3 px-4">PENJAMIN</th>
                <th className="py-3 px-4">RS RUJUKAN</th>
                <th className="py-3 px-4 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="py-4 px-4">
                      <div className="h-4 bg-neutral-200 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : patients.length > 0 ? (
                patients.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleRowClick(p)}
                    className="hover:bg-[#E4F2EE]/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-bold text-[#0F6E5A] tabular-nums">
                      {p.rmNo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#1C1C1C]">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-[#6B6B6B] tabular-nums">
                      {p.nik || "-"}
                    </td>
                    <td className="py-3 px-4 text-[#1C1C1C]">
                      {p.gender === "L" ? "Laki-laki" : "Perempuan"} • {p.dob}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F7F7F6] border border-[#E5E5E3] text-[#1C1C1C]">
                        {p.guaranteeType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#6B6B6B]">
                      {p.hospitalName || "RSUD dr. Slamet Garut"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 bg-[#E4F2EE] hover:bg-[#0F6E5A] hover:text-white text-[#0F6E5A] rounded-md text-[11px] font-semibold transition-colors inline-flex items-center gap-1">
                        <UserCog className="w-3 h-3" /> Edit Data
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B6B6B]">
                    Tidak ada data pasien yang sesuai dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Side Sheet Dialog for Edit & Audit Trail */}
      <Dialog.Root open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-50" />
          <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-[#E5E5E3] p-6 overflow-y-auto focus:outline-none flex flex-col justify-between">
            <div>
              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E3] mb-4">
                <div>
                  <h2 className="text-base font-bold text-[#1C1C1C] flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-[#0F6E5A]" />
                    Edit Profil Pasien — {selectedPatient?.rmNo}
                  </h2>
                  <p className="text-xs text-[#6B6B6B]">
                    Pembaruan data demografi & penjaminan pasien
                  </p>
                </div>
                <button
                  onClick={() => setIsSheetOpen(false)}
                  className="p-1.5 text-[#6B6B6B] hover:text-[#1C1C1C] rounded-md hover:bg-neutral-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Form Fields */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[#1C1C1C] mb-1">
                    Nama Pasien
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1C1C1C] mb-1">
                      Jenis Kelamin
                    </label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C1C1C] mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={editForm.dob}
                      onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                      className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#1C1C1C] mb-1">
                      Penjamin
                    </label>
                    <input
                      type="text"
                      value="UMUM"
                      readOnly
                      className="w-full h-9 px-3 bg-neutral-100 border border-[#E5E5E3] rounded-lg text-[#6B6B6B] cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1C1C1C] mb-1">
                      No. HP / Kontak
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1C] mb-1">
                    Alamat Pasien
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full p-2.5 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Audit Trail Log Section at Bottom */}
              <div className="mt-6 pt-4 border-t border-[#E5E5E3]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1C1C] mb-2.5">
                  <History className="w-4 h-4 text-[#0F6E5A]" />
                  Riwayat Perubahan Data (Audit Trail)
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg text-[11px]"
                    >
                      <div className="flex items-center justify-between font-semibold text-[#1C1C1C]">
                        <span>{log.action}</span>
                        <span className="text-[#6B6B6B] font-normal">{log.date}</span>
                      </div>
                      <p className="text-[#6B6B6B] mt-0.5">{log.details}</p>
                      <span className="text-[10px] text-[#0F6E5A] block mt-1">
                        Oleh: {log.user}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#E5E5E3] flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setIsSheetOpen(false)}
                className="px-4 py-2 bg-white border border-[#E5E5E3] text-xs font-semibold rounded-lg text-[#6B6B6B]"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-5 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
