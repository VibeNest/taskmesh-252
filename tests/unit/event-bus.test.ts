import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEventHandlers: Map<string, Array<Function>> = new Map();

vi.mock('@/lib/redis', () => ({
  default: {},
  redis: {},
}));

vi.mock('@/lib/prisma', () => ({
  default: {},
  prisma: {},
}));

import { EventBus } from '@/lib/event-bus';
import { DomainEventType, createDomainEvent } from '@/lib/events';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEventHandlers.clear();
    eventBus = EventBus.getInstance();
  });

  it('registers and invokes handlers for specific event types', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    eventBus.subscribe(DomainEventType.TASK_CREATED, handler);

    const event = createDomainEvent(
      DomainEventType.TASK_CREATED,
      'task-1',
      'Task',
      { title: 'Test' },
      { userId: 'user-1' }
    );

    await eventBus.publish(event);

    await new Promise((r) => setTimeout(r, 500));

    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0].type).toBe(DomainEventType.TASK_CREATED);
  });

  it('does not invoke handlers for unsubscribed event types', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    eventBus.subscribe(DomainEventType.TASK_CREATED, handler);

    const event = createDomainEvent(
      DomainEventType.TASK_ASSIGNED,
      'task-1',
      'Task',
      {}
    );

    await eventBus.publish(event);
    await new Promise((r) => setTimeout(r, 500));

    expect(handler).not.toHaveBeenCalled();
  });

  it('handles multiple subscriptions for the same event type', async () => {
    const handler1 = vi.fn().mockResolvedValue(undefined);
    const handler2 = vi.fn().mockResolvedValue(undefined);

    eventBus.subscribe(DomainEventType.TASK_CREATED, handler1);
    eventBus.subscribe(DomainEventType.TASK_CREATED, handler2);

    const event = createDomainEvent(DomainEventType.TASK_CREATED, 'task-1', 'Task', {});
    await eventBus.publish(event);
    await new Promise((r) => setTimeout(r, 500));

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('handles wildcard subscriptions for all events', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    eventBus.subscribeToAll(handler);

    const event = createDomainEvent(DomainEventType.TASK_CREATED, 'task-1', 'Task', {});
    await eventBus.publish(event);
    await new Promise((r) => setTimeout(r, 500));

    expect(handler).toHaveBeenCalled();
  });

  it('creates events with proper structure', () => {
    const event = createDomainEvent(
      DomainEventType.TASK_ASSIGNED,
      'task-1',
      'Task',
      { assigneeId: 'user-2' },
      { userId: 'user-1', workspaceId: 'ws-1' }
    );

    expect(event.type).toBe('task.assigned');
    expect(event.aggregateId).toBe('task-1');
    expect(event.payload.assigneeId).toBe('user-2');
  });
});
