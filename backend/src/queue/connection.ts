import Redis, { RedisOptions } from 'ioredis';
import { config } from '../config';

export const redisOptions: RedisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
};

export const redisClient = new Redis(redisOptions);
