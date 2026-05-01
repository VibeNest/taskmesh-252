'use client';

import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Mail, Users, CheckSquare, AtSign, FileEdit, Layout, Trash2 } from 'lucide-react';

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
  WORKSPACE_MEMBER_JOINED: <Users className="h-4 w-4 text-green-500" />,
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
        className="flex h-full w-full max-w-md flex-col overflow-hidden border-l bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h2 className="font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
              Mark all read
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Bell className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">We will notify you when something happens</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`cursor-pointer p-4 transition-colors hover:bg-accent/50 ${
                    !notification.read ? 'bg-accent/30' : ''
                  }`}
                  onClick={() => onMarkRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-muted p-2">
                      {notificationIcons[notification.type] || <Bell className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt))} ago
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
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
