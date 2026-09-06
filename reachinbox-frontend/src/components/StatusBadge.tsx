import clsx from "clsx";
import type { ScheduledStatus, SentStatus } from "../types";

const styles: Record<string, string> = {
  SCHEDULED: "bg-amber-50 text-amber-700 border-amber-200",
  PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
  RESCHEDULED: "bg-purple-50 text-purple-700 border-purple-200",
  SENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

export default function StatusBadge({ status }: { status: ScheduledStatus | SentStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
        styles[status]
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}
