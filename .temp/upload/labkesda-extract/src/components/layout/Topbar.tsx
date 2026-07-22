"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Clock,
  LogOut,
  ShieldCheck,
  ChevronDown,
  AlertTriangle,
  TestTube2,
  CheckCircle2,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

interface TopbarProps {
  user?: { fullName: string; role: string; username: string } | null;
  onLogout?: () => void;
}

interface Notif {
  id: string;
  title: string;
  desc: string;
  type: "critical" | "warning" | "info";
  href: string;
  count: number;
}

export function Topbar({ user, onLogout }: TopbarProps) {
  const router = useRouter();
  const [timeStr, setTimeStr] = useState<string>("");
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const updateTime = () => {
      setTimeStr(format(new Date(), "EEEE, dd MMMM yyyy • HH:mm:ss"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Ambil notifikasi nyata sesuai role, lalu poll tiap 30 detik.
  useEffect(() => {
    let active = true;
    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (active && data.notifications) setNotifications(data.notifications);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user?.role]);

  // Notifikasi yang belum ditutup pengguna pada sesi ini.
  const visible = notifications.filter((n) => !dismissed.has(n.id));

  const openNotif = (n: Notif) => {
    router.push(n.href);
  };

  return (
    <header className="h-14 bg-white border-b border-[#E5E5E3] px-4 flex items-center justify-between z-20 sticky top-0 shrink-0">
      {/* Brand / context (kiri) */}
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1C1C]">
        <span className="hidden sm:inline">Sistem Informasi Laboratorium</span>
        <span className="sm:hidden">LIS Labkesda</span>
      </div>

      {/* Topbar Right Context Actions */}
      <div className="flex items-center gap-3">
        {/* Real-time Date Clock Display */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#6B6B6B] tabular-nums bg-[#F7F7F6] px-2.5 py-1 rounded-md border border-[#E5E5E3]">
          <Clock className="w-3.5 h-3.5 text-[#0F6E5A]" />
          <span>{timeStr || "Memuat waktu..."}</span>
        </div>

        {/* Notifications Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="relative p-2 text-[#6B6B6B] hover:text-[#1C1C1C] hover:bg-neutral-100 rounded-lg transition-colors focus:outline-none">
              <Bell className="w-4 h-4" />
              {visible.length > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D64545] text-[9px] font-bold text-white shadow-xs">
                  {visible.length}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-80 rounded-xl bg-white p-2 shadow-lg border border-[#E5E5E3] text-xs focus:outline-none"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#E5E5E3]">
                <span className="font-semibold text-[#1C1C1C]">Notifikasi Sistem LIS</span>
                <span className="text-[10px] bg-[#E4F2EE] text-[#0F6E5A] px-2 py-0.5 rounded-full font-medium">
                  {visible.length} Baru
                </span>
              </div>

              <div className="py-1 space-y-1 max-h-72 overflow-y-auto">
                {visible.length === 0 ? (
                  <div className="py-8 text-center text-[#6B6B6B]">
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-[#1B8A5A]" />
                    <p className="text-[11px]">Tidak ada notifikasi baru.</p>
                  </div>
                ) : (
                  visible.map((n) => (
                    <DropdownMenu.Item
                      key={n.id}
                      onSelect={() => openNotif(n)}
                      className="p-2.5 rounded-lg hover:bg-[#F7F7F6] transition-colors border border-transparent hover:border-[#E5E5E3] cursor-pointer outline-none block"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {n.type === "critical" && (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#D64545] shrink-0" />
                        )}
                        {n.type === "warning" && (
                          <TestTube2 className="w-3.5 h-3.5 text-[#E8A33D] shrink-0" />
                        )}
                        {n.type === "info" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#3B7DD8] shrink-0" />
                        )}
                        <span className="font-semibold text-[#1C1C1C] truncate">{n.title}</span>
                      </div>
                      <p className="text-[11px] text-[#6B6B6B] line-clamp-2 leading-snug">{n.desc}</p>
                    </DropdownMenu.Item>
                  ))
                )}
              </div>

              {visible.length > 0 && (
                <div className="pt-2 border-t border-[#E5E5E3] text-center">
                  <button
                    onClick={() => setDismissed(new Set(notifications.map((n) => n.id)))}
                    className="text-[11px] text-[#0F6E5A] font-semibold hover:underline"
                  >
                    Tandai Semua Sudah Dibaca
                  </button>
                </div>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* User Profile Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-neutral-100 border border-transparent hover:border-[#E5E5E3] transition-colors focus:outline-none">
              <div className="w-7 h-7 rounded-full bg-[#0F6E5A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {(user?.fullName || "U").substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#1C1C1C] leading-none">
                  {user?.fullName || "User"}
                </span>
                <span className="text-[10px] text-[#6B6B6B] leading-tight mt-0.5">
                  {user?.role || ""}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-56 rounded-xl bg-white p-1.5 shadow-lg border border-[#E5E5E3] text-xs focus:outline-none"
            >
              <div className="px-3 py-2 border-b border-[#E5E5E3] bg-[#F7F7F6] rounded-lg mb-1">
                <p className="font-semibold text-[#1C1C1C]">{user?.fullName || "User"}</p>
                <p className="text-[11px] text-[#6B6B6B]">@{user?.username || ""}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-[#0F6E5A] font-medium">
                  <ShieldCheck className="w-3 h-3" /> {user?.role || ""}
                </div>
              </div>

              <DropdownMenu.Item onSelect={() => onLogout?.()} className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-[#D64545]/10 text-[#D64545] cursor-pointer outline-none font-medium">
                <LogOut className="w-3.5 h-3.5" /> Keluar Sesi LIS
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
