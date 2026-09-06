import axios from "axios";
import type {
  ScheduledEmail,
  SentEmail,
  QueueStats,
  SlackStatus,
  ScheduleEmailPayload,
  BackendEmailRecord,
  BackendQueueStatsResponse,
  BackendSlackStatus,
} from "../types";

export const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ong_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function mapScheduled(rec: BackendEmailRecord): ScheduledEmail {
  return {
    id: rec.id,
    recipient: rec.recipient,
    subject: rec.subject,
    sender: rec.sender,
    scheduledTime:
      rec.scheduled_for || rec.created_at || new Date().toISOString(),
    status: (rec.status as ScheduledEmail["status"]) || "SCHEDULED",
    preview: rec.body,
  };
}

function mapSent(rec: BackendEmailRecord): SentEmail {
  return {
    id: rec.id,
    recipient: rec.recipient,
    subject: rec.subject,
    sender: rec.sender,
    sentTime: rec.sent_at || rec.updated_at || new Date().toISOString(),
    status: (rec.status as SentEmail["status"]) || "SENT",
    error: rec.error,
    preview: rec.body,
  };
}

export async function fetchScheduledEmails() {
  const { data } = await api.get<{ emails: BackendEmailRecord[] }>(
    "/emails/scheduled",
  );
  return (data.emails || []).map(mapScheduled);
}

export async function fetchSentEmails() {
  const { data } = await api.get<{ emails: BackendEmailRecord[] }>(
    "/emails/sent",
  );
  return (data.emails || []).map(mapSent);
}

export async function scheduleEmail(payload: ScheduleEmailPayload) {
  const items = payload.recipients.map((recipient) => ({
    sender: payload.from,
    recipient,
    subject: payload.subject,
    body: payload.body,
    scheduledFor: payload.startTime,
  }));
  const { data } = await api.post("/emails/schedule", items);
  return data;
}

export async function searchEmails(q: string) {
  const { data } = await api.get<{
    count: number;
    emails: BackendEmailRecord[];
  }>("/emails/search", { params: { q } });
  return (data.emails || []).map((r) =>
    r.status === "SENT" || r.status === "FAILED" ? mapSent(r) : mapScheduled(r),
  );
}

export async function fetchQueueStats(): Promise<QueueStats> {
  const { data } = await api.get<BackendQueueStatsResponse>("/queue/stats");
  return {
    waiting: data.counts.waiting ?? 0,
    active: data.counts.active ?? 0,
    delayed: data.counts.delayed ?? 0,
    completed: data.counts.completed ?? 0,
    failed: data.counts.failed ?? 0,
  };
}

function mapSlackStatus(s: BackendSlackStatus): SlackStatus {
  return {
    connected: !!s.connected,
    teamName: s.teamName,
    channel: s.channel,
  };
}

export async function fetchSlackStatus() {
  const { data } = await api.get<BackendSlackStatus>("/slack/status");
  return mapSlackStatus(data);
}

export async function connectSlack(payload: {
  webhookUrl?: string;
  accessToken?: string;
}) {
  const { data } = await api.post<{
    message: string;
    status: BackendSlackStatus;
  }>("/slack/connect", {
    webhookUrl: payload.webhookUrl,
    token: payload.accessToken,
  });
  return mapSlackStatus(data.status);
}

export async function disconnectSlack() {
  const { data } = await api.post<{
    message: string;
    status: BackendSlackStatus;
  }>("/slack/disconnect");
  return mapSlackStatus(data.status);
}

export async function testSlack() {
  const { data } = await api.post<{
    success: boolean;
    message?: string;
    error?: string;
  }>("/slack/test");
  return { ok: data.success };
}

export async function loginWithGoogle(idToken: string) {
  const { data } = await api.post<{
    token: string;
    user: { name: string; email: string; avatarUrl?: string };
  }>("/auth/google", { idToken });
  return data;
}
