import { tryAcquireRateLimitSlot, getHourKey } from '../src/services/rateLimiter';
import { redisClient } from '../src/queue/connection';
import { config } from '../src/config';
import assert from 'assert';

export async function runRateLimitConcurrencyTest(): Promise<void> {
  console.log('\n======================================================');
  console.log('🧪 TEST 2: CONCURRENT REDIS-BACKED HOURLY RATE LIMITING');
  console.log('======================================================');

  const sender = `rate-limit-test-${Date.now()}@example.com`;
  const originalLimit = config.maxEmailsPerHourPerSender;
  
  // Set an intentional low test limit of 3 emails/hr
  const TEST_LIMIT = 3;
  config.maxEmailsPerHourPerSender = TEST_LIMIT;

  const key = getHourKey(sender);
  await redisClient.del(key);

  const CONCURRENT_WORKERS = 10;
  console.log(`[Test] Sender: ${sender}`);
  console.log(`[Test] Hourly Limit: ${TEST_LIMIT}`);
  console.log(`[Test] Launching ${CONCURRENT_WORKERS} simultaneous requests across concurrent workers...`);

  // Fire 10 simultaneous attempts
  const results = await Promise.all(
    Array.from({ length: CONCURRENT_WORKERS }).map(() => tryAcquireRateLimitSlot(sender))
  );

  const allowedCount = results.filter(r => r.allowed).length;
  const blockedCount = results.filter(r => !r.allowed).length;

  console.log(`[Test] Allowed requests: ${allowedCount} (expected: ${TEST_LIMIT})`);
  console.log(`[Test] Blocked requests: ${blockedCount} (expected: ${CONCURRENT_WORKERS - TEST_LIMIT})`);

  assert.strictEqual(allowedCount, TEST_LIMIT, `Allowed count should be exactly ${TEST_LIMIT}, got ${allowedCount}`);
  assert.strictEqual(
    blockedCount,
    CONCURRENT_WORKERS - TEST_LIMIT,
    `Blocked count should be exactly ${CONCURRENT_WORKERS - TEST_LIMIT}, got ${blockedCount}`
  );

  // Verify blocked requests return next available hour start
  for (const res of results.filter(r => !r.allowed)) {
    assert.ok(res.nextAvailableTime, 'Blocked requests must provide nextAvailableTime');
    assert.ok(res.nextAvailableTime > new Date(), 'nextAvailableTime must be in the future');
  }

  // Restore config
  config.maxEmailsPerHourPerSender = originalLimit;

  console.log('✅ PASSED: Rate limiting is completely safe and atomic under high concurrency.\n');
}

if (require.main === module) {
  runRateLimitConcurrencyTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ FAILED:', err);
      process.exit(1);
    });
}
