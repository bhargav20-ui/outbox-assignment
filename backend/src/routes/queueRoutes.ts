import { Router, Request, Response } from 'express';
import { emailQueue } from '../queue/queue';

export const queueRouter = Router();

// Get BullMQ queue counts and status
queueRouter.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const counts = await emailQueue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed', 'paused');
    res.json({
      queue: 'email-queue',
      counts,
      isPaused: await emailQueue.isPaused(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
