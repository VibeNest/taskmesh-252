import prisma from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { eventBus } from '@/lib/event-bus';
import { DomainEventType } from '@/lib/events';
import { recordDbQuery } from '@/lib/telemetry';

export interface CreateTaskCommand {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  assigneeId?: string;
  columnId: string;
  creatorId: string;
}

export interface UpdateTaskCommand {
  id: string;
  title?: string;
  description?: string | null;
  priority?: string | null;
  status?: string;
  dueDate?: string | null;
  startDate?: string | null;
  assigneeId?: string | null;
  tags?: string[];
  updaterId: string;
}

export interface MoveTaskCommand {
  id: string;
  destinationColumnId: string;
  newPosition: number;
  userId: string;
}

export interface DeleteTaskCommand {
  id: string;
  userId: string;
}

export class TaskCommandRepository {
  async create(cmd: CreateTaskCommand) {
    const lastTask = await prisma.task.findFirst({
      where: { columnId: cmd.columnId },
      orderBy: { position: 'desc' },
    });
    const position = lastTask ? lastTask.position + 1 : 0;

    const start = Date.now();
    const task = await prisma.task.create({
      data: {
        title: cmd.title,
        description: cmd.description,
        priority: cmd.priority,
        dueDate: cmd.dueDate,
        assigneeId: cmd.assigneeId,
        columnId: cmd.columnId,
        creatorId: cmd.creatorId,
        position,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        column: { select: { boardId: true } },
      },
    });
    recordDbQuery('create', 'Task', Date.now() - start);

    await cache.invalidate('board', `tasks:${cmd.columnId}`);

    await eventBus.publish({
      type: DomainEventType.TASK_CREATED,
      aggregateId: task.id,
      aggregateType: 'Task',
      payload: { title: task.title, columnId: cmd.columnId, boardId: task.column.boardId },
      metadata: { userId: cmd.creatorId, correlationId: crypto.randomUUID(), timestamp: new Date(), source: 'TaskCommandRepository' },
    });

    if (cmd.assigneeId && cmd.assigneeId !== cmd.creatorId) {
      await eventBus.publish({
        type: DomainEventType.TASK_ASSIGNED,
        aggregateId: task.id,
        aggregateType: 'Task',
        payload: { assigneeId: cmd.assigneeId, taskTitle: task.title, assignerName: '' },
        metadata: { userId: cmd.creatorId, correlationId: crypto.randomUUID(), timestamp: new Date(), source: 'TaskCommandRepository' },
      });
    }

    return task;
  }

  async update(cmd: UpdateTaskCommand) {
    const start = Date.now();
    const previousTask = await prisma.task.findUnique({ where: { id: cmd.id }, select: { assigneeId: true } });
    const task = await prisma.task.update({
      where: { id: cmd.id },
      data: {
        title: cmd.title,
        description: cmd.description,
        priority: cmd.priority,
        status: cmd.status as any,
        dueDate: cmd.dueDate,
        startDate: cmd.startDate,
        tags: cmd.tags,
        assigneeId: cmd.assigneeId,
        updaterId: cmd.updaterId,
      },
      include: { assignee: { select: { id: true, name: true, image: true } } },
    });
    recordDbQuery('update', 'Task', Date.now() - start);

    await cache.invalidate('task', `id:${cmd.id}`);

    await eventBus.publish({
      type: DomainEventType.TASK_UPDATED,
      aggregateId: task.id,
      aggregateType: 'Task',
      payload: { title: task.title },
      metadata: { userId: cmd.updaterId, correlationId: crypto.randomUUID(), timestamp: new Date(), source: 'TaskCommandRepository' },
    });

    if (cmd.assigneeId && cmd.assigneeId !== previousTask?.assigneeId) {
      await eventBus.publish({
        type: DomainEventType.TASK_ASSIGNED,
        aggregateId: task.id,
        aggregateType: 'Task',
        payload: { assigneeId: cmd.assigneeId, taskTitle: task.title, assignerName: '' },
        metadata: { userId: cmd.updaterId, correlationId: crypto.randomUUID(), timestamp: new Date(), source: 'TaskCommandRepository' },
      });
    }

    return task;
  }

  async move(cmd: MoveTaskCommand) {
    const task = await prisma.task.findUnique({ where: { id: cmd.id } });
    if (!task) throw new Error('Task not found');

    const start = Date.now();
    await prisma.$transaction(async (tx) => {
      if (task.columnId === cmd.destinationColumnId) {
        if (task.position < cmd.newPosition) {
          await tx.task.updateMany({
            where: { columnId: cmd.destinationColumnId, position: { gt: task.position, lte: cmd.newPosition }, id: { not: cmd.id } },
            data: { position: { decrement: 1 } },
          });
        } else if (task.position > cmd.newPosition) {
          await tx.task.updateMany({
            where: { columnId: cmd.destinationColumnId, position: { gte: cmd.newPosition, lt: task.position }, id: { not: cmd.id } },
            data: { position: { increment: 1 } },
          });
        }
      } else {
        await tx.task.updateMany({
          where: { columnId: task.columnId, position: { gt: task.position } },
          data: { position: { decrement: 1 } },
        });
        await tx.task.updateMany({
          where: { columnId: cmd.destinationColumnId, position: { gte: cmd.newPosition } },
          data: { position: { increment: 1 } },
        });
      }
      await tx.task.update({
        where: { id: cmd.id },
        data: { columnId: cmd.destinationColumnId, position: cmd.newPosition, updaterId: cmd.userId },
      });
    });
    recordDbQuery('transaction', 'Task', Date.now() - start);

    await cache.invalidatePattern('board', '');

    await eventBus.publish({
      type: DomainEventType.TASK_MOVED,
      aggregateId: cmd.id,
      aggregateType: 'Task',
      payload: { sourceColumnId: task.columnId, destinationColumnId: cmd.destinationColumnId, newPosition: cmd.newPosition },
      metadata: { userId: cmd.userId, correlationId: crypto.randomUUID(), timestamp: new Date(), source: 'TaskCommandRepository' },
    });

    return task;
  }

  async delete(cmd: DeleteTaskCommand) {
    const start = Date.now();
    const task = await prisma.task.delete({ where: { id: cmd.id } });
    recordDbQuery('delete', 'Task', Date.now() - start);

    await cache.invalidatePattern('board', '');

    await eventBus.publish({
      type: DomainEventType.TASK_DELETED,
      aggregateId: cmd.id,
      aggregateType: 'Task',
      payload: { title: task.title },
      metadata: { userId: cmd.userId, correlationId: crypto.randomUUID(), timestamp: new Date(), source: 'TaskCommandRepository' },
    });

    return task;
  }
}

export const taskCommandRepo = new TaskCommandRepository();
