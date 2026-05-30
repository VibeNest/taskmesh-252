'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, ArrowLeft } from 'lucide-react';
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
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => router.push(`/workspaces/${workspaceId}`)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Analytics</h1>
          <p className="text-xs text-muted-foreground">{workspace.name}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
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
  );
}
