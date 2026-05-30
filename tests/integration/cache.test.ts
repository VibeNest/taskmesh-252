import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRedis = vi.hoisted(() => {
  const l2Store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string) => l2Store.get(key) || null),
    set: vi.fn(async (key: string, value: string) => { l2Store.set(key, value); }),
    setex: vi.fn(async (key: string, _ttl: number, value: string) => { l2Store.set(key, value); }),
    del: vi.fn(async (...keys: string[]) => keys.forEach(k => l2Store.delete(k))),
    scanStream: vi.fn(() => {
      const { Readable } = require('stream');
      const keys = Array.from(l2Store.keys()).filter(k => k.startsWith('cache:test:'));
      const s = new Readable({
        objectMode: true,
        read() { this.push(keys.length ? keys : null); },
      });
      return s;
    }),
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

import { MultiLayerCache } from '@/lib/cache';

describe('MultiLayerCache', () => {
  let cache: MultiLayerCache;

  beforeEach(() => {
    vi.clearAllMocks();
    cache = new MultiLayerCache(60, 100);
  });

  it('stores and retrieves values from L1 cache', async () => {
    await cache.set('test', 'key1', { data: 'hello' });
    const result = await cache.get('test', 'key1');
    expect(result).toEqual({ data: 'hello' });
  });

  it('returns null for missing keys', async () => {
    const result = await cache.get('test', 'nonexistent');
    expect(result).toBeNull();
  });

  it('evicts L1 when size limit is reached', async () => {
    const smallCache = new MultiLayerCache(60, 2);
    await smallCache.set('test', 'a', 1);
    await smallCache.set('test', 'b', 2);
    await smallCache.set('test', 'c', 3);
    const result = await smallCache.get('test', 'a');
    expect(result).toBeNull();
  });

  it('getOrSet fetches and caches on miss', async () => {
    const fetchFn = vi.fn().mockResolvedValue('computed-value');
    const result = await cache.getOrSet('test', 'compute-key', fetchFn);
    expect(result).toBe('computed-value');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('getOrSet returns cached value on hit', async () => {
    await cache.set('test', 'cached', 'stored-value');
    const fetchFn = vi.fn().mockResolvedValue('new-value');
    const result = await cache.getOrSet('test', 'cached', fetchFn);
    expect(result).toBe('stored-value');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('invalidates a specific key', async () => {
    await cache.set('test', 'temp', 'value');
    await cache.invalidate('test', 'temp');
    const result = await cache.get('test', 'temp');
    expect(result).toBeNull();
  });

  it('clears all cached data', async () => {
    await cache.set('test', 'a', 1);
    await cache.set('test', 'b', 2);
    await cache.clear();
    expect(await cache.get('test', 'a')).toBeNull();
    expect(await cache.get('test', 'b')).toBeNull();
  });

  it('returns stats', async () => {
    await cache.get('test', 'miss');
    await cache.set('test', 'hit', 'x');
    await cache.get('test', 'hit');
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.sets).toBe(1);
  });
});
