import { NextResponse } from 'next/server';
import { getMetricsOutput, getMetricsContentType } from '@/lib/telemetry';

export async function GET() {
  try {
    const contentType = await getMetricsContentType();
    const metrics = await getMetricsOutput();
    return new NextResponse(metrics, {
      headers: { 'Content-Type': contentType },
    });
  } catch {
    return NextResponse.json({ error: 'Metrics unavailable' }, { status: 503 });
  }
}
