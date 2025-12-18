import Redis, { RedisOptions } from 'ioredis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  private redis: Redis | null = null;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST;

    if (!redisUrl && !redisHost) {
      console.warn('[ioredis] REDIS not configured — client disabled');
      return;
    }

    // Create client inside constructor (attach handlers before connect attempts)
    if (redisUrl) {
      const client = new Redis(redisUrl);
      this.redis = client;
    } else {
      const opts: RedisOptions = {
        host: redisHost ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT ?? 6379),
        // reasonable retry strategy & disable offline queue to avoid repeated unhandled errors
        enableOfflineQueue: false,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
      };
      const client = new Redis(opts);
      this.redis = client;
    }

    if (this.redis) {
      this.redis.on('error', (err: unknown) => {
        const maybeMsg =
          err && typeof err === 'object' && 'message' in err
            ? (err as Record<string, unknown>)['message']
            : undefined;
        const msg = typeof maybeMsg === 'string' ? maybeMsg : String(err);
        console.warn('[ioredis] connection error:', msg);
      });

      this.redis.on('connect', () => {
        console.log('[ioredis] connected');
      });

      this.redis.on('close', () => {
        console.log('[ioredis] connection closed');
      });
    }
  }

  async set(key: string, value: string, ttl: number) {
    if (!this.redis) return Promise.resolve(null);
    try {
      return await this.redis.set(key, value, 'EX', ttl);
    } catch (err: unknown) {
      const maybeMsg =
        err && typeof err === 'object' && 'message' in err
          ? (err as Record<string, unknown>)['message']
          : undefined;
      const msg = typeof maybeMsg === 'string' ? maybeMsg : String(err);
      console.warn('[ioredis] set failed:', msg);
      return null;
    }
  }

  async get(key: string) {
    if (!this.redis) return Promise.resolve(null);
    try {
      return await this.redis.get(key);
    } catch (err: unknown) {
      const maybeMsg =
        err && typeof err === 'object' && 'message' in err
          ? (err as Record<string, unknown>)['message']
          : undefined;
      const msg = typeof maybeMsg === 'string' ? maybeMsg : String(err);
      console.warn('[ioredis] get failed:', msg);
      return null;
    }
  }

  async del(key: string) {
    if (!this.redis) return Promise.resolve(null);
    try {
      return await this.redis.del(key);
    } catch (err: unknown) {
      const maybeMsg =
        err && typeof err === 'object' && 'message' in err
          ? (err as Record<string, unknown>)['message']
          : undefined;
      const msg = typeof maybeMsg === 'string' ? maybeMsg : String(err);
      console.warn('[ioredis] del failed:', msg);
      return null;
    }
  }
}
