"use client";

import React, { useState } from "react";
import { FlaskConical, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Username atau password salah");
      }
    } catch {
      setError("Koneksi ke server gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#0F6E5A] flex items-center justify-center text-white mx-auto mb-3 shadow-sm">
            <FlaskConical className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-[#1C1C1C] tracking-tight">Labkesda Garut</h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">Laboratory Information System</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[#E5E5E3] shadow-sm p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-[#1C1C1C] mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              autoFocus
              required
              className="w-full h-10 px-3.5 text-sm bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1C1C1C] mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
                className="w-full h-10 px-3.5 pr-10 text-sm bg-[#F7F7F6] border border-[#E5E5E3] rounded-xl focus:outline-none focus:border-[#0F6E5A] focus:ring-1 focus:ring-[#0F6E5A]/20"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-2.5 text-[#6B6B6B] hover:text-[#1C1C1C]"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-[#D64545]/10 border border-[#D64545]/20 rounded-xl text-xs text-[#D64545] font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-[#0F6E5A] hover:bg-[#0B5445] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading ? "Memproses..." : <><LogIn className="w-4 h-4" /> Masuk</>}
          </button>
        </form>

        <p className="text-center text-[10px] text-[#6B6B6B] mt-4">
          Hanya untuk petugas Labkesda Garut yang berwenang.
        </p>
      </div>
    </div>
  );
}
