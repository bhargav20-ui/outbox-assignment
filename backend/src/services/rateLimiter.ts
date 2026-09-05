import { redisClient } from '../queue/connection';
import { config } from '../config';

// Redis Lua script to atomically check and increment the hourly counter
const RATE_LIMIT_LUA = `
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local current = tonumber(redis.call('get', key) or '0')
if current >= limit then
  return 0
end
local newval = redis.call('incr', key)
if newval == 1 then
  redis.call('expire', key, 7200)
end
return 1
`;

export function getHourKey(sender: string, date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hour = pad(date.getUTCHours());
  return `ratelimit:${sender}:${year}${month}${day}${hour}`;
}

export function getNextHourStart(date: Date = new Date()): Date {
  const next = new Date(date);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  limit: number;
  currentCount?: number;
  nextAvailableTime?: Date;
}

/**
 * Atomically checks and reserves an email send slot for the sender in the current hour window.
 * Returns allowed: true if under limit, false if limit reached.
 */
export async function tryAcquireRateLimitSlot(sender: string): Promise<RateLimitCheckResult> {
  const limit = config.maxEmailsPerHourPerSender;
  const key = getHourKey(sender);

  // Execute atomic Lua script
  const result = (await redisClient.eval(RATE_LIMIT_LUA, 1, key, limit.toString())) as number;

  if (result === 1) {
    return { allowed: true, limit };
  } else {
    const nextAvailableTime = getNextHourStart();
    return {
      allowed: false,
      limit,
      nextAvailableTime,
    };
  }
}

/**
 * Enforces configurable minimum send delay between consecutive sends for a sender.
 */
export async function enforceMinimumDelay(sender: string): Promise<number> {
  const minDelay = config.minEmailDelayMs;
  if (minDelay <= 0) return 0;

  const key = `throttle:${sender}`;
  const now = Date.now();
  const lastSent = await redisClient.get(key);

  let waitTime = 0;
  if (lastSent) {
    const elapsed = now - parseInt(lastSent, 10);
    if (elapsed < minDelay) {
      waitTime = minDelay - elapsed;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // Update last sent timestamp with 1-hour expiration
  await redisClient.set(key, (Date.now()).toString(), 'EX', 3600);
  return waitTime;
}
