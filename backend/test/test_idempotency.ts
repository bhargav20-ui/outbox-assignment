import { pool, initDb, EmailRecord } from '../src/db';
import { processEmailJob } from '../src/queue/worker';
import { Job } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import assert from 'assert';

export async function runIdempotencyTest(): Promise<void> {
  console.log('\n======================================================');
  console.log('🧪 TEST 1: EMAIL IDEMPOTENCY (2 WORKERS CONCURRENCY)');
  console.log('======================================================');

  await initDb();

  const emailId = uuidv4();
  const sender = `idempotency-test-${Date.now()}@example.com`;
  const recipient = 'lead@example.com';
  const subject = 'Testing idempotency under race conditions';
  const body = 'This email should never be sent twice.';

  // 1. Insert a scheduled email directly into DB
  await pool.query(
    `INSERT INTO emails (id, sender, recipient, subject, body, status, scheduled_for)
     VALUES ($1, $2, $3, $4, $5, 'SCHEDULED', NOW())`,
    [emailId, sender, recipient, subject, body]
  );
  console.log(`[Test] Created scheduled email ${emailId}`);

  // 2. Prepare two simulated concurrent worker jobs for the exact same emailId
  const mockJob1 = { id: `job1-${emailId}`, data: { emailId } } as Job<any>;
  const mockJob2 = { id: `job2-${emailId}`, data: { emailId } } as Job<any>;

  console.log('[Test] Triggering 2 workers SIMULTANEOUSLY on the same emailId...');
  const [result1, result2] = await Promise.all([
    processEmailJob(mockJob1),
    processEmailJob(mockJob2),
  ]);

  console.log('[Test] Worker 1 result:', result1);
  console.log('[Test] Worker 2 result:', result2);

  // 3. Verify exactly one worker sent and the other was safely rejected
  const sentCount = (result1.sent ? 1 : 0) + (result2.sent ? 1 : 0);
  assert.strictEqual(sentCount, 1, `Expected exactly 1 send, but got ${sentCount}!`);

  const rejectedCount = (!result1.sent ? 1 : 0) + (!result2.sent ? 1 : 0);
  assert.strictEqual(rejectedCount, 1, `Expected exactly 1 worker to be rejected!`);

  // 4. Verify DB state
  const dbCheck = await pool.query<EmailRecord>('SELECT * FROM emails WHERE id = $1', [emailId]);
  const row = dbCheck.rows[0];

  assert.strictEqual(row.status, 'SENT', `DB status should be SENT, got ${row.status}`);
  assert.ok(row.provider_message_id, 'provider_message_id must be populated');
  assert.ok(row.sent_at, 'sent_at must be populated');

  console.log(`[Test] DB state verified: status='SENT', provider_message_id='${row.provider_message_id}'`);
  console.log('✅ PASSED: Exactly one worker processed the email. Idempotency is 100% verified under race conditions.\n');
}

if (require.main === module) {
  runIdempotencyTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ FAILED:', err);
      process.exit(1);
    });
}
