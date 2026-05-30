import { createChildLogger } from './logger';
import redis from './redis';

const log = createChildLogger('feature-flags');

interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rules?: FlagRule[];
}

interface FlagRule {
  type: 'percentage' | 'userIds' | 'workspaceIds' | 'plan' | 'custom';
  value: string | string[] | number;
}

const DEFAULT_FLAGS: Record<string, FeatureFlag> = {
  'ai-task-assistant': {
    key: 'ai-task-assistant',
    name: 'AI Task Assistant',
    description: 'Enable AI-powered task generation and suggestions',
    enabled: false,
    rules: [{ type: 'plan', value: 'pro' }],
  },
  'ai-sprint-planner': {
    key: 'ai-sprint-planner',
    name: 'AI Sprint Planner',
    description: 'Enable AI-powered sprint planning',
    enabled: false,
    rules: [{ type: 'plan', value: 'enterprise' }],
  },
  'advanced-analytics': {
    key: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Enable advanced analytics and reporting',
    enabled: false,
    rules: [{ type: 'plan', value: 'pro' }],
  },
  'beta-board-view': {
    key: 'beta-board-view',
    name: 'Beta Board View',
    description: 'New board layout with enhanced features',
    enabled: false,
    rules: [{ type: 'percentage', value: 10 }],
  },
  'export-csv': {
    key: 'export-csv',
    name: 'CSV Export',
    description: 'Enable CSV export for tasks and activity logs',
    enabled: true,
  },
  'global-search': {
    key: 'global-search',
    name: 'Global Search',
    description: 'Enable full-text search across all entities',
    enabled: true,
  },
  'immutable-audit-logs': {
    key: 'immutable-audit-logs',
    name: 'Immutable Audit Logs',
    description: 'Enable immutable audit logging for compliance',
    enabled: false,
    rules: [{ type: 'plan', value: 'enterprise' }],
  },
  'native-auth': {
    key: 'native-auth',
    name: 'Native Authentication',
    description: 'Enable email/password authentication',
    enabled: true,
  },
};

const FLAG_CACHE_PREFIX = 'feature_flag:';
const FLAG_CACHE_TTL = 60;

export class FeatureFlagService {
  private flags: Map<string, FeatureFlag>;
  private cache: Map<string, boolean>;

  constructor() {
    this.flags = new Map(Object.entries(DEFAULT_FLAGS));
    this.cache = new Map();
  }

  async initialize(): Promise<void> {
    try {
      const stored = await redis.hgetall('feature_flags');
      if (stored && Object.keys(stored).length > 0) {
        for (const [key, value] of Object.entries(stored)) {
          const parsed = JSON.parse(value) as FeatureFlag;
          this.flags.set(key, { ...parsed });
        }
        log.info({ count: this.flags.size }, 'Feature flags loaded from Redis');
      } else {
        await this.persistAll();
      }
    } catch (err) {
      log.error({ err }, 'Failed to load feature flags, using defaults');
    }
  }

  async isEnabled(key: string, context?: { userId?: string; workspaceId?: string; plan?: string }): Promise<boolean> {
    const cacheKey = `${key}:${JSON.stringify(context || {})}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) return cached;

    const flag = this.flags.get(key);
    if (!flag) return false;

    let enabled = flag.enabled;

    if (flag.rules && enabled) {
      for (const rule of flag.rules) {
        switch (rule.type) {
          case 'percentage':
            if (context?.userId) {
              const hash = this.hashCode(context.userId) % 100;
              enabled = hash < (rule.value as number);
            }
            break;
          case 'userIds':
            if (context?.userId && Array.isArray(rule.value)) {
              enabled = rule.value.includes(context.userId);
            } else {
              enabled = false;
            }
            break;
          case 'workspaceIds':
            if (context?.workspaceId && Array.isArray(rule.value)) {
              enabled = rule.value.includes(context.workspaceId);
            } else {
              enabled = false;
            }
            break;
          case 'plan':
            if (context?.plan) {
              enabled = context.plan === rule.value;
            } else {
              enabled = false;
            }
            break;
        }
      }
    }

    this.cache.set(cacheKey, enabled);
    setTimeout(() => this.cache.delete(cacheKey), FLAG_CACHE_TTL * 1000);

    return enabled;
  }

  async setFlag(key: string, flag: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const existing = this.flags.get(key) || {
      key,
      name: key,
      description: '',
      enabled: false,
    };

    const updated: FeatureFlag = { ...existing, ...flag };
    this.flags.set(key, updated);
    this.cache.clear();

    await redis.hset('feature_flags', key, JSON.stringify(updated));
    await redis.expire('feature_flags', FLAG_CACHE_TTL);

    return updated;
  }

  async getAllFlags(): Promise<FeatureFlag[]> {
    return Array.from(this.flags.values());
  }

  private async persistAll(): Promise<void> {
    const pipeline = redis.pipeline();
    for (const [key, flag] of this.flags) {
      pipeline.hset('feature_flags', key, JSON.stringify(flag));
    }
    pipeline.expire('feature_flags', FLAG_CACHE_TTL);
    await pipeline.exec();
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

export const featureFlags = new FeatureFlagService();
