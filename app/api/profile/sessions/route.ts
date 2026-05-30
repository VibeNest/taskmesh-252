import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/audit';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { createChildLogger } from '@/lib/logger';

const log = createChildLogger('login-history');

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const history = await prisma.loginHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ history });
  } catch (err) {
    log.error({ err }, 'Failed to fetch login history');
    return NextResponse.json({ error: 'Failed to fetch login history' }, { status: 500 });
  }
}
