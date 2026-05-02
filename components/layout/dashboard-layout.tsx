'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutGrid,
  BarChart3,
  Shield,
  Settings,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';
import { GlobalSearch } from '@/components/global-search';
import { NotificationCenter } from '@/components/notification-center';

interface DashboardLayoutProps {
  children: React.ReactNode;
  workspaces: any[];
  currentWorkspace?: any;
  unreadNotifications?: number;
  notifications?: any[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

export function DashboardLayout({
  children,
  workspaces = [],
  currentWorkspace,
  unreadNotifications = 0,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    onMarkAllNotificationsRead?.();
  }, [onMarkAllNotificationsRead]);

  const workspaceId = currentWorkspace?.id;

  const navItems = workspaceId
    ? [
        {
          label: 'Boards',
          href: `/workspaces/${workspaceId}`,
          icon: LayoutGrid,
        },
        {
          label: 'Analytics',
          href: `/workspaces/${workspaceId}/analytics`,
          icon: BarChart3,
        },
        {
          label: 'Audit Log',
          href: `/workspaces/${workspaceId}/audit`,
          icon: Shield,
        },
        {
          label: 'Settings',
          href: `/workspaces/${workspaceId}/settings`,
          icon: Settings,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        workspaces={workspaces}
        boards={[]}
      />

      <NotificationCenter
        notifications={notifications}
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        onMarkRead={onMarkNotificationRead || (() => {})}
        onMarkAllRead={handleMarkAllRead}
      />

      <header className="fixed left-0 right-0 top-0 z-30 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-full items-center gap-2 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Link href="/workspaces" className="flex items-center gap-2 font-bold">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span className="hidden sm:inline">TaskMesh</span>
          </Link>

          {currentWorkspace && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium">{currentWorkspace.name}</span>
            </>
          )}

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            Search...
            <kbd className="ml-2 hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium lg:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 text-[10px]"
              >
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </Badge>
            )}
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="text-xs">
                  {session?.user?.name?.[0]?.toUpperCase() ||
                    session?.user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm md:inline">{session?.user?.name}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border bg-popover p-1 shadow-md">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => setProfileOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside
        className={cn(
          'fixed left-0 top-14 z-20 hidden h-[calc(100vh-3.5rem)] w-64 flex-col border-r bg-background transition-all md:flex',
          sidebarOpen ? 'w-64' : 'w-14'
        )}
      >
        <div className="flex flex-1 flex-col gap-2 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                  isActive ? 'bg-accent font-medium' : 'text-muted-foreground',
                  !sidebarOpen && 'justify-center px-0'
                )}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}

          {sidebarOpen && (
            <>
              <div className="my-2 h-px bg-border" />
              <div className="flex-1 overflow-y-auto">
                <div className="mb-2 flex items-center justify-between px-3">
                  <span className="text-xs font-medium text-muted-foreground">Workspaces</span>
                  <Link href="/workspaces">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                {workspaces.map((ws: any) => (
                  <Link
                    key={ws.id}
                    href={`/workspaces/${ws.id}`}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent',
                      ws.id === workspaceId && 'bg-accent font-medium'
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                      {ws.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>

      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-64 border-r bg-background md:hidden">
            <div className="flex items-center justify-between border-b p-3">
              <span className="font-medium">Navigation</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-2 p-3">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
                      isActive ? 'bg-accent font-medium' : 'text-muted-foreground'
                    )}
                    onClick={() => setMobileSidebarOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="my-2 h-px bg-border" />
              <div className="text-xs font-medium text-muted-foreground">Workspaces</div>
              {workspaces.map((ws: any) => (
                <Link
                  key={ws.id}
                  href={`/workspaces/${ws.id}`}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent',
                    ws.id === workspaceId && 'bg-accent font-medium'
                  )}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                    {ws.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="truncate">{ws.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <main className={cn('pt-14 transition-all md:pl-0', sidebarOpen && 'md:pl-64')}>
        {children}
      </main>
    </div>
  );
}
