// Katalog paket pemeriksaan -> daftar parameter.
//
// Dipakai bersama oleh registrasi (loket & online) untuk meng-"expand" paket
// yang dipilih menjadi baris examination_details kosong yang siap diisi analis.
// Nilai referensi & satuan selaras dengan data seed + master tarif.

export interface ParamTemplate {
  category: string;
  testCode: string;
  testName: string;
  unit: string;
  referenceRange: string;
}

// Kunci = id paket yang dikirim frontend.
// - Loket (registrasi/baru): HEM, GDS, GDP, LIPID, RENAL, HEPAR, URI, HBSAG, HIV
// - Online (daftar-online): Hematologi, Kimia Klinik, Imunoserologi, Mikrobiologi, Urinalisis
export const TEST_CATALOG: Record<string, ParamTemplate[]> = {
  // ── Paket Loket (granular) ──────────────────────────────────────
  HEM: [
    { category: "Hematologi", testCode: "HEM-HB", testName: "Hemoglobin (Hb)", unit: "g/dL", referenceRange: "13.0 - 17.5" },
    { category: "Hematologi", testCode: "HEM-LEU", testName: "Leukosit (WBC)", unit: "/µL", referenceRange: "4.000 - 10.000" },
    { category: "Hematologi", testCode: "HEM-PLT", testName: "Trombosit (PLT)", unit: "/µL", referenceRange: "150.000 - 450.000" },
    { category: "Hematologi", testCode: "HEM-HCT", testName: "Hematokrit (HCT)", unit: "%", referenceRange: "40.0 - 52.0" },
  ],
  GDS: [
    { category: "Kimia Klinik", testCode: "KIM-GDS", testName: "Glukosa Darah Sewaktu", unit: "mg/dL", referenceRange: "< 140" },
  ],
  GDP: [
    { category: "Kimia Klinik", testCode: "KIM-GDP", testName: "Glukosa Darah Puasa", unit: "mg/dL", referenceRange: "70 - 100" },
  ],
  LIPID: [
    { category: "Kimia Klinik", testCode: "KIM-CHOL", testName: "Kolesterol Total", unit: "mg/dL", referenceRange: "< 200" },
    { category: "Kimia Klinik", testCode: "KIM-HDL", testName: "HDL Kolesterol", unit: "mg/dL", referenceRange: "> 40" },
    { category: "Kimia Klinik", testCode: "KIM-LDL", testName: "LDL Kolesterol", unit: "mg/dL", referenceRange: "< 130" },
    { category: "Kimia Klinik", testCode: "KIM-TG", testName: "Trigliserida", unit: "mg/dL", referenceRange: "< 150" },
  ],
  RENAL: [
    { category: "Kimia Klinik", testCode: "KIM-UREUM", testName: "Ureum", unit: "mg/dL", referenceRange: "15 - 45" },
    { category: "Kimia Klinik", testCode: "KIM-CREAT", testName: "Kreatinin", unit: "mg/dL", referenceRange: "0.6 - 1.2" },
    { category: "Kimia Klinik", testCode: "KIM-UA", testName: "Asam Urat", unit: "mg/dL", referenceRange: "3.4 - 7.0" },
  ],
  HEPAR: [
    { category: "Kimia Klinik", testCode: "KIM-SGOT", testName: "SGOT (AST)", unit: "U/L", referenceRange: "< 35" },
    { category: "Kimia Klinik", testCode: "KIM-SGPT", testName: "SGPT (ALT)", unit: "U/L", referenceRange: "< 41" },
    { category: "Kimia Klinik", testCode: "KIM-BIL", testName: "Bilirubin Total", unit: "mg/dL", referenceRange: "0.3 - 1.2" },
  ],
  URI: [
    { category: "Urinalisis", testCode: "URI-RUTIN", testName: "Urinalisis Rutin", unit: "-", referenceRange: "Normal" },
    { category: "Urinalisis", testCode: "URI-PROT", testName: "Protein Urine", unit: "-", referenceRange: "Negatif" },
    { category: "Urinalisis", testCode: "URI-SED", testName: "Sedimen Urine", unit: "/LPB", referenceRange: "0 - 5" },
  ],
  HBSAG: [
    { category: "Imunoserologi", testCode: "IMU-HBSAG", testName: "HBsAg Rapid", unit: "-", referenceRange: "Negatif" },
  ],
  HIV: [
    { category: "Imunoserologi", testCode: "IMU-HIV", testName: "HIV Screening Rapid", unit: "-", referenceRange: "Non-Reaktif" },
  ],

  // ── Paket Online (per kategori besar) ───────────────────────────
  Hematologi: [
    { category: "Hematologi", testCode: "HEM-HB", testName: "Hemoglobin (Hb)", unit: "g/dL", referenceRange: "13.0 - 17.5" },
    { category: "Hematologi", testCode: "HEM-LEU", testName: "Leukosit (WBC)", unit: "/µL", referenceRange: "4.000 - 10.000" },
    { category: "Hematologi", testCode: "HEM-PLT", testName: "Trombosit (PLT)", unit: "/µL", referenceRange: "150.000 - 450.000" },
    { category: "Hematologi", testCode: "HEM-HCT", testName: "Hematokrit (HCT)", unit: "%", referenceRange: "40.0 - 52.0" },
  ],
  "Kimia Klinik": [
    { category: "Kimia Klinik", testCode: "KIM-GDS", testName: "Glukosa Darah Sewaktu", unit: "mg/dL", referenceRange: "< 140" },
    { category: "Kimia Klinik", testCode: "KIM-UREUM", testName: "Ureum", unit: "mg/dL", referenceRange: "15 - 45" },
    { category: "Kimia Klinik", testCode: "KIM-CREAT", testName: "Kreatinin", unit: "mg/dL", referenceRange: "0.6 - 1.2" },
  ],
  Imunoserologi: [
    { category: "Imunoserologi", testCode: "IMU-HBSAG", testName: "HBsAg Rapid", unit: "-", referenceRange: "Negatif" },
    { category: "Imunoserologi", testCode: "IMU-HIV", testName: "HIV Screening Rapid", unit: "-", referenceRange: "Non-Reaktif" },
  ],
  Mikrobiologi: [
    { category: "Mikrobiologi", testCode: "MIK-BTA", testName: "BTA (Bakteri Tahan Asam)", unit: "-", referenceRange: "Negatif" },
    { category: "Mikrobiologi", testCode: "MIK-KULTUR", testName: "Kultur Bakteri & Sensitivitas", unit: "-", referenceRange: "Tidak ada pertumbuhan" },
  ],
  Urinalisis: [
    { category: "Urinalisis", testCode: "URI-RUTIN", testName: "Urinalisis Rutin", unit: "-", referenceRange: "Normal" },
    { category: "Urinalisis", testCode: "URI-PROT", testName: "Protein Urine", unit: "-", referenceRange: "Negatif" },
    { category: "Urinalisis", testCode: "URI-SED", testName: "Sedimen Urine", unit: "/LPB", referenceRange: "0 - 5" },
  ],

  // ── Paket khusus surat keterangan (butuh field "keperluan") ─────
  // NARKOBA: panel 5-6 parameter zat, hasil kualitatif Negatif/Positif.
  NARKOBA: [
    { category: "Toksikologi (Narkoba)", testCode: "NAR-AMP", testName: "Amfetamin (AMP)", unit: "-", referenceRange: "Negatif" },
    { category: "Toksikologi (Narkoba)", testCode: "NAR-MET", testName: "Metamfetamin (MET)", unit: "-", referenceRange: "Negatif" },
    { category: "Toksikologi (Narkoba)", testCode: "NAR-THC", testName: "Ganja / Kanabis (THC)", unit: "-", referenceRange: "Negatif" },
    { category: "Toksikologi (Narkoba)", testCode: "NAR-MOP", testName: "Morfin / Opiat (MOP)", unit: "-", referenceRange: "Negatif" },
    { category: "Toksikologi (Narkoba)", testCode: "NAR-COC", testName: "Kokain (COC)", unit: "-", referenceRange: "Negatif" },
    { category: "Toksikologi (Narkoba)", testCode: "NAR-BZO", testName: "Benzodiazepin (BZO)", unit: "-", referenceRange: "Negatif" },
  ],
  // KESEHATAN: pemeriksaan untuk surat keterangan sehat (fisik + penunjang).
  KESEHATAN: [
    { category: "Pemeriksaan Fisik", testCode: "SEH-TB", testName: "Tinggi Badan", unit: "cm", referenceRange: "-" },
    { category: "Pemeriksaan Fisik", testCode: "SEH-BB", testName: "Berat Badan", unit: "kg", referenceRange: "-" },
    { category: "Pemeriksaan Fisik", testCode: "SEH-TD", testName: "Tekanan Darah", unit: "mmHg", referenceRange: "90/60 - 120/80" },
    { category: "Pemeriksaan Fisik", testCode: "SEH-NADI", testName: "Denyut Nadi", unit: "x/menit", referenceRange: "60 - 100" },
    { category: "Pemeriksaan Fisik", testCode: "SEH-SUHU", testName: "Suhu Tubuh", unit: "°C", referenceRange: "36.1 - 37.2" },
    { category: "Pemeriksaan Fisik", testCode: "SEH-MATA", testName: "Ketajaman Penglihatan", unit: "-", referenceRange: "Normal" },
    { category: "Pemeriksaan Fisik", testCode: "SEH-BUTA", testName: "Tes Buta Warna", unit: "-", referenceRange: "Normal" },
  ],
};

// Jenis dokumen hasil menentukan template surat yang dipakai.
export type ResultDocType = "LAB" | "NARKOBA" | "KESEHATAN";

// Paket yang memerlukan field "keperluan/tujuan" wajib diisi.
export const PURPOSE_REQUIRED_PACKAGES = ["NARKOBA", "KESEHATAN"];

// Tentukan jenis surat dari kategori parameter yang ada pada satu pemeriksaan.
export function resultDocTypeFromCategories(categories: string[]): ResultDocType {
  if (categories.some((c) => /narkoba|toksikologi/i.test(c))) return "NARKOBA";
  if (categories.some((c) => /pemeriksaan fisik|kesehatan/i.test(c))) return "KESEHATAN";
  return "LAB";
}

// ── Jenis spesimen (untuk memisahkan siapa yang cetak label) ─────
// URINE dikumpulkan & dilabeli di loket; DARAH diambil & dilabeli oleh analis.
export type SampleType = "URINE" | "DARAH";

// Tentukan jenis spesimen dari kategori/kode parameter satu baris.
// Narkoba & urinalisis pakai sampel urin; selain itu darah (default).
export function sampleTypeFor(category: string, testCode: string): SampleType {
  const c = (category || "").toLowerCase();
  const code = (testCode || "").toUpperCase();
  if (/urinalisis|urine|urin/.test(c)) return "URINE";
  if (/narkoba|toksikologi/.test(c)) return "URINE";
  if (code.startsWith("URI") || code.startsWith("NAR")) return "URINE";
  return "DARAH";
}

// Jenis spesimen dominan dari sekumpulan detail pemeriksaan.
// Dipakai untuk memfilter daftar label: URINE (loket) vs DARAH (analis).
export function sampleTypesOf(details: { category: string; testCode: string }[]): SampleType[] {
  const set = new Set<SampleType>();
  for (const d of details) set.add(sampleTypeFor(d.category, d.testCode));
  return Array.from(set);
}

// Expand daftar id paket -> baris parameter (dedupe berdasarkan testCode).
export function expandTestPackages(packageIds: string[]): ParamTemplate[] {
  const seen = new Set<string>();
  const out: ParamTemplate[] = [];
  for (const id of packageIds) {
    const params = TEST_CATALOG[id];
    if (!params) continue;
    for (const p of params) {
      if (seen.has(p.testCode)) continue;
      seen.add(p.testCode);
      out.push(p);
    }
  }
  return out;
}

// ── Auto-flagging ────────────────────────────────────────────────
// Menandai nilai hasil terhadap rentang rujukan. Mendukung format:
//   "13.0 - 17.5"  (range)   "< 140" / "> 40"  (batas)   "Negatif"/"Normal" (kualitatif)
export type Flag = "NORMAL" | "HIGH" | "LOW" | "CRITICAL";

// Ambang kritis kasar per parameter (opsional). Kalau tak ada, hanya HIGH/LOW.
const CRITICAL_RULES: Record<string, { lowBelow?: number; highAbove?: number }> = {
  "HEM-HB": { lowBelow: 7, highAbove: 20 },
  "HEM-PLT": { lowBelow: 50000, highAbove: 1000000 },
  "HEM-LEU": { highAbove: 30000 },
  "KIM-GDS": { lowBelow: 40, highAbove: 400 },
  "KIM-GDP": { lowBelow: 40, highAbove: 400 },
};

function parseNumber(raw: string): number | null {
  if (!raw) return null;
  // Sisakan hanya digit, titik, koma, minus.
  let s = raw.replace(/[^0-9.,\-]/g, "").trim();
  if (s === "" || s === "-" || s === "." || s === ",") return null;

  if (s.includes(",")) {
    // Gaya Indonesia eksplisit: koma = desimal, titik = pemisah ribuan.
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // Hanya titik: ambigu antara ribuan ("4.000" = 4000) & desimal ("13.0").
    // Konvensi lab: pemisah ribuan selalu grup tepat 3 digit. Kalau tiap
    // segmen setelah titik pertama berisi 3 digit, perlakukan sebagai ribuan;
    // selain itu titik terakhir adalah desimal.
    const parts = s.split(".");
    if (parts.length > 1 && parts.slice(1).every((p) => p.length === 3)) {
      s = parts.join(""); // mis. "4.000" -> "4000", "150.000" -> "150000"
    }
    // else biarkan apa adanya: "13.0", "17.5", "0.6" tetap desimal.
  }

  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export function computeFlag(value: string, referenceRange: string, testCode?: string): Flag {
  const v = (value ?? "").trim();
  if (!v) return "NORMAL";

  const ref = (referenceRange ?? "").trim();

  // Kualitatif: Negatif / Normal / Non-Reaktif dianggap NORMAL, selain itu HIGH.
  const qualitative = /^(negatif|normal|non-?reaktif|tidak ada pertumbuhan)/i.test(ref);
  if (qualitative) {
    return /^(negatif|normal|non-?reaktif|tidak ada|-)?$/i.test(v) || /negatif|normal|non-?reaktif/i.test(v)
      ? "NORMAL"
      : "HIGH";
  }

  const num = parseNumber(v);
  if (num === null) return "NORMAL";

  const crit = testCode ? CRITICAL_RULES[testCode] : undefined;

  // Format "< 140"
  let m = ref.match(/^<\s*([\d.,]+)/);
  if (m) {
    const max = parseNumber(m[1])!;
    if (crit?.highAbove && num >= crit.highAbove) return "CRITICAL";
    return num >= max ? "HIGH" : "NORMAL";
  }
  // Format "> 40"
  m = ref.match(/^>\s*([\d.,]+)/);
  if (m) {
    const min = parseNumber(m[1])!;
    if (crit?.lowBelow && num <= crit.lowBelow) return "CRITICAL";
    return num <= min ? "LOW" : "NORMAL";
  }
  // Format "13.0 - 17.5"
  m = ref.match(/([\d.,]+)\s*-\s*([\d.,]+)/);
  if (m) {
    const min = parseNumber(m[1])!;
    const max = parseNumber(m[2])!;
    if (num < min) return crit?.lowBelow && num <= crit.lowBelow ? "CRITICAL" : "LOW";
    if (num > max) return crit?.highAbove && num >= crit.highAbove ? "CRITICAL" : "HIGH";
    return "NORMAL";
  }

  return "NORMAL";
}
