'use client';

import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Mail, Users, CheckSquare, AtSign, FileEdit, Layout } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: any;
  createdAt: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notificationIcons: Record<string, React.ReactNode> = {
  WORKSPACE_INVITATION: <Mail className="h-4 w-4 text-blue-500" />,
  WORKSPACE_MEMBER_JOINED: <Users className="h-4 w-4 text-emerald-500" />,
  TASK_ASSIGNED: <CheckSquare className="h-4 w-4 text-purple-500" />,
  TASK_MENTION: <AtSign className="h-4 w-4 text-yellow-500" />,
  COMMENT_MENTION: <AtSign className="h-4 w-4 text-orange-500" />,
  TASK_UPDATED: <FileEdit className="h-4 w-4 text-blue-500" />,
  BOARD_CREATED: <Layout className="h-4 w-4 text-emerald-500" />,
};

export function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  open,
  onOpenChange,
}: NotificationCenterProps) {
  if (!open) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={() => onOpenChange(false)}>
      <div
        className="flex h-full w-full max-w-md flex-col overflow-hidden border-l bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <h2 className="text-sm font-medium">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Bell className="mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs">We will notify you when something happens</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`cursor-pointer px-4 py-3 transition-colors hover:bg-accent/50 ${
                    !notification.read ? 'bg-accent/20' : ''
                  }`}
                  onClick={() => onMarkRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-muted p-1.5">
                      {notificationIcons[notification.type] || <Bell className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{notification.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt))} ago
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
