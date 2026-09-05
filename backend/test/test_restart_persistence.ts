import { pool, initDb } from '../src/db';
import { emailQueue, scheduleEmailJob, recoverScheduledJobs } from '../src/queue/queue';
import { v4 as uuidv4 } from 'uuid';
import assert from 'assert';

export async function runPersistenceTest(): Promise<void> {
  console.log('\n======================================================');
  console.log('🧪 TEST 5: BULLMQ PERSISTENCE ACROSS RESTART');
  console.log('======================================================');

  await initDb();

  const emailId = uuidv4();
  const scheduledFor = new Date(Date.now() + 60000); // 60s in future

  // 1. Insert into DB
  await pool.query(
    `INSERT INTO emails (id, sender, recipient, subject, body, status, scheduled_for)
     VALUES ($1, 'restart@test.com', 'client@test.com', 'Persistence test', 'Body', 'SCHEDULED', $2)`,
    [emailId, scheduledFor]
  );

  // 2. Schedule in BullMQ
  await scheduleEmailJob(emailId, scheduledFor);

  // 3. Verify job is present in BullMQ delayed set
  const initialJob = await emailQueue.getJob(`email_${emailId}`);
  assert.ok(initialJob, 'Job must exist in BullMQ queue before restart');
  console.log(`[Test] Verified initial job in queue: id=${initialJob.id}, delay=${initialJob.delay}ms`);

  // 4. Simulate server restart: run recoverScheduledJobs()
  console.log('[Test] Simulating server restart recovery...');
  const recovered = await recoverScheduledJobs();
  console.log(`[Test] Recovered count: ${recovered}`);

  // 5. Verify job is STILL in the queue and NOT duplicated
  const postRestartJob = await emailQueue.getJob(`email_${emailId}`);
  assert.ok(postRestartJob, 'Job must persist after restart');
  assert.strictEqual(postRestartJob.id, `email_${emailId}`, 'Job ID must remain deterministic');

  // Verify counts in queue
  const delayedJobs = await emailQueue.getDelayed();
  const matching = delayedJobs.filter(j => j.id === `email_${emailId}`);
  assert.strictEqual(matching.length, 1, 'Job must NOT be duplicated in delayed set');

  console.log('✅ PASSED: BullMQ delayed jobs persist across restart without loss or duplication.\n');
}

runPersistenceTest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ FAILED:', err);
    process.exit(1);
  });
