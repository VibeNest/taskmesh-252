'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, ArrowLeft, Shield, Download } from 'lucide-react';
import { useWorkspace, useActivity } from '@/hooks/use-api';
import { AuditLogViewer } from '@/components/audit-log-viewer';
import { Button } from '@/components/ui/button';
import { exportActivityLogsToCSV } from '@/lib/export-utils';

export default function AuditPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { data: session } = useSession();
  const [filter, setFilter] = useState<string>('all');

  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const { data: activity, isLoading } = useActivity(workspaceId);

  const filteredActivity =
    filter === 'all'
      ? activity
      : activity?.filter((a: any) => a.action.toLowerCase().includes(filter.toLowerCase()));

  const handleExport = () => {
    exportActivityLogsToCSV(filteredActivity || [], `audit-logs-${workspace?.name || 'export'}`);
  };

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
          <div className="flex items-center justify-between">
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
                  <Shield className="h-6 w-6 text-emerald-500" />
                  Audit Log
                </h1>
                <p className="text-sm text-muted-foreground">{workspace.name}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleExport} disabled={!filteredActivity?.length}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="mt-4 flex gap-2">
            {['all', 'task', 'board', 'member', 'workspace'].map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AuditLogViewer logs={filteredActivity || []} />
        )}
      </div>
    </div>
  );
}
