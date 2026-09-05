import { app } from './app';
import { config } from './config';
import { initDb, pool } from './db';
import { initElasticsearch } from './services/search';
import { recoverScheduledJobs } from './queue/queue';
import { startWorker, stopWorker } from './queue/worker';
import { redisClient } from './queue/connection';

async function bootstrap() {
  console.log('--- Starting ReachInbox Email Scheduler Service ---');

  // 1. Initialize PostgreSQL database
  await initDb();

  // 2. Initialize Elasticsearch index
  await initElasticsearch();

  // 3. Recover scheduled jobs from DB to BullMQ (Survives server restart)
  await recoverScheduledJobs();

  // 4. Start BullMQ worker with configured concurrency
  startWorker();

  // 5. Start Express server
  const server = app.listen(config.port, () => {
    console.log(`[Server] ReachInbox Email Scheduler running on port ${config.port}`);
    console.log(`[Server] Bull Board UI: http://localhost:${config.port}/admin/queues`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[Server] Shutting down gracefully...');
    server.close();
    await stopWorker();
    await pool.end();
    await redisClient.quit();
    console.log('[Server] Shutdown complete.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch(err => {
  console.error('[Server] Fatal bootstrap error:', err);
  process.exit(1);
});
