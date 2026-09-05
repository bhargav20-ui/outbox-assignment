import { config } from '../config';

// Dynamic Slack configuration (in-memory + fallback to config env)
let activeSlackWebhookUrl = config.slackWebhookUrl || '';
let activeSlackToken: string | null = null;
let activeSlackChannel: string | null = null;
let connectedAt: string | null = activeSlackWebhookUrl ? new Date().toISOString() : null;

export function getSlackStatus() {
  const connected = Boolean(activeSlackWebhookUrl || (activeSlackToken && activeSlackChannel));
  return {
    connected,
    webhookConfigured: Boolean(activeSlackWebhookUrl),
    tokenConfigured: Boolean(activeSlackToken),
    channel: activeSlackChannel || (activeSlackWebhookUrl ? '#reachinbox-alerts' : null),
    connectedAt,
  };
}

export function setSlackConfig(params: { webhookUrl?: string; token?: string; channel?: string }) {
  if (params.webhookUrl !== undefined) {
    activeSlackWebhookUrl = params.webhookUrl.trim();
  }
  if (params.token !== undefined) {
    activeSlackToken = params.token.trim();
  }
  if (params.channel !== undefined) {
    activeSlackChannel = params.channel.trim();
  }
  connectedAt = new Date().toISOString();
}

export function disconnectSlack() {
  activeSlackWebhookUrl = '';
  activeSlackToken = null;
  activeSlackChannel = null;
  connectedAt = null;
}

export async function sendSlackAlert(text: string): Promise<boolean> {
  const status = getSlackStatus();
  if (!status.connected) {
    return false;
  }

  if (activeSlackWebhookUrl) {
    const res = await fetch(activeSlackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  }

  if (activeSlackToken && activeSlackChannel) {
    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${activeSlackToken}`,
      },
      body: JSON.stringify({
        channel: activeSlackChannel,
        text,
      }),
    });
    const data: any = await res.json();
    return Boolean(data.ok);
  }

  return false;
}

export async function notifySlackRateLimit(sender: string, limit: number, nextAvailableTime: Date): Promise<void> {
  const status = getSlackStatus();
  if (!status.connected) {
    console.log(`[Slack] No Slack integration connected. Skipping notification for rate limit on sender: ${sender}`);
    return;
  }

  try {
    const payloadText = `⚠️ *Rate Limit Reached* for sender \`${sender}\`!\nHourly limit of *${limit} emails* reached. Future jobs rescheduled to *${nextAvailableTime.toISOString()}*.`;
    const success = await sendSlackAlert(payloadText);

    if (success) {
      console.log(`[Slack] Successfully posted rate limit notification for sender: ${sender}`);
    } else {
      console.warn(`[Slack] Failed to post rate limit notification`);
    }
  } catch (err: any) {
    console.warn(`[Slack] Error posting notification: ${err.message}`);
  }
}
