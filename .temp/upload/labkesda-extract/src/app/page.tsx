import React from "react";
import Link from "next/link";
import {
  FlaskConical,
  LogIn,
  ClipboardCheck,
  Droplets,
  TestTube,
  Bug,
  Microscope,
  Beaker,
  ArrowRight,
  UserPlus,
  FileText,
  CalendarClock,
  Clock,
  MapPin,
  Phone,
  Mail,
  Search,
} from "lucide-react";

const LAYANAN = [
  { icon: Droplets, name: "Hematologi", desc: "Pemeriksaan darah lengkap dan analisis sel darah." },
  { icon: TestTube, name: "Kimia Klinik", desc: "Gula darah, kolesterol, fungsi ginjal dan hati." },
  { icon: Bug, name: "Imunoserologi", desc: "HBsAg, HIV, Dengue, dan pemeriksaan imunologi." },
  { icon: Microscope, name: "Mikrobiologi", desc: "Kultur bakteri dan uji sensitivitas antibiotik." },
  { icon: Beaker, name: "Urinalisis", desc: "Pemeriksaan urine rutin dan sedimen." },
];

const LANGKAH = [
  {
    icon: UserPlus,
    step: "1",
    title: "Isi Data Diri",
    desc: "Lengkapi identitas pasien, pilih jenis penjamin (Umum/BPJS), dan tanggal kunjungan.",
  },
  {
    icon: FileText,
    step: "2",
    title: "Pilih Pemeriksaan",
    desc: "Tentukan kategori pemeriksaan yang dibutuhkan dan unggah surat rujukan bila ada.",
  },
  {
    icon: CalendarClock,
    step: "3",
    title: "Dapatkan Kode Booking",
    desc: "Simpan kode booking, lalu datang ke lab sesuai jadwal untuk verifikasi dan pengambilan sampel.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F6] text-[#1C1C1C]">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#E5E5E3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0F6E5A] flex items-center justify-center text-white shadow-sm">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Labkesda Garut</p>
              <p className="text-[10px] text-[#6B6B6B]">Laboratory Information System</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              href="/cek-hasil"
              className="h-9 px-3.5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1C1C1C] hover:bg-[#F7F7F6] rounded-xl transition-colors"
            >
              <Search className="w-4 h-4" /> <span className="hidden sm:inline">Cek Hasil</span>
            </Link>
            <Link
              href="/login"
              className="h-9 px-3.5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1C1C1C] hover:bg-[#F7F7F6] rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">Login Petugas</span>
            </Link>
            <Link
              href="/daftar-online"
              className="h-9 px-4 inline-flex items-center gap-1.5 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Daftar Online
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#E4F2EE] to-[#F7F7F6]" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E5E3] text-xs font-medium text-[#0F6E5A] mb-6">
            <ClipboardCheck className="w-3.5 h-3.5" /> Laboratorium Kesehatan Daerah Kabupaten Garut
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">
            Layanan Laboratorium yang{" "}
            <span className="text-[#0F6E5A]">Cepat, Akurat, dan Terpercaya</span>
          </h1>
          <p className="mt-5 text-sm sm:text-base text-[#6B6B6B] max-w-xl mx-auto">
            Daftar pemeriksaan laboratorium secara online tanpa antre lama. Pilih jadwal,
            pilih pemeriksaan, dan dapatkan hasil yang tervalidasi oleh tenaga ahli.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/daftar-online"
              className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center gap-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <ClipboardCheck className="w-4 h-4" /> Daftar Online Sekarang
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F7F7F6] text-[#1C1C1C] text-sm font-semibold rounded-xl border border-[#E5E5E3] transition-colors"
            >
              <LogIn className="w-4 h-4" /> Login Petugas
            </Link>
          </div>
        </div>
      </section>

      {/* Layanan */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Layanan Pemeriksaan</h2>
          <p className="mt-2 text-sm text-[#6B6B6B]">Berbagai kategori pemeriksaan laboratorium tersedia untuk Anda.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LAYANAN.map((l) => (
            <div
              key={l.name}
              className="bg-white rounded-2xl border border-[#E5E5E3] p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 rounded-xl bg-[#E4F2EE] flex items-center justify-center text-[#0F6E5A] mb-4">
                <l.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold">{l.name}</h3>
              <p className="mt-1.5 text-xs text-[#6B6B6B] leading-relaxed">{l.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cara Pendaftaran */}
      <section className="bg-white border-y border-[#E5E5E3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Cara Pendaftaran Online</h2>
            <p className="mt-2 text-sm text-[#6B6B6B]">Tiga langkah mudah untuk mendaftar pemeriksaan.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LANGKAH.map((s) => (
              <div key={s.step} className="relative text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#0F6E5A] text-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <s.icon className="w-6 h-6" />
                </div>
                <span className="absolute top-0 left-1/2 -translate-x-8 -translate-y-1 text-xs font-bold text-white bg-[#E8A33D] w-5 h-5 rounded-full flex items-center justify-center">
                  {s.step}
                </span>
                <h3 className="text-sm font-bold">{s.title}</h3>
                <p className="mt-1.5 text-xs text-[#6B6B6B] leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/daftar-online"
              className="h-11 px-6 inline-flex items-center justify-center gap-2 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              Mulai Daftar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Jam & Kontak */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#E5E5E3] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-[#0F6E5A]" />
              <h3 className="text-sm font-bold">Jam Operasional</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-[#6B6B6B]">Senin – Jumat</span>
                <span className="font-semibold">07.30 – 15.00 WIB</span>
              </li>
              <li className="flex justify-between">
                <span className="text-[#6B6B6B]">Sabtu</span>
                <span className="font-semibold">07.30 – 12.00 WIB</span>
              </li>
              <li className="flex justify-between">
                <span className="text-[#6B6B6B]">Minggu & Hari Libur</span>
                <span className="font-semibold text-[#D64545]">Tutup</span>
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-[#E5E5E3] p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#0F6E5A]" />
              <h3 className="text-sm font-bold">Kontak & Lokasi</h3>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#6B6B6B] mt-0.5 shrink-0" />
                <span className="text-[#6B6B6B]">Jl. Proklamasi, Tarogong Kidul, Kabupaten Garut, Jawa Barat</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#6B6B6B] shrink-0" />
                <span className="text-[#6B6B6B]">(0262) 000-0000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#6B6B6B] shrink-0" />
                <span className="text-[#6B6B6B]">labkesda@garutkab.go.id</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E5E3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F6E5A] flex items-center justify-center text-white">
              <FlaskConical className="w-4 h-4" />
            </div>
            <p className="text-xs text-[#6B6B6B]">
              © {new Date().getFullYear()} Labkesda Kabupaten Garut. Semua hak dilindungi.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/daftar-online" className="text-[#6B6B6B] hover:text-[#0F6E5A] font-medium">
              Daftar Online
            </Link>
            <Link href="/login" className="text-[#6B6B6B] hover:text-[#0F6E5A] font-medium">
              Login Petugas
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
