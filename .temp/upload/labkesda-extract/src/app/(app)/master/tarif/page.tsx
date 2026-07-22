"use client";

import React, { useState, useEffect } from "react";
import { Tag, Plus, Pencil, Search, RefreshCw } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useToast } from "@/components/ui/ToastProvider";

interface Tariff { id: number; category: string; testCode: string; testName: string; price: string; isActive: boolean; }

export default function TarifPage() {
  const { showToast } = useToast();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Tariff | null>(null);
  const [form, setForm] = useState({ category: "Hematologi", testCode: "", testName: "", price: "" });

  const fetchTariffs = async () => { setLoading(true); try { const r = await fetch("/api/tariffs"); const d = await r.json(); if (d.success) setTariffs(d.tariffs); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchTariffs(); }, []);

  const openAdd = () => { setEditing(null); setForm({ category: "Hematologi", testCode: "", testName: "", price: "" }); setIsOpen(true); };
  const openEdit = (t: Tariff) => { setEditing(t); setForm({ category: t.category, testCode: t.testCode, testName: t.testName, price: t.price }); setIsOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...form } : form;
    const res = await fetch("/api/tariffs", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) { showToast({ type: "success", title: editing ? "Tarif Diperbarui" : "Tarif Ditambahkan", description: form.testName }); setIsOpen(false); fetchTariffs(); }
    else showToast({ type: "error", title: "Gagal", description: data.error });
  };

  const fmtRp = (n: string) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(parseFloat(n));
  const filtered = tariffs.filter((t) => !search || t.testName.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div><h1 className="text-xl font-bold text-[#1C1C1C]">Datamaster Tarif Pemeriksaan Lab</h1><p className="text-xs text-[#6B6B6B] mt-0.5">Kelola harga per jenis pemeriksaan laboratorium.</p></div>
        <div className="flex gap-2">
          <button onClick={fetchTariffs} className="p-2 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] rounded-lg"><RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" /></button>
          <button onClick={openAdd} className="px-3.5 py-1.5 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs"><Plus className="w-4 h-4" /> Tambah Tarif</button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-xs"><Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-2.5" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari tarif..." className="w-full h-8 pl-8 pr-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]" /></div>
        <span className="text-xs text-[#6B6B6B]">Total: <strong>{tariffs.length}</strong></span>
      </div>

      <div className="bg-white border border-[#E5E5E3] rounded-xl shadow-2xs overflow-hidden"><div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse"><thead><tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
          <th className="py-3 px-4">KATEGORI</th><th className="py-3 px-4">KODE TES</th><th className="py-3 px-4">NAMA PEMERIKSAAN</th><th className="py-3 px-4 text-right">HARGA</th><th className="py-3 px-4 text-right">AKSI</th>
        </tr></thead><tbody className="divide-y divide-[#E5E5E3]">
          {loading ? Array.from({length:3}).map((_,i)=><tr key={i} className="animate-pulse"><td colSpan={5} className="py-4 px-4"><div className="h-4 bg-neutral-200 rounded w-full"/></td></tr>) :
          filtered.map((t) => (
            <tr key={t.id} className="hover:bg-[#F7F7F6]">
              <td className="py-3 px-4 font-semibold">{t.category}</td>
              <td className="py-3 px-4 text-[#0F6E5A] font-bold tabular-nums">{t.testCode}</td>
              <td className="py-3 px-4 font-medium text-[#1C1C1C]">{t.testName}</td>
              <td className="py-3 px-4 text-right font-bold tabular-nums text-[#1C1C1C]">{fmtRp(t.price)}</td>
              <td className="py-3 px-4 text-right"><button onClick={() => openEdit(t)} className="px-2.5 py-1 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-[#1C1C1C] rounded-md text-[11px] font-semibold inline-flex items-center gap-1"><Pencil className="w-3 h-3 text-[#0F6E5A]" /> Edit</button></td>
            </tr>
          ))}
        </tbody></table>
      </div></div>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-xl border border-[#E5E5E3] shadow-2xl focus:outline-none">
          <h2 className="text-base font-bold text-[#1C1C1C] mb-4 flex items-center gap-2"><Tag className="w-4 h-4 text-[#0F6E5A]" /> {editing ? "Edit Tarif" : "Tambah Tarif Baru"}</h2>
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div><label className="block font-semibold mb-1">Kategori</label><select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg"><option>Hematologi</option><option>Kimia Klinik</option><option>Imunoserologi</option><option>Mikrobiologi</option><option>Urinalisis</option></select></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="block font-semibold mb-1">Kode Tes</label><input required value={form.testCode} onChange={(e) => setForm({...form, testCode: e.target.value})} className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg" /></div>
            <div><label className="block font-semibold mb-1">Harga (Rp)</label><input required type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg tabular-nums" /></div></div>
            <div><label className="block font-semibold mb-1">Nama Pemeriksaan</label><input required value={form.testName} onChange={(e) => setForm({...form, testName: e.target.value})} className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg" /></div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E3]"><button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 bg-white border border-[#E5E5E3] text-xs font-semibold rounded-lg text-[#6B6B6B]">Batal</button><button type="submit" className="px-5 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg shadow-xs">Simpan</button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal></Dialog.Root>
    </div>
  );
}
