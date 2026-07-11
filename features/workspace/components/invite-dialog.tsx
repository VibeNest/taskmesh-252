'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useCreateInvitation, useInvitations } from '@/hooks/use-api';
import { Role } from '@prisma/client';
import { Loader2, Mail, Plus } from 'lucide-react';

interface InviteDialogProps {
  workspaceId: string;
}

export function InviteDialog({ workspaceId }: InviteDialogProps) {
  const createInvitation = useCreateInvitation();
  const { data: invitations } = useInvitations(workspaceId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(Role.MEMBER);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    await createInvitation.mutateAsync({
      workspaceId,
      email,
      role,
    });
    setEmail('');
    setIsDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Invite Members</CardTitle>
            <CardDescription className="text-xs">
              Invite new members to join this workspace
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1.5 size-3.5" />
                Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join this workspace.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label htmlFor="invite-email" className="text-sm font-medium">
                    Email address
                  </label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="invite-role" className="text-sm font-medium">
                    Role
                  </label>
                  <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Role.MEMBER}>Member</SelectItem>
                      <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createInvitation.isPending}>
                  {createInvitation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Mail className="mr-1.5 h-4 w-4" />
                  Send invitation
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {invitations && invitations.length > 0 && (
          <div className="space-y-1.5">
            {invitations.map(
              (invitation: { id: string; email: string; role: string; status: string }) => (
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
                  <Badge variant="secondary" className="text-[10px]">
                    {invitation.status}
                  </Badge>
                </div>
              )
            )}
          </div>
        )}
        {(!invitations || invitations.length === 0) && (
          <p className="py-4 text-center text-sm text-muted-foreground">No pending invitations.</p>
        )}
      </CardContent>
    </Card>
  );
}
