import '@testing-library/jest-dom';
import { vi } from 'vitest';

process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
(process.env as any).NODE_ENV = 'test';

vi.mock('@/lib/prisma', () => ({
  default: {},
  prisma: {},
}));

vi.mock('@/lib/redis', () => ({
  default: {},
  redis: {},
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
  createChildLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));
