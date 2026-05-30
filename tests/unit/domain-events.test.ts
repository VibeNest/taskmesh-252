import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/redis', () => ({
  default: {},
  redis: {},
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  createChildLogger: vi.fn(() => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() })),
}));

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({
    name: 'test',
    add: vi.fn(),
    getWaitingCount: vi.fn().mockResolvedValue(0),
    getActiveCount: vi.fn().mockResolvedValue(0),
    getCompletedCount: vi.fn().mockResolvedValue(0),
    getFailedCount: vi.fn().mockResolvedValue(0),
    getDelayedCount: vi.fn().mockResolvedValue(0),
    close: vi.fn(),
  })),
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  })),
  Job: vi.fn(),
}));

import { createDomainEvent, DomainEventType } from '@/lib/events';

describe('Domain Events', () => {
  it('creates a task created event with correct structure', () => {
    const event = createDomainEvent(
      DomainEventType.TASK_CREATED,
      'task-123',
      'Task',
      { title: 'Test task', columnId: 'col-1' },
      { userId: 'user-1', workspaceId: 'ws-1' }
    );

    expect(event.type).toBe(DomainEventType.TASK_CREATED);
    expect(event.aggregateId).toBe('task-123');
    expect(event.aggregateType).toBe('Task');
    expect(event.payload.title).toBe('Test task');
    expect(event.metadata.userId).toBe('user-1');
    expect(event.metadata.workspaceId).toBe('ws-1');
    expect(event.metadata.correlationId).toBeDefined();
    expect(event.metadata.timestamp).toBeInstanceOf(Date);
    expect(event.metadata.source).toBe('taskmesh-api');
  });

  it('generates unique correlation IDs for each event', () => {
    const event1 = createDomainEvent(DomainEventType.TASK_CREATED, 'id-1', 'Task', {});
    const event2 = createDomainEvent(DomainEventType.TASK_CREATED, 'id-2', 'Task', {});
    expect(event1.metadata.correlationId).not.toBe(event2.metadata.correlationId);
  });

  it('uses default source when not provided', () => {
    const event = createDomainEvent(DomainEventType.TASK_CREATED, 'id-1', 'Task', {});
    expect(event.metadata.source).toBe('taskmesh-api');
  });

  it('overrides default metadata with provided values', () => {
    const event = createDomainEvent(
      DomainEventType.TASK_ASSIGNED,
      'task-1',
      'Task',
      { assigneeId: 'user-2' },
      { source: 'custom-source' }
    );
    expect(event.metadata.source).toBe('custom-source');
  });

  it('lists all domain event types', () => {
    const eventTypes = Object.values(DomainEventType);
    expect(eventTypes).toContain(DomainEventType.TASK_CREATED);
    expect(eventTypes).toContain(DomainEventType.TASK_ASSIGNED);
    expect(eventTypes).toContain(DomainEventType.MEMBER_JOINED);
    expect(eventTypes).toContain(DomainEventType.SPRINT_CREATED);
    expect(eventTypes).toContain(DomainEventType.EXPORT_REQUESTED);
    expect(eventTypes.length).toBeGreaterThanOrEqual(20);
  });
});
