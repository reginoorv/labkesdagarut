"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";
import { LockedFeatureModal } from "@/components/common/LockedFeatureModal";

export default function DarahPage() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="py-16 text-center space-y-4 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-[#E4F2EE] flex items-center justify-center text-[#0F6E5A] mx-auto">
        <Lock className="w-8 h-8" />
      </div>
      <h1 className="text-xl font-bold text-[#1C1C1C]">Permintaan Darah Pasien & Transfusi</h1>
      <p className="text-xs text-[#6B6B6B]">
        Modul permintaan darah PMI & uji silang serasi (crossmatch) sedang dikembangkan.
      </p>

      <LockedFeatureModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        featureTitle="Permintaan Darah Pasien"
      />
    </div>
  );
}
