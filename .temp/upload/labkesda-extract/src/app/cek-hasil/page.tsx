"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FlaskConical, Search, Printer, ArrowLeft, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

interface Detail {
  id: number;
  category: string;
  testCode: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: string;
}

interface Exam {
  id: number;
  labNo: string;
  patientRm: string;
  patientNik: string | null;
  patientName: string;
  patientGender: string;
  patientDob: string;
  patientAddress: string | null;
  guaranteeType: string;
  doctorName: string;
  hospitalName: string | null;
  priority: string;
  status: string;
  clinicalNotes: string;
  purpose: string | null;
  resultTemplate: "LAB" | "NARKOBA" | "KESEHATAN";
  completedAt: string;
  validatedAt: string;
  validatorName: string;
  createdAt: string;
  details: Detail[];
}

const KOP = {
  line1: "Pemerintah Kabupaten Garut",
  line2: "Dinas Kesehatan",
  line3: "Laboratorium Kesehatan Daerah",
  address: "Jl. Proklamasi No. 2, Tarogong Kidul, Garut 44151, Jawa Barat",
  contact: "Telp. (0262) 232720 • Email: labkesda@garutkab.go.id",
};

function fmtDateOnly(s?: string) {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export default function CekHasilPage() {
  const [code, setCode] = useState("");
  const [nik, setNik] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exam, setExam] = useState<Exam | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !nik.trim()) {
      setError("Kode Booking / No. Lab dan NIK wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");
    setExam(null);
    try {
      const res = await fetch("/api/cek-hasil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), nik: nik.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setExam(data.examination);
      } else {
        setError(data.error || "Data tidak ditemukan.");
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setExam(null);
    setError("");
  };

  // ── Tampilan surat hasil ──────────────────────────────────────
  if (exam) {
    const template = exam.resultTemplate || "LAB";
    const isLetter = template === "NARKOBA" || template === "KESEHATAN";
    const docTitle =
      template === "NARKOBA"
        ? "Surat Keterangan Hasil Pemeriksaan Narkoba"
        : template === "KESEHATAN"
        ? "Surat Keterangan Hasil Pemeriksaan Kesehatan"
        : "Hasil Pemeriksaan Laboratorium";
    const LEGACY_ONLINE_DOCTOR = "Dokter Penanggung Jawab Lab (Online)";
    const doctorLabel =
      !exam.doctorName || exam.doctorName === LEGACY_ONLINE_DOCTOR
        ? "Tanpa Rujukan (Mandiri)"
        : exam.doctorName;
    const grouped = (exam.details || []).reduce<Record<string, Detail[]>>((acc, d) => {
      (acc[d.category] = acc[d.category] || []).push(d);
      return acc;
    }, {});

    return (
      <div className="min-h-screen bg-[#F7F7F6] py-6 px-4">
        {/* Toolbar (tidak tercetak) */}
        <div className="no-print max-w-[210mm] mx-auto flex items-center justify-between gap-3 pb-3 mb-4 border-b border-[#E5E5E3]">
          <button onClick={resetSearch} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] hover:text-[#1C1C1C]">
            <ArrowLeft className="w-4 h-4" /> Cek hasil lain
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak / Unduh Surat Hasil
          </button>
        </div>

        {/* Dokumen A4 resmi */}
        <div className="flex justify-center">
          <div
            id="printable-doc"
            className="w-[210mm] min-h-[297mm] bg-white text-black shadow-sm border border-[#E5E5E3] px-12 py-10 mx-auto"
            style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
          >
            {/* Kop surat */}
            <div className="flex items-center gap-4 pb-2">
              <div className="w-20 h-20 shrink-0 flex items-center justify-center border-2 border-black rounded-full overflow-hidden">
                <FlaskConical className="w-9 h-9" />
              </div>
              <div className="flex-1 text-center leading-tight">
                <p className="text-sm font-semibold uppercase tracking-wide">{KOP.line1}</p>
                <p className="text-sm font-semibold uppercase tracking-wide">{KOP.line2}</p>
                <p className="text-xl font-bold uppercase tracking-wide">{KOP.line3}</p>
                <p className="text-[11px] mt-0.5">{KOP.address}</p>
                <p className="text-[11px]">{KOP.contact}</p>
              </div>
              <div className="w-20 shrink-0" />
            </div>

            <div className="border-t-[3px] border-black" />
            <div className="border-t border-black mt-[2px]" />

            <h2 className="text-center text-base font-bold uppercase tracking-wide mt-4 underline underline-offset-4">
              {docTitle}
            </h2>
            <p className="text-center text-[11px] mb-4">No. {exam.labNo}</p>

            {/* Identitas */}
            <div className="grid grid-cols-2 gap-x-10 text-[11px] mb-4">
              <div className="space-y-0.5">
                <FRow label="Nama" value={exam.patientName} bold />
                <FRow label="No. RM" value={exam.patientRm} />
                {isLetter && <FRow label="NIK" value={exam.patientNik || "-"} />}
                <FRow label="Tgl. Lahir" value={fmtDateOnly(exam.patientDob)} />
                <FRow label="Jenis Kelamin" value={exam.patientGender === "L" ? "Laki-laki" : exam.patientGender === "P" ? "Perempuan" : exam.patientGender || "-"} />
                {isLetter && <FRow label="Alamat" value={exam.patientAddress || "-"} />}
              </div>
              <div className="space-y-0.5">
                {!isLetter && <FRow label="Dokter Pengirim" value={doctorLabel} />}
                {!isLetter && <FRow label="Faskes Perujuk" value={exam.hospitalName || "Datang Langsung"} />}
                <FRow label="Penjamin" value={exam.guaranteeType || "-"} />
                {isLetter && exam.purpose && <FRow label="Keperluan" value={exam.purpose} />}
                <FRow label="Tgl. Terima" value={fmtDateOnly(exam.createdAt)} />
                <FRow label="Tgl. Selesai" value={fmtDateOnly(exam.completedAt)} />
              </div>
            </div>

            {template === "NARKOBA" && (
              <p className="text-[11px] leading-relaxed mb-3 text-justify">
                Yang bertanda tangan di bawah ini menerangkan bahwa terhadap sampel urin/darah pasien
                tersebut di atas telah dilakukan pemeriksaan skrining narkotika dan psikotropika, dengan
                hasil sebagai berikut{exam.purpose ? ` (keperluan: ${exam.purpose})` : ""}:
              </p>
            )}
            {template === "KESEHATAN" && (
              <p className="text-[11px] leading-relaxed mb-3 text-justify">
                Yang bertanda tangan di bawah ini menerangkan bahwa pasien tersebut di atas telah menjalani
                pemeriksaan kesehatan, dengan hasil sebagai berikut{exam.purpose ? ` (keperluan: ${exam.purpose})` : ""}:
              </p>
            )}

            {/* Tabel hasil */}
            <table className="w-full text-[11px] border-collapse border border-black">
              <thead>
                <tr className="bg-[#EDEDED]">
                  <th className="border border-black px-2 py-1 text-left w-[42%]">PEMERIKSAAN</th>
                  <th className="border border-black px-2 py-1 text-left w-[20%]">HASIL</th>
                  <th className="border border-black px-2 py-1 text-left w-[12%]">SATUAN</th>
                  <th className="border border-black px-2 py-1 text-left w-[26%]">NILAI RUJUKAN</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([category, rows]) => (
                  <React.Fragment key={category}>
                    <tr>
                      <td colSpan={4} className="border border-black px-2 py-1 font-bold uppercase bg-[#F5F5F5]">
                        {category}
                      </td>
                    </tr>
                    {rows.map((d) => {
                      const abnormal = d.flag && d.flag !== "NORMAL";
                      const critical = d.flag === "CRITICAL";
                      const arrow = critical ? " !!" : d.flag === "HIGH" ? " (H)" : d.flag === "LOW" ? " (L)" : "";
                      return (
                        <tr key={d.id}>
                          <td className="border border-black px-2 py-1">{d.testName}</td>
                          <td className={`border border-black px-2 py-1 font-bold ${abnormal ? "underline" : ""}`}>
                            {d.value || "-"}
                            {abnormal && <span>{arrow}</span>}
                          </td>
                          <td className="border border-black px-2 py-1">{d.unit && d.unit !== "-" ? d.unit : ""}</td>
                          <td className="border border-black px-2 py-1">{d.referenceRange || "-"}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {template === "NARKOBA" && (
              <p className="mt-3 text-[11px] leading-relaxed text-justify">
                <span className="font-bold">Kesimpulan: </span>
                Berdasarkan hasil pemeriksaan di atas, seluruh parameter skrining narkotika menunjukkan hasil
                sesuai nilai rujukan (Negatif), kecuali yang ditandai. Surat keterangan ini dikeluarkan untuk
                dipergunakan sebagaimana mestinya{exam.purpose ? ` dalam rangka ${exam.purpose}` : ""}.
              </p>
            )}
            {template === "KESEHATAN" && (
              <p className="mt-3 text-[11px] leading-relaxed text-justify">
                <span className="font-bold">Kesimpulan: </span>
                Berdasarkan hasil pemeriksaan di atas, pasien dinyatakan dalam kondisi sesuai catatan hasil.
                Surat keterangan ini dikeluarkan untuk dipergunakan sebagaimana mestinya{exam.purpose ? ` dalam rangka ${exam.purpose}` : ""}.
              </p>
            )}

            {exam.clinicalNotes && (
              <div className="mt-3 text-[11px]">
                <span className="font-bold">Catatan Klinis: </span>
                <span>{exam.clinicalNotes}</span>
              </div>
            )}

            <p className="mt-2 text-[10px] italic">
              Keterangan: (H) hasil di atas nilai rujukan, (L) di bawah nilai rujukan, !! nilai kritis.
              Hasil hanya berlaku untuk sampel yang diperiksa.
            </p>

            <div className="mt-8 flex justify-end text-[11px]">
              <div className="text-center w-64">
                <p>Garut, {fmtDateOnly(exam.validatedAt || exam.completedAt)}</p>
                <p>Penanggung Jawab Laboratorium,</p>
                <div className="inline-flex items-center gap-1 my-1 text-[10px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Tervalidasi elektronik
                </div>
                <p className="font-bold underline">{exam.validatorName || "( ............................. )"}</p>
                <p className="text-[10px]">Penanggung Jawab Teknis Laboratorium</p>
              </div>
            </div>

            <div className="mt-6 pt-2 border-t border-black text-center text-[9px] text-[#333]">
              Dokumen dicetak dari Sistem Informasi Laboratorium (LIS) Labkesda Garut — telah divalidasi
              secara elektronik dan sah tanpa tanda tangan basah.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form pencarian ────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E4F2EE] to-[#F7F7F6] flex flex-col">
      <header className="border-b border-[#E5E5E3] bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F6E5A] flex items-center justify-center text-white">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Labkesda Garut</p>
              <p className="text-[10px] text-[#6B6B6B]">Laboratory Information System</p>
            </div>
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B6B6B] hover:text-[#1C1C1C]">
            <ArrowLeft className="w-4 h-4" /> Beranda
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#0F6E5A] flex items-center justify-center text-white mx-auto mb-4">
              <Search className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Cek Hasil Pemeriksaan</h1>
            <p className="mt-2 text-sm text-[#6B6B6B]">
              Masukkan Kode Booking atau No. Lab beserta NIK Anda untuk melihat dan mengunduh surat hasil
              yang telah divalidasi.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white border border-[#E5E5E3] rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1C1C1C] mb-1.5">Kode Booking / No. Lab</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="mis. LAB-20260101-001 atau BK-XXXXXX"
                className="w-full h-10 px-3 text-sm bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1C1C1C] mb-1.5">NIK (Nomor Induk Kependudukan)</label>
              <input
                type="text"
                inputMode="numeric"
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                placeholder="16 digit NIK sesuai pendaftaran"
                maxLength={16}
                className="w-full h-10 px-3 text-sm bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A] tabular-nums"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-[#B91C1C] bg-[#FEE2E2] border border-[#FCA5A5] rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 bg-[#0F6E5A] hover:bg-[#0B5445] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Mencari..." : "Cek Hasil"}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-[#6B6B6B] leading-relaxed">
            Hasil hanya dapat diakses jika Kode/No. Lab dan NIK cocok, dan telah divalidasi oleh
            Penanggung Jawab Lab. Simpan kode Anda dengan aman.
          </p>
        </div>
      </main>
    </div>
  );
}

function FRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-1">
      <span className="w-28 shrink-0">{label}</span>
      <span>:</span>
      <span className={bold ? "font-bold" : ""}>{value}</span>
    </div>
  );
}
