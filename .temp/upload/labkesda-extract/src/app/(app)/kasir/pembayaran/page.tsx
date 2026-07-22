"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Search, Filter, RefreshCw, CreditCard, ShieldCheck, CheckCircle2, Clock, Printer, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import { useUser } from "@/components/layout/AppLayout";

interface PaymentExam {
  id: number; labNo: string; queueNo: string; patientName: string; patientRm: string; guaranteeType: string;
  priority: string; paymentGateStatus: string; status: string; createdAt: string;
  payment: any;
}

export default function PembayaranPage() {
  const { showToast } = useToast();
  const user = useUser();
  const router = useRouter();
  const [items, setItems] = useState<PaymentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("MENUNGGU_PEMBAYARAN");
  const [selectedExam, setSelectedExam] = useState<PaymentExam | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("TUNAI");
  const [eligibilityNote, setEligibilityNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) setItems(data.items);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchItems(); }, [statusFilter]);

  const openDetail = async (exam: PaymentExam) => {
    setSelectedExam(exam);
    setIsDetailOpen(true);
    try {
      const res = await fetch(`/api/payments/${exam.id}`);
      const data = await res.json();
      if (data.success) setDetailData(data);
    } catch {}
  };

  const handlePayCash = async () => {
    if (!selectedExam || !detailData) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/payments/${selectedExam.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guaranteeType: detailData.patient?.guaranteeType || "UMUM",
          totalAmount: String(detailData.totalAmount),
          paymentMethod,
          items: detailData.items,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const paidExamId = selectedExam.id;
        showToast({ type: "success", title: "Pembayaran Lunas!", description: "Membuka invoice untuk dicetak..." });
        setIsDetailOpen(false);
        fetchItems();
        router.push(`/kasir/invoice/${paidExamId}`);
      } else {
        showToast({ type: "error", title: "Gagal", description: data.error });
      }
    } catch (e: any) { showToast({ type: "error", title: "Error", description: e.message }); }
    finally { setIsProcessing(false); }
  };

  const handleVerifyEligibility = async () => {
    if (!selectedExam || !detailData) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/payments/${selectedExam.id}/verify-eligibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guaranteeType: detailData.patient?.guaranteeType || "BPJS",
          totalAmount: String(detailData.totalAmount),
          eligibilityNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast({ type: "success", title: "Eligibilitas Terverifikasi!", description: data.message });
        setIsDetailOpen(false);
        fetchItems();
      } else {
        showToast({ type: "error", title: "Gagal", description: data.error });
      }
    } catch (e: any) { showToast({ type: "error", title: "Error", description: e.message }); }
    finally { setIsProcessing(false); }
  };

  const fmtRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
  const isUmum = detailData?.patient?.guaranteeType === "UMUM";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <div>
          <h1 className="text-xl font-bold text-[#1C1C1C]">Pembayaran & Verifikasi Eligibilitas</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">Gerbang pembayaran pemeriksaan laboratorium sebelum sampel diproses analis.</p>
        </div>
        <button onClick={fetchItems} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5E3] hover:bg-[#F7F7F6] text-xs font-semibold rounded-lg text-[#1C1C1C]">
          <RefreshCw className="w-3.5 h-3.5 text-[#0F6E5A]" /> Refresh
        </button>
      </div>

      <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#6B6B6B]" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 text-xs bg-[#F7F7F6] border border-[#E5E5E3] rounded-lg">
            <option value="MENUNGGU_PEMBAYARAN">Menunggu Pembayaran</option>
            <option value="LOLOS">Sudah Lolos</option>
            <option value="ALL">Semua</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-[#E5E5E3] rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead><tr className="bg-[#F7F7F6] border-b border-[#E5E5E3] text-[#6B6B6B] font-semibold">
              <th className="py-3 px-4">NO. ANTRIAN</th>
              <th className="py-3 px-4">NO. LAB</th>
              <th className="py-3 px-4">NAMA PASIEN</th>
              <th className="py-3 px-4">PENJAMIN</th>
              <th className="py-3 px-4 text-center">STATUS PEMBAYARAN</th>
              <th className="py-3 px-4 text-right">AKSI</th>
            </tr></thead>
            <tbody className="divide-y divide-[#E5E5E3]">
              {loading ? Array.from({length:3}).map((_,i) => <tr key={i} className="animate-pulse"><td colSpan={6} className="py-4 px-4"><div className="h-4 bg-neutral-200 rounded w-full" /></td></tr>) :
              items.length > 0 ? items.map((item) => (
                <tr key={item.id} onClick={() => openDetail(item)} className={`hover:bg-[#F7F7F6] cursor-pointer ${item.paymentGateStatus === "MENUNGGU_PEMBAYARAN" ? "bg-[#E8A33D]/5" : ""}`}>
                  <td className="py-3 px-4"><span className={`font-extrabold tabular-nums ${item.priority === "CITO" ? "text-[#D64545]" : "text-[#0F6E5A]"}`}>{item.queueNo || "-"}</span></td>
                  <td className="py-3 px-4 font-bold text-[#0F6E5A] tabular-nums">{item.labNo}</td>
                  <td className="py-3 px-4 font-semibold text-[#1C1C1C]">{item.patientName}<span className="text-[11px] text-[#6B6B6B] ml-1">({item.patientRm})</span></td>
                  <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${item.guaranteeType === "UMUM" ? "bg-[#E8A33D]/15 text-[#E8A33D]" : "bg-[#3B7DD8]/15 text-[#3B7DD8]"}`}>{item.guaranteeType}</span></td>
                  <td className="py-3 px-4 text-center">
                    {item.paymentGateStatus === "LOLOS" ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1B8A5A]/15 text-[#1B8A5A] inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Lolos</span> :
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8A33D]/15 text-[#E8A33D] inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Menunggu</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="px-2.5 py-1 bg-[#E4F2EE] hover:bg-[#0F6E5A] hover:text-white text-[#0F6E5A] rounded-md text-[11px] font-semibold transition-colors">Proses</button>
                  </td>
                </tr>
              )) : <tr><td colSpan={6} className="py-8 text-center text-xs text-[#6B6B6B]">Tidak ada data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Sheet */}
      <Dialog.Root open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-50" />
          <Dialog.Content className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-[#E5E5E3] p-6 overflow-y-auto focus:outline-none flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3] mb-4">
                <h2 className="text-base font-bold text-[#1C1C1C] flex items-center gap-2"><Receipt className="w-4 h-4 text-[#0F6E5A]" /> Detail Tagihan — {selectedExam?.labNo}</h2>
                <button onClick={() => setIsDetailOpen(false)} className="p-1.5 text-[#6B6B6B] hover:text-[#1C1C1C] rounded-md hover:bg-neutral-100"><X className="w-4 h-4" /></button>
              </div>
              {detailData && (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl p-3 space-y-1">
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">Pasien</span><span className="font-bold">{detailData.patient?.name}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">RM</span><span className="font-bold tabular-nums">{detailData.patient?.rmNo}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B6B6B]">Penjamin</span><span className={`font-bold ${isUmum ? "text-[#E8A33D]" : "text-[#3B7DD8]"}`}>{detailData.patient?.guaranteeType}</span></div>
                  </div>

                  <div className="border border-[#E5E5E3] rounded-xl overflow-hidden">
                    <div className="bg-[#F7F7F6] px-3 py-2 font-semibold text-[#1C1C1C] border-b border-[#E5E5E3]">Rincian Item Pemeriksaan</div>
                    <table className="w-full text-xs">
                      <thead><tr className="border-b border-[#E5E5E3] text-[#6B6B6B]"><th className="py-2 px-3 text-left">Item</th><th className="py-2 px-3 text-right">Harga</th></tr></thead>
                      <tbody className="divide-y divide-[#E5E5E3]">
                        {detailData.items?.map((it: any, i: number) => (
                          <tr key={i}><td className="py-2 px-3 font-medium">{it.testName}<span className="text-[10px] text-[#6B6B6B] ml-1">({it.category})</span></td><td className="py-2 px-3 text-right tabular-nums font-semibold">{fmtRp(it.price)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="bg-[#E4F2EE] px-3 py-2.5 flex justify-between font-bold text-sm text-[#0F6E5A]">
                      <span>TOTAL TAGIHAN</span><span className="tabular-nums">{fmtRp(detailData.totalAmount)}</span>
                    </div>
                  </div>

                  {selectedExam?.paymentGateStatus === "MENUNGGU_PEMBAYARAN" && isUmum && (
                    <div className="bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl p-4 space-y-3">
                      <h3 className="font-bold text-[#1C1C1C] flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-[#0F6E5A]" /> Metode Pembayaran</h3>
                      <div className="flex gap-2">
                        {["TUNAI", "TF_BANK"].map((m) => (
                          <button key={m} onClick={() => setPaymentMethod(m)} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${paymentMethod === m ? "bg-[#0F6E5A] text-white border-[#0F6E5A]" : "bg-white border-[#E5E5E3] text-[#1C1C1C] hover:bg-[#F7F7F6]"}`}>
                            {m === "TUNAI" ? "Tunai" : "Transfer Bank"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedExam?.paymentGateStatus === "MENUNGGU_PEMBAYARAN" && !isUmum && (
                    <div className="bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl p-4 space-y-3">
                      <h3 className="font-bold text-[#1C1C1C] flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#3B7DD8]" /> Verifikasi Eligibilitas {detailData.patient?.guaranteeType}</h3>
                      <textarea rows={3} value={eligibilityNote} onChange={(e) => setEligibilityNote(e.target.value)} placeholder="Catatan verifikasi: No. kartu BPJS, surat rujukan dinas, dll..." className="w-full p-2.5 text-xs bg-white border border-[#E5E5E3] rounded-lg focus:outline-none focus:border-[#0F6E5A]" />
                    </div>
                  )}

                  {selectedExam?.paymentGateStatus === "LOLOS" && detailData.existingPayment && (
                    <div className="p-3 bg-[#1B8A5A]/10 border border-[#1B8A5A]/30 rounded-xl space-y-2">
                      <span className="font-bold text-[#1B8A5A] text-[11px] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {detailData.existingPayment.status === "LUNAS" ? "Pembayaran Lunas" : "Eligibilitas Terverifikasi"}</span>
                      <p className="text-[11px] text-[#6B6B6B]">Invoice: {detailData.existingPayment.invoiceNo} — oleh {detailData.existingPayment.processedBy}</p>
                      <button
                        onClick={() => selectedExam && router.push(`/kasir/invoice/${selectedExam.id}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F6E5A] hover:underline"
                      >
                        <Printer className="w-3.5 h-3.5" /> Cetak Invoice
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#E5E5E3] flex items-center justify-end gap-3 mt-4">
              {selectedExam?.paymentGateStatus === "MENUNGGU_PEMBAYARAN" && detailData && (
                isUmum ? (
                  <button onClick={handlePayCash} disabled={isProcessing} className="px-5 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs">
                    <CreditCard className="w-3.5 h-3.5" /> {isProcessing ? "Memproses..." : "Konfirmasi Lunas"}
                  </button>
                ) : (
                  <button onClick={handleVerifyEligibility} disabled={isProcessing} className="px-5 py-2 bg-[#3B7DD8] hover:bg-[#2a6ac0] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5" /> {isProcessing ? "Memproses..." : "Verifikasi & Lanjutkan"}
                  </button>
                )
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
