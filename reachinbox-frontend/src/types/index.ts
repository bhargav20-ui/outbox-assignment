export type ScheduledStatus = "SCHEDULED" | "PROCESSING" | "RESCHEDULED";
export type SentStatus = "SENT" | "FAILED";

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface ScheduledEmail {
  id: string;
  recipient: string;
  subject: string;
  sender: string;
  scheduledTime: string; // ISO
  status: ScheduledStatus;
  preview?: string;
}

export interface SentEmail {
  id: string;
  recipient: string;
  subject: string;
  sender: string;
  sentTime: string; // ISO
  status: SentStatus;
  error?: string;
  preview?: string;
}

export interface QueueStats {
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
}

export interface SlackStatus {
  connected: boolean;
  teamName?: string;
  channel?: string;
}

export interface ScheduleEmailPayload {
  from: string;
  recipients: string[];
  subject: string;
  body: string;
  startTime: string; // ISO
  delayBetweenEmailsSeconds: number;
  hourlyLimit: number;
}

/** Raw row shape as returned by the actual backend (PostgreSQL `emails` table). */
export interface BackendEmailRecord {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  status: string; // SCHEDULED | PROCESSING | RESCHEDULED | SENT | FAILED
  scheduled_for?: string;
  sent_at?: string;
  updated_at?: string;
  created_at?: string;
  error?: string;
}

export interface BackendQueueStatsResponse {
  queue: string;
  counts: {
    waiting: number;
    active: number;
    delayed: number;
    completed: number;
    failed: number;
    paused?: number;
  };
  isPaused: boolean;
}

export interface BackendSlackStatus {
  connected: boolean;
  webhookUrl?: string;
  token?: string;
  channel?: string;
  teamName?: string;
}
