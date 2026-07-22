"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (message: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(({ type, title, description }: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            let borderClass = "border-[#E5E5E3]";
            let bgClass = "bg-white";
            let icon = <Info className="w-5 h-5 text-[#3B7DD8]" />;

            if (toast.type === "success") {
              borderClass = "border-[#1B8A5A]/30 border-l-4 border-l-[#1B8A5A]";
              icon = <CheckCircle2 className="w-5 h-5 text-[#1B8A5A] shrink-0" />;
            } else if (toast.type === "warning") {
              borderClass = "border-[#E8A33D]/30 border-l-4 border-l-[#E8A33D]";
              icon = <AlertTriangle className="w-5 h-5 text-[#E8A33D] shrink-0" />;
            } else if (toast.type === "error") {
              borderClass = "border-[#D64545]/30 border-l-4 border-l-[#D64545]";
              icon = <XCircle className="w-5 h-5 text-[#D64545] shrink-0" />;
            } else if (toast.type === "info") {
              borderClass = "border-[#3B7DD8]/30 border-l-4 border-l-[#3B7DD8]";
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-sm ${bgClass} ${borderClass}`}
              >
                {icon}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-[#1C1C1C] leading-snug">{toast.title}</div>
                  {toast.description && (
                    <div className="text-xs text-[#6B6B6B] mt-0.5 leading-normal">{toast.description}</div>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors p-0.5 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
