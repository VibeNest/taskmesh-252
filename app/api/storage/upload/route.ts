import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, entityType, fileName, contentType } = body;

    if (!workspaceId || !entityType || !fileName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await storage.generatePresignedUploadUrl(
      workspaceId,
      entityType,
      fileName,
      contentType || 'application/octet-stream'
    );

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to generate upload URL: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
