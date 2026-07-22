"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Clock,
  AlertTriangle,
  FileCheck,
  Inbox,
  ArrowUpRight,
  Flame,
  RefreshCw,
  TrendingUp,
  FlaskConical,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import Link from "next/link";
import { useUser } from "@/components/layout/AppLayout";
import { ROLE_LABELS } from "@/lib/auth-shared";

interface DashboardData {
  summary: {
    totalPatientsToday: number;
    totalPatientsAll: number;
    avgTatMinutes: number;
    criticalCount: number;
    pendingValidationCount: number;
    pendingOnlineCount: number;
  };
  pieData: Array<{ name: string; value: number; fill: string }>;
  barData: Array<{ status: string; count: number; color: string }>;
  citoPatients: Array<{
    id: number;
    labNo: string;
    patientName: string;
    rmNo: string;
    doctorName: string;
    status: string;
    sampleReceivedAt: string;
    clinicalNotes?: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const user = useUser();
  const role = user?.role || "";

  useEffect(() => {
    fetchDashboard();
  }, [role]);

  const pendingOnlineCount = data?.summary.pendingOnlineCount || 0;

  // Visibilitas kartu & widget per role. Admin melihat semua.
  const isRole = (...roles: string[]) => roles.includes(role);
  const show = {
    totalPatients: true,
    tat: isRole("ANALIS_LAB", "PJ_LAB", "ADMIN_SISTEM"),
    critical: isRole("ANALIS_LAB", "PJ_LAB", "ADMIN_SISTEM"),
    pendingValidation: isRole("PJ_LAB", "ADMIN_SISTEM"),
    onlineReg: isRole("PETUGAS_LOKET", "ADMIN_SISTEM"),
    qcChart: isRole("ANALIS_LAB", "PJ_LAB", "ADMIN_SISTEM"),
    statusChart: true,
    citoWidget: isRole("ANALIS_LAB", "PJ_LAB", "KASIR", "ADMIN_SISTEM"),
  };
  const cardCount = [
    show.totalPatients, show.tat, show.critical, show.pendingValidation, show.onlineReg,
  ].filter(Boolean).length;
  const cardGrid =
    cardCount >= 5 ? "lg:grid-cols-5"
    : cardCount === 4 ? "lg:grid-cols-4"
    : cardCount === 3 ? "lg:grid-cols-3"
    : cardCount === 2 ? "lg:grid-cols-2"
    : "lg:grid-cols-1";

  const ROLE_SUBTITLE: Record<string, string> = {
    PETUGAS_LOKET: "Ringkasan registrasi pasien dan antrean pendaftaran online hari ini.",
    KASIR: "Ringkasan volume pasien dan sampel yang perlu diproses pembayarannya.",
    ANALIS_LAB: "Ringkasan beban kerja analitik, Turn Around Time, dan sampel CITO/kritis.",
    PJ_LAB: "Ringkasan antrean validasi, nilai kritis, dan performa TAT laboratorium.",
    ADMIN_SISTEM: "Ringkasan menyeluruh aktivitas operasional laboratorium.",
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1C1C1C] tracking-tight">
            Dashboard {ROLE_LABELS[role] || "Operasional"} Labkesda
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            {ROLE_SUBTITLE[role] || "Ringkasan aktivitas operasional laboratorium hari ini."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] rounded-lg text-xs font-semibold text-[#1C1C1C] transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0F6E5A] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Data</span>
          </button>
          {isRole("PETUGAS_LOKET", "ADMIN_SISTEM") && (
            <Link
              href="/registrasi/baru"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F6E5A] hover:bg-[#0B5445] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>+ Pasien Baru</span>
            </Link>
          )}
        </div>
      </div>

      {/* Row 1: Summary Cards (per role) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${cardGrid} gap-3.5`}>
        {loading ? (
          Array.from({ length: cardCount }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-[#E5E5E3] rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-neutral-200 rounded w-1/2 mb-3" />
              <div className="h-6 bg-neutral-200 rounded w-1/3" />
            </div>
          ))
        ) : (
          <>
            {/* Card 1: Total Pasien Hari Ini */}
            {show.totalPatients && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="bg-white border border-[#E5E5E3] rounded-xl p-4 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-xs font-medium">Total Pasien Hari Ini</span>
                <div className="p-2 bg-[#E4F2EE] rounded-lg text-[#0F6E5A]">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#1C1C1C] tabular-nums">
                  {data?.summary.totalPatientsToday || 0}
                </span>
                <span className="text-[11px] text-[#1B8A5A] font-semibold flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> Live Order
                </span>
              </div>
            </motion.div>
            )}

            {/* Card 2: TAT Rata-rata */}
            {show.tat && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white border border-[#E5E5E3] rounded-xl p-4 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-xs font-medium">TAT Rata-rata</span>
                <div className="p-2 bg-[#E4F2EE] rounded-lg text-[#0F6E5A]">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#1C1C1C] tabular-nums">
                  {data?.summary.avgTatMinutes || 0}{" "}
                  <span className="text-xs font-normal text-[#6B6B6B]">Menit</span>
                </span>
                <span className="text-[11px] text-[#1B8A5A] font-medium bg-[#1B8A5A]/10 px-2 py-0.5 rounded">
                  Target &lt;120m
                </span>
              </div>
            </motion.div>
            )}

            {/* Card 3: Pasien Kritis */}
            {show.critical && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className={`bg-white border rounded-xl p-4 shadow-2xs flex flex-col justify-between ${
                (data?.summary.criticalCount || 0) > 0
                  ? "border-[#D64545]/40 bg-[#D64545]/5"
                  : "border-[#E5E5E3]"
              }`}
            >
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-xs font-medium">Pasien Kritis (Unconfirmed)</span>
                <div
                  className={`p-2 rounded-lg ${
                    (data?.summary.criticalCount || 0) > 0
                      ? "bg-[#D64545] text-white"
                      : "bg-neutral-100 text-[#6B6B6B]"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#1C1C1C] tabular-nums">
                  {data?.summary.criticalCount || 0}
                </span>
                {(data?.summary.criticalCount || 0) > 0 ? (
                  <span className="text-[11px] font-bold text-[#D64545] bg-[#D64545]/15 px-2 py-0.5 rounded-full animate-pulse">
                    CITO / Urgent
                  </span>
                ) : (
                  <span className="text-[11px] text-[#1B8A5A]">Semua Aman</span>
                )}
              </div>
            </motion.div>
            )}

            {/* Card 4: Pending Validasi */}
            {show.pendingValidation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-white border border-[#E5E5E3] rounded-xl p-4 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-xs font-medium">Pending Validasi Analis</span>
                <div className="p-2 bg-[#E8A33D]/10 text-[#E8A33D] rounded-lg">
                  <FileCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#1C1C1C] tabular-nums">
                  {data?.summary.pendingValidationCount || 0}
                </span>
                <Link
                  href="/pemeriksaan/validasi"
                  className="text-[11px] font-semibold text-[#0F6E5A] hover:underline flex items-center"
                >
                  Proses Validasi &rarr;
                </Link>
              </div>
            </motion.div>
            )}

            {/* Card 5: Pendaftaran Online Menunggu */}
            {show.onlineReg && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
              className={`bg-white border rounded-xl p-4 shadow-2xs flex flex-col justify-between ${
                pendingOnlineCount > 0
                  ? "border-[#E8A33D]/40 bg-[#E8A33D]/5"
                  : "border-[#E5E5E3]"
              }`}
            >
              <div className="flex items-center justify-between text-[#6B6B6B]">
                <span className="text-xs font-medium">Pendaftaran Online Menunggu</span>
                <div className={`p-2 rounded-lg ${
                  pendingOnlineCount > 0
                    ? "bg-[#E8A33D] text-white"
                    : "bg-neutral-100 text-[#6B6B6B]"
                }`}>
                  <Inbox className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-[#1C1C1C] tabular-nums">
                  {pendingOnlineCount}
                </span>
                {pendingOnlineCount > 0 ? (
                  <Link
                    href="/registrasi/pendaftaran-online"
                    className="text-[11px] font-bold text-[#E8A33D] bg-[#E8A33D]/15 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 animate-pulse"
                  >
                    <Inbox className="w-3 h-3" /> Verifikasi Sekarang
                  </Link>
                ) : (
                  <span className="text-[11px] text-[#1B8A5A]">Tidak Ada Antrean</span>
                )}
              </div>
            </motion.div>
            )}
          </>
        )}
      </div>

      {/* Row 2: Charts & CITO Widget */}
      <div className={`grid grid-cols-1 gap-5 ${
        [show.qcChart, show.statusChart, show.citoWidget].filter(Boolean).length >= 3
          ? "lg:grid-cols-3"
          : [show.qcChart, show.statusChart, show.citoWidget].filter(Boolean).length === 2
          ? "lg:grid-cols-2"
          : "lg:grid-cols-1"
      }`}>
        {/* Pie Chart: Duplo vs Non-Duplo */}
        {show.qcChart && (
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
            <div>
              <h3 className="text-sm font-bold text-[#1C1C1C]">Kunjungan Duplo & Non-Duplo</h3>
              <p className="text-[11px] text-[#6B6B6B]">Proporsi kontrol kualitas sampel laboratorium</p>
            </div>
            <span className="text-[10px] bg-[#3B7DD8]/10 text-[#3B7DD8] font-bold px-2 py-0.5 rounded">
              QC Monitor
            </span>
          </div>

          <div className="h-56 w-full my-2 flex items-center justify-center">
            {loading ? (
              <div className="w-32 h-32 rounded-full border-4 border-neutral-200 border-t-[#0F6E5A] animate-spin" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.pieData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(data?.pieData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E5E5E3",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-[#1C1C1C]">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        )}

        {/* Bar Chart: Total Pasien per Status Pemeriksaan */}
        {show.statusChart && (
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
            <div>
              <h3 className="text-sm font-bold text-[#1C1C1C]">Pasien per Status Pemeriksaan</h3>
              <p className="text-[11px] text-[#6B6B6B]">Progres tahapan pengolahan spesimen lab</p>
            </div>
          </div>

          <div className="h-56 w-full my-2">
            {loading ? (
              <div className="h-full w-full bg-neutral-100 animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.barData || []} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis
                    dataKey="status"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E5E5E3",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {(data?.barData || []).map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        )}

        {/* Widget CITO Registrasi */}
        {show.citoWidget && (
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-4 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#D64545] text-white rounded-md">
                <Flame className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1C1C]">Penanda Registrasi CITO</h3>
                <p className="text-[11px] text-[#6B6B6B]">Daftar prioritas tinggi hari ini</p>
              </div>
            </div>
            <Link
              href="/pemeriksaan"
              className="text-xs text-[#0F6E5A] font-semibold hover:underline flex items-center"
            >
              Lihat Semua <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-64 pr-1">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-neutral-100 rounded-lg animate-pulse" />
              ))
            ) : data?.citoPatients && data.citoPatients.length > 0 ? (
              data.citoPatients.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded-lg border border-[#D64545]/20 bg-[#D64545]/5 hover:bg-[#D64545]/10 transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#1C1C1C] truncate">{p.patientName}</span>
                      <span className="px-1.5 py-0.2 bg-[#D64545] text-white text-[10px] font-bold rounded">
                        CITO
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B6B6B] mt-0.5 truncate">
                      {p.labNo} • {p.rmNo} • Dr. {p.doctorName}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-[#D64545] font-semibold block">
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#6B6B6B]">
                Tidak ada sampel CITO aktif saat ini.
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
