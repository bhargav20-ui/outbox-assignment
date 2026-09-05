import { Router, Request, Response } from 'express';
import { getSlackStatus, setSlackConfig, disconnectSlack, sendSlackAlert } from '../services/slack';

export const slackRouter = Router();

// Get Slack integration status
slackRouter.get('/status', (_req: Request, res: Response): void => {
  res.json(getSlackStatus());
});

// Connect Slack via Webhook URL or OAuth Token
slackRouter.post('/connect', (req: Request, res: Response): void => {
  try {
    const { webhookUrl, token, channel } = req.body;

    if (!webhookUrl && (!token || !channel)) {
      res.status(400).json({
        error: 'Please provide either a Slack Webhook URL, or both an OAuth Bot Token and Channel name/ID.',
      });
      return;
    }

    setSlackConfig({ webhookUrl, token, channel });
    res.json({
      message: 'Slack successfully connected!',
      status: getSlackStatus(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Disconnect Slack
slackRouter.post('/disconnect', (_req: Request, res: Response): void => {
  disconnectSlack();
  res.json({
    message: 'Slack disconnected successfully',
    status: getSlackStatus(),
  });
});

// Send a verifiable live test notification
slackRouter.post('/test', async (_req: Request, res: Response): Promise<void> => {
  try {
    const status = getSlackStatus();
    if (!status.connected) {
      res.status(400).json({ error: 'Slack is not connected. Connect a webhook or token first.' });
      return;
    }

    const testMessage = `🚀 *ReachInbox Test Alert*\nSlack integration is active and verified! When hourly rate limits are hit, notifications will appear here in real-time. (${new Date().toLocaleString()})`;
    const success = await sendSlackAlert(testMessage);

    if (success) {
      res.json({ success: true, message: 'Test notification sent to Slack successfully!' });
    } else {
      res.status(502).json({
        success: false,
        error: 'Failed to deliver notification to Slack. Please verify your Webhook URL or Token.',
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
