import { initElasticsearch, indexEmail, searchEmails } from '../src/services/search';
import { v4 as uuidv4 } from 'uuid';
import assert from 'assert';

export async function runElasticsearchTest(): Promise<void> {
  console.log('\n======================================================');
  console.log('🧪 TEST 6: ELASTICSEARCH INDEXING AND SEARCH');
  console.log('======================================================');

  await initElasticsearch();

  const uniqueKeyword = `esdemo_${Date.now()}`;
  const testDoc = {
    id: uuidv4(),
    sender: 'es-tester@reachinbox.ai',
    recipient: 'searchable-lead@example.com',
    subject: `Important update regarding ${uniqueKeyword}`,
    body: `Here is the secret phrase ${uniqueKeyword} to find this email.`,
    status: 'SCHEDULED',
    scheduled_for: new Date(),
  };

  console.log(`[Test] Indexing document with unique keyword '${uniqueKeyword}'...`);
  await indexEmail(testDoc);

  // Search by query
  console.log(`[Test] Querying Elasticsearch for '${uniqueKeyword}'...`);
  const results = await searchEmails(uniqueKeyword);

  console.log(`[Test] Hits returned: ${results.length}`);
  assert.ok(results.length >= 1, 'Expected at least 1 search hit in Elasticsearch');
  assert.strictEqual(results[0].id, testDoc.id, 'Hit ID should match test document');
  assert.ok(results[0].body.includes(uniqueKeyword), 'Hit body should contain keyword');

  console.log('✅ PASSED: Elasticsearch indexing and search functioning perfectly.\n');
}

if (require.main === module) {
  runElasticsearchTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ FAILED:', err);
      process.exit(1);
    });
}
