"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Phone,
  User,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useToast } from "@/components/ui/ToastProvider";

interface Hospital {
  id: number;
  code: string;
  name: string;
  type: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  cooperationType: string;
  isActive: boolean;
}

export default function MasterRsPage() {
  const { showToast } = useToast();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);

  const [formState, setFormState] = useState({
    code: "",
    name: "",
    type: "Rumah Sakit",
    phone: "",
    address: "",
    contactPerson: "",
    cooperationType: "BPJS & Daerah",
  });

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hospitals");
      const data = await res.json();
      if (data.success) {
        setHospitals(data.hospitals);
      }
    } catch (e) {
      console.error("Fetch hospitals error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const openAddDialog = () => {
    setEditingHospital(null);
    setFormState({
      code: `RS-${Math.floor(100 + Math.random() * 900)}`,
      name: "",
      type: "Rumah Sakit",
      phone: "",
      address: "",
      contactPerson: "",
      cooperationType: "Mandiri",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (h: Hospital) => {
    setEditingHospital(h);
    setFormState({
      code: h.code,
      name: h.name,
      type: h.type,
      phone: h.phone || "",
      address: h.address || "",
      contactPerson: h.contactPerson || "",
      cooperationType: h.cooperationType || "Mandiri",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingHospital ? "PUT" : "POST";
    const body = editingHospital ? { id: editingHospital.id, ...formState } : formState;

    try {
      const res = await fetch("/api/hospitals", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        showToast({
          type: "success",
          title: editingHospital ? "Data RS Diperbarui" : "RS Rujukan Baru Ditambahkan",
          description: `Master data ${formState.name} berhasil disimpan.`,
        });
        setIsDialogOpen(false);
        fetchHospitals();
      } else {
        showToast({
          type: "error",
          title: "Gagal Menyimpan",
          description: data.error,
        });
      }
    } catch (err: any) {
      showToast({
        type: "error",
        title: "Koneksi Terputus",
        description: err.message,
      });
    }
  };

  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.code.toLowerCase().includes(search.toLowerCase()) ||
      h.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Datamaster RS & Klinik Rujukan</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Kelola daftar fasilitas kesehatan pengirim spesimen, kontak penanggung jawab, dan skema kerjasama.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHospitals}
            className="p-2 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs rounded-lg text-[#1C1C1C]"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" />
          </button>
          <button
            onClick={openAddDialog}
            className="px-3.5 py-1.5 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Fasilitas Rujukan</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama RS, kode, atau tipe..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
          />
        </div>

        <div className="text-xs text-[#6B6B6B]">
          Total RS / Klinik: <span className="font-bold text-[#1C1C1C]">{hospitals.length}</span>
        </div>
      </div>

      {/* Hospital Master Table */}
      <div className="bg-white border border-[#E5E5E3] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
                <th className="py-3 px-4">KODE & NAMA FASILITAS</th>
                <th className="py-3 px-4">TIPE FASILITAS</th>
                <th className="py-3 px-4">PENANGGUNG JAWAB</th>
                <th className="py-3 px-4">TELEPON</th>
                <th className="py-3 px-4">SKEMA KERJASAMA</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-right">AKSI</th>
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
              ) : filtered.length > 0 ? (
                filtered.map((h) => (
                  <tr key={h.id} className="hover:bg-[#F7F7F6]">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1C1C1C]">{h.name}</div>
                      <div className="text-[10px] text-[#0F6E5A] font-bold tabular-nums mt-0.5">
                        {h.code}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#1C1C1C] font-medium">{h.type}</td>
                    <td className="py-3 px-4 text-[#6B6B6B]">{h.contactPerson || "-"}</td>
                    <td className="py-3 px-4 text-[#6B6B6B] tabular-nums">{h.phone || "-"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E4F2EE] text-[#0F6E5A]">
                        {h.cooperationType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B8A5A]/15 text-[#1B8A5A]">
                        Aktif
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditDialog(h)}
                        className="px-2.5 py-1 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-[#1C1C1C] rounded-md text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3 text-[#0F6E5A]" /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B6B6B]">
                    Tidak ada fasilitas rujukan ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal Dialog */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-xl border border-[#E5E5E3] shadow-2xl focus:outline-none">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-4">
              <h2 className="text-base font-bold text-[#1C1C1C] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F6E5A]" />
                {editingHospital ? "Edit Data Fasilitas Rujukan" : "Tambah Fasilitas Rujukan Baru"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1C1C] mb-1">Kode Fasilitas</label>
                  <input
                    type="text"
                    required
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                    className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none font-bold text-[#0F6E5A]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1C] mb-1">Tipe Fasilitas</label>
                  <select
                    value={formState.type}
                    onChange={(e) => setFormState({ ...formState, type: e.target.value })}
                    className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                  >
                    <option value="Rumah Sakit">Rumah Sakit</option>
                    <option value="Puskesmas">Puskesmas</option>
                    <option value="Klinik Utama">Klinik Utama</option>
                    <option value="Dokter Mandiri">Dokter Mandiri</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1C] mb-1">Nama Fasilitas / RS</label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="Contoh: RSUD dr. Slamet Garut"
                  className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1C1C1C] mb-1">Penanggung Jawab</label>
                  <input
                    type="text"
                    value={formState.contactPerson}
                    onChange={(e) => setFormState({ ...formState, contactPerson: e.target.value })}
                    placeholder="dr. Contoh"
                    className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1C1C1C] mb-1">No. Telepon</label>
                  <input
                    type="text"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="0262-..."
                    className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1C] mb-1">Skema Kerjasama</label>
                <select
                  value={formState.cooperationType}
                  onChange={(e) => setFormState({ ...formState, cooperationType: e.target.value })}
                  className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                >
                  <option value="BPJS & Daerah">BPJS & Daerah</option>
                  <option value="BPJS Only">BPJS Only</option>
                  <option value="Asuransi Swasta">Asuransi Swasta</option>
                  <option value="Mandiri">Mandiri</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1C] mb-1">Alamat Fasilitas</label>
                <input
                  type="text"
                  value={formState.address}
                  onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                  placeholder="Jl. Rumah Sakit, Garut"
                  className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
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
                  className="px-5 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  Simpan Fasilitas
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
