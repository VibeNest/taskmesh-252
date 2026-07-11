'use client';

import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Bell, Mail, Users, CheckSquare, AtSign, FileEdit, Layout } from 'lucide-react';

interface NotificationItemProps {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  onMarkRead?: (id: string) => void;
  className?: string;
}

const notificationIcons: Record<string, React.ReactNode> = {
  WORKSPACE_INVITATION: <Mail className="h-4 w-4 text-primary" />,
  WORKSPACE_MEMBER_JOINED: <Users className="h-4 w-4 text-emerald-500" />,
  TASK_ASSIGNED: <CheckSquare className="h-4 w-4 text-primary" />,
  TASK_MENTION: <AtSign className="h-4 w-4 text-yellow-500" />,
  COMMENT_MENTION: <AtSign className="h-4 w-4 text-yellow-500" />,
  TASK_UPDATED: <FileEdit className="h-4 w-4 text-primary" />,
  BOARD_CREATED: <Layout className="h-4 w-4 text-emerald-500" />,
};

export function NotificationItem({
  id,
  type,
  title,
  message,
  read,
  createdAt,
  onMarkRead,
  className,
}: NotificationItemProps) {
  return (
    <button
      type="button"
      className={cn(
        'w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-accent/50',
        !read && 'bg-accent/20',
        className
      )}
      onClick={() => onMarkRead?.(id)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-muted p-1.5">
          {notificationIcons[type] || <Bell className="h-3.5 w-3.5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{message}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt))} ago
          </p>
        </div>
        {!read && (
          <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
        )}
      </div>
    </button>
  );
}
