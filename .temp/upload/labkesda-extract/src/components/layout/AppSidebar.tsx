"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, UserPlus, Inbox, UserCog, Printer, TestTube2, CheckSquare,
  Layers, AlertOctagon, PhoneCall, Activity, FileText, Building2, HardDrive,
  Lock, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft, FlaskConical,
  Receipt, Users, LogOut, DollarSign, Tag, BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import type { AppUser } from "./AppLayout";
import { hasAccess, ROLE_LABELS } from "@/lib/auth-shared";

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenLockedModal: (title: string) => void;
  user: AppUser;
  onLogout: () => void;
}

export function AppSidebar({ isCollapsed, onToggleCollapse, onOpenLockedModal, user, onLogout }: AppSidebarProps) {
  const pathname = usePathname();
  const [pendingOnlineCount, setPendingOnlineCount] = useState(0);
  const [openSection, setOpenSection] = useState<Record<string, boolean>>({
    registrasi: true, kasir: true, pemeriksaan: true, monitoring: true, master: true, laporan: true, pengaturan: true,
  });

  useEffect(() => {
    if (hasAccess(user.role, "/registrasi/pendaftaran-online")) {
      const fetchPending = async () => {
        try {
          const res = await fetch("/api/online-registrations?status=MENUNGGU_VERIFIKASI");
          const data = await res.json();
          if (data.success) setPendingOnlineCount(data.registrations?.length || 0);
        } catch {}
      };
      fetchPending();
      const interval = setInterval(fetchPending, 30000);
      return () => clearInterval(interval);
    }
  }, [user.role]);

  const toggleGroup = (key: string) => setOpenSection((p) => ({ ...p, [key]: !p[key] }));
  const isActive = (path: string) => pathname === path;
  const can = (path: string) => hasAccess(user.role, path);

  const MenuItem = ({ href, icon, label, badge }: { href: string; icon: React.ReactNode; label: string; badge?: React.ReactNode }) => (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
        isActive(href) ? "bg-[#E4F2EE] text-[#0F6E5A] font-semibold" : "text-[#1C1C1C] hover:bg-neutral-100 hover:text-[#0F6E5A]"
      }`}
      title={label}
    >
      {icon}
      {!isCollapsed && <span className="flex items-center justify-between w-full"><span>{label}</span>{badge}</span>}
    </Link>
  );

  const GroupHeader = ({ label, sectionKey }: { label: string; sectionKey: string }) =>
    !isCollapsed ? (
      <button onClick={() => toggleGroup(sectionKey)} className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-[#6B6B6B] hover:text-[#1C1C1C]">
        <span className="uppercase tracking-wider">{label}</span>
        {openSection[sectionKey] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>
    ) : <div className="h-px bg-[#E5E5E3] my-1" />;

  // Determine which groups have at least one visible item
  const hasRegistrasi = can("/registrasi/baru") || can("/registrasi/pendaftaran-online") || can("/registrasi/edit") || can("/registrasi/print-label");
  const hasKasir = can("/kasir/pembayaran");
  const hasPemeriksaan = can("/pemeriksaan") || can("/pemeriksaan/validasi") || can("/pemeriksaan/duplo") || can("/pemeriksaan/auto-flagging") || can("/pemeriksaan/nilai-kritis");
  const hasMonitoring = can("/monitoring/realtime-tat") || can("/monitoring/laporan-tat");
  const hasMaster = can("/master/rs") || can("/master/tarif");
  const hasLaporan = can("/laporan");
  const hasPengaturan = can("/pengaturan/backup") || can("/pengaturan/pengguna") || can("/pengaturan/kop-surat");

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative z-30 flex flex-col h-screen bg-white border-r border-[#E5E5E3] select-none shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-3.5 border-b border-[#E5E5E3] bg-white">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#0F6E5A] flex items-center justify-center text-white shrink-0 shadow-xs">
            <FlaskConical className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#1C1C1C] tracking-wide uppercase truncate">Labkesda Garut</span>
              <span className="text-[10px] text-[#6B6B6B] truncate font-medium">LIS v2.6 • Operational</span>
            </div>
          )}
        </div>
        <button onClick={onToggleCollapse} className="p-1.5 text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-neutral-100 rounded-md transition-colors">
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {can("/dashboard") && <MenuItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4 shrink-0" />} label="Dashboard" />}
        {can("/antrian") && <MenuItem href="/antrian" icon={<Layers className="w-4 h-4 shrink-0" />} label="Antrian Pasien" />}

        {hasRegistrasi && (
          <div className="pt-2">
            <GroupHeader label="Registrasi" sectionKey="registrasi" />
            {(openSection.registrasi || isCollapsed) && (
              <div className="mt-0.5 space-y-0.5">
                {can("/registrasi/baru") && <MenuItem href="/registrasi/baru" icon={<UserPlus className="w-4 h-4 shrink-0" />} label="Registrasi Pasien Baru" />}
                {can("/registrasi/pendaftaran-online") && (
                  <MenuItem href="/registrasi/pendaftaran-online" icon={<Inbox className="w-4 h-4 shrink-0 text-[#E8A33D]" />} label="Pendaftaran Online"
                    badge={pendingOnlineCount > 0 ? <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-[#D64545] text-white rounded-full min-w-[18px] text-center leading-tight shadow-xs">{pendingOnlineCount}</span> : undefined}
                  />
                )}
                {can("/registrasi/edit") && <MenuItem href="/registrasi/edit" icon={<UserCog className="w-4 h-4 shrink-0" />} label="Edit Data Pasien" />}
                {can("/registrasi/print-label") && <MenuItem href="/registrasi/print-label" icon={<Printer className="w-4 h-4 shrink-0" />} label="Print Label" />}
              </div>
            )}
          </div>
        )}

        {hasKasir && (
          <div className="pt-2">
            <GroupHeader label="Kasir" sectionKey="kasir" />
            {(openSection.kasir || isCollapsed) && (
              <div className="mt-0.5 space-y-0.5">
                <MenuItem href="/kasir/pembayaran" icon={<Receipt className="w-4 h-4 shrink-0 text-[#E8A33D]" />} label="Pembayaran & Verifikasi" />
              </div>
            )}
          </div>
        )}

        {hasPemeriksaan && (
          <div className="pt-2">
            <GroupHeader label="Pemeriksaan Lab" sectionKey="pemeriksaan" />
            {(openSection.pemeriksaan || isCollapsed) && (
              <div className="mt-0.5 space-y-0.5">
                {can("/pemeriksaan") && <MenuItem href="/pemeriksaan" icon={<TestTube2 className="w-4 h-4 shrink-0" />} label="Detail Data Pemeriksaan" />}
                {can("/pemeriksaan/validasi") && <MenuItem href="/pemeriksaan/validasi" icon={<CheckSquare className="w-4 h-4 shrink-0" />} label="Validasi Pasien" />}
                {can("/pemeriksaan/duplo") && <MenuItem href="/pemeriksaan/duplo" icon={<Layers className="w-4 h-4 shrink-0 text-[#3B7DD8]" />} label="Hasil Duplo" />}
                {can("/pemeriksaan/auto-flagging") && <MenuItem href="/pemeriksaan/auto-flagging" icon={<AlertOctagon className="w-4 h-4 shrink-0 text-[#D64545]" />} label="Auto Flagging" />}
                {can("/pemeriksaan/nilai-kritis") && <MenuItem href="/pemeriksaan/nilai-kritis" icon={<PhoneCall className="w-4 h-4 shrink-0 text-[#D64545]" />} label="Pelaporan Nilai Kritis" />}
              </div>
            )}
          </div>
        )}

        {hasMonitoring && (
          <div className="pt-2">
            <GroupHeader label="Monitoring" sectionKey="monitoring" />
            {(openSection.monitoring || isCollapsed) && (
              <div className="mt-0.5 space-y-0.5">
                {can("/monitoring/realtime-tat") && <MenuItem href="/monitoring/realtime-tat" icon={<Activity className="w-4 h-4 shrink-0 text-[#1B8A5A]" />} label="Monitoring TAT Realtime" />}
                {can("/monitoring/laporan-tat") && <MenuItem href="/monitoring/laporan-tat" icon={<FileText className="w-4 h-4 shrink-0" />} label="Laporan TAT" />}
              </div>
            )}
          </div>
        )}

        {hasMaster && (
          <div className="pt-2">
            <GroupHeader label="Master Data" sectionKey="master" />
            {(openSection.master || isCollapsed) && (
              <div className="mt-0.5 space-y-0.5">
                {can("/master/rs") && <MenuItem href="/master/rs" icon={<Building2 className="w-4 h-4 shrink-0" />} label="Datamaster RS Rujukan" />}
                {can("/master/tarif") && <MenuItem href="/master/tarif" icon={<Tag className="w-4 h-4 shrink-0" />} label="Datamaster Tarif Lab" />}
              </div>
            )}
          </div>
        )}

        {hasLaporan && (
          <div className="pt-2">
            <GroupHeader label="Laporan" sectionKey="laporan" />
            {(openSection.laporan || isCollapsed) && (
              <div className="mt-0.5 space-y-0.5">
                <MenuItem href="/laporan" icon={<BarChart3 className="w-4 h-4 shrink-0 text-[#0F6E5A]" />} label="Laporan & Rekapitulasi" />
              </div>
            )}
          </div>
        )}

        {hasPengaturan && (
          <div className="pt-2">
            <GroupHeader label="Pengaturan" sectionKey="pengaturan" />
            {(openSection.pengaturan || isCollapsed) && (
              <div className="mt-0.5 space-y-0.5">
                {can("/pengaturan/kop-surat") && <MenuItem href="/pengaturan/kop-surat" icon={<FileText className="w-4 h-4 shrink-0" />} label="Kelola Kop Surat" />}
                {can("/pengaturan/backup") && <MenuItem href="/pengaturan/backup" icon={<HardDrive className="w-4 h-4 shrink-0" />} label="Setting Backup" />}
                {can("/pengaturan/pengguna") && <MenuItem href="/pengaturan/pengguna" icon={<Users className="w-4 h-4 shrink-0" />} label="Kelola Pengguna" />}
              </div>
            )}
          </div>
        )}

        {/* Segera Hadir */}
        <div className="pt-3 pb-2 border-t border-[#E5E5E3] mt-3">
          {!isCollapsed && <div className="px-2.5 py-1 text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider flex items-center justify-between"><span>Segera Hadir</span><Lock className="w-3 h-3" /></div>}
          <div className="mt-1 space-y-0.5 opacity-60">
            {[{t:"Registrasi MCU"},{t:"Permintaan Darah Pasien"}].map((i)=>(
              <button key={i.t} onClick={() => onOpenLockedModal(i.t)} className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#6B6B6B] hover:bg-neutral-100 cursor-pointer text-left" title={i.t}>
                <Lock className="w-3.5 h-3.5 shrink-0" />{!isCollapsed && <span>{i.t}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User Footer */}
      {!isCollapsed && (
        <div className="p-3 border-t border-[#E5E5E3] bg-[#F7F7F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0F6E5A] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-[#1C1C1C] truncate">{user.fullName}</span>
              <span className="text-[10px] text-[#6B6B6B] truncate">{ROLE_LABELS[user.role] || user.role}</span>
            </div>
            <button onClick={onLogout} title="Keluar" className="p-1.5 text-[#6B6B6B] hover:text-[#D64545] hover:bg-[#D64545]/10 rounded-md transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
