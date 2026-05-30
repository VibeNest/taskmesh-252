import { NextRequest, NextResponse } from 'next/server';
import { searchService } from '@/lib/search';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { query, types, workspaceId, boardId, limit, offset } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchService.search({
      query,
      types,
      workspaceId,
      boardId,
      limit,
      offset,
    });

    return NextResponse.json({ results, total: results.length });
  } catch (err) {
    return NextResponse.json(
      { error: `Search failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
