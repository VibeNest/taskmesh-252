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

    const taskLabels = await prisma.taskLabel.findMany({
      where: { taskId: params.taskId },
      include: {
        label: true,
      },
    });

    return NextResponse.json(taskLabels);
  } catch (error) {
    console.error('Task labels fetch error:', error);
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
    const { labelId } = body;

    if (!labelId) {
      return NextResponse.json({ error: 'Label ID is required' }, { status: 400 });
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

    const taskLabel = await prisma.taskLabel.create({
      data: {
        taskId: params.taskId,
        labelId,
      },
      include: {
        label: true,
      },
    });

    return NextResponse.json(taskLabel, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Label already added to task' }, { status: 409 });
    }
    console.error('Task label creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { labelId } = body;

    if (!labelId) {
      return NextResponse.json({ error: 'Label ID is required' }, { status: 400 });
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

    await prisma.taskLabel.deleteMany({
      where: {
        taskId: params.taskId,
        labelId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task label deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
