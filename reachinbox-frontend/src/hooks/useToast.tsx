import React, { createContext, useCallback, useContext, useState } from "react";
import { ToastViewport, ToastItem, ToastKind } from "../components/Toast";

interface ToastContextValue {
  push: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  let idCounter = 0;

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    idCounter += 1;
    const id = Date.now() + idCounter;
    setToasts((prev) => [...prev, { id, message, kind }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
