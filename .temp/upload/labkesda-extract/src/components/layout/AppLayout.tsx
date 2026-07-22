"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { LockedFeatureModal } from "@/components/common/LockedFeatureModal";
import { motion } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { hasAccess } from "@/lib/auth-shared";

export interface AppUser {
  userId: number;
  username: string;
  fullName: string;
  role: string;
}

const UserContext = createContext<AppUser | null>(null);
export function useUser() {
  return useContext(UserContext);
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [lockedModal, setLockedModal] = useState<{ isOpen: boolean; title: string }>({
    isOpen: false,
    title: "",
  });
  const [user, setUser] = useState<AppUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Seed + fetch session
    fetch("/api/seed").catch(() => {});
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoaded(true));
  }, [router]);

  // Route guard: cegah akses lintas-role lewat URL langsung.
  // Dashboard selalu boleh; sisanya harus lolos hasAccess sesuai role.
  useEffect(() => {
    if (!user) return;
    if (pathname === "/dashboard" || pathname === "/") return;
    if (!hasAccess(user.role, pathname)) {
      router.replace("/dashboard");
    }
  }, [user, pathname, router]);

  const openLockedModal = (title: string) => {
    setLockedModal({ isOpen: true, title });
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (!loaded) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F7F7F6]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F6E5A] flex items-center justify-center text-white mx-auto animate-pulse">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" /></svg>
          </div>
          <p className="text-xs text-[#6B6B6B]">Memuat sesi...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <UserContext.Provider value={user}>
      <ToastProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-[#F7F7F6] text-[#1C1C1C] font-sans antialiased">
          <AppSidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            onOpenLockedModal={openLockedModal}
            user={user}
            onLogout={handleLogout}
          />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <Topbar user={user} onLogout={handleLogout} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F7F7F6]">
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="max-w-7xl mx-auto space-y-5"
              >
                {children}
              </motion.div>
            </main>
          </div>
          <LockedFeatureModal
            isOpen={lockedModal.isOpen}
            onClose={() => setLockedModal({ isOpen: false, title: "" })}
            featureTitle={lockedModal.title}
          />
        </div>
      </ToastProvider>
    </UserContext.Provider>
  );
}
