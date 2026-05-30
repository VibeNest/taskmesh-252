import prisma from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { recordDbQuery } from '@/lib/telemetry';

export class TaskReadRepository {
  async findById(id: string) {
    return cache.getOrSet('task', `id:${id}`, async () => {
      const start = Date.now();
      const result = await prisma.task.findUnique({
        where: { id },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          creator: { select: { id: true, name: true, image: true } },
          comments: {
            orderBy: { createdAt: 'asc' },
            include: { author: { select: { id: true, name: true, image: true } } },
          },
          column: { include: { board: { select: { id: true, workspaceId: true } } } },
          labels: { include: { label: true } },
          subtasks: { orderBy: { position: 'asc' } },
          attachments: true,
        },
      });
      recordDbQuery('findUnique', 'Task', Date.now() - start);
      return result;
    });
  }

  async findByColumn(columnId: string) {
    return cache.getOrSet('board', `tasks:${columnId}`, async () => {
      const start = Date.now();
      const result = await prisma.task.findMany({
        where: { columnId },
        orderBy: { position: 'asc' },
        include: {
          assignee: { select: { id: true, name: true, image: true } },
          _count: { select: { comments: true, subtasks: true } },
          labels: { include: { label: true } },
        },
      });
      recordDbQuery('findMany', 'Task', Date.now() - start);
      return result;
    });
  }

  async findByBoard(boardId: string) {
    const start = Date.now();
    const columns = await prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: {
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            assignee: { select: { id: true, name: true, image: true } },
            _count: { select: { comments: true, subtasks: true } },
            labels: { include: { label: true } },
          },
        },
      },
    });
    recordDbQuery('findMany', 'Task', Date.now() - start);
    return columns;
  }

  async findBySprint(sprintId: string) {
    const start = Date.now();
    const result = await prisma.task.findMany({
      where: { sprintId },
      orderBy: { position: 'asc' },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        column: { select: { id: true, name: true } },
      },
    });
    recordDbQuery('findMany', 'Task', Date.now() - start);
    return result;
  }

  async findByAssignee(userId: string, workspaceId?: string) {
    const where: Record<string, unknown> = { assigneeId: userId };
    if (workspaceId) {
      where.column = { board: { workspaceId } };
    }

    const start = Date.now();
    const result = await prisma.task.findMany({
      where: where as any,
      orderBy: { updatedAt: 'desc' },
      include: {
        column: { include: { board: { select: { id: true, name: true, workspaceId: true } } } },
      },
      take: 50,
    });
    recordDbQuery('findMany', 'Task', Date.now() - start);
    return result;
  }
}

export const taskReadRepo = new TaskReadRepository();
