import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { DomainEvent, DomainEventType } from './events';
import { logger, createChildLogger } from './logger';

const log = createChildLogger('event-bus');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export class EventBus {
  private queues: Map<DomainEventType, Queue> = new Map();
  private defaultQueue: Queue;
  private workers: Worker[] = [];
  private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();
  private static instance: EventBus;

  private constructor() {
    this.defaultQueue = new Queue('taskmesh:events', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: { age: 3600 * 24 },
        removeOnFail: { age: 3600 * 24 * 7 },
      },
    });
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  async publish(event: DomainEvent): Promise<void> {
    log.info({ eventType: event.type, aggregateId: event.aggregateId }, 'Publishing event');

    const queue = this.queues.get(event.type) || this.defaultQueue;
    await queue.add(event.type, event, {
      jobId: `${event.type}:${event.metadata.correlationId}`,
      deduplication: { id: `${event.type}:${event.metadata.correlationId}`, ttl: 5000 },
    });
  }

  subscribe(eventType: DomainEventType, handler: (event: DomainEvent) => Promise<void>): void {
    const key = eventType;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    this.handlers.get(key)!.push(handler);
    log.info({ eventType: key }, 'Handler registered');
  }

  subscribeToAll(handler: (event: DomainEvent) => Promise<void>): void {
    const key = '*';
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    this.handlers.get(key)!.push(handler);
  }

  async startWorker(concurrency = 5): Promise<void> {
    const worker = new Worker(
      'taskmesh:events',
      async (job: Job) => {
        const event = job.data as DomainEvent;
        const eventHandlers = this.handlers.get(event.type) || [];
        const wildcardHandlers = this.handlers.get('*') || [];
        const allHandlers = [...eventHandlers, ...wildcardHandlers];

        if (allHandlers.length === 0) {
          log.debug({ eventType: event.type }, 'No handlers for event');
          return;
        }

        log.info(
          { eventType: event.type, handlerCount: allHandlers.length, jobId: job.id },
          'Processing event'
        );

        await Promise.all(
          allHandlers.map(async (handler) => {
            try {
              await handler(event);
            } catch (err) {
              log.error(
                { err, eventType: event.type, jobId: job.id },
                'Handler failed for event'
              );
              throw err;
            }
          })
        );
      },
      {
        connection,
        concurrency,
        lockDuration: 30000,
        stalledInterval: 15000,
      }
    );

    worker.on('completed', (job) => {
      log.info({ jobId: job.id, eventType: job.name }, 'Job completed');
    });

    worker.on('failed', (job, err) => {
      log.error(
        { jobId: job?.id, eventType: job?.name, err, attempts: job?.attemptsMade },
        'Job failed'
      );
    });

    worker.on('error', (err) => {
      log.error({ err }, 'Worker error');
    });

    this.workers.push(worker);
    log.info({ concurrency }, 'Event bus worker started');
  }

  async createDedicatedQueue(
    name: string,
    eventTypes: DomainEventType[]
  ): Promise<Queue> {
    const queue = new Queue(name, {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: { age: 3600 * 24 },
        removeOnFail: { age: 3600 * 24 * 7 },
      },
    });

    for (const eventType of eventTypes) {
      this.queues.set(eventType, queue);
    }

    log.info({ queueName: name, eventTypes: eventTypes.join(',') }, 'Dedicated queue created');
    return queue;
  }

  async getQueueMetrics(): Promise<Record<string, unknown>> {
    const metrics: Record<string, unknown> = {};
    const queues = [this.defaultQueue, ...this.queues.values()];
    const uniqueQueues = [...new Set(queues)];

    for (const queue of uniqueQueues) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);
      metrics[queue.name] = { waiting, active, completed, failed, delayed };
    }

    return metrics;
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.close()));
    await Promise.all([...new Set([this.defaultQueue, ...this.queues.values()])].map((q) => q.close()));
    log.info('Event bus closed');
  }
}

export const eventBus = EventBus.getInstance();
