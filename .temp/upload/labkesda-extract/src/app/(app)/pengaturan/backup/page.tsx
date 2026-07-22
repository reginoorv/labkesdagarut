"use client";

import React, { useState, useEffect } from "react";
import {
  HardDrive,
  Save,
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  RefreshCw,
  FolderDown,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface BackupLog {
  id: number;
  backupType: string;
  status: string;
  filename: string;
  fileSizeMb: string;
  durationSeconds: number;
  createdBy: string;
  createdAt: string;
}

export default function SettingBackupPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [settings, setSettings] = useState({
    autoBackupEnabled: true,
    scheduleFrequency: "HARIAN",
    scheduleTime: "23:00",
    retentionDays: 30,
    destinationFolder: "/var/backups/labkesda_garut",
  });

  const fetchBackupData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        if (data.settings) {
          setSettings({
            autoBackupEnabled: data.settings.autoBackupEnabled ?? true,
            scheduleFrequency: data.settings.scheduleFrequency || "HARIAN",
            scheduleTime: data.settings.scheduleTime || "23:00",
            retentionDays: data.settings.retentionDays || 30,
            destinationFolder: data.settings.destinationFolder || "/var/backups/labkesda_garut",
          });
        }
      }
    } catch (e) {
      console.error("Fetch backup error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupData();
  }, []);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createdBy: "Analis Utama (Manual Trigger)" }),
      });
      const data = await res.json();
      if (data.success) {
        // Unduh berkas ekspor JSON yang dikembalikan server.
        if (data.content && data.filename) {
          const blob = new Blob([data.content], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = data.filename;
          a.click();
          URL.revokeObjectURL(url);
        }
        showToast({
          type: "success",
          title: "Ekspor Data Selesai!",
          description: data.message,
        });
        fetchBackupData();
      } else {
        showToast({ type: "error", title: "Ekspor Gagal", description: data.error });
      }
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Backup Gagal",
        description: e.message,
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/backup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        showToast({
          type: "success",
          title: "Pengaturan Backup Tersimpan",
          description: `Jadwal otomatis ${settings.scheduleFrequency} pada jam ${settings.scheduleTime} telah diperbarui.`,
        });
      }
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Gagal Menyimpan Pengaturan",
        description: e.message,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Backup & Ekspor Data LIS</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Ekspor seluruh data operasional ke berkas JSON untuk arsip, serta konfigurasi jadwal backup otomatis.
          </p>
        </div>

        <button
          onClick={handleManualBackup}
          disabled={isBackingUp}
          className="px-4 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 shadow-xs transition-colors"
        >
          <PlayCircle className={`w-4 h-4 ${isBackingUp ? "animate-spin" : ""}`} />
          <span>{isBackingUp ? "Mengekspor Data..." : "Ekspor & Unduh Data Sekarang"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Schedule Settings Form */}
        <div className="lg:col-span-5 bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E5E5E3] font-semibold text-sm text-[#0F6E5A]">
            <HardDrive className="w-4 h-4" />
            Pengaturan Jadwal Otomatis
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg">
              <div>
                <span className="font-bold text-[#1C1C1C] block">Auto-Backup Otomatis</span>
                <span className="text-[11px] text-[#6B6B6B]">Jalankan ekspor berkala di background</span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoBackupEnabled}
                onChange={(e) => setSettings({ ...settings, autoBackupEnabled: e.target.checked })}
                className="w-5 h-5 accent-[#0F6E5A] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1C1C1C] mb-1">Frekuensi Backup</label>
                <select
                  value={settings.scheduleFrequency}
                  onChange={(e) => setSettings({ ...settings, scheduleFrequency: e.target.value })}
                  className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                >
                  <option value="HARIAN">Setiap Hari (Harian)</option>
                  <option value="MINGGUAN">Setiap Minggu</option>
                  <option value="BULANAN">Setiap Bulan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1C1C1C] mb-1">Jam Eksekusi</label>
                <input
                  type="time"
                  value={settings.scheduleTime}
                  onChange={(e) => setSettings({ ...settings, scheduleTime: e.target.value })}
                  className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1C1C1C] mb-1">
                Masa Simpan File Retention (Hari)
              </label>
              <input
                type="number"
                value={settings.retentionDays}
                onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) || 30 })}
                className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#1C1C1C] mb-1">
                Folder Tujuan Penyimpanan
              </label>
              <input
                type="text"
                value={settings.destinationFolder}
                onChange={(e) => setSettings({ ...settings, destinationFolder: e.target.value })}
                className="w-full h-9 px-3 bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none font-mono text-[11px]"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="w-full py-2.5 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Konfigurasi</span>
            </button>
          </form>
        </div>

        {/* Right Column: History Table */}
        <div className="lg:col-span-7 bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
            <div className="flex items-center gap-2 font-semibold text-sm text-[#0F6E5A]">
              <Clock className="w-4 h-4" />
              Riwayat Backup Terakhir
            </div>
            <button
              onClick={fetchBackupData}
              className="p-1 text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-[#F7F7F6] rounded"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
                  <th className="py-2.5 px-3">NAMA FILE DUMP</th>
                  <th className="py-2.5 px-3">TIPE</th>
                  <th className="py-2.5 px-3">UKURAN</th>
                  <th className="py-2.5 px-3 text-center">DURASI</th>
                  <th className="py-2.5 px-3 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E3]">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="py-3 px-3">
                        <div className="h-4 bg-neutral-200 rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F7F7F6]">
                      <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-[#1C1C1C]">
                        {log.filename}
                        <span className="block font-sans text-[10px] text-[#6B6B6B] font-normal">
                          {new Date(log.createdAt).toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#0F6E5A]">{log.backupType}</td>
                      <td className="py-2.5 px-3 tabular-nums text-[#1C1C1C]">{log.fileSizeMb} MB</td>
                      <td className="py-2.5 px-3 text-center tabular-nums text-[#6B6B6B]">
                        {log.durationSeconds}s
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#1B8A5A]/15 text-[#1B8A5A] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Sukses
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#6B6B6B]">
                      Belum ada log riwayat backup.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
