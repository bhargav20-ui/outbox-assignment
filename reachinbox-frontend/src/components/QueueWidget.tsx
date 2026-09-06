import { ExternalLink } from "lucide-react";
import type { QueueStats } from "../types";

const LABELS: { key: keyof QueueStats; label: string; color: string }[] = [
  { key: "waiting", label: "Waiting", color: "bg-neutral-400" },
  { key: "active", label: "Active", color: "bg-blue-500" },
  { key: "delayed", label: "Delayed", color: "bg-amber-500" },
  { key: "completed", label: "Completed", color: "bg-emerald-500" },
  { key: "failed", label: "Failed", color: "bg-red-500" },
];

export default function QueueWidget({ stats }: { stats: QueueStats | null }) {
  return (
    <div className="border border-neutral-100 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-neutral-700">Live BullMQ Queue</p>
        <a
          href="/admin/queues"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-[11px] text-emerald-600 hover:text-emerald-700"
        >
          Bull Board <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {LABELS.map(({ key, label, color }) => (
          <div key={key} className="text-center">
            <div className="text-sm font-semibold text-neutral-800">
              {stats ? stats[key] : "–"}
            </div>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
              <span className="text-[10px] text-neutral-400">{label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
