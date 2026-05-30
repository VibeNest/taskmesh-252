import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/audit';
import { auth } from '@/auth';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const filters: Record<string, unknown> = {};

    if (searchParams.get('userId')) filters.userId = searchParams.get('userId');
    if (searchParams.get('workspaceId')) filters.workspaceId = searchParams.get('workspaceId');
    if (searchParams.get('action')) filters.action = searchParams.get('action');
    if (searchParams.get('since')) filters.since = new Date(searchParams.get('since')!);

    const trail = auditLogger.getAuditTrail(filters as any);
    const integrity = await auditLogger.verifyIntegrity();

    return NextResponse.json({ trail, integrity });
  } catch (err) {
    return NextResponse.json(
      { error: `Audit log fetch failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
