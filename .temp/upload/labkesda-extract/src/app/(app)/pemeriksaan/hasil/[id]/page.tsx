"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft, FlaskConical, ShieldCheck, AlertTriangle } from "lucide-react";

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

function fmtDate(s?: string) {
  if (!s) return "-";
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
function fmtDateOnly(s?: string) {
  if (!s) return "-";
  return new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export default function HasilLabPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [kop, setKop] = useState({
    line1: "Pemerintah Kabupaten Garut",
    line2: "Dinas Kesehatan",
    line3: "Laboratorium Kesehatan Daerah",
    address: "Jl. Proklamasi No. 2, Tarogong Kidul, Garut 44151, Jawa Barat",
    contact: "Telp. (0262) 232720 • Email: labkesda@garutkab.go.id",
    logoUrl: "",
  });

  useEffect(() => {
    fetch("/api/examinations?priority=ALL")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const found = (data.examinations as Exam[]).find((e) => e.id === id);
          setExam(found || null);
        }
      })
      .finally(() => setLoading(false));
    fetch("/api/letterhead")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.settings) setKop((prev) => ({ ...prev, ...data.settings }));
      })
      .catch(() => {});
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center text-xs text-[#6B6B6B]">Memuat surat hasil...</div>;
  }
  if (!exam) {
    return (
      <div className="p-10 text-center space-y-3">
        <p className="text-sm text-[#6B6B6B]">Data pemeriksaan tidak ditemukan.</p>
        <button onClick={() => router.back()} className="text-xs text-[#0F6E5A] font-semibold hover:underline">Kembali</button>
      </div>
    );
  }

  const isValidated = exam.status === "VALIDA";
  // Normalkan placeholder bohongan dari record online lama menjadi label jujur.
  const LEGACY_ONLINE_DOCTOR = "Dokter Penanggung Jawab Lab (Online)";
  const doctorLabel =
    !exam.doctorName || exam.doctorName === LEGACY_ONLINE_DOCTOR
      ? "Tanpa Rujukan (Mandiri)"
      : exam.doctorName;
  const details = exam.details || [];
  // Kelompokkan per kategori.
  const grouped = details.reduce<Record<string, Detail[]>>((acc, d) => {
    (acc[d.category] = acc[d.category] || []).push(d);
    return acc;
  }, {});

  // Template surat: LAB (hasil lab biasa), NARKOBA & KESEHATAN (surat keterangan).
  const template = exam.resultTemplate || "LAB";
  const isLetter = template === "NARKOBA" || template === "KESEHATAN";
  const docTitle =
    template === "NARKOBA"
      ? "Surat Keterangan Hasil Pemeriksaan Narkoba"
      : template === "KESEHATAN"
      ? "Surat Keterangan Hasil Pemeriksaan Kesehatan"
      : "Hasil Pemeriksaan Laboratorium";

  return (
    <div className="space-y-4">
      {/* Toolbar (tidak ikut tercetak) */}
      <div className="no-print flex items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] hover:text-[#1C1C1C]">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <div className="flex items-center gap-2">
          {!isValidated && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E8A33D] bg-[#E8A33D]/10 px-2.5 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" /> Belum divalidasi PJ Lab
            </span>
          )}
          <button
            onClick={() => window.print()}
            disabled={!isValidated}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            title={isValidated ? "Cetak surat hasil" : "Hasil harus divalidasi dulu sebelum dicetak"}
          >
            <Printer className="w-4 h-4" /> Cetak Surat Hasil
          </button>
        </div>
      </div>

      {/* Jika belum divalidasi PJ Lab, isi surat disembunyikan. */}
      {!isValidated ? (
        <div className="max-w-md mx-auto mt-10 bg-white border border-[#E8A33D]/40 rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#E8A33D]/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-[#E8A33D]" />
          </div>
          <h2 className="text-base font-bold text-[#1C1C1C]">Surat Hasil Belum Tersedia</h2>
          <p className="text-sm text-[#6B6B6B] mt-2 leading-relaxed">
            Hasil pemeriksaan ini <strong>belum divalidasi</strong> oleh Penanggung Jawab Lab.
            Surat hasil hanya dapat dilihat dan dicetak setelah proses validasi selesai.
          </p>
          <p className="text-xs text-[#6B6B6B] mt-3">
            Status saat ini: <span className="font-semibold text-[#1C1C1C]">{exam.status}</span>
          </p>
        </div>
      ) : (
      /* Dokumen A4 — format resmi laboratorium pemerintah */
      <div className="flex justify-center">
        <div
          id="printable-doc"
          className="w-[210mm] min-h-[297mm] bg-white text-black shadow-sm border border-[#E5E5E3] px-12 py-10 mx-auto"
          style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
        >
          {/* Kop surat instansi */}
          <div className="flex items-center gap-4 pb-2">
            <div className="w-20 h-20 shrink-0 flex items-center justify-center border-2 border-black rounded-full overflow-hidden">
              {kop?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={kop.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <FlaskConical className="w-9 h-9" />
              )}
            </div>
            <div className="flex-1 text-center leading-tight">
              <p className="text-sm font-semibold uppercase tracking-wide">{kop?.line1 || "Pemerintah Kabupaten Garut"}</p>
              <p className="text-sm font-semibold uppercase tracking-wide">{kop?.line2 || "Dinas Kesehatan"}</p>
              <p className="text-xl font-bold uppercase tracking-wide">{kop?.line3 || "Laboratorium Kesehatan Daerah"}</p>
              <p className="text-[11px] mt-0.5">
                {kop?.address || "Jl. Proklamasi No. 2, Tarogong Kidul, Garut 44151, Jawa Barat"}
              </p>
              <p className="text-[11px]">
                {kop?.contact || "Telp. (0262) 232720 • Email: labkesda@garutkab.go.id"}
              </p>
            </div>
            <div className="w-20 shrink-0" />
          </div>

          {/* Garis kop ganda */}
          <div className="border-t-[3px] border-black" />
          <div className="border-t border-black mt-[2px]" />

          <h2 className="text-center text-base font-bold uppercase tracking-wide mt-4 underline underline-offset-4">
            {docTitle}
          </h2>
          <p className="text-center text-[11px] mb-4">No. {exam.labNo}</p>

          {/* Identitas pasien & pemeriksaan */}
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

          {/* Narasi surat keterangan (Narkoba / Sehat) di atas tabel hasil */}
          {exam.resultTemplate === "NARKOBA" && (
            <p className="text-[11px] leading-relaxed mb-3 text-justify">
              Yang bertanda tangan di bawah ini menerangkan bahwa terhadap sampel urin/darah pasien
              tersebut di atas telah dilakukan pemeriksaan skrining narkotika dan psikotropika, dengan
              hasil sebagai berikut{exam.purpose ? ` (keperluan: ${exam.purpose})` : ""}:
            </p>
          )}
          {exam.resultTemplate === "KESEHATAN" && (
            <p className="text-[11px] leading-relaxed mb-3 text-justify">
              Yang bertanda tangan di bawah ini menerangkan bahwa pasien tersebut di atas telah menjalani
              pemeriksaan kesehatan, dengan hasil sebagai berikut{exam.purpose ? ` (keperluan: ${exam.purpose})` : ""}:
            </p>
          )}

          {/* Tabel hasil per kategori (tanpa kolom Metode) */}
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

          {/* Kesimpulan surat keterangan */}
          {exam.resultTemplate === "NARKOBA" && (
            <p className="mt-3 text-[11px] leading-relaxed text-justify">
              <span className="font-bold">Kesimpulan: </span>
              Berdasarkan hasil pemeriksaan di atas, seluruh parameter skrining narkotika menunjukkan hasil
              sesuai nilai rujukan (Negatif), kecuali yang ditandai. Surat keterangan ini dikeluarkan untuk
              dipergunakan sebagaimana mestinya{exam.purpose ? ` dalam rangka ${exam.purpose}` : ""}.
            </p>
          )}
          {exam.resultTemplate === "KESEHATAN" && (
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

          {/* Tanda tangan penanggung jawab */}
          <div className="mt-8 flex justify-end text-[11px]">
            <div className="text-center w-64">
              <p>Garut, {fmtDateOnly(exam.validatedAt || exam.completedAt)}</p>
              <p>Penanggung Jawab Laboratorium,</p>
              {isValidated ? (
                <div className="inline-flex items-center gap-1 my-1 text-[10px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Tervalidasi elektronik
                </div>
              ) : (
                <div className="h-12" />
              )}
              <p className="font-bold underline">{exam.validatorName || "( ............................. )"}</p>
              <p className="text-[10px]">Penanggung Jawab Teknis Laboratorium</p>
            </div>
          </div>

          <div className="mt-6 pt-2 border-t border-black text-center text-[9px] text-[#333]">
            Dokumen dicetak dari Sistem Informasi Laboratorium (LIS) Labkesda Garut
            {isValidated ? " — telah divalidasi secara elektronik dan sah tanpa tanda tangan basah." : "."}
          </div>
        </div>
      </div>
      )}
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

