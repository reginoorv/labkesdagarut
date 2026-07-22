"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Lock, X, Construction, ShieldCheck } from "lucide-react";

interface LockedFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureTitle: string;
}

export function LockedFeatureModal({ isOpen, onClose, featureTitle }: LockedFeatureModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50 transition-opacity" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 max-w-md w-[90vw] translate-x-[-50%] translate-y-[-50%] rounded-xl bg-white p-6 shadow-xl border border-[#E5E5E3] focus:outline-none">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
            <div className="flex items-center gap-2 text-[#0F6E5A] font-semibold text-sm">
              <div className="p-1.5 bg-[#E4F2EE] rounded-md">
                <Lock className="w-4 h-4 text-[#0F6E5A]" />
              </div>
              Fitur Dalam Pengembangan
            </div>
            <Dialog.Close asChild>
              <button
                onClick={onClose}
                className="text-[#6B6B6B] hover:text-[#1C1C1C] p-1 rounded-md hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="py-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#E4F2EE] flex items-center justify-center text-[#0F6E5A]">
              <Construction className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#1C1C1C] mb-1">
              {featureTitle}
            </h3>
            <p className="text-xs text-[#6B6B6B] leading-relaxed max-w-xs mx-auto">
              Fitur ini sedang dikembangkan untuk integrasi tahap berikutnya pada Laboratorium Kesehatan Daerah (Labkesda) Kabupaten Garut.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-[11px] font-medium text-[#6B6B6B]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F6E5A]" /> Target Rilis Q3 2026
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-[#E5E5E3]">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#0F6E5A] text-white hover:bg-[#0B5445] text-xs font-semibold rounded-md transition-colors"
            >
              Mengerti & Tutup
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
