'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Download } from 'lucide-react';
import { useWorkspace, useActivity } from '@/hooks/use-api';
import { AuditLogViewer } from '@/components/audit-log-viewer';
import { Button } from '@/components/ui/button';
import { exportActivityLogsToCSV } from '@/lib/export-utils';
import type { ActivityLogWithUser } from '@/types';

export default function AuditPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const [filter, setFilter] = useState<string>('all');

  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const { data: activity, isLoading } = useActivity(workspaceId);

  const filteredActivity =
    filter === 'all'
      ? activity
      : activity?.filter((a: ActivityLogWithUser) => a.action.toLowerCase().includes(filter.toLowerCase()));

  const handleExport = () => {
    exportActivityLogsToCSV(filteredActivity || [], `audit-logs-${workspace?.name || 'export'}`);
  };

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
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => router.push(`/workspaces/${workspaceId}`)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-semibold">Audit Log</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!filteredActivity?.length}>
          <Download className="mr-1.5 size-3.5" />
          Export CSV
        </Button>
      </div>

      <div className="mb-6 flex gap-1.5">
        {['all', 'task', 'board', 'member', 'workspace'].map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs capitalize"
            onClick={() => setFilter(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AuditLogViewer logs={filteredActivity || []} />
      )}
    </div>
  );
}
