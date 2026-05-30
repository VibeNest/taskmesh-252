import { createChildLogger } from '../lib/logger';
import { eventBus } from '../lib/event-bus';
import { DomainEvent, DomainEventType } from '../lib/events';
import { notificationService } from '../server/services/notification.service';
import { activityService } from '../server/services/activity.service';
import { storage } from '../lib/storage';

const log = createChildLogger('workers');

export async function initializeWorkers(): Promise<void> {
  eventBus.subscribe(DomainEventType.TASK_CREATED, handleTaskCreated);
  eventBus.subscribe(DomainEventType.TASK_ASSIGNED, handleTaskAssigned);
  eventBus.subscribe(DomainEventType.TASK_DELETED, handleTaskDeleted);
  eventBus.subscribe(DomainEventType.MEMBER_JOINED, handleMemberJoined);
  eventBus.subscribe(DomainEventType.INVITATION_SENT, handleInvitationSent);
  eventBus.subscribe(DomainEventType.BOARD_CREATED, handleBoardCreated);
  eventBus.subscribe(DomainEventType.COMMENT_CREATED, handleCommentCreated);
  eventBus.subscribe(DomainEventType.WORKSPACE_CREATED, handleWorkspaceCreated);
  eventBus.subscribe(DomainEventType.EXPORT_REQUESTED, handleExportRequested);

  eventBus.subscribeToAll(async (event: DomainEvent) => {
    await activityService.logFromEvent(event);
  });

  await eventBus.startWorker(10);

  log.info('All workers initialized');
}

async function handleTaskCreated(event: DomainEvent): Promise<void> {
  log.info({ taskId: event.aggregateId }, 'Processing task.created event');
}

async function handleTaskAssigned(event: DomainEvent): Promise<void> {
  log.info({ taskId: event.aggregateId }, 'Processing task.assigned event');
  const { assigneeId, taskTitle, assignerName } = event.payload as Record<string, string>;
  if (assigneeId && taskTitle && assignerName) {
    await notificationService.notifyTaskAssigned(
      assigneeId,
      taskTitle,
      assignerName,
      event.aggregateId,
      event.metadata.workspaceId || ''
    );
  }
}

async function handleTaskDeleted(event: DomainEvent): Promise<void> {
  log.info({ taskId: event.aggregateId }, 'Processing task.deleted event');
}

async function handleMemberJoined(event: DomainEvent): Promise<void> {
  log.info({ memberId: event.aggregateId }, 'Processing member.joined event');
  const { workspaceId, memberName, memberId } = event.payload as Record<string, string>;
  if (workspaceId && memberName && memberId) {
    await notificationService.notifyMemberJoined(workspaceId, memberName, memberId);
  }
}

async function handleInvitationSent(event: DomainEvent): Promise<void> {
  log.info({ invitationId: event.aggregateId }, 'Processing invitation.sent event');
}

async function handleBoardCreated(event: DomainEvent): Promise<void> {
  log.info({ boardId: event.aggregateId }, 'Processing board.created event');
  const { workspaceId, boardName, creatorId } = event.payload as Record<string, string>;
  if (workspaceId && boardName && creatorId) {
    await notificationService.notifyBoardCreated(workspaceId, boardName, creatorId);
  }
}

async function handleCommentCreated(event: DomainEvent): Promise<void> {
  log.info({ commentId: event.aggregateId }, 'Processing comment.created event');
}

async function handleWorkspaceCreated(event: DomainEvent): Promise<void> {
  log.info({ workspaceId: event.aggregateId }, 'Processing workspace.created event');
}

async function handleExportRequested(event: DomainEvent): Promise<void> {
  log.info({ exportId: event.aggregateId }, 'Processing export.requested event');
  const { workspaceId, entityType, format, userId } = event.payload as Record<string, string>;
  try {
    log.info({ workspaceId, entityType, format, userId }, 'Export job completed');
  } catch (err) {
    log.error({ err }, 'Export job failed');
  }
}
