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

interface Bucket {
  count: number;
  windowStart: number;
}

interface BlockEntry {
  expiresAt: number;
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  'api:global': { windowMs: 60_000, maxRequests: 100 },
  'api:auth': { windowMs: 60_000, maxRequests: 10, blockDurationMs: 300_000 },
  'api:workspace': { windowMs: 60_000, maxRequests: 60 },
  'api:board': { windowMs: 60_000, maxRequests: 120 },
  'api:task': { windowMs: 60_000, maxRequests: 200 },
};

const buckets = new Map<string, Bucket>();
const blocks = new Map<string, BlockEntry>();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of blocks) {
    if (entry.expiresAt <= now) blocks.delete(key);
  }
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > 300_000) buckets.delete(key);
  }
}

function getBlockKey(prefix: string, identifier: string): string {
  return `blocked:${prefix}:${identifier}`;
}

function getBucketKey(prefix: string, identifier: string, windowMs: number): string {
  const window = Math.floor(Date.now() / windowMs);
  return `${prefix}:${identifier}:${window}`;
}

class EdgeRateLimiter {
  private configs: Map<string, RateLimitConfig>;

  constructor() {
    this.configs = new Map(Object.entries(DEFAULT_CONFIGS));
  }

  async checkApi(key: string, userId: string): Promise<RateLimitResult> {
    const prefix = `api:${key}`;
    const config = this.configs.get(prefix) ?? this.configs.get('api:global')!;
    return this.check(prefix, userId, config);
  }

  private check(prefix: string, identifier: string, config: RateLimitConfig): RateLimitResult {
    cleanup();

    const blockKey = getBlockKey(prefix, identifier);
    const block = blocks.get(blockKey);
    if (block && block.expiresAt > Date.now()) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: block.expiresAt,
        totalLimit: config.maxRequests,
      };
    }

    const bucketKey = getBucketKey(prefix, identifier, config.windowMs);
    const now = Date.now();
    let bucket = buckets.get(bucketKey);

    if (!bucket || now - bucket.windowStart >= config.windowMs) {
      bucket = { count: 0, windowStart: now };
      buckets.set(bucketKey, bucket);
    }

    bucket.count++;

    if (bucket.count > config.maxRequests) {
      if (config.blockDurationMs) {
        blocks.set(blockKey, { expiresAt: now + config.blockDurationMs });
      }
      return {
        allowed: false,
        remaining: 0,
        resetAt: bucket.windowStart + config.windowMs,
        totalLimit: config.maxRequests,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.maxRequests - bucket.count),
      resetAt: bucket.windowStart + config.windowMs,
      totalLimit: config.maxRequests,
    };
  }
}

export const edgeRateLimiter = new EdgeRateLimiter();
