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

    const labels = await prisma.label.findMany({
      where: { workspaceId: params.workspaceId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(labels);
  } catch (error) {
    console.error('Labels fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { workspaceId: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canUpdate = await rbacService.hasPermission(
      session.user.id,
      params.workspaceId,
      'board:update'
    );
    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, color, description } = body;

    if (!name || !color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 });
    }

    const label = await prisma.label.create({
      data: {
        name,
        color,
        description,
        workspaceId: params.workspaceId,
      },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Label already exists' }, { status: 409 });
    }
    console.error('Label creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
