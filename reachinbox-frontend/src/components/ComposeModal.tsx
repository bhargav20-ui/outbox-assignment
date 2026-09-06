import { useCallback, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Paperclip,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  X,
  Upload,
} from "lucide-react";
import { format } from "date-fns";
import SendLaterPopover from "./SendLaterPopover";
import { scheduleEmail } from "../lib/api";
import { useToast } from "../hooks/useToast";
import type { ScheduleEmailPayload } from "../types";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const SENDERS = ["oliver.brown@domain.io", "team@domain.io", "sales@domain.io"];

export default function ComposeModal({
  onClose,
  onScheduled,
}: {
  onClose: () => void;
  onScheduled: () => void;
}) {
  const { push } = useToast();
  const [from, setFrom] = useState(SENDERS[0]);
  const [recipients, setRecipients] = useState<string[]>([]);
  const [manualTo, setManualTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delaySeconds, setDelaySeconds] = useState<number>(2);
  const [hourlyLimit, setHourlyLimit] = useState<number>(50);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showSendLater, setShowSendLater] = useState(false);
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addManualRecipient = () => {
    const matches = manualTo.match(EMAIL_REGEX);
    if (matches) {
      setRecipients((prev) => Array.from(new Set([...prev, ...matches])));
    }
    setManualTo("");
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r !== email));
  };

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const matches = Array.from(new Set(text.match(EMAIL_REGEX) || []));
      setRecipients((prev) => Array.from(new Set([...prev, ...matches])));
      setUploadedCount(matches.length);
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const canSend = recipients.length > 0 && subject.trim().length > 0;

  const submit = async () => {
    if (!canSend) {
      push("Add at least one recipient and a subject.", "error");
      return;
    }
    setSubmitting(true);
    const payload: ScheduleEmailPayload = {
      from,
      recipients,
      subject,
      body,
      startTime: (startTime ?? new Date()).toISOString(),
      delayBetweenEmailsSeconds: delaySeconds,
      hourlyLimit,
    };
    try {
      await scheduleEmail(payload);
      push(`Scheduled ${recipients.length} email${recipients.length > 1 ? "s" : ""} successfully.`, "success");
      onScheduled();
      onClose();
    } catch (err) {
      console.error(err);
      push("Couldn't reach the backend — check your API is running.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl mt-4 mb-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
          <button onClick={onClose} className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900">
            <ArrowLeft className="w-4 h-4" /> Compose New Email
          </button>
          <div className="flex items-center gap-2">
            <button className="p-1.5 text-neutral-400 hover:text-neutral-600">
              <Paperclip className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowSendLater((s) => !s)}
                className="flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-800 border border-neutral-200 rounded-md px-2.5 py-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                {startTime ? format(startTime, "MMM d, h:mm a") : "Send Later"}
              </button>
              {showSendLater && (
                <SendLaterPopover
                  onCancel={() => setShowSendLater(false)}
                  onConfirm={(d) => {
                    setStartTime(d);
                    setShowSendLater(false);
                  }}
                />
              )}
            </div>
            <button
              onClick={submit}
              disabled={submitting || !canSend}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-medium px-4 py-1.5 rounded-md"
            >
              {submitting ? "Scheduling…" : startTime ? "Send Later" : "Send"}
            </button>
          </div>
        </div>

        {/* Fields */}
        <div className="px-5 py-3 space-y-2 border-b border-neutral-100">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-400 w-14 shrink-0">From</span>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="flex-1 outline-none bg-transparent text-neutral-700 font-medium"
            >
              {SENDERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-start gap-3 text-xs">
            <span className="text-neutral-400 w-14 shrink-0 pt-1">To</span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {recipients.map((r) => (
                  <span
                    key={r}
                    className="flex items-center gap-1 bg-neutral-100 text-neutral-700 rounded-full pl-2 pr-1 py-0.5 text-[11px]"
                  >
                    {r}
                    <button onClick={() => removeRecipient(r)} className="hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={manualTo}
                  onChange={(e) => setManualTo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "," || e.key === " ") {
                      e.preventDefault();
                      addManualRecipient();
                    }
                  }}
                  onBlur={addManualRecipient}
                  placeholder="recipient@example.com"
                  className="flex-1 min-w-[140px] outline-none bg-transparent placeholder:text-neutral-400"
                />
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 shrink-0 text-[11px] font-medium"
            >
              <Upload className="w-3 h-3" /> Upload List
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileInput}
            />
          </div>

          {uploadedCount !== null && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`ml-14 flex items-center gap-2 text-[11px] rounded-md border px-2.5 py-1.5 ${
                dragOver ? "border-emerald-400 bg-emerald-50" : "border-neutral-100 bg-neutral-50"
              }`}
            >
              <span className="bg-emerald-100 text-emerald-700 font-medium px-1.5 py-0.5 rounded-full">
                {uploadedCount} detected
              </span>
              <span className="text-neutral-400">emails parsed from uploaded list</span>
            </div>
          )}
          {uploadedCount === null && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`ml-14 text-[11px] rounded-md border border-dashed px-2.5 py-2 text-center text-neutral-400 ${
                dragOver ? "border-emerald-400 bg-emerald-50" : "border-neutral-200"
              }`}
            >
              Drag & drop a CSV/TXT lead list here, or use "Upload List"
            </div>
          )}

          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-400 w-14 shrink-0">Subject</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 outline-none bg-transparent placeholder:text-neutral-400"
            />
          </div>

          <div className="flex items-center gap-6 text-xs pt-1">
            <label className="flex items-center gap-2 text-neutral-500">
              Delay between 2 emails
              <input
                type="number"
                min={0}
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(Number(e.target.value))}
                className="w-14 border border-neutral-200 rounded-md px-2 py-1 outline-none focus:border-emerald-400"
              />
              <span className="text-neutral-400">sec</span>
            </label>
            <label className="flex items-center gap-2 text-neutral-500">
              Hourly Limit
              <input
                type="number"
                min={0}
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(Number(e.target.value))}
                className="w-14 border border-neutral-200 rounded-md px-2 py-1 outline-none focus:border-emerald-400"
              />
            </label>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type Your Reply..."
            rows={10}
            className="w-full outline-none resize-none text-sm placeholder:text-neutral-400"
          />
        </div>
        <div className="flex items-center gap-1 px-5 py-2 border-t border-neutral-100 text-neutral-400">
          {[Bold, Italic, Underline, AlignLeft, List, ListOrdered, Link2, ImageIcon].map((Icon, i) => (
            <button key={i} className="p-1.5 hover:text-neutral-600 hover:bg-neutral-50 rounded">
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
