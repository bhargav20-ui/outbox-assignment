import { useEffect, useMemo, useState, useCallback } from "react";
import { format } from "date-fns";
import Sidebar from "../components/Sidebar";
import EmailList from "../components/EmailList";
import ComposeModal from "../components/ComposeModal";
import SlackModal from "../components/SlackModal";
import QueueWidget from "../components/QueueWidget";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import {
  fetchScheduledEmails,
  fetchSentEmails,
  fetchSlackStatus,
  fetchQueueStats,
} from "../lib/api";
import type { ScheduledEmail, SentEmail, SlackStatus, QueueStats } from "../types";

// Demo fallback data so the UI is fully explorable even with no backend running.
const DEMO_SCHEDULED: ScheduledEmail[] = [
  {
    id: "s1",
    recipient: "John Smith",
    subject: "Meeting follow-up",
    sender: "oliver.brown@domain.io",
    scheduledTime: new Date(Date.now() + 3600_000).toISOString(),
    status: "SCHEDULED",
    preview: "Hi John, just wanted to follow up on our meeting…",
  },
  {
    id: "s2",
    recipient: "Olive",
    subject: "Great to meet you - you'll love it",
    sender: "oliver.brown@domain.io",
    scheduledTime: new Date(Date.now() + 7200_000).toISOString(),
    status: "RESCHEDULED",
    preview: "Hi Olive, great to meet you - you'll love it!",
  },
];

const DEMO_SENT: SentEmail[] = [
  {
    id: "e1",
    recipient: "Sarah Wilson",
    subject: "Re: Project Update",
    sender: "oliver.brown@domain.io",
    sentTime: new Date(Date.now() - 3600_000).toISOString(),
    status: "SENT",
    preview: "Thanks for the update. Looks good.",
  },
  {
    id: "e2",
    recipient: "Support",
    subject: "Issue with login",
    sender: "oliver.brown@domain.io",
    sentTime: new Date(Date.now() - 7200_000).toISOString(),
    status: "FAILED",
    preview: "I'm having trouble logging in to the dashboard…",
    error: "SMTP timeout after 3 retries",
  },
];

type Tab = "scheduled" | "sent";

export default function DashboardPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("scheduled");
  const [query, setQuery] = useState("");
  const [scheduled, setScheduled] = useState<ScheduledEmail[]>([]);
  const [sent, setSent] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [composeOpen, setComposeOpen] = useState(false);
  const [slackOpen, setSlackOpen] = useState(false);
  const [slackStatus, setSlackStatus] = useState<SlackStatus | undefined>();
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sc, se] = await Promise.all([fetchScheduledEmails(), fetchSentEmails()]);
      setScheduled(sc);
      setSent(se);
      setUsingDemoData(false);
    } catch {
      setScheduled(DEMO_SCHEDULED);
      setSent(DEMO_SENT);
      setUsingDemoData(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetchSlackStatus().then(setSlackStatus).catch(() => setSlackStatus({ connected: false }));
    fetchQueueStats().then(setQueueStats).catch(() => setQueueStats(null));
    const interval = setInterval(() => {
      fetchQueueStats().then(setQueueStats).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (usingDemoData) {
      push("Backend not reachable — showing demo data. Set VITE_BACKEND_URL to connect.", "info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usingDemoData]);

  const filtered = useMemo(() => {
    const list = tab === "scheduled" ? scheduled : sent;
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (i) =>
        i.subject.toLowerCase().includes(q) ||
        i.recipient.toLowerCase().includes(q) ||
        i.sender.toLowerCase().includes(q)
    );
  }, [tab, scheduled, sent, query]);

  const selected = useMemo(
    () => [...scheduled, ...sent].find((i) => i.id === selectedId),
    [scheduled, sent, selectedId]
  );

  return (
    <div className="h-screen flex bg-white">
      <Sidebar
        activeTab={tab}
        onTabChange={(t) => {
          setTab(t);
          setSelectedId(undefined);
        }}
        scheduledCount={scheduled.length}
        sentCount={sent.length}
        onCompose={() => setComposeOpen(true)}
        query={query}
        onQueryChange={setQuery}
        slackStatus={slackStatus}
        onOpenSlack={() => setSlackOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
          <h1 className="text-sm font-semibold text-neutral-800">
            {tab === "scheduled" ? "Scheduled Emails" : "Sent Emails"}
          </h1>
        </header>

        <div className="px-4 pt-3">
          <QueueWidget stats={queueStats} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {selected ? (
            <EmailDetail email={selected} onBack={() => setSelectedId(undefined)} />
          ) : (
            <EmailList
              loading={loading}
              items={filtered}
              kind={tab}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
        </div>
      </main>

      {composeOpen && (
        <ComposeModal onClose={() => setComposeOpen(false)} onScheduled={load} />
      )}
      {slackOpen && (
        <SlackModal
          status={slackStatus}
          onClose={() => setSlackOpen(false)}
          onChange={setSlackStatus}
        />
      )}
    </div>
  );
}

function EmailDetail({
  email,
  onBack,
}: {
  email: ScheduledEmail | SentEmail;
  onBack: () => void;
}) {
  const time = "scheduledTime" in email ? email.scheduledTime : email.sentTime;
  return (
    <div className="px-5 py-4">
      <button onClick={onBack} className="text-xs text-neutral-500 hover:text-neutral-700 mb-4">
        ← Back
      </button>
      <div className="border-b border-neutral-100 pb-4 mb-4">
        <h2 className="text-base font-medium text-neutral-900">{email.subject}</h2>
        <p className="text-xs text-neutral-400 mt-1">
          From {email.sender} to {email.recipient} ·{" "}
          {(() => {
            try {
              return format(new Date(time), "MMM d, yyyy h:mm a");
            } catch {
              return time;
            }
          })()}
        </p>
      </div>
      {"error" in email && email.error && (
        <div className="bg-red-50 text-red-700 text-xs rounded-md px-3 py-2 mb-4">
          Error: {email.error}
        </div>
      )}
      {email.preview ? (
        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{email.preview}</p>
      ) : (
        <EmptyState title="No preview available" />
      )}
    </div>
  );
}
