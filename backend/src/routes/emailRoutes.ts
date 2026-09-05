import { Router, Request, Response } from 'express';
import { pool, EmailRecord } from '../db';
import { scheduleEmailJob } from '../queue/queue';
import { indexEmail, searchEmails } from '../services/search';
import { v4 as uuidv4 } from 'uuid';

export const emailRouter = Router();

// Schedule one or multiple emails
emailRouter.post('/schedule', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body;
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      res.status(400).json({ error: 'No emails provided for scheduling' });
      return;
    }

    const scheduledEmails: EmailRecord[] = [];

    for (const item of items) {
      const { sender, recipient, to, subject, body: content, scheduledFor } = item;
      const targetRecipient = recipient || to;

      if (!sender || !targetRecipient || !subject || !content) {
        res.status(400).json({ error: 'Missing required fields (sender, recipient/to, subject, body)' });
        return;
      }

      const emailId = uuidv4();
      const scheduledDate = scheduledFor ? new Date(scheduledFor) : new Date();

      // Insert into PostgreSQL
      const insertRes = await pool.query<EmailRecord>(
        `INSERT INTO emails (id, sender, recipient, subject, body, status, scheduled_for)
         VALUES ($1, $2, $3, $4, $5, 'SCHEDULED', $6)
         RETURNING *`,
        [emailId, sender, targetRecipient, subject, content, scheduledDate]
      );

      const emailRecord = insertRes.rows[0];

      // Index in Elasticsearch
      await indexEmail(emailRecord);

      // Add to BullMQ delayed queue
      await scheduleEmailJob(emailId, scheduledDate);

      scheduledEmails.push(emailRecord);
    }

    res.status(201).json({
      message: `Successfully scheduled ${scheduledEmails.length} email(s)`,
      emails: scheduledEmails,
    });
  } catch (err: any) {
    console.error('[API] Schedule error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List scheduled emails
emailRouter.get('/scheduled', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<EmailRecord>(
      `SELECT * FROM emails WHERE status IN ('SCHEDULED', 'PROCESSING') ORDER BY scheduled_for ASC`
    );
    res.json({ emails: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// List sent / failed emails
emailRouter.get('/sent', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query<EmailRecord>(
      `SELECT * FROM emails WHERE status IN ('SENT', 'FAILED') ORDER BY COALESCE(sent_at, updated_at) DESC`
    );
    res.json({ emails: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Search emails via Elasticsearch
emailRouter.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string | undefined;
    const sender = req.query.sender as string | undefined;
    const status = req.query.status as string | undefined;

    const results = await searchEmails(q, { sender, status });
    res.json({ count: results.length, emails: results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
