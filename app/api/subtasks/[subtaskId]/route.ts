import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { rbacService } from '@/server/services/rbac.service';

export async function PATCH(request: Request, { params }: { params: { subtaskId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { completed, title, description, assigneeId, position } = body;

    const subtask = await prisma.subtask.findUnique({
      where: { id: params.subtaskId },
      include: {
        task: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
    });

    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    const canUpdate = await rbacService.hasPermission(
      session.user.id,
      subtask.task.column.board.workspaceId,
      'task:update'
    );
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.subtask.update({
      where: { id: params.subtaskId },
      data: {
        ...(completed !== undefined && { completed }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(position !== undefined && { position }),
      },
      include: {
        assignee: { select: { name: true, email: true, image: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Subtask update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { subtaskId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subtask = await prisma.subtask.findUnique({
      where: { id: params.subtaskId },
      include: {
        task: {
          include: {
            column: {
              include: {
                board: true,
              },
            },
          },
        },
      },
    });

    if (!subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    const canUpdate = await rbacService.hasPermission(
      session.user.id,
      subtask.task.column.board.workspaceId,
      'task:update'
    );
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.subtask.delete({
      where: { id: params.subtaskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subtask deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
