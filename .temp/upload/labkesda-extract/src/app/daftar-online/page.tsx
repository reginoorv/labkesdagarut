"use client";

import React, { useState } from "react";
import {
  FlaskConical,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Download,
  QrCode,
  CalendarClock,
  User,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  Upload,
  AlertCircle,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Barcode } from "@/components/common/Barcode";
import { NEGARA, getProvinsiList, getKotaList, getKecamatanList, getDesaList } from "@/lib/wilayah";
import { PURPOSE_REQUIRED_PACKAGES } from "@/lib/test-catalog";

const TEST_CATEGORIES = [
  { id: "Hematologi", name: "Hematologi", desc: "Darah lengkap, hitung sel darah", color: "#D64545" },
  { id: "Kimia Klinik", name: "Kimia Klinik", desc: "Gula darah, kolesterol, fungsi ginjal & hati", color: "#3B7DD8" },
  { id: "Imunoserologi", name: "Imunoserologi", desc: "HBsAg, HIV, Dengue", color: "#0F6E5A" },
  { id: "Mikrobiologi", name: "Mikrobiologi", desc: "Kultur & identifikasi bakteri", color: "#8B5CF6" },
  { id: "Urinalisis", name: "Urinalisis", desc: "Urine rutin", color: "#E8A33D" },
  { id: "NARKOBA", name: "Tes Narkoba", desc: "Panel 6 parameter — perlu keperluan", color: "#B45309" },
  { id: "KESEHATAN", name: "Surat Keterangan Sehat", desc: "Pemeriksaan fisik — perlu keperluan", color: "#0891B2" },
];

// Get min/max visit dates
const today = new Date();
const minDate = new Date(today);
minDate.setDate(minDate.getDate() + 1);
const maxDate = new Date(today);
maxDate.setDate(maxDate.getDate() + 14);

const formatDate = (d: Date) => d.toISOString().split("T")[0];
const minDateStr = formatDate(minDate);
const maxDateStr = formatDate(maxDate);

const EMPTY_FORM = {
  name: "",
  nik: "",
  dob: "",
  gender: "L",
  phone: "",
  negara: "Indonesia",
  provinsi: "",
  kota: "",
  kecamatan: "",
  desa: "",
  rtRw: "",
  jalan: "",
};

export default function DaftarOnlinePage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [purpose, setPurpose] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [referralFileName, setReferralFileName] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pencarian pasien lama via NIK.
  const [nikLookupState, setNikLookupState] = useState<"idle" | "loading" | "found" | "notfound">("idle");

  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Reset turunan alamat ketika induknya berubah.
  const setProvinsi = (v: string) => setForm((p) => ({ ...p, provinsi: v, kota: "", kecamatan: "", desa: "" }));
  const setKota = (v: string) => setForm((p) => ({ ...p, kota: v, kecamatan: "", desa: "" }));
  const setKecamatan = (v: string) => setForm((p) => ({ ...p, kecamatan: v, desa: "" }));

  const needPurpose = selectedTests.some((t) => PURPOSE_REQUIRED_PACKAGES.includes(t));

  // Susun alamat lengkap dari komponen dropdown.
  const composeAddress = () => {
    const parts = [
      form.jalan,
      form.rtRw ? `RT/RW ${form.rtRw}` : "",
      form.desa,
      form.kecamatan,
      form.kota,
      form.provinsi,
      form.negara,
    ].filter(Boolean);
    return parts.join(", ");
  };

  // Cari data pasien lama berdasarkan NIK; kalau ada, isi otomatis.
  const handleNikLookup = async () => {
    const nik = form.nik.trim();
    if (nik.length < 6) {
      setErrors((e) => ({ ...e, nik: "Masukkan NIK lengkap untuk mencari data" }));
      return;
    }
    setNikLookupState("loading");
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(nik)}`);
      const data = await res.json();
      const found = (data.patients || []).find((p: any) => p.nik === nik);
      if (found) {
        setForm((p) => ({
          ...p,
          name: found.name || "",
          dob: found.dob || "",
          gender: found.gender || "L",
          phone: found.phone || "",
        }));
        setNikLookupState("found");
        setErrors((e) => ({ ...e, nik: "" }));
      } else {
        setNikLookupState("notfound");
      }
    } catch {
      setNikLookupState("notfound");
    }
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.name || form.name.trim().length < 3) errs.name = "Nama lengkap minimal 3 karakter";
    if (!form.nik || form.nik.trim().length < 6) errs.nik = "NIK wajib diisi";
    if (!form.dob) errs.dob = "Tanggal lahir wajib diisi";
    if (!form.gender) errs.gender = "Pilih jenis kelamin";
    if (!form.phone || form.phone.trim().length < 8) errs.phone = "No. HP minimal 8 digit";
    if (!form.provinsi) errs.provinsi = "Pilih provinsi";
    if (!form.kota) errs.kota = "Pilih kota/kabupaten";
    if (!form.kecamatan) errs.kecamatan = "Pilih kecamatan";
    if (!form.desa) errs.desa = "Pilih desa/kelurahan";
    if (!form.rtRw || form.rtRw.trim().length < 3) errs.rtRw = "Isi RT/RW (mis. 001/002)";
    if (!form.jalan || form.jalan.trim().length < 3) errs.jalan = "Isi nama jalan/kampung";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return false;
    setStep(2);
    return true;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!visitDate) errs.visitDate = "Pilih tanggal kunjungan";
    if (selectedTests.length === 0) errs.testCategories = "Pilih minimal 1 jenis pemeriksaan";
    if (needPurpose && purpose.trim().length < 3) errs.purpose = "Keperluan wajib diisi untuk tes Narkoba/Kesehatan";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return false;
    return true;
  };

  const handleFinalSubmit = async () => {
    if (!validateStep2()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/online-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          nik: form.nik,
          dob: form.dob,
          gender: form.gender,
          phone: form.phone,
          address: composeAddress(),
          guaranteeType: "UMUM",
          purpose: needPurpose ? purpose : null,
          visitDate,
          requestedTests: selectedTests,
          notes,
          referralFileUrl: referralFileName ? `/uploads/referrals/${referralFileName}` : null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmittedResult(data.registration);
      } else {
        setErrors({ submit: data.error || "Gagal mengirim pendaftaran" });
      }
    } catch (e: any) {
      setErrors({ submit: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTest = (id: string) => {
    setSelectedTests((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleDownloadImage = () => {
    const qrEl = document.getElementById("qr-code-area");
    const svg = qrEl?.querySelector("svg");
    if (!svg || !submittedResult) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const S = 3; // skala resolusi (retina)
    const W = 440; // lebar kartu (pt logis)
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tests: string[] = (() => {
      try { return JSON.parse(submittedResult.requestedTests); } catch { return []; }
    })();
    const testsLine = tests.join(", ");
    const visitStr = new Date(submittedResult.visitDate + "T00:00:00").toLocaleDateString("id-ID", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    // Bungkus teks daftar tes agar muat di lebar kartu.
    const pad = 28;
    ctx.font = `600 13px system-ui, sans-serif`;
    const wrap = (text: string, maxW: number) => {
      const words = text.split(" ");
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const trial = cur ? cur + " " + w : w;
        if (ctx.measureText(trial).width > maxW && cur) { lines.push(cur); cur = w; }
        else cur = trial;
      }
      if (cur) lines.push(cur);
      return lines;
    };
    const testLines = wrap(testsLine || "-", W - pad * 2);

    // Hitung tinggi total kartu secara dinamis.
    const barcodeH = 90;
    const H = 250 + barcodeH + testLines.length * 18 + 90;
    canvas.width = W * S;
    canvas.height = H * S;
    ctx.scale(S, S);

    const img = new Image();
    img.onload = () => {
      // Latar
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, W, H);

      // Header hijau institusi
      ctx.fillStyle = "#0F6E5A";
      ctx.fillRect(0, 0, W, 58);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "700 17px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("LABKESDA GARUT", pad, 30);
      ctx.font = "500 11px system-ui, sans-serif";
      ctx.fillText("Bukti Pendaftaran Online Laboratorium", pad, 46);

      let y = 92;
      // Kode booking
      ctx.textAlign = "center";
      ctx.fillStyle = "#6B6B6B";
      ctx.font = "500 11px system-ui, sans-serif";
      ctx.fillText("KODE BOOKING", W / 2, y);
      y += 26;
      ctx.fillStyle = "#0F6E5A";
      ctx.font = "800 26px system-ui, sans-serif";
      ctx.fillText(submittedResult.bookingCode, W / 2, y);
      y += 24;

      // Barcode
      ctx.drawImage(img, (W - 260) / 2, y, 260, barcodeH);
      y += barcodeH + 6;
      ctx.fillStyle = "#1C1C1C";
      ctx.font = "600 12px monospace";
      ctx.fillText(submittedResult.bookingCode, W / 2, y);
      y += 26;

      // Garis pemisah
      ctx.strokeStyle = "#E5E5E3";
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
      y += 24;

      // Detail (label kiri, nilai kanan)
      const row = (label: string, value: string) => {
        ctx.textAlign = "left";
        ctx.fillStyle = "#6B6B6B";
        ctx.font = "500 12px system-ui, sans-serif";
        ctx.fillText(label, pad, y);
        ctx.textAlign = "right";
        ctx.fillStyle = "#1C1C1C";
        ctx.font = "700 12px system-ui, sans-serif";
        ctx.fillText(value, W - pad, y);
        y += 24;
      };
      row("Nama Pasien", submittedResult.name);
      row("Jadwal Kunjungan", visitStr);

      // Daftar tes (multi-baris)
      ctx.textAlign = "left";
      ctx.fillStyle = "#6B6B6B";
      ctx.font = "500 12px system-ui, sans-serif";
      ctx.fillText("Jenis Pemeriksaan", pad, y);
      y += 18;
      ctx.fillStyle = "#1C1C1C";
      ctx.font = "600 12px system-ui, sans-serif";
      for (const line of testLines) { ctx.fillText(line, pad, y); y += 18; }
      y += 10;

      // Footer instruksi
      ctx.fillStyle = "#E4F2EE";
      ctx.fillRect(0, H - 64, W, 64);
      ctx.fillStyle = "#0F6E5A";
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Tunjukkan barcode ini ke petugas loket saat datang.", W / 2, H - 40);
      ctx.fillText("Hadir 15 menit sebelum jadwal kunjungan.", W / 2, H - 22);

      const link = document.createElement("a");
      link.download = `booking-${submittedResult.bookingCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  // --- SUCCESS STATE ---
  if (submittedResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E4F2EE] to-[#F7F7F6] flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-8 flex-1 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-[#E5E5E3] p-6 md:p-8 space-y-5"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1B8A5A]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-[#1B8A5A]" />
              </div>
              <h2 className="text-xl font-bold text-[#1C1C1C]">Pendaftaran Berhasil!</h2>
              <p className="text-sm text-[#6B6B6B] mt-1">
                Simpan kode booking di bawah ini dan tunjukkan ke petugas loket saat datang.
              </p>
            </div>

            {/* Booking Code */}
            <div className="bg-[#F7F7F6] border-2 border-dashed border-[#0F6E5A]/30 rounded-xl p-4 text-center space-y-1">
              <span className="text-xs text-[#6B6B6B] font-medium">Kode Booking</span>
              <div className="text-2xl font-extrabold text-[#0F6E5A] tracking-wider tabular-nums">
                {submittedResult.bookingCode}
              </div>
            </div>

            {/* Barcode Code128 asli (discan petugas loket) */}
            <div id="qr-code-area" className="flex justify-center py-2">
              <Barcode value={submittedResult.bookingCode} height={64} moduleWidth={2} />
            </div>

            {/* Summary */}
            <div className="space-y-2 text-sm bg-[#F7F7F6] rounded-xl p-4 border border-[#E5E5E3]">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Nama Pasien</span>
                <span className="font-semibold text-[#1C1C1C]">{submittedResult.name}</span>
              </div>
              <div className="flex justify-between border-t border-[#E5E5E3] pt-2">
                <span className="text-[#6B6B6B]">Jadwal Kunjungan</span>
                <span className="font-semibold text-[#1C1C1C]">
                  {new Date(submittedResult.visitDate + "T00:00:00").toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E5E5E3] pt-2">
                <span className="text-[#6B6B6B]">Jenis Pemeriksaan</span>
                <span className="font-semibold text-[#1C1C1C] text-right">
                  {JSON.parse(submittedResult.requestedTests).join(", ")}
                </span>
              </div>
            </div>

            {/* Alur langkah pasien */}
            <div className="p-4 bg-[#E4F2EE] rounded-xl text-xs text-[#0F6E5A] leading-relaxed space-y-2">
              <p className="font-bold flex items-center gap-1">
                <CalendarClock className="w-4 h-4" /> Langkah selanjutnya:
              </p>
              <ol className="list-decimal list-inside space-y-1 font-medium">
                <li>Datang ke loket sesuai jadwal, tunjukkan kode booking / barcode ini.</li>
                <li>Petugas loket memverifikasi data dan memberi <strong>Nomor Antrian</strong>.</li>
                <li>Tunggu nomor antrian dipanggil di <strong>Kasir</strong> untuk pembayaran / verifikasi jaminan.</li>
                <li>Setelah lolos, sampel diambil dan diperiksa di laboratorium.</li>
              </ol>
              <p className="text-[11px] text-[#0F6E5A]/80">Hadir 15 menit sebelum jadwal kunjungan.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSubmittedResult(null);
                  setStep(1);
                  setForm({ ...EMPTY_FORM });
                  setSelectedTests([]);
                  setPurpose("");
                  setVisitDate("");
                  setConsent(false);
                  setNikLookupState("idle");
                }}
                className="flex-1 py-3 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-[#1C1C1C] text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali / Daftar Lagi
              </button>
              <button
                onClick={handleDownloadImage}
                className="flex-1 py-3 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                Simpan Bukti Booking
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- FORM WIZARD ---
  const STEP_LABELS = ["Data Diri", "Detail Pemeriksaan", "Konfirmasi"];
  return (
    <div className="min-h-screen bg-[#F7F7F6] lg:flex">
      {/* Panel branding kiri (desktop) */}
      <aside className="hidden lg:flex lg:w-[38%] xl:w-[34%] bg-gradient-to-br from-[#0F6E5A] to-[#0B5445] text-white flex-col justify-between p-10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight leading-tight">Labkesda Garut</p>
              <p className="text-[11px] text-white/70">Laboratorium Kesehatan Daerah</p>
            </div>
          </div>

          <div className="mt-14">
            <h2 className="text-2xl font-bold leading-snug">Pendaftaran<br />Laboratorium Online</h2>
            <p className="text-sm text-white/80 mt-3 leading-relaxed max-w-xs">
              Daftar dari rumah, pilih jadwal, dan cukup tunjukkan kode booking di loket. Tanpa antre panjang.
            </p>
          </div>

          <ol className="mt-12 space-y-4">
            {STEP_LABELS.map((label, i) => {
              const s = i + 1;
              const done = step > s;
              const active = step === s;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      done ? "bg-white text-[#0F6E5A]" : active ? "bg-white/90 text-[#0F6E5A]" : "bg-white/15 text-white/70"
                    }`}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : s}
                  </span>
                  <span className={`text-sm ${active || done ? "font-semibold" : "text-white/70"}`}>{label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="relative z-10 text-[11px] text-white/60">
          © {new Date().getFullYear()} Pemerintah Kabupaten Garut · Dinas Kesehatan
        </p>

        {/* Ornamen */}
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute top-20 -right-10 w-40 h-40 rounded-full bg-white/5" />
      </aside>

      {/* Kolom form kanan */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header mobile */}
        <header className="lg:hidden bg-white border-b border-[#E5E5E3] px-4 py-3 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F6E5A] flex items-center justify-center text-white shadow-sm">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#1C1C1C] tracking-tight">Pendaftaran Online Labkesda</h1>
              <p className="text-xs text-[#6B6B6B]">Kabupaten Garut</p>
            </div>
          </div>
        </header>

        {/* Stepper mobile (ringkas) */}
        <div className="lg:hidden max-w-lg mx-auto w-full px-4 pt-4">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  step >= s ? "bg-[#0F6E5A]" : "bg-neutral-200"
                }`}
              />
            ))}
          </div>
          <p className="text-[11px] font-semibold text-[#0F6E5A] mt-2">
            Langkah {step} dari 3 — {STEP_LABELS[step - 1]}
          </p>
        </div>

      {/* Form Content */}
      <div className="max-w-lg mx-auto w-full px-4 py-6 lg:py-10 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* STEP 1: Data Diri */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E3] p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-[#0F6E5A]" />
                  <h2 className="text-base font-bold text-[#1C1C1C]">Data Diri Pasien</h2>
                </div>

                {/* NIK + tombol cari data lama */}
                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1">
                    NIK <span className="text-[#D64545]">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      inputMode="numeric"
                      value={form.nik}
                      onChange={(e) => { set("nik", e.target.value.replace(/\D/g, "")); setNikLookupState("idle"); }}
                      className="flex-1 h-11 px-4 text-base bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20"
                      placeholder="16 digit NIK KTP"
                    />
                    <button
                      type="button"
                      onClick={handleNikLookup}
                      disabled={nikLookupState === "loading"}
                      className="shrink-0 px-4 h-11 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-sm font-semibold rounded-xl inline-flex items-center gap-1.5 disabled:opacity-60"
                    >
                      <Search className="w-4 h-4" /> {nikLookupState === "loading" ? "Mencari..." : "Cari"}
                    </button>
                  </div>
                  {errors.nik && <p className="text-xs text-[#D64545] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.nik}</p>}
                  {nikLookupState === "found" && <p className="text-xs text-[#1B8A5A] mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Data pasien ditemukan & terisi otomatis. Lengkapi alamat lalu lanjut.</p>}
                  {nikLookupState === "notfound" && <p className="text-xs text-[#6B6B6B] mt-1">NIK belum terdaftar — silakan isi data baru di bawah.</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1">
                    Nama Lengkap <span className="text-[#D64545]">*</span>
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="w-full h-11 px-4 text-base bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20"
                    placeholder="Contoh: Siti Nurjanah"
                  />
                  {errors.name && <p className="text-xs text-[#D64545] mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1">
                      Tanggal Lahir <span className="text-[#D64545]">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => set("dob", e.target.value)}
                      className="w-full h-11 px-4 text-base bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20"
                    />
                    {errors.dob && <p className="text-xs text-[#D64545] mt-1">{errors.dob}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1">
                      Jenis Kelamin <span className="text-[#D64545]">*</span>
                    </label>
                    <select
                      value={form.gender}
                      onChange={(e) => set("gender", e.target.value)}
                      className="w-full h-11 px-4 text-base bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1">
                    No. HP <span className="text-[#D64545]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className="w-full h-11 px-4 text-base bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20"
                    placeholder="0812xxxx"
                  />
                  {errors.phone && <p className="text-xs text-[#D64545] mt-1">{errors.phone}</p>}
                </div>

                {/* Alamat bertingkat */}
                <div className="pt-1 border-t border-[#E5E5E3]">
                  <p className="text-sm font-bold text-[#1C1C1C] mt-3 mb-2">Alamat Domisili</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">Negara <span className="text-[#D64545]">*</span></label>
                      <select value={form.negara} onChange={(e) => set("negara", e.target.value)} className="w-full h-11 px-3 text-sm bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A]">
                        {NEGARA.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">Provinsi <span className="text-[#D64545]">*</span></label>
                      <select value={form.provinsi} onChange={(e) => setProvinsi(e.target.value)} className="w-full h-11 px-3 text-sm bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A]">
                        <option value="">— Pilih —</option>
                        {getProvinsiList().map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {errors.provinsi && <p className="text-xs text-[#D64545] mt-1">{errors.provinsi}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">Kota/Kabupaten <span className="text-[#D64545]">*</span></label>
                      <select value={form.kota} onChange={(e) => setKota(e.target.value)} disabled={!form.provinsi} className="w-full h-11 px-3 text-sm bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] disabled:opacity-50">
                        <option value="">— Pilih —</option>
                        {getKotaList(form.provinsi).map((k) => <option key={k} value={k}>{k}</option>)}
                      </select>
                      {errors.kota && <p className="text-xs text-[#D64545] mt-1">{errors.kota}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">Kecamatan <span className="text-[#D64545]">*</span></label>
                      <select value={form.kecamatan} onChange={(e) => setKecamatan(e.target.value)} disabled={!form.kota} className="w-full h-11 px-3 text-sm bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] disabled:opacity-50">
                        <option value="">— Pilih —</option>
                        {getKecamatanList(form.provinsi, form.kota).map((kc) => <option key={kc} value={kc}>{kc}</option>)}
                      </select>
                      {errors.kecamatan && <p className="text-xs text-[#D64545] mt-1">{errors.kecamatan}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">Desa/Kelurahan <span className="text-[#D64545]">*</span></label>
                      <select value={form.desa} onChange={(e) => set("desa", e.target.value)} disabled={!form.kecamatan} className="w-full h-11 px-3 text-sm bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] disabled:opacity-50">
                        <option value="">— Pilih —</option>
                        {getDesaList(form.provinsi, form.kota, form.kecamatan).map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {errors.desa && <p className="text-xs text-[#D64545] mt-1">{errors.desa}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">RT/RW <span className="text-[#D64545]">*</span></label>
                      <input value={form.rtRw} onChange={(e) => set("rtRw", e.target.value)} placeholder="001/002" className="w-full h-11 px-3 text-sm bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A]" />
                      {errors.rtRw && <p className="text-xs text-[#D64545] mt-1">{errors.rtRw}</p>}
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">Nama Jalan / Kampung <span className="text-[#D64545]">*</span></label>
                    <input value={form.jalan} onChange={(e) => set("jalan", e.target.value)} placeholder="Jl. Proklamasi No. 2 / Kp. Sukamaju" className="w-full h-11 px-4 text-base bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20" />
                    {errors.jalan && <p className="text-xs text-[#D64545] mt-1">{errors.jalan}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#6B6B6B] bg-[#F7F7F6] rounded-lg px-3 py-2 border border-[#E5E5E3]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F6E5A]" /> Penjamin: <strong className="text-[#1C1C1C]">Umum (Membayar Mandiri)</strong>
                </div>

                <button
                  type="button"
                  onClick={validateStep1}
                  className="w-full py-3 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  Lanjut ke Detail Pemeriksaan
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Detail Pemeriksaan */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E3] p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-[#0F6E5A]" />
                  <h2 className="text-base font-bold text-[#1C1C1C]">Detail Pemeriksaan</h2>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1">
                    Pilih Tanggal Kunjungan <span className="text-[#D64545]">*</span>
                  </label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    min={minDateStr}
                    max={maxDateStr}
                    className="w-full h-11 px-4 text-base bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20"
                  />
                  {errors.visitDate && <p className="text-xs text-[#D64545] mt-1">{errors.visitDate}</p>}
                  <p className="text-xs text-[#6B6B6B] mt-1">
                    Pilih H+1 sampai maksimal 14 hari ke depan
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-2">
                    Jenis Pemeriksaan yang Dibutuhkan <span className="text-[#D64545]">*</span>
                  </label>
                  <div className="space-y-2">
                    {TEST_CATEGORIES.map((t) => {
                      const active = selectedTests.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            active
                              ? "border-[#0F6E5A] bg-[#E4F2EE]"
                              : "border-[#E5E5E3] bg-white hover:border-[#0F6E5A]/40 hover:bg-[#F7F7F6]"
                          }`}
                        >
                          <span className="w-1.5 h-9 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                          <div className="flex-1 min-w-0">
                            <span className="block text-sm font-semibold text-[#1C1C1C]">{t.name}</span>
                            <span className="block text-xs text-[#6B6B6B] truncate">{t.desc}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleTest(t.id)}
                            className="w-5 h-5 accent-[#0F6E5A] shrink-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                  {errors.testCategories && (
                    <p className="text-xs text-[#D64545] mt-2">{errors.testCategories}</p>
                  )}
                </div>

                {needPurpose && (
                  <div>
                    <label className="block text-sm font-semibold text-[#1C1C1C] mb-1">
                      Keperluan Pemeriksaan <span className="text-[#D64545]">*</span>
                    </label>
                    <input
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Contoh: Melamar kerja, syarat SIM, daftar sekolah"
                      className="w-full h-11 px-4 text-base bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20"
                    />
                    <p className="text-xs text-[#6B6B6B] mt-1">
                      Wajib untuk tes Narkoba / Surat Keterangan Sehat.
                    </p>
                    {errors.purpose && <p className="text-xs text-[#D64545] mt-1">{errors.purpose}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-2">
                    Upload Surat Rujukan Dokter (Opsional)
                  </label>
                  <label className="flex items-center gap-3 p-4 border-2 border-dashed border-[#E5E5E3] rounded-xl cursor-pointer hover:bg-[#F7F7F6] transition-colors">
                    <Upload className="w-5 h-5 text-[#6B6B6B]" />
                    <div>
                      <span className="text-sm text-[#6B6B6B]">Klik untuk upload foto/PDF rujukan</span>
                      <span className="block text-xs text-[#6B6B6B]">
                        {referralFileName || "Format: JPG, PNG, PDF (maks 5MB)"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setReferralFileName(file.name);
                      }}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1C1C1C] mb-1">
                    Catatan / Keluhan (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 text-base bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20"
                    placeholder="Contoh: Demam 3 hari, nyeri pinggang kanan..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-[#1C1C1C]"
                  >
                    <ChevronLeft className="w-4 h-4" /> Kembali
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateStep2()) setStep(3);
                    }}
                    className="flex-1 py-3 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    Lanjut Konfirmasi <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Konfirmasi */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#E5E5E3] p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardCheck className="w-4 h-4 text-[#0F6E5A]" />
                  <h2 className="text-base font-bold text-[#1C1C1C]">Konfirmasi Pendaftaran</h2>
                </div>

                {/* Summary Data */}
                <div className="space-y-3 text-sm bg-[#F7F7F6] rounded-xl p-4 border border-[#E5E5E3]">
                  <h3 className="font-bold text-[#1C1C1C] text-base">Data Diri</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-[#6B6B6B]">Nama</span><p className="font-semibold text-[#1C1C1C]">{form.name}</p></div>
                    <div><span className="text-[#6B6B6B]">NIK</span><p className="font-semibold text-[#1C1C1C]">{form.nik}</p></div>
                    <div><span className="text-[#6B6B6B]">Tgl Lahir</span><p className="font-semibold">{form.dob}</p></div>
                    <div><span className="text-[#6B6B6B]">Gender</span><p className="font-semibold">{form.gender === "L" ? "Laki-laki" : "Perempuan"}</p></div>
                    <div><span className="text-[#6B6B6B]">No. HP</span><p className="font-semibold">{form.phone}</p></div>
                    <div><span className="text-[#6B6B6B]">Penjamin</span><p className="font-semibold">Umum</p></div>
                  </div>
                  <div><span className="text-[#6B6B6B]">Alamat</span><p className="font-semibold">{composeAddress()}</p></div>
                </div>

                <div className="space-y-2 text-sm bg-[#F7F7F6] rounded-xl p-4 border border-[#E5E5E3]">
                  <h3 className="font-bold text-[#1C1C1C] text-base">Detail Pemeriksaan</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#6B6B6B]">Tanggal Kunjungan</span>
                      <p className="font-semibold">
                        {visitDate ? new Date(visitDate + "T00:00:00").toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }) : "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#6B6B6B]">Pemeriksaan</span>
                      <p className="font-semibold">{selectedTests.join(", ")}</p>
                    </div>
                  </div>
                  {needPurpose && <div><span className="text-[#6B6B6B]">Keperluan:</span><p className="font-semibold">{purpose}</p></div>}
                  {notes && <div><span className="text-[#6B6B6B]">Catatan:</span><p className="font-semibold">{notes}</p></div>}
                  {referralFileName && <div><span className="text-[#6B6B6B]">File Rujukan:</span><p className="font-semibold">{referralFileName}</p></div>}
                </div>

                {/* Consent Checkbox */}
                <label className="flex items-start gap-3 p-3 bg-[#E4F2EE]/50 border border-[#0F6E5A]/15 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="w-5 h-5 mt-0.5 accent-[#0F6E5A] shrink-0"
                  />
                  <div>
                    <span className="text-sm font-semibold text-[#1C1C1C]">Saya menyetujui</span>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      Data yang saya isi adalah benar. Saya setuju data saya digunakan untuk
                      keperluan pemeriksaan laboratorium di Labkesda Kabupaten Garut sesuai
                      ketentuan perlindungan data pribadi yang berlaku.
                    </p>
                  </div>
                </label>

                {errors.submit && (
                  <p className="text-sm text-[#D64545] bg-[#D64545]/10 p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {errors.submit}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-[#1C1C1C]"
                  >
                    <ChevronLeft className="w-4 h-4" /> Edit Data
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting || !consent}
                    title={!consent ? "Centang persetujuan terlebih dahulu" : undefined}
                    className="flex-1 py-3 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      "Mengirim..."
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Kirim Pendaftaran
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

        {/* Footer */}
        <footer className="bg-white border-t border-[#E5E5E3] py-4 text-center text-xs text-[#6B6B6B]">
          <p>© {new Date().getFullYear()} Laboratorium Kesehatan Daerah (Labkesda) Kabupaten Garut</p>
          <p className="mt-1">Jl. Rumah Sakit No. 12, Garut Kota | Telp. 0262-232720</p>
        </footer>
      </div>
    </div>
  );
}
