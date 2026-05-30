import { NextResponse } from 'next/server';
import { featureFlags } from '@/lib/feature-flags';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const flags = await featureFlags.getAllFlags();
    const results: Record<string, boolean> = {};

    for (const flag of flags) {
      results[flag.key] = await featureFlags.isEnabled(flag.key, {
        userId: session.user.id,
      });
    }

    return NextResponse.json({ flags: results });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to get feature flags: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
