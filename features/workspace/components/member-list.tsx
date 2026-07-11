'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Shield, Users } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface Member {
  id: string;
  role: string;
  user: {
    image: string | null;
    name: string | null;
    email: string;
  };
}

interface MemberListProps {
  members: Member[];
  className?: string;
}

const roleIcons: Record<string, React.ReactNode> = {
  OWNER: <Crown className="size-3.5 text-yellow-500" />,
  ADMIN: <Shield className="size-3.5 text-blue-500" />,
  MEMBER: <Users className="size-3.5 text-muted-foreground" />,
};

export function MemberList({ members, className }: MemberListProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm">Team Members</CardTitle>
        <CardDescription className="text-xs">
          Manage workspace members and their roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <div className="space-y-1.5">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-md border p-2.5"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={member.user.image ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.user.name || member.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.user.name || member.user.email}
                    </p>
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
        )}
      </CardContent>
    </Card>
  );
}
