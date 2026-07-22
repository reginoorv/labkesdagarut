import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Labkesda Garut — LIS Operational System",
  description: "Laboratory Information System (LIS) Laboratorium Kesehatan Daerah Kabupaten Garut",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased bg-[#F7F7F6] text-[#1C1C1C]">
        {children}
      </body>
    </html>
  );
}
