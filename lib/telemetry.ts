import { createChildLogger } from './logger';

const log = createChildLogger('telemetry');

let registry: any = null;

const metrics: Record<string, any> = {};

export function initTelemetry(): any {
  if (registry) return registry;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Registry, Counter, Histogram, Gauge } = require('prom-client');
    registry = new Registry();

    metrics.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [registry],
    });

    metrics.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [registry],
    });

    metrics.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'path', 'status'],
      registers: [registry],
    });

    metrics.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Database query duration in seconds',
      labelNames: ['operation', 'model'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [registry],
    });

    metrics.dbQueryTotal = new Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'model'],
      registers: [registry],
    });

    metrics.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['layer', 'namespace'],
      registers: [registry],
    });

    metrics.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['namespace'],
      registers: [registry],
    });

    metrics.activeSocketConnections = new Gauge({
      name: 'active_socket_connections',
      help: 'Number of active Socket.IO connections',
      registers: [registry],
    });

    metrics.eventBusJobsProcessed = new Counter({
      name: 'event_bus_jobs_processed_total',
      help: 'Total number of event bus jobs processed',
      labelNames: ['eventType', 'status'],
      registers: [registry],
    });

    metrics.eventBusJobsFailed = new Counter({
      name: 'event_bus_jobs_failed_total',
      help: 'Total number of event bus jobs failed',
      labelNames: ['eventType'],
      registers: [registry],
    });

    metrics.workerQueueSize = new Gauge({
      name: 'worker_queue_size',
      help: 'Current size of worker queues',
      labelNames: ['queue'],
      registers: [registry],
    });

    metrics.activeUsers = new Gauge({
      name: 'active_users',
      help: 'Number of currently active users',
      registers: [registry],
    });

    log.info('Prometheus metrics initialized');
  } catch (err) {
    log.warn({ err }, 'prom-client not available, metrics disabled');
  }

  return registry;
}

export function getRegistry(): any {
  return registry;
}

export function recordHttpRequest(method: string, path: string, status: number, duration: number) {
  metrics.httpRequestDuration?.observe({ method, path, status: String(status) }, duration);
  metrics.httpRequestTotal?.inc({ method, path, status: String(status) });
  if (status >= 400) {
    metrics.httpRequestErrors?.inc({ method, path, status: String(status) });
  }
}

export function recordDbQuery(operation: string, model: string, duration: number) {
  metrics.dbQueryDuration?.observe({ operation, model }, duration);
  metrics.dbQueryTotal?.inc({ operation, model });
}

export function recordCacheHit(layer: string, namespace: string) {
  metrics.cacheHits?.inc({ layer, namespace });
}

export function recordCacheMiss(namespace: string) {
  metrics.cacheMisses?.inc({ namespace });
}

export function recordSocketConnection(delta: 1 | -1) {
  if (metrics.activeSocketConnections) {
    if (delta === 1) metrics.activeSocketConnections.inc();
    else metrics.activeSocketConnections.dec();
  }
}

export function recordEventProcessed(eventType: string, status: 'success' | 'failed') {
  metrics.eventBusJobsProcessed?.inc({ eventType, status });
}

export function setActiveUsers(count: number) {
  metrics.activeUsers?.set(count);
}

export function setWorkerQueueSize(queue: string, size: number) {
  metrics.workerQueueSize?.set({ queue }, size);
}

export async function getMetricsContentType(): Promise<string> {
  if (!registry) return 'text/plain';
  return registry.contentType;
}

export async function getMetricsOutput(): Promise<string> {
  if (!registry) return '# Metrics disabled';
  return registry.metrics();
}
