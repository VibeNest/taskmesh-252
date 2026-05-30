import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedis = vi.hoisted(() => {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => store.get(key) || null),
    set: vi.fn(async (key: string, value: string) => { store.set(key, value); }),
    setex: vi.fn(async (key: string, _ttl: number, value: string) => { store.set(key, value); }),
    del: vi.fn(async (...keys: string[]) => keys.forEach(k => store.delete(k))),
    multi: vi.fn(() => ({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, 1]]),
    })),
    ping: vi.fn().mockResolvedValue('PONG'),
    scanStream: vi.fn(() => {
      const { Readable } = require('stream');
      return new Readable({ objectMode: true, read() { this.push(null); } });
    }),
    hset: vi.fn(),
    hget: vi.fn(),
    hdel: vi.fn(),
    expire: vi.fn(),
  };
});

vi.mock('@/lib/redis', () => ({
  default: mockRedis,
  redis: mockRedis,
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  createChildLogger: vi.fn(() => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() })),
}));

import { RateLimiter } from '@/lib/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    vi.clearAllMocks();
    rateLimiter = new RateLimiter();
  });

  it('allows requests within the limit', async () => {
    mockRedis.get.mockResolvedValue(null);
    const result = await rateLimiter.check('api:global', 'user-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(99);
  });

  it('blocks requests exceeding the limit', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.multi.mockImplementation(() => ({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, 101]]),
    }));
    const result = await rateLimiter.check('api:auth', 'user-1');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('blocks login after 5 attempts', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.multi.mockImplementation(() => ({
      incr: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, 6]]),
    }));
    const result = await rateLimiter.checkLogin('test@example.com');
    expect(result.allowed).toBe(false);
  });

  it('resets rate limit for a given key', async () => {
    await rateLimiter.reset('auth:login', 'test@example.com');
    expect(mockRedis.del).toHaveBeenCalledTimes(2);
  });

  it('returns unlimited result for unknown prefix', async () => {
    const result = await rateLimiter.check('unknown:prefix', 'user-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });

  it('returns configured limits', async () => {
    const configs = await rateLimiter.getConfigs();
    expect(configs['api:global']).toBeDefined();
    expect(configs['api:global'].maxRequests).toBe(100);
    expect(configs['auth:login'].maxRequests).toBe(5);
  });
});
