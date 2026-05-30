import { ActivityAction, Prisma } from '@prisma/client';
import { activityRepository } from '@/server/repositories';
import { DomainEvent, DomainEventType } from '@/lib/events';

export class ActivityService {
  async log(
    action: ActivityAction,
    entityType: string,
    entityId: string,
    userId: string,
    workspaceId: string,
    metadata?: Prisma.InputJsonValue,
    taskId?: string,
    boardId?: string,
    commentId?: string
  ) {
    return activityRepository.create({
      action,
      entityType,
      entityId,
      userId,
      workspaceId,
      metadata,
      taskId,
      boardId,
      commentId,
    });
  }

  async getWorkspaceActivity(workspaceId: string, limit = 50, cursor?: string) {
    return activityRepository.findByWorkspace(workspaceId, limit, cursor);
  }

  async getTaskActivity(taskId: string) {
    return activityRepository.findByTask(taskId);
  }

  async getBoardActivity(boardId: string, limit = 50) {
    return activityRepository.findByBoard(boardId, limit);
  }

  async logWorkspaceCreated(workspaceId: string, userId: string, workspaceName: string) {
    return this.log(
      ActivityAction.WORKSPACE_CREATED,
      'workspace',
      workspaceId,
      userId,
      workspaceId,
      { workspaceName }
    );
  }

  async logMemberJoined(workspaceId: string, userId: string, memberId: string, memberName: string) {
    return this.log(
      ActivityAction.MEMBER_JOINED,
      'workspace_member',
      memberId,
      userId,
      workspaceId,
      { memberName }
    );
  }

  async logMemberRemoved(
    workspaceId: string,
    userId: string,
    memberId: string,
    memberName: string
  ) {
    return this.log(
      ActivityAction.MEMBER_REMOVED,
      'workspace_member',
      memberId,
      userId,
      workspaceId,
      { memberName }
    );
  }

  async logRoleChanged(workspaceId: string, userId: string, memberId: string, newRole: string) {
    return this.log(
      ActivityAction.ROLE_CHANGED,
      'workspace_member',
      memberId,
      userId,
      workspaceId,
      { newRole }
    );
  }

  async logBoardCreated(boardId: string, workspaceId: string, userId: string, boardName: string) {
    return this.log(
      ActivityAction.BOARD_CREATED,
      'board',
      boardId,
      userId,
      workspaceId,
      { boardName },
      undefined,
      boardId
    );
  }

  async logTaskCreated(taskId: string, workspaceId: string, userId: string, taskTitle: string) {
    return this.log(
      ActivityAction.TASK_CREATED,
      'task',
      taskId,
      userId,
      workspaceId,
      { taskTitle },
      taskId
    );
  }

  async logTaskMoved(
    taskId: string,
    workspaceId: string,
    userId: string,
    fromColumn: string,
    toColumn: string
  ) {
    return this.log(
      ActivityAction.TASK_MOVED,
      'task',
      taskId,
      userId,
      workspaceId,
      { fromColumn, toColumn },
      taskId
    );
  }

  async logTaskAssigned(
    taskId: string,
    workspaceId: string,
    userId: string,
    assigneeId: string,
    assigneeName: string
  ) {
    return this.log(
      ActivityAction.TASK_ASSIGNED,
      'task',
      taskId,
      userId,
      workspaceId,
      { assigneeId, assigneeName },
      taskId
    );
  }

  async logCommentAdded(commentId: string, taskId: string, workspaceId: string, userId: string) {
    return this.log(
      ActivityAction.COMMENT_ADDED,
      'comment',
      commentId,
      userId,
      workspaceId,
      {},
      taskId,
      undefined,
      commentId
    );
  }

  async logFromEvent(event: DomainEvent): Promise<void> {
    const actionMap: Partial<Record<DomainEventType, ActivityAction>> = {
      [DomainEventType.WORKSPACE_CREATED]: ActivityAction.WORKSPACE_CREATED,
      [DomainEventType.WORKSPACE_UPDATED]: ActivityAction.WORKSPACE_UPDATED,
      [DomainEventType.MEMBER_JOINED]: ActivityAction.MEMBER_JOINED,
      [DomainEventType.MEMBER_REMOVED]: ActivityAction.MEMBER_REMOVED,
      [DomainEventType.BOARD_CREATED]: ActivityAction.BOARD_CREATED,
      [DomainEventType.BOARD_UPDATED]: ActivityAction.BOARD_UPDATED,
      [DomainEventType.BOARD_DELETED]: ActivityAction.BOARD_DELETED,
      [DomainEventType.TASK_CREATED]: ActivityAction.TASK_CREATED,
      [DomainEventType.TASK_UPDATED]: ActivityAction.TASK_UPDATED,
      [DomainEventType.TASK_MOVED]: ActivityAction.TASK_MOVED,
      [DomainEventType.TASK_DELETED]: ActivityAction.TASK_DELETED,
      [DomainEventType.TASK_ASSIGNED]: ActivityAction.TASK_ASSIGNED,
      [DomainEventType.COMMENT_CREATED]: ActivityAction.COMMENT_ADDED,
      [DomainEventType.COMMENT_DELETED]: ActivityAction.COMMENT_DELETED,
      [DomainEventType.INVITATION_SENT]: ActivityAction.INVITATION_SENT,
    };

    const action = actionMap[event.type];
    if (!action) return;

    const taskId = event.aggregateType === 'Task' ? event.aggregateId : undefined;
    const boardId = event.payload?.boardId as string | undefined;

    await this.log(
      action,
      event.aggregateType.toLowerCase(),
      event.aggregateId,
      event.metadata.userId || '',
      event.metadata.workspaceId || '',
      event.payload as Prisma.InputJsonValue,
      taskId,
      boardId
    );
  }
}

export const activityService = new ActivityService();
