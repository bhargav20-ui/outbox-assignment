import { pool, initDb, EmailRecord } from '../src/db';
import { processEmailJob } from '../src/queue/worker';
import { redisClient } from '../src/queue/connection';
import { getHourKey } from '../src/services/rateLimiter';
import { config } from '../src/config';
import { Job } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import assert from 'assert';

export async function runReschedulingTest(): Promise<void> {
  console.log('\n======================================================');
  console.log('🧪 TEST 3: JOB RESCHEDULING ON RATE LIMIT REACHED');
  console.log('======================================================');

  await initDb();

  const sender = `reschedule-test-${Date.now()}@example.com`;
  const originalLimit = config.maxEmailsPerHourPerSender;
  const TEST_LIMIT = 1;
  config.maxEmailsPerHourPerSender = TEST_LIMIT;

  // Pre-fill the rate limit counter in Redis to simulate limit reached
  const key = getHourKey(sender);
  await redisClient.set(key, TEST_LIMIT.toString());

  const emailId = uuidv4();
  await pool.query(
    `INSERT INTO emails (id, sender, recipient, subject, body, status, scheduled_for)
     VALUES ($1, $2, 'client@example.com', 'Delayed proposal', 'Body', 'SCHEDULED', NOW())`,
    [emailId, sender]
  );

  console.log(`[Test] Pre-set sender ${sender} count to ${TEST_LIMIT}. Triggering worker...`);

  const mockJob = { id: `reschedule-job-${emailId}`, data: { emailId } } as Job<any>;
  const result = await processEmailJob(mockJob);

  console.log('[Test] Worker processing result:', result);
  assert.strictEqual(result.sent, false, 'Email should not be sent immediately');
  assert.ok(result.reason?.includes('rate limit exceeded'), 'Reason should cite rate limit');

  // Verify DB state has updated scheduled_for into next hour
  const res = await pool.query<EmailRecord>('SELECT * FROM emails WHERE id = $1', [emailId]);
  const row = res.rows[0];

  assert.strictEqual(row.status, 'SCHEDULED', 'Email should remain in SCHEDULED status');
  const nextScheduled = new Date(row.scheduled_for);
  console.log(`[Test] Rescheduled time in DB: ${nextScheduled.toISOString()}`);
  assert.ok(nextScheduled > new Date(), 'Rescheduled time must be in future');

  // Restore config
  config.maxEmailsPerHourPerSender = originalLimit;

  console.log('✅ PASSED: When rate limit is reached, job is safely rescheduled to the next available hour without dropping.\n');
}

if (require.main === module) {
  runReschedulingTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ FAILED:', err);
      process.exit(1);
    });
}
