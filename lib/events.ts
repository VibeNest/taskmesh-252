export enum DomainEventType {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_MOVED = 'task.moved',
  TASK_ASSIGNED = 'task.assigned',
  COLUMN_CREATED = 'column.created',
  COLUMN_UPDATED = 'column.updated',
  COLUMN_DELETED = 'column.deleted',
  BOARD_CREATED = 'board.created',
  BOARD_UPDATED = 'board.updated',
  BOARD_DELETED = 'board.deleted',
  WORKSPACE_CREATED = 'workspace.created',
  WORKSPACE_UPDATED = 'workspace.updated',
  WORKSPACE_DELETED = 'workspace.deleted',
  MEMBER_JOINED = 'member.joined',
  MEMBER_REMOVED = 'member.removed',
  MEMBER_ROLE_CHANGED = 'member.role_changed',
  INVITATION_SENT = 'invitation.sent',
  INVITATION_ACCEPTED = 'invitation.accepted',
  COMMENT_CREATED = 'comment.created',
  COMMENT_DELETED = 'comment.deleted',
  NOTIFICATION_CREATED = 'notification.created',
  EXPORT_REQUESTED = 'export.requested',
  SPRINT_CREATED = 'sprint.created',
  SPRINT_STARTED = 'sprint.started',
  SPRINT_COMPLETED = 'sprint.completed',
}

export interface DomainEvent {
  type: DomainEventType;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  metadata: {
    correlationId: string;
    causationId?: string;
    userId?: string;
    workspaceId?: string;
    timestamp: Date;
    source: string;
  };
}

export function createDomainEvent(
  type: DomainEventType,
  aggregateId: string,
  aggregateType: string,
  payload: Record<string, unknown>,
  metadata?: Partial<DomainEvent['metadata']>
): DomainEvent {
  return {
    type,
    aggregateId,
    aggregateType,
    payload,
    metadata: {
      correlationId: crypto.randomUUID(),
      timestamp: new Date(),
      source: process.env.SERVICE_NAME || 'taskmesh-api',
      ...metadata,
    },
  };
}
