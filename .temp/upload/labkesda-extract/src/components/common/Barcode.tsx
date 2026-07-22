"use client";

import React, { useMemo } from "react";
import { encodeCode128B, code128ModuleCount } from "@/lib/barcode";

interface BarcodeProps {
  value: string;
  height?: number;      // tinggi bar (px)
  moduleWidth?: number; // lebar 1 modul (px)
  showValue?: boolean;  // tampilkan teks di bawah barcode
  className?: string;
}

// Barcode Code128-B asli sebagai SVG. Deterministik & scannable.
export function Barcode({
  value,
  height = 56,
  moduleWidth = 2,
  showValue = true,
  className = "",
}: BarcodeProps) {
  const { bars, totalWidth } = useMemo(() => {
    const widths = encodeCode128B(value || "");
    const total = code128ModuleCount(widths);
    // widths berselang: bar, space, bar, space, ... (mulai dari bar).
    const rects: { x: number; w: number }[] = [];
    let x = 0;
    widths.forEach((w, i) => {
      const isBar = i % 2 === 0;
      if (isBar) rects.push({ x, w });
      x += w;
    });
    return { bars: rects, totalWidth: total };
  }, [value]);

  const svgWidth = totalWidth * moduleWidth;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={svgWidth}
        height={height}
        viewBox={`0 0 ${totalWidth} ${height}`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        role="img"
        aria-label={`Barcode ${value}`}
      >
        <rect x={0} y={0} width={totalWidth} height={height} fill="#FFFFFF" />
        {bars.map((b, i) => (
          <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="#000000" />
        ))}
      </svg>
      {showValue && (
        <span className="mt-1 font-mono text-[11px] tracking-[0.2em] text-black">
          {value}
        </span>
      )}
    </div>
  );
}
