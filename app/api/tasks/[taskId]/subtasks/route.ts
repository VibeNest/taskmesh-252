import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { rbacService } from '@/server/services/rbac.service';

export async function GET(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subtasks = await prisma.subtask.findMany({
      where: { taskId: params.taskId },
      orderBy: { position: 'asc' },
      include: {
        assignee: { select: { name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(subtasks);
  } catch (error) {
    console.error('Subtasks fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, assigneeId } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        column: {
          include: {
            board: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const canUpdate = await rbacService.hasPermission(
      session.user.id,
      task.column.board.workspaceId,
      'task:update'
    );
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const maxPosition = await prisma.subtask.aggregate({
      where: { taskId: params.taskId },
      _max: { position: true },
    });

    const subtask = await prisma.subtask.create({
      data: {
        title,
        description,
        assigneeId,
        taskId: params.taskId,
        position: (maxPosition._max.position || 0) + 1,
      },
      include: {
        assignee: { select: { name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    console.error('Subtask creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
