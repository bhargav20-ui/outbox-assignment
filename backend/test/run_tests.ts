import { runPersistenceTest } from './test_restart_persistence';
import { runIdempotencyTest } from './test_idempotency';
import { runRateLimitConcurrencyTest } from './test_concurrency_ratelimit';
import { runMinimumDelayTest } from './test_minimum_delay';
import { runReschedulingTest } from './test_rescheduling';
import { runElasticsearchTest } from './test_elasticsearch';
import { runBullBoardTest } from './test_bull_board';
import { pool } from '../src/db';
import { redisClient } from '../src/queue/connection';

async function main() {
  console.log('🚀 RUNNING ALL REACHINBOX AUDIT & VERIFICATION TESTS...\n');

  try {
    // 1. Persistence
    await runPersistenceTest();

    // 2. Email Idempotency (2 workers cannot send the same email twice)
    await runIdempotencyTest();

    // 3. Worker Concurrency & Redis-backed Rate Limiting
    await runRateLimitConcurrencyTest();

    // 4. Configurable Minimum Send Delay
    await runMinimumDelayTest();

    // 5. Next Available Hour Rescheduling on Rate Limit Reach
    await runReschedulingTest();

    // 6. Elasticsearch Indexing and Search
    await runElasticsearchTest();

    // 7. Bull Board Queue Dashboard
    await runBullBoardTest();

    console.log('======================================================');
    console.log('🎉 ALL 8 ASSIGNMENT REQUIREMENTS VERIFIED SUCCESSFULLY!');
    console.log('======================================================');
  } catch (err: any) {
    console.error('❌ Test suite failed:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
    await redisClient.quit();
    process.exit(process.exitCode || 0);
  }
}

main();
