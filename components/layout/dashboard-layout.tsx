'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutGrid,
  BarChart3,
  Shield,
  Settings,
  Search,
  Bell,
  LogOut,
  User,
  Menu,
  X,
  Plus,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Home,
  FolderKanban,
} from 'lucide-react';
import { GlobalSearch } from '@/components/global-search';
import { NotificationCenter } from '@/components/notification-center';

interface Workspace {
  id: string;
  name: string;
}

interface Board {
  id: string;
  name: string;
  workspaceId?: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: unknown;
  createdAt: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  workspaces: Workspace[];
  currentWorkspace?: Workspace;
  boards?: Board[];
  unreadNotifications?: number;
  notifications?: Notification[];
  onMarkNotificationRead?: (id: string) => void;
  onMarkAllNotificationsRead?: () => void;
}

export function DashboardLayout({
  children,
  workspaces = [],
  currentWorkspace,
  boards = [],
  unreadNotifications = 0,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const handleMarkAllRead = useCallback(() => {
    onMarkAllNotificationsRead?.();
  }, [onMarkAllNotificationsRead]);

  const workspaceId = currentWorkspace?.id;

  const workspaceNavItems = workspaceId
    ? [
        { label: 'Boards', href: `/workspaces/${workspaceId}`, icon: LayoutGrid },
        { label: 'Analytics', href: `/workspaces/${workspaceId}/analytics`, icon: BarChart3 },
        { label: 'Audit Log', href: `/workspaces/${workspaceId}/audit`, icon: Shield },
        { label: 'Settings', href: `/workspaces/${workspaceId}/settings`, icon: Settings },
      ]
    : [];

  const globalNavItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Workspaces', href: '/workspaces', icon: FolderKanban },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const boardsWithWorkspace = boards.map((board) => ({
    ...board,
    workspaceId: board.workspaceId ?? workspaceId,
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <GlobalSearch
        open={searchOpen}
        onOpenChange={setSearchOpen}
        workspaces={workspaces}
        boards={boardsWithWorkspace}
      />

      <NotificationCenter
        notifications={notifications}
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        onMarkRead={onMarkNotificationRead || (() => {})}
        onMarkAllRead={handleMarkAllRead}
      />

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 hidden h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 md:flex',
          sidebarCollapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-sidebar-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && <span className="text-[15px] tracking-tight">TaskMesh</span>}
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-0.5 overflow-hidden p-2">
          <NavSection label="Menu" collapsed={sidebarCollapsed}>
            {globalNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                pathname={pathname}
                collapsed={sidebarCollapsed}
              />
            ))}
          </NavSection>

          {workspaceNavItems.length > 0 && (
            <NavSection label={currentWorkspace?.name ?? 'Workspace'} collapsed={sidebarCollapsed}>
              {workspaceNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  pathname={pathname}
                  collapsed={sidebarCollapsed}
                  exact={item.href === `/workspaces/${workspaceId}`}
                />
              ))}
            </NavSection>
          )}

          {!sidebarCollapsed && (
            <NavSection label="Workspaces" collapsed={false} className="mt-auto min-h-0 flex-1">
              <div className="mb-1 flex items-center justify-end px-1">
                <Link href="/workspaces">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-sidebar-muted hover:text-sidebar-foreground">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <div className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin">
                {workspaces.map((ws) => (
                  <Link
                    key={ws.id}
                    href={`/workspaces/${ws.id}`}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                      ws.id === workspaceId
                        ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                        : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                      {ws.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </Link>
                ))}
              </div>
            </NavSection>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex h-9 items-center justify-center border-t border-sidebar-border text-sidebar-muted transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>

      {/* Mobile sidebar */}
      {mobileSidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileSidebarOpen(false)} />
          <div className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar md:hidden">
            <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
              <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span>TaskMesh</span>
              </Link>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
              {globalNavItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  pathname={pathname}
                  collapsed={false}
                  onClick={() => setMobileSidebarOpen(false)}
                />
              ))}
              {workspaceNavItems.length > 0 && (
                <>
                  <div className="my-2 h-px bg-sidebar-border" />
                  {workspaceNavItems.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.label}
                      pathname={pathname}
                      collapsed={false}
                      exact={item.href === `/workspaces/${workspaceId}`}
                      onClick={() => setMobileSidebarOpen(false)}
                    />
                  ))}
                </>
              )}
              <div className="my-2 h-px bg-sidebar-border" />
              <p className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted">Workspaces</p>
              {workspaces.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/workspaces/${ws.id}`}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm',
                    ws.id === workspaceId ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-sidebar-muted'
                  )}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                    {ws.name?.[0]?.toUpperCase()}
                  </div>
                  {ws.name}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <div className={cn('flex flex-1 flex-col transition-all duration-200', sidebarCollapsed ? 'md:ml-[68px]' : 'md:ml-64')}>
        <header className="glass-header sticky top-0 z-20 flex h-14 items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {currentWorkspace && (
            <nav className="hidden items-center gap-1.5 text-sm sm:flex">
              <Link href="/workspaces" className="text-muted-foreground transition-colors hover:text-foreground">
                Workspaces
              </Link>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-medium">{currentWorkspace.name}</span>
            </nav>
          )}

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-8 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:bg-muted/70 sm:flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="ml-3 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>

          <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            )}
          </Button>

          <div className="relative">
            <button
              type="button"
              className="flex h-8 items-center gap-2 rounded-lg border bg-card pl-1 pr-2.5 transition-colors hover:bg-accent"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                  {session?.user?.name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[120px] truncate text-xs font-medium md:inline">
                {session?.user?.name?.split(' ')[0]}
              </span>
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1.5 w-52 animate-scale-in rounded-xl border bg-popover p-1 shadow-lg">
                  <div className="border-b px-3 py-2.5">
                    <p className="truncate text-sm font-medium">{session?.user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                  <Link href="/profile" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-accent" onClick={() => setProfileOpen(false)}>
                    <User className="h-3.5 w-3.5" />
                    Profile
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm hover:bg-accent" onClick={() => setProfileOpen(false)}>
                    <Settings className="h-3.5 w-3.5" />
                    Settings
                  </Link>
                  <div className="my-0.5 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function NavSection({
  label,
  collapsed,
  children,
  className,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-2', className)}>
      {!collapsed && (
        <p className="mb-1 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-sidebar-muted">{label}</p>
      )}
      {children}
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
  pathname,
  collapsed,
  exact,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pathname: string;
  collapsed: boolean;
  exact?: boolean;
  onClick?: () => void;
}) {
  const isActive = exact
    ? pathname === href
    : pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-all',
        isActive
          ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-sm'
          : 'text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
        collapsed && 'justify-center px-0'
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}
