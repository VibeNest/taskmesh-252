import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['node_modules', '.next'],
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['lib/**/*.ts', 'server/**/*.ts'],
      exclude: ['node_modules', 'tests'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/server': path.resolve(__dirname, 'server'),
      '@/prisma': path.resolve(__dirname, 'prisma'),
    },
  },
});
