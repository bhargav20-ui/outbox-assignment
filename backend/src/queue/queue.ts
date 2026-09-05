import { Queue } from 'bullmq';
import { redisOptions } from './connection';
import { pool } from '../db';

export const QUEUE_NAME = 'email-queue';

export interface EmailJobData {
  emailId: string;
}

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAME, {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 1000,
    removeOnFail: 1000,
  },
});

/**
 * Adds an email job to BullMQ with a calculated delay and deterministic jobId.
 */
export async function scheduleEmailJob(emailId: string, scheduledFor: Date): Promise<void> {
  const now = Date.now();
  const delay = Math.max(0, scheduledFor.getTime() - now);

  await emailQueue.add(
    'send-email',
    { emailId },
    {
      jobId: `email_${emailId}`, // Deterministic jobId ensures idempotency in the queue
      delay,
    }
  );
  console.log(`[Queue] Enqueued job 'email_${emailId}' with delay ${delay}ms (scheduled for ${scheduledFor.toISOString()})`);
}

/**
 * Persistence recovery routine run on server boot:
 * Scans DB for any emails in 'SCHEDULED' state and ensures they are in BullMQ.
 * BullMQ's deterministic jobId prevents duplicate job creation if already present.
 */
export async function recoverScheduledJobs(): Promise<number> {
  console.log('[Recovery] Checking DB for scheduled emails needing queue persistence...');
  const res = await pool.query(
    `SELECT id, scheduled_for FROM emails WHERE status = 'SCHEDULED' ORDER BY scheduled_for ASC`
  );

  let recoveredCount = 0;
  for (const row of res.rows) {
    const scheduledFor = new Date(row.scheduled_for);
    const existingJob = await emailQueue.getJob(`email_${row.id}`);
    if (!existingJob) {
      await scheduleEmailJob(row.id, scheduledFor);
      recoveredCount++;
    }
  }

  console.log(`[Recovery] Found ${res.rows.length} scheduled email(s) in DB. Added ${recoveredCount} missing job(s) to queue.`);
  return recoveredCount;
}
