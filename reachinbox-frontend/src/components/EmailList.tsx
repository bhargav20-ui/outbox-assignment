import { format } from "date-fns";
import type { ScheduledEmail, SentEmail } from "../types";
import StatusBadge from "./StatusBadge";
import RowSkeleton from "./RowSkeleton";
import EmptyState from "./EmptyState";
import clsx from "clsx";

type Row = (ScheduledEmail | SentEmail) & { timeField: string };

export default function EmailList({
  loading,
  items,
  kind,
  selectedId,
  onSelect,
}: {
  loading: boolean;
  items: (ScheduledEmail | SentEmail)[];
  kind: "scheduled" | "sent";
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (loading) return <RowSkeleton rows={6} />;

  if (items.length === 0) {
    return (
      <EmptyState
        title={kind === "scheduled" ? "No scheduled emails yet" : "No sent emails yet"}
        subtitle={
          kind === "scheduled"
            ? "Compose a new email and schedule it to see it here."
            : "Once your scheduled emails are sent, they'll show up here."
        }
      />
    );
  }

  return (
    <div className="divide-y divide-neutral-100">
      {items.map((item) => {
        const time = "scheduledTime" in item ? item.scheduledTime : item.sentTime;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={clsx(
              "w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors",
              selectedId === item.id && "bg-emerald-50/60"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-300 shrink-0" />
            <span className="text-xs font-medium text-neutral-800 w-40 truncate">
              To: {item.recipient}
            </span>
            <span className="flex-1 min-w-0 text-xs text-neutral-500 truncate">
              <StatusBadge status={item.status} />{" "}
              <span className="ml-1 font-medium text-neutral-700">{item.subject}</span>
              {item.preview && <span className="text-neutral-400"> — {item.preview}</span>}
            </span>
            <span className="text-[11px] text-neutral-400 shrink-0 w-28 text-right">
              {(() => {
                try {
                  return format(new Date(time), "EEE h:mm a");
                } catch {
                  return time;
                }
              })()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
