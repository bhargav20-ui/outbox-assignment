import { useState } from "react";
import { X, Slack, CheckCircle2 } from "lucide-react";
import { connectSlack, disconnectSlack, testSlack } from "../lib/api";
import { useToast } from "../hooks/useToast";
import type { SlackStatus } from "../types";

export default function SlackModal({
  status,
  onClose,
  onChange,
}: {
  status?: SlackStatus;
  onClose: () => void;
  onChange: (s: SlackStatus) => void;
}) {
  const { push } = useToast();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const handleConnect = async () => {
    if (!webhookUrl.trim()) {
      push("Enter a Slack webhook URL or use OAuth.", "error");
      return;
    }
    setBusy(true);
    try {
      const s = await connectSlack({ webhookUrl });
      onChange(s);
      push("Slack connected.", "success");
    } catch {
      push("Couldn't connect Slack — check the backend is running.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      const s = await disconnectSlack();
      onChange(s);
      push("Slack disconnected.", "info");
    } catch {
      push("Couldn't disconnect Slack right now.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleTest = async () => {
    setBusy(true);
    try {
      await testSlack();
      push("Test notification sent to Slack.", "success");
    } catch {
      push("Test notification failed — is Slack connected?", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Slack className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-neutral-800">Slack Notifications</h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {status?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs rounded-md px-3 py-2">
              <CheckCircle2 className="w-4 h-4" />
              Connected {status.teamName ? `to ${status.teamName}` : ""}{" "}
              {status.channel ? `(#${status.channel})` : ""}
            </div>
            <button
              onClick={handleTest}
              disabled={busy}
              className="w-full text-xs font-medium bg-neutral-900 text-white rounded-md py-2 hover:bg-neutral-800 disabled:opacity-50"
            >
              Send test notification
            </button>
            <button
              onClick={handleDisconnect}
              disabled={busy}
              className="w-full text-xs font-medium border border-red-200 text-red-600 rounded-md py-2 hover:bg-red-50 disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-neutral-500">
              Paste a Slack Incoming Webhook URL, or use OAuth to connect your workspace. You'll get a
              live alert whenever a sender's hourly rate limit is hit.
            </p>
            <input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/…"
              className="w-full text-xs border border-neutral-200 rounded-md px-3 py-2 outline-none focus:border-emerald-400"
            />
            <button
              onClick={handleConnect}
              disabled={busy}
              className="w-full text-xs font-medium bg-emerald-600 text-white rounded-md py-2 hover:bg-emerald-700 disabled:opacity-50"
            >
              Connect Slack
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
