import { enforceMinimumDelay } from '../src/services/rateLimiter';
import { redisClient } from '../src/queue/connection';
import { config } from '../src/config';
import assert from 'assert';

export async function runMinimumDelayTest(): Promise<void> {
  console.log('\n======================================================');
  console.log('🧪 TEST 4: MINIMUM SEND DELAY THROTTLING');
  console.log('======================================================');

  const sender = `throttle-test-${Date.now()}@example.com`;
  const originalDelay = config.minEmailDelayMs;
  const TEST_DELAY_MS = 1000;
  config.minEmailDelayMs = TEST_DELAY_MS;

  // Clear throttle key
  await redisClient.del(`throttle:${sender}`);

  // First send - should not wait
  console.log('[Test] Performing first send...');
  const wait1 = await enforceMinimumDelay(sender);
  console.log(`[Test] First call wait: ${wait1}ms`);
  assert.strictEqual(wait1, 0, 'First call should have 0ms wait');

  // Second immediate send - should be throttled by ~TEST_DELAY_MS
  console.log('[Test] Performing second immediate send...');
  const start = Date.now();
  const wait2 = await enforceMinimumDelay(sender);
  const elapsed = Date.now() - start;
  console.log(`[Test] Second call wait: ${wait2}ms, actual elapsed: ${elapsed}ms`);

  assert.ok(elapsed >= 900, `Expected elapsed >= 900ms, got ${elapsed}ms`);

  // Restore config
  config.minEmailDelayMs = originalDelay;

  console.log('✅ PASSED: Configurable minimum delay properly throttles consecutive sends.\n');
}

if (require.main === module) {
  runMinimumDelayTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ FAILED:', err);
      process.exit(1);
    });
}
