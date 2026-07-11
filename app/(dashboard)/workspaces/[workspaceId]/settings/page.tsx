'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWorkspace, useWorkspaceMembers, useDeleteWorkspace } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WorkspaceSettingsForm } from '@/features/workspace/components/workspace-settings-form';
import { MemberList } from '@/features/workspace/components/member-list';
import { InviteDialog } from '@/features/workspace/components/invite-dialog';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  const { data: members } = useWorkspaceMembers(workspaceId);
  const deleteWorkspace = useDeleteWorkspace();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteWorkspace = async () => {
    await deleteWorkspace.mutateAsync(workspaceId);
  };

  if (isLoading) {
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
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/workspaces/${workspaceId}`}
          className="flex size-8 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-lg font-semibold">Workspace Settings</h1>
      </div>

      <div className="space-y-6">
        <WorkspaceSettingsForm
          workspaceId={workspaceId}
          name={workspace.name}
          description={workspace.description}
        />

        <InviteDialog workspaceId={workspaceId} />

        <MemberList members={members || []} />

        <Card className="border-destructive/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
            <CardDescription className="text-xs">
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-1.5 size-3.5" />
                  Delete Workspace
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the workspace and all
                    associated data including boards, tasks, and comments.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteWorkspace}
                    disabled={deleteWorkspace.isPending}
                  >
                    {deleteWorkspace.isPending && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    Delete Workspace
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
