import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pendaftaran Online — Labkesda Garut",
  description: "Pendaftaran online pasien untuk pemeriksaan laboratorium di Labkesda Kabupaten Garut",
};

export default function DaftarOnlineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="id" className={`${inter.variable}`}>
      {children}
    </div>
  );
}
