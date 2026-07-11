'use client';

import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  useWorkspaces,
  useWorkspace,
  useBoards,
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/use-api';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const workspaceId = params?.workspaceId as string | undefined;

  const { data: workspaces = [] } = useWorkspaces();
  const { data: currentWorkspace } = useWorkspace(workspaceId ?? '');
  const { data: boards = [] } = useBoards(workspaceId ?? '');
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: { read: boolean }) => !n.read).length : 0;

  return (
    <DashboardLayout
      workspaces={workspaces}
      currentWorkspace={workspaceId ? currentWorkspace : undefined}
      boards={workspaceId ? boards : []}
      unreadNotifications={unreadCount}
      notifications={notifications}
      onMarkNotificationRead={(id) => markRead.mutate(id)}
      onMarkAllNotificationsRead={() => markAllRead.mutate()}
    >
      {children}
    </DashboardLayout>
  );
}
