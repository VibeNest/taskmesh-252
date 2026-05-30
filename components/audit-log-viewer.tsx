'use client';

import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  FilePlus,
  FileEdit,
  FileMinus,
  Users,
  UserMinus,
  Mail,
  Layout,
  Trash2,
  Plus,
  Edit,
  Move,
  CheckSquare,
  MessageSquare,
  Tag,
  Flag,
  Download,
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface AuditLogViewerProps {
  logs: AuditLog[];
}

const actionIcons: Record<string, React.ReactNode> = {
  WORKSPACE_CREATED: <Layout className="h-3.5 w-3.5" />,
  WORKSPACE_UPDATED: <Edit className="h-3.5 w-3.5" />,
  MEMBER_JOINED: <Users className="h-3.5 w-3.5" />,
  MEMBER_REMOVED: <UserMinus className="h-3.5 w-3.5" />,
  ROLE_CHANGED: <Users className="h-3.5 w-3.5" />,
  INVITATION_SENT: <Mail className="h-3.5 w-3.5" />,
  BOARD_CREATED: <Plus className="h-3.5 w-3.5" />,
  BOARD_UPDATED: <Edit className="h-3.5 w-3.5" />,
  BOARD_DELETED: <Trash2 className="h-3.5 w-3.5" />,
  COLUMN_CREATED: <Plus className="h-3.5 w-3.5" />,
  COLUMN_UPDATED: <Edit className="h-3.5 w-3.5" />,
  COLUMN_DELETED: <Trash2 className="h-3.5 w-3.5" />,
  TASK_CREATED: <FilePlus className="h-3.5 w-3.5" />,
  TASK_UPDATED: <FileEdit className="h-3.5 w-3.5" />,
  TASK_MOVED: <Move className="h-3.5 w-3.5" />,
  TASK_DELETED: <FileMinus className="h-3.5 w-3.5" />,
  TASK_ASSIGNED: <CheckSquare className="h-3.5 w-3.5" />,
  COMMENT_ADDED: <MessageSquare className="h-3.5 w-3.5" />,
  COMMENT_DELETED: <Trash2 className="h-3.5 w-3.5" />,
  LABEL_CREATED: <Tag className="h-3.5 w-3.5" />,
  LABEL_DELETED: <Tag className="h-3.5 w-3.5" />,
  SPRINT_CREATED: <Flag className="h-3.5 w-3.5" />,
  SPRINT_STARTED: <Flag className="h-3.5 w-3.5" />,
  SPRINT_COMPLETED: <CheckSquare className="h-3.5 w-3.5" />,
  EXPORT_REQUESTED: <Download className="h-3.5 w-3.5" />,
};

function getActionLabel(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AuditLogViewer({ logs }: AuditLogViewerProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FilePlus className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm font-medium">No activity logs yet</p>
        <p className="text-xs">Activity will appear here as you use the workspace</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/30"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={log.user.image || undefined} />
            <AvatarFallback className="text-xs">
              {log.user.name?.[0]?.toUpperCase() || log.user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium">{log.user.name || log.user.email}</span>
              <span className="text-xs text-muted-foreground">
                {getActionLabel(log.action).toLowerCase()}
              </span>
              <span className="text-xs capitalize text-muted-foreground">
                {log.entityType.toLowerCase()}
              </span>
            </div>

            {log.metadata?.taskTitle && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                &ldquo;{log.metadata.taskTitle}&rdquo;
              </p>
            )}
            {log.metadata?.boardName && (
              <p className="mt-0.5 text-xs text-muted-foreground">Board: {log.metadata.boardName}</p>
            )}
            {log.metadata?.sprintName && (
              <p className="mt-0.5 text-xs text-muted-foreground">Sprint: {log.metadata.sprintName}</p>
            )}
            {log.metadata?.role && (
              <p className="mt-0.5 text-xs text-muted-foreground">Role: {log.metadata.role}</p>
            )}

            <div className="mt-1.5 flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1 text-[10px]">
                {actionIcons[log.action] || <Edit className="h-3 w-3" />}
                {log.action.replace(/_/g, ' ')}
              </Badge>
            </div>
          </div>

          <div className="whitespace-nowrap text-right text-[10px] text-muted-foreground">
            {format(new Date(log.createdAt), 'MMM dd, yyyy')}
            <br />
            {format(new Date(log.createdAt), 'HH:mm')}
          </div>
        </div>
      ))}
    </div>
  );
}
