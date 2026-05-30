import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export async function POST(req: NextRequest) {
  try {
    const { key, expiresIn } = await req.json();

    if (!key) {
      return NextResponse.json({ error: 'Missing file key' }, { status: 400 });
    }

    const url = await storage.generatePresignedDownloadUrl(key, expiresIn || 3600);

    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to generate download URL: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
