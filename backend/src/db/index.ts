import { Pool } from 'pg';
import { config } from '../config';

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

export async function initDb(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS emails (
        id VARCHAR(64) PRIMARY KEY,
        sender VARCHAR(255) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
        scheduled_for TIMESTAMPTZ NOT NULL,
        sent_at TIMESTAMPTZ,
        provider_message_id VARCHAR(255),
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
      CREATE INDEX IF NOT EXISTS idx_emails_sender ON emails(sender);
      CREATE INDEX IF NOT EXISTS idx_emails_scheduled_for ON emails(scheduled_for);
    `);
    console.log('[DB] PostgreSQL initialized with emails table & indexes');
  } finally {
    client.release();
  }
}

export interface EmailRecord {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  status: 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'RESCHEDULED';
  scheduled_for: Date;
  sent_at: Date | null;
  provider_message_id: string | null;
  last_error: string | null;
  created_at: Date;
  updated_at: Date;
}
