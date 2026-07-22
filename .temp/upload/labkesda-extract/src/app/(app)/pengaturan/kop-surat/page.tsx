"use client";

import React, { useState, useEffect } from "react";
import { FileText, Save, Upload, Image as ImageIcon, Trash2, FlaskConical } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface Letterhead {
  line1: string;
  line2: string;
  line3: string;
  address: string;
  contact: string;
  logoUrl: string;
}

const EMPTY: Letterhead = {
  line1: "",
  line2: "",
  line3: "",
  address: "",
  contact: "",
  logoUrl: "",
};

export default function KopSuratPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState<Letterhead>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/letterhead")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setForm({ ...EMPTY, ...data.settings });
      })
      .finally(() => setLoading(false));
  }, []);

  const setField = (k: keyof Letterhead, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      showToast({ type: "warning", title: "Logo terlalu besar", description: "Ukuran maksimal 512 KB. Kompres dulu logonya." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField("logoUrl", String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/letterhead", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast({ type: "success", title: "Kop Surat Tersimpan", description: "Kop surat baru akan dipakai pada semua surat hasil lab." });
      } else {
        showToast({ type: "error", title: "Gagal Menyimpan", description: data.error });
      }
    } catch (e: any) {
      showToast({ type: "error", title: "Error", description: e.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-xs text-[#6B6B6B]">Memuat pengaturan kop surat...</div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Kelola Kop Surat</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Atur logo dan teks kop surat yang tampil pada surat hasil laboratorium.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-xs"
        >
          <Save className="w-4 h-4" /> {saving ? "Menyimpan..." : "Simpan Kop Surat"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5E5E3] text-[#0F6E5A] font-semibold text-sm">
            <FileText className="w-4 h-4" /> Teks Kop Surat
          </div>

          {/* Logo */}
          <div>
            <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">Logo Instansi</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 shrink-0 rounded-lg border border-[#E5E5E3] bg-[#F7F7F6] flex items-center justify-center overflow-hidden">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-[#6B6B6B]" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F7F6] border border-[#E5E5E3] hover:bg-neutral-200/60 rounded-lg text-xs font-semibold text-[#1C1C1C] cursor-pointer w-fit">
                  <Upload className="w-3.5 h-3.5" /> Pilih Logo
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                </label>
                {form.logoUrl && (
                  <button onClick={() => setField("logoUrl", "")} className="inline-flex items-center gap-1 text-[11px] text-[#D64545] font-medium hover:underline">
                    <Trash2 className="w-3 h-3" /> Hapus logo
                  </button>
                )}
                <span className="text-[10px] text-[#6B6B6B]">PNG/JPG/SVG, maks 512 KB.</span>
              </div>
            </div>
          </div>

          {[
            { k: "line1" as const, label: "Baris 1 (Instansi Induk)", ph: "Pemerintah Kabupaten Garut" },
            { k: "line2" as const, label: "Baris 2 (Dinas)", ph: "Dinas Kesehatan" },
            { k: "line3" as const, label: "Baris 3 (Nama Unit)", ph: "Laboratorium Kesehatan Daerah" },
            { k: "address" as const, label: "Alamat", ph: "Jl. Proklamasi No. 2, ..." },
            { k: "contact" as const, label: "Kontak", ph: "Telp. (0262) ... • Email: ..." },
          ].map((f) => (
            <div key={f.k}>
              <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">{f.label}</label>
              <input
                value={form[f.k]}
                onChange={(e) => setField(f.k, e.target.value)}
                placeholder={f.ph}
                className="w-full h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20"
              />
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center gap-2 pb-2 mb-4 border-b border-[#E5E5E3] text-[#0F6E5A] font-semibold text-sm">
            <FileText className="w-4 h-4" /> Pratinjau Kop Surat
          </div>
          <div className="border border-[#E5E5E3] rounded-lg p-5" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
            <div className="flex items-center gap-4 border-b-2 border-black pb-3">
              <div className="w-20 h-20 shrink-0 flex items-center justify-center border-2 border-black rounded-full overflow-hidden">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <FlaskConical className="w-9 h-9" />
                )}
              </div>
              <div className="flex-1 text-center leading-tight">
                <p className="text-sm font-semibold uppercase tracking-wide">{form.line1 || "—"}</p>
                <p className="text-sm font-semibold uppercase tracking-wide">{form.line2 || "—"}</p>
                <p className="text-xl font-bold uppercase tracking-wide">{form.line3 || "—"}</p>
                <p className="text-[11px] mt-0.5">{form.address || "—"}</p>
                <p className="text-[11px]">{form.contact || "—"}</p>
              </div>
            </div>
            <p className="text-center text-xs text-[#6B6B6B] mt-4">Contoh tampilan pada surat hasil laboratorium</p>
          </div>
        </div>
      </div>
    </div>
  );
}
