import { NextRequest, NextResponse } from 'next/server';
import { aiService } from '@/lib/ai';
import { featureFlags } from '@/lib/feature-flags';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const enabled = await featureFlags.isEnabled('ai-task-assistant', {
    userId: session.user.id,
  });

  if (!enabled) {
    return NextResponse.json({ error: 'AI features not enabled for your plan' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    let result;

    switch (action) {
      case 'generate-tasks':
        result = await aiService.generateTasks(payload.description, payload.count);
        break;
      case 'generate-sprint':
        result = await aiService.generateSprintPlan(
          payload.tasks,
          payload.developers,
          payload.duration
        );
        break;
      case 'generate-stories':
        result = await aiService.generateUserStories(payload.feature);
        break;
      case 'search':
        result = await aiService.searchWithAI(payload.query, payload.context);
        break;
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json(
      { error: `AI request failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
