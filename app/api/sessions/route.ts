import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessions = await prisma.userSession.findMany({
      where: { userId: session.user.id, isActive: true },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        device: true,
        ipAddress: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sessionId } = body;

    if (sessionId) {
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { isActive: false },
      });
    } else {
      await prisma.userSession.updateMany({
        where: { userId: session.user.id },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
  }
}
