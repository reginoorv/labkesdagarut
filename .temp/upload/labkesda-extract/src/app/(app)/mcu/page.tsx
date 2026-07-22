"use client";

import React, { useState } from "react";
import { Lock, Construction, ShieldCheck } from "lucide-react";
import { LockedFeatureModal } from "@/components/common/LockedFeatureModal";

export default function McuPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="py-16 text-center space-y-4 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-[#E4F2EE] flex items-center justify-center text-[#0F6E5A] mx-auto">
        <Lock className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-[#1C1C1C]">Registrasi MCU Massal</h1>
      <p className="text-xs text-[#6B6B6B]">
        Fitur registrasi Medical Check-Up (MCU) massal perusahaan & instansi sedang dikembangkan untuk rilis tahap berikutnya.
      </p>

      <LockedFeatureModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        featureTitle="Registrasi MCU Massal"
      />
    </div>
  );
}
