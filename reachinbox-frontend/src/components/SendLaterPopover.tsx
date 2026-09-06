import { useState } from "react";
import { addDays, setHours, setMinutes, format } from "date-fns";

const QUICK_OPTIONS = [
  { label: "Tomorrow, 9:00 AM", hours: 9, minutes: 0, dayOffset: 1 },
  { label: "Tomorrow, 10:00 AM", hours: 10, minutes: 0, dayOffset: 1 },
  { label: "Tomorrow, 11:00 AM", hours: 11, minutes: 0, dayOffset: 1 },
  { label: "Tomorrow, 3:00 PM", hours: 15, minutes: 0, dayOffset: 1 },
];

export default function SendLaterPopover({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: (date: Date) => void;
}) {
  const [custom, setCustom] = useState("");

  const pick = (opt: (typeof QUICK_OPTIONS)[number]) => {
    const base = addDays(new Date(), opt.dayOffset);
    onConfirm(setMinutes(setHours(base, opt.hours), opt.minutes));
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-xl z-30 p-3">
      <p className="text-xs font-medium text-neutral-500 mb-2">Send Later</p>
      <input
        type="datetime-local"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        className="w-full text-xs border border-neutral-200 rounded-md px-2 py-1.5 mb-2 outline-none focus:border-emerald-400"
      />
      <p className="text-[11px] text-neutral-400 mb-1">Tomorrow</p>
      <div className="space-y-0.5 mb-2">
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => pick(opt)}
            className="w-full text-left text-xs text-neutral-600 hover:bg-neutral-50 rounded px-2 py-1.5"
          >
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-neutral-100">
        <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded-md text-neutral-500 hover:bg-neutral-50">
          Cancel
        </button>
        <button
          onClick={() => custom && onConfirm(new Date(custom))}
          disabled={!custom}
          className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700"
        >
          Done
        </button>
      </div>
    </div>
  );
}
