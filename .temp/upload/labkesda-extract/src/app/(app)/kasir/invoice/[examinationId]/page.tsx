"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, ArrowLeft, FlaskConical } from "lucide-react";
import { Barcode } from "@/components/common/Barcode";

interface Item {
  testName: string;
  category: string;
  price: number;
}

function rupiah(n: number) {
  return "Rp " + (n || 0).toLocaleString("id-ID");
}
function fmtDate(s?: string) {
  if (!s) return "-";
  return new Date(s).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function InvoicePage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examinationId;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/payments/${examId}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d); })
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) {
    return <div className="p-10 text-center text-xs text-[#6B6B6B]">Memuat invoice...</div>;
  }
  if (!data) {
    return (
      <div className="p-10 text-center space-y-3">
        <p className="text-sm text-[#6B6B6B]">Data tagihan tidak ditemukan.</p>
        <button onClick={() => router.back()} className="text-xs text-[#0F6E5A] font-semibold hover:underline">Kembali</button>
      </div>
    );
  }

  const { exam, patient, items, totalAmount, existingPayment } = data as {
    exam: any; patient: any; items: Item[]; totalAmount: number; existingPayment: any;
  };
  const paid = !!existingPayment;
  const isLunas = existingPayment?.status === "LUNAS";
  const invoiceNo = existingPayment?.invoiceNo || `PRO-${exam.labNo}`;

  return (
    <div className="space-y-4">
      {/* Toolbar (tidak tercetak) */}
      <div className="no-print flex items-center justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] hover:text-[#1C1C1C]">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Printer className="w-4 h-4" /> Cetak Struk (80mm)
        </button>
      </div>

      {/* Struk thermal 80mm */}
      <div className="flex justify-center">
        <div
          id="printable-thermal"
          className="bg-white text-black shadow-sm border border-[#E5E5E3] px-3 py-4 mx-auto"
          style={{ width: "80mm", fontFamily: "'Courier New', monospace", fontSize: "11px", lineHeight: 1.35 }}
        >
          {/* Kop */}
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <FlaskConical className="w-6 h-6" />
            </div>
            <p className="font-bold uppercase leading-tight">Laboratorium Kesehatan Daerah</p>
            <p className="font-bold">Kabupaten Garut</p>
            <p className="text-[9px] leading-tight mt-0.5">Jl. Proklamasi No. 2, Tarogong Kidul, Garut, Jawa Barat</p>
            <p className="text-[9px]">Telp (0262) 000-000</p>
          </div>

          <Divider />
          <p className="text-center font-bold uppercase tracking-wide">Invoice Pembayaran</p>
          <p className="text-center text-[10px]">{invoiceNo}</p>
          <Divider />

          {/* Info tagihan */}
          <div className="text-[10px] space-y-0.5">
            <TRow label="Nama" value={patient?.name || "-"} />
            <TRow label="No. RM" value={patient?.rmNo || "-"} />
            <TRow label="No. Lab" value={exam.labNo} />
            <TRow label="Penjamin" value={patient?.guaranteeType || "-"} />
            <TRow label="Tanggal" value={fmtDate(existingPayment?.processedAt || exam.createdAt)} />
            <TRow label="Kasir" value={existingPayment?.processedBy || "-"} />
          </div>

          <Divider />

          {/* Rincian item — daftar vertikal ala struk */}
          <div className="space-y-1">
            {items.map((it, i) => (
              <div key={i} className="text-[10px]">
                <p className="font-medium leading-tight">{it.testName}</p>
                <div className="flex justify-between">
                  <span className="text-[9px] text-[#444]">{it.category}</span>
                  <span className="tabular-nums">{rupiah(it.price)}</span>
                </div>
              </div>
            ))}
          </div>

          <Divider />
          <div className="flex justify-between font-bold text-[12px]">
            <span>TOTAL</span>
            <span className="tabular-nums">{rupiah(totalAmount)}</span>
          </div>
          <Divider />

          {/* Status */}
          <p className="text-center font-bold text-[11px] my-1">
            {paid ? (isLunas ? "*** LUNAS ***" : "*** TERVERIFIKASI (JAMINAN) ***") : "*** BELUM DIBAYAR (PROFORMA) ***"}
          </p>

          <Divider />

          {/* Barcode */}
          <div className="flex flex-col items-center mt-1">
            <Barcode value={exam.labNo} height={30} moduleWidth={1} showValue={false} />
            <p className="text-[9px] mt-0.5 tracking-widest">{exam.labNo}</p>
          </div>

          <p className="mt-2 text-[8px] text-center italic leading-tight">
            Struk ini bukti transaksi resmi Labkesda Garut.<br />Simpan sebagai arsip pembayaran. Terima kasih.
          </p>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="my-1.5 border-t border-dashed border-black" />;
}

function TRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <span className="w-16 shrink-0">{label}</span>
      <span>:</span>
      <span className="flex-1 break-words">{value}</span>
    </div>
  );
}
