'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useWorkspaces, useCreateWorkspace } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Users, LayoutGrid, Loader2, ArrowRight } from 'lucide-react';

export default function WorkspacesPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const createWorkspace = useCreateWorkspace();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    await createWorkspace.mutateAsync({ name: newWorkspaceName });
    setNewWorkspaceName('');
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workspaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {workspaces?.length || 0} workspace{(workspaces?.length || 0) !== 1 ? 's' : ''} · pick one to continue
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 size-3.5" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create workspace</DialogTitle>
              <DialogDescription>
                Workspaces help you organize your team and projects.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label htmlFor="workspace-name" className="text-sm font-medium">
                  Workspace name
                </label>
                <Input
                  id="workspace-name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Corp, Engineering Team"
                  className="mt-1.5"
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={createWorkspace.isPending}>
                {createWorkspace.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create workspace
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {workspaces?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-16">
          <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
            <LayoutGrid className="size-6 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-base font-medium">No workspaces yet</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Create your first workspace to start collaborating with your team.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="mr-1.5 size-3.5" />
            Create workspace
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces?.map((workspace: { id: string; name: string; description?: string; _count?: { members: number; boards: number }; members?: unknown[] }) => (
            <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
              <div className="group rounded-lg border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-sm font-semibold text-primary">
                      {workspace.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <h3 className="mb-0.5 text-sm font-medium">{workspace.name}</h3>
                <p className="mb-4 line-clamp-2 text-xs text-muted-foreground">
                  {workspace.description || 'No description'}
                </p>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {workspace._count?.members || workspace.members?.length || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <LayoutGrid className="size-3" />
                    {workspace._count?.boards || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
