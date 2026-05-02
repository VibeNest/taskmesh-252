'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
import { Plus, Users, LayoutGrid, Loader2, Sparkles, ArrowRight, Clock } from 'lucide-react';

export default function WorkspacesPage() {
  const { data: session } = useSession();
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

  const colors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">TaskMesh</span>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                New Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a new workspace</DialogTitle>
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
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createWorkspace.isPending}>
                  {createWorkspace.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create workspace
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-2 text-gray-500">Choose a workspace to get started</p>
        </div>

        {workspaces?.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-16 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <LayoutGrid className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold">No workspaces yet</h2>
            <p className="mx-auto mb-8 max-w-md text-gray-500">
              Create your first workspace to start collaborating with your team, manage projects,
              and boost productivity.
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create workspace
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces?.map((workspace: any, index: number) => (
              <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
                <div className="group relative overflow-hidden rounded-xl border bg-white transition-all hover:border-blue-200 hover:shadow-lg">
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colors[index % colors.length]}`}
                  />

                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${colors[index % colors.length]} shadow-sm`}
                      >
                        {workspace.logo ? (
                          <img
                            src={workspace.logo}
                            alt={workspace.name}
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-white">
                            {workspace.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
                    </div>

                    <h3 className="mb-1 text-lg font-semibold">{workspace.name}</h3>
                    <p className="mb-4 line-clamp-2 text-sm text-gray-500">
                      {workspace.description || 'No description yet'}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>{workspace._count?.members || workspace.members?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <LayoutGrid className="h-4 w-4" />
                        <span>{workspace._count?.boards || 0}</span>
                      </div>
                      <div className="ml-auto flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">
                          {new Date(workspace.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
