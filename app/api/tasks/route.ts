import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { taskRepository, boardRepository } from '@/server/repositories';
import { rbacService, activityService, notificationService } from '@/server/services';
import { createTaskSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const board = await boardRepository.findById(body.boardId);
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const canCreate = await rbacService.hasPermission(
      session.user.id,
      board.workspaceId,
      'task:create'
    );
    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const task = await taskRepository.create({
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      assigneeId: data.assigneeId,
      columnId: body.columnId,
      creatorId: session.user.id,
    });

    await activityService.logTaskCreated(task.id, board.workspaceId, session.user.id, board.id);

    if (data.assigneeId) {
      await notificationService.notifyTaskAssigned(
        data.assigneeId,
        task.title,
        session.user.name || 'Someone',
        task.id,
        board.workspaceId
      );
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Task creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
