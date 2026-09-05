import { app } from '../src/app';
import { Server } from 'http';
import assert from 'assert';

export async function runBullBoardTest(): Promise<void> {
  console.log('\n======================================================');
  console.log('🧪 TEST 7: BULL BOARD UI DASHBOARD');
  console.log('======================================================');

  const testPort = 5999;
  let server: Server | null = null;

  await new Promise<void>((resolve) => {
    server = app.listen(testPort, () => {
      resolve();
    });
  });

  try {
    const res = await fetch(`http://localhost:${testPort}/admin/queues`);
    console.log(`[Test] GET /admin/queues status: ${res.status}`);
    const text = await res.text();

    assert.strictEqual(res.status, 200, 'Bull Board should return HTTP 200');
    assert.ok(text.includes('BullMQ') || text.includes('bull-board') || text.includes('html'), 'Response should include Bull Board HTML');

    console.log('✅ PASSED: Bull Board UI endpoint /admin/queues is live and responding with HTTP 200.\n');
  } finally {
    if (server) {
      (server as Server).close();
    }
  }
}

if (require.main === module) {
  runBullBoardTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ FAILED:', err);
      process.exit(1);
    });
}
