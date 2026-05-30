import { Redis } from 'ioredis';
import { createChildLogger } from './logger';
import redis from './redis';

const log = createChildLogger('cache');

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  createdAt: number;
  hitCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  size: number;
}

export class MultiLayerCache {
  private l1: Map<string, CacheEntry<unknown>>;
  private l2: Redis;
  private defaultTTL: number;
  private maxL1Size: number;
  private stats: CacheStats;

  constructor(defaultTTL = 300, maxL1Size = 1000) {
    this.l1 = new Map();
    this.l2 = redis;
    this.defaultTTL = defaultTTL;
    this.maxL1Size = maxL1Size;
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0, size: 0 };
  }

  private buildKey(namespace: string, key: string): string {
    return `cache:${namespace}:${key}`;
  }

  async get<T>(namespace: string, key: string): Promise<T | null> {
    const cacheKey = this.buildKey(namespace, key);

    const l1Entry = this.l1.get(cacheKey) as CacheEntry<T> | undefined;
    if (l1Entry && this.isValid(l1Entry)) {
      l1Entry.hitCount++;
      l1Entry.expiresAt = l1Entry.expiresAt
        ? Date.now() + (l1Entry.expiresAt - l1Entry.createdAt)
        : null;
      this.stats.hits++;
      log.debug({ namespace, key, layer: 'L1' }, 'Cache hit');
      return l1Entry.value;
    }

    if (l1Entry && !this.isValid(l1Entry)) {
      this.l1.delete(cacheKey);
      this.stats.evictions++;
    }

    try {
      const l2Data = await this.l2.get(cacheKey);
      if (l2Data) {
        const parsed: CacheEntry<T> = JSON.parse(l2Data);
        if (this.isValid(parsed)) {
          this.l1.set(cacheKey, parsed);
          this.stats.hits++;
          log.debug({ namespace, key, layer: 'L2' }, 'Cache hit');
          return parsed.value;
        }
        await this.l2.del(cacheKey);
      }
    } catch (err) {
      log.error({ err, namespace, key }, 'L2 cache get error');
    }

    this.stats.misses++;
    return null;
  }

  async set<T>(
    namespace: string,
    key: string,
    value: T,
    ttl?: number
  ): Promise<void> {
    const cacheKey = this.buildKey(namespace, key);
    const expiresIn = ttl ?? this.defaultTTL;
    const entry: CacheEntry<T> = {
      value,
      expiresAt: expiresIn > 0 ? Date.now() + expiresIn * 1000 : null,
      createdAt: Date.now(),
      hitCount: 0,
    };

    if (this.l1.size >= this.maxL1Size) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [k, v] of this.l1.entries()) {
        if (v.createdAt < oldestTime) {
          oldestTime = v.createdAt;
          oldestKey = k;
        }
      }
      if (oldestKey) {
        this.l1.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    this.l1.set(cacheKey, entry);
    this.stats.sets++;

    try {
      const serialized = JSON.stringify(entry);
      if (expiresIn > 0) {
        await this.l2.setex(cacheKey, expiresIn, serialized);
      } else {
        await this.l2.set(cacheKey, serialized);
      }
    } catch (err) {
      log.error({ err, namespace, key }, 'L2 cache set error');
    }
  }

  async invalidate(namespace: string, key: string): Promise<void> {
    const cacheKey = this.buildKey(namespace, key);
    this.l1.delete(cacheKey);
    try {
      await this.l2.del(cacheKey);
    } catch (err) {
      log.error({ err, namespace, key }, 'L2 cache invalidation error');
    }
  }

  async invalidatePattern(namespace: string, pattern: string): Promise<void> {
    const prefix = `cache:${namespace}:`;
    for (const key of this.l1.keys()) {
      if (key.startsWith(prefix) && key.includes(pattern)) {
        this.l1.delete(key);
      }
    }
    try {
      const stream = this.l2.scanStream({
        match: `cache:${namespace}:*${pattern}*`,
        count: 100,
      });
      for await (const keys of stream) {
        if (keys.length > 0) {
          await this.l2.del(...keys);
        }
      }
    } catch (err) {
      log.error({ err, namespace, pattern }, 'L2 pattern invalidation error');
    }
  }

  async invalidateNamespace(namespace: string): Promise<void> {
    const prefix = `cache:${namespace}:`;
    for (const key of this.l1.keys()) {
      if (key.startsWith(prefix)) {
        this.l1.delete(key);
      }
    }
    try {
      const stream = this.l2.scanStream({
        match: `cache:${namespace}:*`,
        count: 100,
      });
      for await (const keys of stream) {
        if (keys.length > 0) {
          await this.l2.del(...keys);
        }
      }
    } catch (err) {
      log.error({ err, namespace }, 'L2 namespace invalidation error');
    }
  }

  async getOrSet<T>(
    namespace: string,
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(namespace, key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(namespace, key, value, ttl);
    return value;
  }

  getStats(): CacheStats & { l1Size: number } {
    return {
      ...this.stats,
      size: this.stats.size,
      l1Size: this.l1.size,
    };
  }

  async clear(): Promise<void> {
    this.l1.clear();
    try {
      const stream = this.l2.scanStream({ match: 'cache:*', count: 100 });
      for await (const keys of stream) {
        if (keys.length > 0) {
          await this.l2.del(...keys);
        }
      }
    } catch (err) {
      log.error({ err }, 'Cache clear error');
    }
    this.stats = { hits: 0, misses: 0, sets: 0, evictions: 0, size: 0 };
  }

  private isValid<T>(entry: CacheEntry<T>): boolean {
    if (entry.expiresAt === null) return true;
    return Date.now() < entry.expiresAt;
  }
}

export const cache = new MultiLayerCache();
