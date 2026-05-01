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
  LayoutList,
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
  WORKSPACE_CREATED: <Layout className="h-4 w-4" />,
  WORKSPACE_UPDATED: <LayoutList className="h-4 w-4" />,
  MEMBER_JOINED: <Users className="h-4 w-4" />,
  MEMBER_REMOVED: <UserMinus className="h-4 w-4" />,
  ROLE_CHANGED: <Users className="h-4 w-4" />,
  INVITATION_SENT: <Mail className="h-4 w-4" />,
  BOARD_CREATED: <Plus className="h-4 w-4" />,
  BOARD_UPDATED: <Edit className="h-4 w-4" />,
  BOARD_DELETED: <Trash2 className="h-4 w-4" />,
  COLUMN_CREATED: <Plus className="h-4 w-4" />,
  COLUMN_UPDATED: <Edit className="h-4 w-4" />,
  COLUMN_DELETED: <Trash2 className="h-4 w-4" />,
  TASK_CREATED: <FilePlus className="h-4 w-4" />,
  TASK_UPDATED: <FileEdit className="h-4 w-4" />,
  TASK_MOVED: <Move className="h-4 w-4" />,
  TASK_DELETED: <FileMinus className="h-4 w-4" />,
  TASK_ASSIGNED: <CheckSquare className="h-4 w-4" />,
  COMMENT_ADDED: <MessageSquare className="h-4 w-4" />,
  COMMENT_DELETED: <Trash2 className="h-4 w-4" />,
  LABEL_CREATED: <Tag className="h-4 w-4" />,
  LABEL_DELETED: <Tag className="h-4 w-4" />,
  SPRINT_CREATED: <Flag className="h-4 w-4" />,
  SPRINT_STARTED: <Flag className="h-4 w-4" />,
  SPRINT_COMPLETED: <CheckSquare className="h-4 w-4" />,
  EXPORT_REQUESTED: <Download className="h-4 w-4" />,
};

const actionColors: Record<string, string> = {
  WORKSPACE_CREATED: 'bg-blue-100 text-blue-800',
  WORKSPACE_UPDATED: 'bg-blue-100 text-blue-800',
  MEMBER_JOINED: 'bg-green-100 text-green-800',
  MEMBER_REMOVED: 'bg-red-100 text-red-800',
  ROLE_CHANGED: 'bg-purple-100 text-purple-800',
  INVITATION_SENT: 'bg-yellow-100 text-yellow-800',
  BOARD_CREATED: 'bg-blue-100 text-blue-800',
  BOARD_DELETED: 'bg-red-100 text-red-800',
  TASK_CREATED: 'bg-green-100 text-green-800',
  TASK_UPDATED: 'bg-blue-100 text-blue-800',
  TASK_MOVED: 'bg-yellow-100 text-yellow-800',
  TASK_DELETED: 'bg-red-100 text-red-800',
  TASK_ASSIGNED: 'bg-purple-100 text-purple-800',
  COMMENT_ADDED: 'bg-green-100 text-green-800',
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
        <FilePlus className="mb-4 h-12 w-12 opacity-50" />
        <p className="text-lg font-medium">No activity logs yet</p>
        <p className="text-sm">Activity will appear here as you use the workspace</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={log.user.image || undefined} />
            <AvatarFallback>
              {log.user.name?.[0]?.toUpperCase() || log.user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{log.user.name || log.user.email}</span>
              <span className="text-sm text-muted-foreground">
                {getActionLabel(log.action).toLowerCase()}
              </span>
              <span className="text-sm capitalize text-muted-foreground">
                {log.entityType.toLowerCase()}
              </span>
            </div>

            {log.metadata?.taskTitle && (
              <p className="mt-1 text-sm text-muted-foreground">"{log.metadata.taskTitle}"</p>
            )}
            {log.metadata?.boardName && (
              <p className="mt-1 text-sm text-muted-foreground">Board: {log.metadata.boardName}</p>
            )}
            {log.metadata?.role && (
              <p className="mt-1 text-sm text-muted-foreground">Role: {log.metadata.role}</p>
            )}

            <div className="mt-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {actionIcons[log.action] || <Edit className="h-3 w-3" />}
                <span className="ml-1">{log.action.replace(/_/g, ' ')}</span>
              </Badge>
            </div>
          </div>

          <div className="whitespace-nowrap text-right text-xs text-muted-foreground">
            {format(new Date(log.createdAt), 'MMM dd, yyyy')}
            <br />
            {format(new Date(log.createdAt), 'HH:mm')}
          </div>
        </div>
      ))}
    </div>
  );
}
