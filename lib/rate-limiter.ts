import { Redis } from 'ioredis';
import { createChildLogger } from './logger';
import redis from './redis';

const log = createChildLogger('rate-limiter');

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  totalLimit: number;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  'api:global': { windowMs: 60_000, maxRequests: 100 },
  'api:auth': { windowMs: 60_000, maxRequests: 10, blockDurationMs: 300_000 },
  'api:workspace': { windowMs: 60_000, maxRequests: 60 },
  'api:board': { windowMs: 60_000, maxRequests: 120 },
  'api:task': { windowMs: 60_000, maxRequests: 200 },
  'socket:connect': { windowMs: 60_000, maxRequests: 20 },
  'auth:login': { windowMs: 300_000, maxRequests: 5, blockDurationMs: 900_000 },
  'auth:register': { windowMs: 3600_000, maxRequests: 3, blockDurationMs: 3600_000 },
};

export class RateLimiter {
  private redis: Redis;
  private configs: Map<string, RateLimitConfig>;

  constructor() {
    this.redis = redis;
    this.configs = new Map(Object.entries(DEFAULT_CONFIGS));
  }

  addConfig(name: string, config: RateLimitConfig): void {
    this.configs.set(name, config);
  }

  private buildKey(prefix: string, identifier: string): string {
    return `ratelimit:${prefix}:${identifier}`;
  }

  private buildBlockKey(prefix: string, identifier: string): string {
    return `ratelimit:blocked:${prefix}:${identifier}`;
  }

  async check(prefix: string, identifier: string): Promise<RateLimitResult> {
    const config = this.configs.get(prefix);
    if (!config) {
      return { allowed: true, remaining: Infinity, resetAt: 0, totalLimit: Infinity };
    }

    const blockKey = this.buildBlockKey(prefix, identifier);
    const blocked = await this.redis.get(blockKey);
    if (blocked) {
      const ttl = await this.redis.ttl(blockKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + ttl * 1000,
        totalLimit: config.maxRequests,
      };
    }

    const key = this.buildKey(prefix, identifier);
    const now = Date.now();
    const windowKey = Math.floor(now / config.windowMs);

    const slidingKey = `${key}:${windowKey}`;

    const current = await this.redis.get(slidingKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= config.maxRequests) {
      if (config.blockDurationMs) {
        await this.redis.setex(blockKey, Math.ceil(config.blockDurationMs / 1000), '1');
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt: now + config.windowMs,
        totalLimit: config.maxRequests,
      };
    }

    const multi = this.redis.multi();
    multi.incr(slidingKey);
    multi.expire(slidingKey, Math.ceil(config.windowMs / 1000));
    const results = await multi.exec();

    const newCount = results?.[0]?.[1] as number ?? count + 1;

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - newCount),
      resetAt: now + config.windowMs,
      totalLimit: config.maxRequests,
    };
  }

  async checkLogin(email: string): Promise<RateLimitResult> {
    return this.check('auth:login', email.toLowerCase());
  }

  async checkRegister(ip: string): Promise<RateLimitResult> {
    return this.check('auth:register', ip);
  }

  async checkApi(key: string, userId: string): Promise<RateLimitResult> {
    const prefix = `api:${key}`;
    if (this.configs.has(prefix)) {
      return this.check(prefix, userId);
    }
    return this.check('api:global', userId);
  }

  async reset(prefix: string, identifier: string): Promise<void> {
    const key = this.buildKey(prefix, identifier);
    const blockKey = this.buildBlockKey(prefix, identifier);
    await Promise.all([
      this.redis.del(key),
      this.redis.del(blockKey),
    ]);
  }

  async getConfigs(): Promise<Record<string, RateLimitConfig>> {
    const configs: Record<string, RateLimitConfig> = {};
    for (const [key, config] of this.configs) {
      configs[key] = { ...config };
    }
    return configs;
  }
}

export const rateLimiter = new RateLimiter();
