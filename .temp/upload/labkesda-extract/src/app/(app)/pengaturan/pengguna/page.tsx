"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Pencil, RefreshCw, ShieldCheck, Search } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useToast } from "@/components/ui/ToastProvider";
import { ROLE_LABELS } from "@/lib/auth-shared";

interface UserItem { id: number; username: string; fullName: string; role: string; isActive: boolean; lastLoginAt?: string; createdAt: string; }

const ROLES = ["PETUGAS_LOKET", "KASIR", "ANALIS_LAB", "PJ_LAB", "ADMIN_SISTEM"];

export default function PenggunaPage() {
  const { showToast } = useToast();
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [form, setForm] = useState({ username: "", fullName: "", role: "PETUGAS_LOKET", password: "", isActive: true });

  const fetchUsers = async () => { setLoading(true); try { const r = await fetch("/api/users"); const d = await r.json(); if (d.success) setUsersList(d.users); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetchUsers(); }, []);

  const openAdd = () => { setEditing(null); setForm({ username: "", fullName: "", role: "PETUGAS_LOKET", password: "password123", isActive: true }); setIsOpen(true); };
  const openEdit = (u: UserItem) => { setEditing(u); setForm({ username: u.username, fullName: u.fullName, role: u.role, password: "", isActive: u.isActive }); setIsOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...form } : form;
    const res = await fetch("/api/users", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.success) { showToast({ type: "success", title: editing ? "Pengguna Diperbarui" : "Pengguna Ditambahkan", description: form.fullName }); setIsOpen(false); fetchUsers(); }
    else showToast({ type: "error", title: "Gagal", description: data.error });
  };

  const filtered = usersList.filter((u) => !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div><h1 className="text-xl font-bold text-[#1C1C1C]">Kelola Pengguna & Hak Akses</h1><p className="text-xs text-[#6B6B6B] mt-0.5">Manajemen akun petugas LIS dan penetapan role akses.</p></div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} className="p-2 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] rounded-lg"><RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" /></button>
          <button onClick={openAdd} className="px-3.5 py-1.5 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs"><Plus className="w-4 h-4" /> Tambah User</button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-xs"><Search className="w-3.5 h-3.5 text-[#6B6B6B] absolute left-3 top-2.5" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pengguna..." className="w-full h-8 pl-8 pr-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]" /></div>
      </div>

      <div className="bg-white border border-[#E5E5E3] rounded-xl shadow-2xs overflow-hidden"><div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse"><thead><tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
          <th className="py-3 px-4">USERNAME</th><th className="py-3 px-4">NAMA LENGKAP</th><th className="py-3 px-4">ROLE</th><th className="py-3 px-4 text-center">STATUS</th><th className="py-3 px-4">LOGIN TERAKHIR</th><th className="py-3 px-4 text-right">AKSI</th>
        </tr></thead><tbody className="divide-y divide-[#E5E5E3]">
          {loading ? Array.from({length:3}).map((_,i)=><tr key={i} className="animate-pulse"><td colSpan={6} className="py-4 px-4"><div className="h-4 bg-neutral-200 rounded w-full"/></td></tr>) :
          filtered.map((u) => (
            <tr key={u.id} className="hover:bg-[#F7F7F6]">
              <td className="py-3 px-4 font-bold text-[#0F6E5A]">@{u.username}</td>
              <td className="py-3 px-4 font-semibold text-[#1C1C1C]">{u.fullName}</td>
              <td className="py-3 px-4"><span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E4F2EE] text-[#0F6E5A]">{ROLE_LABELS[u.role] || u.role}</span></td>
              <td className="py-3 px-4 text-center">{u.isActive ? <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B8A5A]/15 text-[#1B8A5A]">Aktif</span> : <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D64545]/15 text-[#D64545]">Nonaktif</span>}</td>
              <td className="py-3 px-4 text-[#6B6B6B] tabular-nums">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("id-ID") : "Belum pernah"}</td>
              <td className="py-3 px-4 text-right"><button onClick={() => openEdit(u)} className="px-2.5 py-1 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-[#1C1C1C] rounded-md text-[11px] font-semibold inline-flex items-center gap-1"><Pencil className="w-3 h-3 text-[#0F6E5A]" /> Edit</button></td>
            </tr>
          ))}
        </tbody></table>
      </div></div>

      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-xl border border-[#E5E5E3] shadow-2xl focus:outline-none">
          <h2 className="text-base font-bold text-[#1C1C1C] mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#0F6E5A]" /> {editing ? "Edit Pengguna" : "Tambah Pengguna Baru"}</h2>
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block font-semibold mb-1">Username</label><input required value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} disabled={!!editing} className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg disabled:opacity-50" /></div>
              <div><label className="block font-semibold mb-1">Role</label><select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg">{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></div>
            </div>
            <div><label className="block font-semibold mb-1">Nama Lengkap</label><input required value={form.fullName} onChange={(e) => setForm({...form, fullName: e.target.value})} className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg" /></div>
            <div><label className="block font-semibold mb-1">{editing ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}</label><input type="password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} placeholder={editing ? "Kosongkan jika tidak diubah" : "password123"} className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg" {...(!editing && { required: true })} /></div>
            {editing && <div className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({...form, isActive: e.target.checked})} className="accent-[#0F6E5A]" /><span className="font-semibold">Akun Aktif</span></div>}
            <div className="flex justify-end gap-3 pt-3 border-t border-[#E5E5E3]"><button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 bg-white border border-[#E5E5E3] text-xs font-semibold rounded-lg text-[#6B6B6B]">Batal</button><button type="submit" className="px-5 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg shadow-xs">Simpan</button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal></Dialog.Root>
    </div>
  );
}
