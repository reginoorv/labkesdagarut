"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  UserPlus,
  Flame,
  Printer,
  CheckCircle2,
  Building2,
  FileText,
  AlertCircle,
  Search,
} from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import Link from "next/link";

// Zod Validation Schema
const patientSchema = z
  .object({
    rmNo: z.string().optional(),
    nik: z.string().optional(),
    name: z.string().min(2, "Nama pasien minimal 2 karakter"),
    gender: z.enum(["L", "P"], { message: "Pilih jenis kelamin" }),
    dob: z.string().min(1, "Tanggal lahir wajib diisi"),
    phone: z.string().optional(),
    address: z.string().optional(),
    guaranteeType: z.string().min(1, "Pilih jenis penjamin"),
    // Apakah pasien membawa rujukan dari faskes/dokter lain.
    referralType: z.enum(["RUJUKAN", "TANPA_RUJUKAN"]),
    hospitalId: z.string().optional(),
    doctorName: z.string().optional(),
    priority: z.enum(["NORMAL", "CITO"]),
    clinicalNotes: z.string().optional(),
    // Keperluan/tujuan pemeriksaan (wajib untuk paket Narkoba & Kesehatan).
    purpose: z.string().optional(),
    testCategories: z.array(z.string()).min(1, "Pilih minimal 1 jenis pemeriksaan lab"),
  })
  .superRefine((data, ctx) => {
    // Data rujukan hanya wajib bila pasien memang membawa rujukan.
    if (data.referralType === "RUJUKAN") {
      if (!data.hospitalId || data.hospitalId.length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["hospitalId"], message: "Pilih fasilitas pengirim/RS" });
      }
      if (!data.doctorName || data.doctorName.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["doctorName"], message: "Nama dokter pengirim wajib diisi" });
      }
    }
    // Keperluan wajib bila memilih paket Narkoba / Kesehatan.
    const needPurpose = (data.testCategories || []).some((t) => t === "NARKOBA" || t === "KESEHATAN");
    if (needPurpose && (!data.purpose || data.purpose.trim().length < 3)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["purpose"], message: "Keperluan wajib diisi untuk tes Narkoba/Kesehatan (mis. melamar kerja, syarat SIM)" });
    }
  });

type PatientFormData = z.infer<typeof patientSchema>;

const AVAILABLE_TESTS = [
  { id: "HEM", name: "Hematologi Lengkap (Hb, Leu, Plt, Hct, Diff)", category: "Hematologi" },
  { id: "GDS", name: "Glukosa Darah Sewaktu (GDS)", category: "Kimia Klinik" },
  { id: "GDP", name: "Glukosa Darah Puasa (GDP)", category: "Kimia Klinik" },
  { id: "LIPID", name: "Profil Lipid (Kolesterol, HDL, LDL, Trigliserida)", category: "Kimia Klinik" },
  { id: "RENAL", name: "Fungsi Ginjal (Ureum, Kreatinin, Asam Urat)", category: "Kimia Klinik" },
  { id: "HEPAR", name: "Fungsi Hati (SGOT, SGPT, Bilirubin)", category: "Kimia Klinik" },
  { id: "URI", name: "Urinalisis Rutin & Sedimen Urine", category: "Urinalisis" },
  { id: "HBSAG", name: "HBsAg Rapid Screen", category: "Imunoserologi" },
  { id: "HIV", name: "HIV Screening Rapid Test", category: "Imunoserologi" },
  { id: "NARKOBA", name: "Tes Narkoba (Panel 6 Parameter)", category: "Toksikologi (Narkoba)" },
  { id: "KESEHATAN", name: "Pemeriksaan Surat Keterangan Sehat", category: "Pemeriksaan Fisik" },
];

export default function RegistrasiBaruPage() {
  const { showToast } = useToast();
  const [hospitalsList, setHospitalsList] = useState<Array<{ id: number; name: string }>>([]);
  const [submittedData, setSubmittedData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      rmNo: "",
      gender: "L",
      dob: "1990-01-01",
      guaranteeType: "UMUM",
      referralType: "TANPA_RUJUKAN",
      priority: "NORMAL",
      testCategories: ["HEM"],
      doctorName: "",
      hospitalId: "",
    },
  });

  const priorityValue = watch("priority");
  const referralType = watch("referralType");
  const nikValue = watch("nik") || "";
  const selectedTests = watch("testCategories") || [];
  // Keperluan wajib bila memilih paket Narkoba / Kesehatan.
  const needPurpose = selectedTests.some((t) => t === "NARKOBA" || t === "KESEHATAN");

  // Pencarian pasien lama via NIK: kalau ketemu, isi otomatis identitasnya.
  const [nikLookup, setNikLookup] = useState<"idle" | "loading" | "found" | "notfound">("idle");
  // Id pasien yang ketemu via NIK — diteruskan ke backend supaya backend
  // UPDATE record lama alih-alih INSERT baru (yang memicu duplicate rm_no).
  const [existingPatientId, setExistingPatientId] = useState<number | null>(null);
  const handleNikLookup = async () => {
    const nik = (nikValue || "").trim();
    if (nik.length < 6) {
      showToast({ type: "error", title: "NIK belum lengkap", description: "Masukkan NIK untuk mencari data pasien." });
      return;
    }
    setNikLookup("loading");
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(nik)}`);
      const data = await res.json();
      const found = (data.patients || []).find((p: any) => p.nik === nik);
      if (found) {
        setValue("name", found.name || "");
        setValue("gender", found.gender === "P" ? "P" : "L");
        if (found.dob) setValue("dob", found.dob);
        setValue("phone", found.phone || "");
        setValue("address", found.address || "");
        setValue("guaranteeType", "UMUM");
        if (found.rmNo) setValue("rmNo", found.rmNo);
        setExistingPatientId(found.id);
        setNikLookup("found");
        showToast({ type: "success", title: "Data pasien ditemukan", description: `${found.name} (${found.rmNo}) — tinggal pilih pemeriksaan.` });
      } else {
        setExistingPatientId(null);
        setNikLookup("notfound");
        showToast({ type: "info", title: "Pasien baru", description: "NIK belum terdaftar. Silakan isi data manual." });
      }
    } catch (e: any) {
      setNikLookup("notfound");
      showToast({ type: "error", title: "Gagal mencari", description: e.message });
    }
  };

  useEffect(() => {
    fetch("/api/hospitals")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.hospitals) {
          setHospitalsList(data.hospitals);
          if (data.hospitals.length > 0) {
            setValue("hospitalId", String(data.hospitals[0].id));
          }
        }
      })
      .catch((err) => console.error("Hospital load error:", err));
  }, [setValue]);

  const onSubmit = async (formData: PatientFormData) => {
    try {
      // Kalau pasien datang langsung (tanpa rujukan), jangan bawa data faskes/dokter perujuk.
      const isReferral = formData.referralType === "RUJUKAN";
      const payload = {
        ...formData,
        hospitalId: isReferral ? formData.hospitalId : "",
        doctorName: isReferral ? formData.doctorName : "",
        existingPatientId,
      };

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        showToast({
          type: "success",
          title: "Pasien Berhasil Terdaftar",
          description: `No. Antrian: ${result.queueNo || "-"} | No. Lab: ${result.labOrder?.labNo || "Generated"}`,
        });
        // Lengkapi data tampilan dari form (penjamin, faskes, dokter, catatan).
        const hospitalName = isReferral
          ? hospitalsList.find((h) => String(h.id) === String(formData.hospitalId))?.name || "-"
          : "Datang Langsung (Tanpa Rujukan)";
        setSubmittedData({
          ...result,
          formSnapshot: {
            guaranteeType: formData.guaranteeType,
            hospitalName,
            doctorName: isReferral ? formData.doctorName : "Datang Langsung (Tanpa Rujukan)",
            clinicalNotes: formData.clinicalNotes,
          },
        });
      } else {
        showToast({
          type: "error",
          title: "Gagal Mendaftarkan Pasien",
          description: result.error || "Terjadi kesalahan server.",
        });
      }
    } catch (e: any) {
      showToast({
        type: "error",
        title: "Koneksi Gagal",
        description: e.message,
      });
    }
  };

  const handleTestToggle = (testId: string) => {
    const current = [...selectedTests];
    const index = current.indexOf(testId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(testId);
    }
    setValue("testCategories", current, { shouldValidate: true });
  };

  return (
    <div className="space-y-5">
      {/* Header Title */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Registrasi Pasien Baru</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Pendaftaran spesimen laboratorium, pemilihan jenis tes, dan penetapan prioritas sampel.
          </p>
        </div>
      </div>

      {/* CITO Urgency Notification Overlay Banner if CITO is selected */}
      {priorityValue === "CITO" && (
        <div className="p-3.5 rounded-xl border-2 border-[#D64545] bg-[#D64545]/10 flex items-center gap-3 animate-pulse">
          <Flame className="w-5 h-5 text-[#D64545] shrink-0" />
          <div className="text-xs text-[#1C1C1C]">
            <span className="font-bold text-[#D64545] uppercase tracking-wider block">
              PERHATIAN: Mode Prioritas CITO Aktif!
            </span>
            Sampel akan ditandai dengan label CITO khusus & dimasukkan langsung ke urutan analisis pertama.
          </div>
        </div>
      )}

      {submittedData ? (
        /* Post Registration Success View with Quick Print Label Trigger */
        <div className="bg-white border border-[#1B8A5A]/30 rounded-xl p-6 shadow-xs text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-12 bg-[#1B8A5A]/10 text-[#1B8A5A] rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1C1C1C]">Registrasi Pasien Berhasil!</h2>
            <p className="text-xs text-[#6B6B6B] mt-1">
              Data pendaftaran dan order pemeriksaan sampel telah tersimpan di database PostgreSQL.
            </p>
          </div>

          {/* Nomor Antrian — informasi utama untuk pasien */}
          <div className="p-4 bg-[#0F6E5A]/5 rounded-xl border-2 border-dashed border-[#0F6E5A]/40 text-center">
            <p className="text-[10px] uppercase tracking-wider text-[#0F6E5A] font-semibold">Nomor Antrian Kasir</p>
            <p className="text-3xl font-extrabold text-[#0F6E5A] tabular-nums mt-1">
              {submittedData.queueNo || "-"}
            </p>
            <p className="text-[11px] text-[#6B6B6B] mt-1">
              Arahkan pasien menunggu panggilan nomor ini di loket Kasir untuk pembayaran / verifikasi jaminan.
            </p>
          </div>

          <div className="p-4 bg-[#F7F7F6] rounded-xl border border-[#E5E5E3] text-left text-xs space-y-2">
            <div className="flex justify-between border-b pb-1.5 border-[#E5E5E3]">
              <span className="text-[#6B6B6B]">Nama Pasien:</span>
              <span className="font-bold text-[#1C1C1C]">{submittedData.patient.name}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5 border-[#E5E5E3]">
              <span className="text-[#6B6B6B]">No. Rekam Medis (RM):</span>
              <span className="font-bold text-[#0F6E5A] tabular-nums">{submittedData.patient.rmNo}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5 border-[#E5E5E3]">
              <span className="text-[#6B6B6B]">No. Sampel Lab:</span>
              <span className="font-bold text-[#1C1C1C] tabular-nums">{submittedData.labOrder?.labNo || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5 border-[#E5E5E3]">
              <span className="text-[#6B6B6B]">Jenis Penjamin:</span>
              <span className="font-bold text-[#1C1C1C]">{submittedData.formSnapshot?.guaranteeType || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5 border-[#E5E5E3]">
              <span className="text-[#6B6B6B]">Faskes Perujuk:</span>
              <span className="font-bold text-[#1C1C1C] text-right">{submittedData.formSnapshot?.hospitalName || "-"}</span>
            </div>
            <div className="flex justify-between border-b pb-1.5 border-[#E5E5E3]">
              <span className="text-[#6B6B6B]">Dokter Perujuk:</span>
              <span className="font-bold text-[#1C1C1C] text-right">{submittedData.formSnapshot?.doctorName || "-"}</span>
            </div>
            {submittedData.formSnapshot?.clinicalNotes && (
              <div className="flex justify-between border-b pb-1.5 border-[#E5E5E3]">
                <span className="text-[#6B6B6B]">Catatan Klinis:</span>
                <span className="font-medium text-[#1C1C1C] text-right max-w-[60%]">{submittedData.formSnapshot.clinicalNotes}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[#6B6B6B]">Prioritas:</span>
              <span className={`font-bold ${submittedData.labOrder?.priority === "CITO" ? "text-[#D64545]" : "text-[#1B8A5A]"}`}>
                {submittedData.labOrder?.priority || "NORMAL"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSubmittedData(null);
                setExistingPatientId(null);
                reset({
                  rmNo: "",
                  priority: "NORMAL",
                });
              }}
              className="px-4 py-2 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs font-semibold rounded-lg text-[#1C1C1C]"
            >
              + Registrasi Pasien Lain
            </button>
            <Link
              href={`/registrasi/print-label?rm=${submittedData.patient.rmNo}`}
              className="px-5 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print Label Sampel Barcode
            </Link>
          </div>
        </div>
      ) : (
        /* Main Registration Form */
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Section 1: Data Identitas Pasien */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5E5E3] text-[#0F6E5A] font-semibold text-sm">
              <UserPlus className="w-4 h-4" />
              Data Utama Pasien
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                  Nama Lengkap Pasien <span className="text-[#D64545]">*</span>
                </label>
                <input
                  {...register("name")}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
                />
                {errors.name && (
                  <p className="text-[11px] text-[#D64545] mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                  No. Rekam Medis (No. RM)
                </label>
                <input
                  {...register("rmNo")}
                  className="w-full h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A] tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                  NIK Pasien
                </label>
                <div className="flex gap-1.5">
                  <input
                    {...register("nik")}
                    placeholder="320501..."
                    className="flex-1 h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A] tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={handleNikLookup}
                    disabled={nikLookup === "loading"}
                    title="Cari data pasien lama berdasarkan NIK"
                    className="shrink-0 px-3 h-9 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 disabled:opacity-60"
                  >
                    <Search className="w-3.5 h-3.5" /> {nikLookup === "loading" ? "..." : "Cari"}
                  </button>
                </div>
                {nikLookup === "found" && <p className="text-[11px] text-[#1B8A5A] mt-1">Data terisi dari rekam medis.</p>}
                {nikLookup === "notfound" && <p className="text-[11px] text-[#6B6B6B] mt-1">Pasien baru — isi manual.</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                  Jenis Kelamin <span className="text-[#D64545]">*</span>
                </label>
                <select
                  {...register("gender")}
                  className="w-full h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                  Tanggal Lahir <span className="text-[#D64545]">*</span>
                </label>
                <input
                  type="date"
                  {...register("dob")}
                  className="w-full h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                  Jenis Penjamin
                </label>
                <input type="hidden" {...register("guaranteeType")} value="UMUM" />
                <div className="w-full h-9 px-3 flex items-center text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg text-[#6B6B6B]">
                  Umum / Mandiri
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                  No. Telepon / HP
                </label>
                <input
                  {...register("phone")}
                  placeholder="0812..."
                  className="w-full h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                  Alamat Lengkap
                </label>
                <input
                  {...register("address")}
                  placeholder="Jl. / Kp. RT/RW, Kecamatan, Garut"
                  className="w-full h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Data Prioritas & Rujukan Dokter */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
              <div className="flex items-center gap-2 text-[#0F6E5A] font-semibold text-sm">
                <Building2 className="w-4 h-4" />
                Rujukan & Prioritas Sampel
              </div>

              {/* Prioritas Toggle Switch */}
              <div className="flex items-center gap-2 bg-[#F7F7F6] p-1 rounded-lg border border-[#E5E5E3]">
                <button
                  type="button"
                  onClick={() => setValue("priority", "NORMAL")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                    priorityValue === "NORMAL"
                      ? "bg-[#0F6E5A] text-white shadow-xs"
                      : "text-[#6B6B6B] hover:text-[#1C1C1C]"
                  }`}
                >
                  NORMAL
                </button>
                <button
                  type="button"
                  onClick={() => setValue("priority", "CITO")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${
                    priorityValue === "CITO"
                      ? "bg-[#D64545] text-white shadow-xs animate-pulse"
                      : "text-[#6B6B6B] hover:text-[#D64545]"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" /> CITO (Urgent)
                </button>
              </div>
            </div>

            {/* Pilihan Jenis Kedatangan: Rujukan vs Datang Langsung */}
            <div>
              <label className="block text-xs font-semibold text-[#1C1C1C] mb-1.5">
                Jenis Kedatangan Pasien <span className="text-[#D64545]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue("referralType", "TANPA_RUJUKAN", { shouldValidate: true })}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-colors ${
                    referralType === "TANPA_RUJUKAN"
                      ? "border-[#0F6E5A] bg-[#E4F2EE]"
                      : "border-[#E5E5E3] bg-[#F7F7F6] hover:border-[#0F6E5A]/40"
                  }`}
                >
                  <span className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${referralType === "TANPA_RUJUKAN" ? "border-[#0F6E5A]" : "border-[#B5B5B2]"}`}>
                    {referralType === "TANPA_RUJUKAN" && <span className="w-2 h-2 rounded-full bg-[#0F6E5A]" />}
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-[#1C1C1C]">Datang Langsung</span>
                    <span className="block text-[10px] text-[#6B6B6B] mt-0.5">Tanpa rujukan dokter/faskes lain</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("referralType", "RUJUKAN", { shouldValidate: true })}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-colors ${
                    referralType === "RUJUKAN"
                      ? "border-[#0F6E5A] bg-[#E4F2EE]"
                      : "border-[#E5E5E3] bg-[#F7F7F6] hover:border-[#0F6E5A]/40"
                  }`}
                >
                  <span className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${referralType === "RUJUKAN" ? "border-[#0F6E5A]" : "border-[#B5B5B2]"}`}>
                    {referralType === "RUJUKAN" && <span className="w-2 h-2 rounded-full bg-[#0F6E5A]" />}
                  </span>
                  <span>
                    <span className="block text-xs font-semibold text-[#1C1C1C]">Membawa Rujukan</span>
                    <span className="block text-[10px] text-[#6B6B6B] mt-0.5">Dari RS/puskesmas/dokter pengirim</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Data rujukan hanya tampil jika membawa rujukan */}
            {referralType === "RUJUKAN" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                    Fasilitas Pengirim / RS Rujukan <span className="text-[#D64545]">*</span>
                  </label>
                  <select
                    {...register("hospitalId")}
                    className="w-full h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
                  >
                    <option value="">— Pilih faskes —</option>
                    {hospitalsList.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                  {errors.hospitalId && (
                    <p className="text-[11px] text-[#D64545] mt-1">{errors.hospitalId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                    Dokter Pengirim / Penanggung Jawab <span className="text-[#D64545]">*</span>
                  </label>
                  <input
                    {...register("doctorName")}
                    placeholder="dr. Contoh, Sp.PD"
                    className="w-full h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
                  />
                  {errors.doctorName && (
                    <p className="text-[11px] text-[#D64545] mt-1">{errors.doctorName.message}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                Catatan Klinis / Indikasi Pemeriksaan
              </label>
              <input
                {...register("clinicalNotes")}
                placeholder="Contoh: Lemas, pucat, demam 3 hari..."
                className="w-full h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
              />
            </div>
          </div>

          {/* Section 3: Jenis Pemeriksaan Lab (Multi-select) */}
          <div className="bg-white border border-[#E5E5E3] rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E3]">
              <div className="flex items-center gap-2 text-[#0F6E5A] font-semibold text-sm">
                <FileText className="w-4 h-4" />
                Pilihan Parameters & Jenis Pemeriksaan
              </div>
              <span className="text-xs text-[#6B6B6B]">
                Pilih minimal 1 jenis tes
              </span>
            </div>

            {errors.testCategories && (
              <p className="text-xs font-semibold text-[#D64545] bg-[#D64545]/10 p-2 rounded-md">
                {errors.testCategories.message}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
              {AVAILABLE_TESTS.map((t) => {
                const isSelected = selectedTests.includes(t.id);
                return (
                  <div
                    key={t.id}
                    onClick={() => handleTestToggle(t.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors flex items-start gap-2.5 ${
                      isSelected
                        ? "border-[#0F6E5A] bg-[#E4F2EE] font-semibold text-[#0F6E5A]"
                        : "border-[#E5E5E3] bg-[#F7F7F6] hover:bg-neutral-200/50 text-[#1C1C1C]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent div
                      className="mt-0.5 accent-[#0F6E5A]"
                    />
                    <div>
                      <span className="block">{t.name}</span>
                      <span className="text-[10px] text-[#6B6B6B] block font-normal mt-0.5">
                        Kategori: {t.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Keperluan — wajib bila memilih paket Narkoba / Kesehatan */}
            {needPurpose && (
              <div className="pt-2 border-t border-[#E5E5E3]">
                <label className="block text-xs font-semibold text-[#1C1C1C] mb-1">
                  Keperluan / Tujuan Pemeriksaan <span className="text-[#D64545]">*</span>
                </label>
                <input
                  {...register("purpose")}
                  placeholder="Contoh: Syarat melamar kerja, perpanjangan SIM, pendaftaran sekolah..."
                  className="w-full h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
                />
                <p className="text-[10px] text-[#6B6B6B] mt-1">
                  Wajib untuk tes Narkoba & Surat Keterangan Sehat — tercantum di surat hasil.
                </p>
                {errors.purpose && (
                  <p className="text-[11px] text-[#D64545] mt-1">{errors.purpose.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Submit Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs font-semibold rounded-lg text-[#6B6B6B]"
            >
              Reset Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-2 ${
                priorityValue === "CITO"
                  ? "bg-[#D64545] hover:bg-[#b83838]"
                  : "bg-[#0F6E5A] hover:bg-[#0B5445]"
              }`}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan & Daftarkan Pasien"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
