import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import clsx from "clsx";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const colors: Record<ToastKind, string> = {
  success: "border-emerald-200 text-emerald-700",
  error: "border-red-200 text-red-700",
  info: "border-neutral-200 text-neutral-700",
};

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const Icon = icons[toast.kind];
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={clsx(
        "flex items-start gap-2 bg-white shadow-lg border rounded-lg px-3 py-2.5 animate-[fadeIn_0.15s_ease-out]",
        colors[toast.kind]
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="text-xs text-neutral-700 flex-1">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} className="text-neutral-400 hover:text-neutral-600">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
