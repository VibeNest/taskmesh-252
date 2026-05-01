import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { rbacService } from '@/server/services/rbac.service';

export async function GET(request: Request, { params }: { params: { workspaceId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isMember = await rbacService.isWorkspaceMember(session.user.id, params.workspaceId);
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [tasks, members, activityLogs, boards] = await Promise.all([
      prisma.task.findMany({
        where: {
          column: {
            board: {
              workspaceId: params.workspaceId,
            },
          },
        },
        include: {
          assignee: { select: { name: true, email: true, image: true } },
          creator: { select: { name: true, email: true } },
          labels: { include: { label: true } },
        },
      }),
      prisma.workspaceMember.findMany({
        where: { workspaceId: params.workspaceId },
        include: {
          user: { select: { name: true, email: true, image: true } },
        },
      }),
      prisma.activityLog.findMany({
        where: { workspaceId: params.workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: { select: { name: true, email: true, image: true } },
        },
      }),
      prisma.board.findMany({
        where: { workspaceId: params.workspaceId },
      }),
    ]);

    return NextResponse.json({ tasks, members, activityLogs, boards });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
