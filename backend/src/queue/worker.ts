import { Worker, Job } from 'bullmq';
import { QUEUE_NAME, EmailJobData, emailQueue } from './queue';
import { redisOptions, redisClient } from './connection';
import { pool, EmailRecord } from '../db';
import { config } from '../config';
import { tryAcquireRateLimitSlot, enforceMinimumDelay, getNextHourStart } from '../services/rateLimiter';
import { sendMail } from '../services/mailer';
import { indexEmail } from '../services/search';
import { notifySlackRateLimit } from '../services/slack';
import { v4 as uuidv4 } from 'uuid';

export let emailWorker: Worker<EmailJobData> | null = null;

export async function processEmailJob(job: Job<EmailJobData>): Promise<{ sent: boolean; reason?: string }> {
  const { emailId } = job.data;
  const workerInstanceId = uuidv4();
  const lockKey = `lock:email:${emailId}`;

  // 1. Distributed Redis Lock for initial concurrency gate
  const lockAcquired = await redisClient.set(lockKey, workerInstanceId, 'EX', 120, 'NX');
  if (!lockAcquired) {
    console.warn(`[Worker] Email ${emailId} is already locked by another worker. Skipping.`);
    return { sent: false, reason: 'Already locked' };
  }

  try {
    // 2. ATOMIC DATABASE TRANSITION: SCHEDULED -> PROCESSING
    // Guaranteed by PostgreSQL row-level locks. Only ONE worker can transition this row.
    const res = await pool.query<EmailRecord>(
      `UPDATE emails 
       SET status = 'PROCESSING', updated_at = NOW() 
       WHERE id = $1 AND status = 'SCHEDULED' 
       RETURNING *`,
      [emailId]
    );

    if (res.rowCount === 0) {
      console.log(`[Worker] Email ${emailId} not in 'SCHEDULED' status (already processed or processing). Skipping.`);
      return { sent: false, reason: 'Not in scheduled state' };
    }

    const email = res.rows[0];

    // 3. Hourly Rate Limit Check (Redis Lua Script)
    const rateCheck = await tryAcquireRateLimitSlot(email.sender);
    if (!rateCheck.allowed) {
      const nextHour = rateCheck.nextAvailableTime || getNextHourStart();
      console.warn(
        `[RateLimit] Sender '${email.sender}' reached limit (${rateCheck.limit}/hr). Rescheduling ${email.id} to ${nextHour.toISOString()}`
      );

      // Transition DB back to SCHEDULED with new future time
      const rescheduledRes = await pool.query<EmailRecord>(
        `UPDATE emails 
         SET status = 'SCHEDULED', scheduled_for = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [nextHour, email.id]
      );

      // Re-index into Elasticsearch with new scheduled time
      await indexEmail(rescheduledRes.rows[0]);

      // Reschedule in BullMQ
      const delayMs = Math.max(1000, nextHour.getTime() - Date.now());
      // Remove current job if exists, re-enqueue
      await emailQueue.add(
        'send-email',
        { emailId: email.id },
        {
          jobId: `email_${email.id}_${nextHour.getTime()}`, // Unique job ID for new window
          delay: delayMs,
        }
      );

      // Slack Notification
      await notifySlackRateLimit(email.sender, rateCheck.limit, nextHour);

      return { sent: false, reason: 'Hourly rate limit exceeded - rescheduled' };
    }

    // 4. Configurable Minimum Send Delay Throttling
    const waitTime = await enforceMinimumDelay(email.sender);
    if (waitTime > 0) {
      console.log(`[Throttle] Sender '${email.sender}' throttled for ${waitTime}ms (min delay: ${config.minEmailDelayMs}ms)`);
    }

    // 5. Send Email via SMTP
    try {
      console.log(`[SMTP] Sending email ${email.id} from <${email.sender}> to <${email.recipient}>...`);
      const sendResult = await sendMail({
        from: email.sender,
        to: email.recipient,
        subject: email.subject,
        text: email.body,
      });

      console.log(`[SMTP] Sent email ${email.id}! Message ID: ${sendResult.messageId}. Preview: ${sendResult.previewUrl}`);

      // 6. Update DB to SENT
      const sentRes = await pool.query<EmailRecord>(
        `UPDATE emails 
         SET status = 'SENT', sent_at = NOW(), provider_message_id = $1, last_error = NULL, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [sendResult.messageId, email.id]
      );

      // 7. Update Elasticsearch
      await indexEmail(sentRes.rows[0]);

      return { sent: true };
    } catch (sendErr: any) {
      console.error(`[SMTP] Failed to send email ${email.id}:`, sendErr.message);

      const failRes = await pool.query<EmailRecord>(
        `UPDATE emails 
         SET status = 'FAILED', last_error = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [sendErr.message, email.id]
      );

      await indexEmail(failRes.rows[0]);
      throw sendErr;
    }
  } finally {
    // Release Redis distributed lock
    await redisClient.del(lockKey);
  }
}

export function startWorker(): Worker<EmailJobData> {
  if (emailWorker) return emailWorker;

  console.log(`[Worker] Starting BullMQ worker with concurrency = ${config.workerConcurrency}`);

  emailWorker = new Worker<EmailJobData>(
    QUEUE_NAME,
    async (job: Job<EmailJobData>) => {
      return await processEmailJob(job);
    },
    {
      connection: redisOptions,
      concurrency: config.workerConcurrency,
    }
  );

  emailWorker.on('completed', (job: Job<EmailJobData>, result: any) => {
    console.log(`[Worker] Job ${job.id} completed. Result:`, result);
  });

  emailWorker.on('failed', (job: Job<EmailJobData> | undefined, err: Error) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  return emailWorker;
}

export async function stopWorker(): Promise<void> {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    console.log('[Worker] Worker closed.');
  }
}
