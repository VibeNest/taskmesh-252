'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWorkspace, useWorkspaceMembers, useUpdateWorkspace, useDeleteWorkspace, useInvitations, useCreateInvitation } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Trash2,
  Loader2,
  Mail,
  Shield,
  Crown,
  Users,
  Save,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { Role } from '@prisma/client';

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  const { data: members } = useWorkspaceMembers(workspaceId);
  const { data: invitations } = useInvitations(workspaceId);
  const updateWorkspace = useUpdateWorkspace();
  const deleteWorkspace = useDeleteWorkspace();
  const createInvitation = useCreateInvitation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>(Role.MEMBER);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateWorkspace.mutateAsync({
      workspaceId,
      data: { name, description },
    });
  };

  const handleDeleteWorkspace = async () => {
    await deleteWorkspace.mutateAsync(workspaceId);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    await createInvitation.mutateAsync({
      workspaceId,
      email: inviteEmail,
      role: inviteRole,
    });
    setInviteEmail('');
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

  const roleIcons: Record<string, React.ReactNode> = {
    OWNER: <Crown className="size-3.5 text-yellow-500" />,
    ADMIN: <Shield className="size-3.5 text-blue-500" />,
    MEMBER: <Users className="size-3.5 text-muted-foreground" />,
  };

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
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">General</CardTitle>
            <CardDescription className="text-xs">Update your workspace name and description</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateWorkspace} className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium">Workspace name</label>
                <Input
                  id="name"
                  value={name || workspace.name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  value={description ?? workspace.description ?? ''}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <Button type="submit" size="sm" disabled={updateWorkspace.isPending}>
                {updateWorkspace.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                <Save className="mr-1.5 size-3.5" />
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">Invite Members</CardTitle>
            <CardDescription className="text-xs">Invite new members to join this workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-2">
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.MEMBER}>Member</SelectItem>
                  <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" size="sm" disabled={createInvitation.isPending}>
                {createInvitation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Mail className="size-4" />
                )}
              </Button>
            </form>

            {invitations && invitations.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">Pending Invitations</h4>
                <div className="space-y-1.5">
                  {invitations.map((invitation: { id: string; email: string; role: string; status: string }) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between rounded-md border p-2.5"
                    >
                      <div>
                        <p className="text-sm">{invitation.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {invitation.role} &middot; {invitation.status}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{invitation.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-sm">Team Members</CardTitle>
            <CardDescription className="text-xs">Manage workspace members and their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {members?.map((member: { id: string; role: string; user: { image: string; name: string; email: string } }) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-md border p-2.5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarImage src={member.user.image} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.user.name || member.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{member.user.name || member.user.email}</p>
                      <p className="text-xs text-muted-foreground">{member.user.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    {roleIcons[member.role]}
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
            <CardDescription className="text-xs">Irreversible and destructive actions</CardDescription>
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
                    This action cannot be undone. This will permanently delete the
                    workspace and all associated data including boards, tasks, and comments.
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
                    {deleteWorkspace.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
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
