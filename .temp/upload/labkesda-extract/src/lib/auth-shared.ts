// Shared auth constants - safe to import in both client and server components

// Entri diakhiri "/*" berarti path itu beserta seluruh turunannya (untuk
// halaman dokumen dinamis seperti cetak hasil / invoice). Tanpa "/*" berarti
// cocok persis — supaya sub-halaman satu role tidak bocor ke role lain.
export const ROLE_MENU_ACCESS: Record<string, string[]> = {
  PETUGAS_LOKET: ["/dashboard", "/antrian", "/registrasi/baru", "/registrasi/pendaftaran-online", "/registrasi/edit", "/registrasi/print-label", "/master/rs"],
  KASIR: ["/dashboard", "/antrian", "/kasir/pembayaran", "/kasir/invoice/*", "/master/tarif"],
  ANALIS_LAB: ["/dashboard", "/antrian", "/pemeriksaan", "/pemeriksaan/duplo", "/pemeriksaan/auto-flagging", "/pemeriksaan/nilai-kritis", "/pemeriksaan/hasil/*", "/registrasi/print-label", "/monitoring/realtime-tat"],
  PJ_LAB: ["/dashboard", "/antrian", "/pemeriksaan/duplo", "/pemeriksaan/auto-flagging", "/pemeriksaan/nilai-kritis", "/pemeriksaan/validasi", "/pemeriksaan/hasil/*", "/monitoring/realtime-tat", "/monitoring/laporan-tat"],
  ADMIN_SISTEM: ["*"],
};

export const ROLE_LABELS: Record<string, string> = {
  PETUGAS_LOKET: "Petugas Loket",
  KASIR: "Kasir",
  ANALIS_LAB: "Analis Laboratorium",
  PJ_LAB: "Penanggung Jawab Lab",
  ADMIN_SISTEM: "Administrator Sistem",
};

export function hasAccess(role: string, path: string): boolean {
  if (role === "ADMIN_SISTEM") return true;
  const allowed = ROLE_MENU_ACCESS[role] || [];
  return allowed.some((p) => {
    if (p === "*") return true;
    // "/prefix/*" -> cocokkan prefix + turunannya.
    if (p.endsWith("/*")) {
      const base = p.slice(0, -2);
      return path === base || path.startsWith(base + "/");
    }
    // Selain itu cocok persis, supaya sub-halaman satu role (mis.
    // "/pemeriksaan/validasi") tidak bocor ke role yang cuma punya induknya.
    return path === p;
  });
}
