'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, ArrowLeft, BarChart3 } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-api';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { data: session } = useSession();

  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['workspace-analytics', workspaceId],
    queryFn: async () => {
      const response = await fetch(`/api/workspaces/${workspaceId}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!workspaceId && !!session,
  });

  if (workspaceLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/workspaces/${workspaceId}`)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                Analytics
              </h1>
              <p className="text-sm text-muted-foreground">{workspace.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AnalyticsDashboard
            data={{
              tasks: analyticsData?.tasks || [],
              members: analyticsData?.members || [],
              activityLogs: analyticsData?.activityLogs || [],
              boards: analyticsData?.boards || [],
            }}
          />
        )}
      </div>
    </div>
  );
}
