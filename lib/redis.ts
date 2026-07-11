import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 5000,
    retryStrategy(times: number) {
      if (times > 3) {
        console.warn('Redis: max retries reached, giving up');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('error', (err) => {
    if (process.env.NODE_ENV === 'production') {
      console.error('Redis Client Error:', err);
    }
  });

  redis.on('connect', () => {
    console.log('Redis Client Connected');
  });

  return redis;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export default redis;
