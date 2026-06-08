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
    <div className="flex min-h-screen bg-background">
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} workspaces={workspaces} boards={[]} />

      <NotificationCenter
        notifications={notifications}
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        onMarkRead={onMarkNotificationRead || (() => {})}
        onMarkAllRead={handleMarkAllRead}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 z-30 hidden h-full flex-col border-r bg-card transition-all duration-200 md:flex',
          sidebarCollapsed ? 'w-16' : 'w-60'
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Link href="/workspaces" className="flex items-center gap-2 font-semibold">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {!sidebarCollapsed && <span className="text-sm">TaskMesh</span>}
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-2">
          {/* Global navigation */}
          <GlobalNavLink
            href="/"
            icon={Home}
            label="Dashboard"
            pathname={pathname}
            collapsed={sidebarCollapsed}
          />
          <GlobalNavLink
            href="/profile"
            icon={User}
            label="Profile"
            pathname={pathname}
            collapsed={sidebarCollapsed}
          />
          <GlobalNavLink
            href="/settings"
            icon={Settings}
            label="Settings"
            pathname={pathname}
            collapsed={sidebarCollapsed}
          />

          <div className="my-2 h-px bg-border" />

          {navItems.length > 0 && (
            <>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent',
                      isActive ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground',
                      sidebarCollapsed && 'justify-center px-0'
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
              <div className="my-2 h-px bg-border" />
            </>
          )}

          {sidebarCollapsed && (
            <div className="my-2 h-px bg-border" />
          )}

          {!sidebarCollapsed && (
            <>
              <div className="mb-1 flex items-center justify-between px-2.5">
                <span className="text-xs font-medium text-muted-foreground">Workspaces</span>
                <Link href="/workspaces">
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Plus className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
              <div className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin">
                {workspaces.map((ws: any) => (
                  <Link
                    key={ws.id}
                    href={`/workspaces/${ws.id}`}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent',
                      ws.id === workspaceId && 'bg-accent font-medium'
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                      {ws.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="truncate text-muted-foreground">{ws.name}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex h-8 items-center justify-center border-t text-muted-foreground hover:text-foreground"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>

      {mobileSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 z-50 h-full w-60 border-r bg-card md:hidden">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Link href="/workspaces" className="flex items-center gap-2 font-semibold">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm">TaskMesh</span>
              </Link>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobileSidebarOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-1 p-2">
              <MobileNavLink href="/" icon={Home} label="Dashboard" pathname={pathname} onClick={() => setMobileSidebarOpen(false)} />
              <MobileNavLink href="/profile" icon={User} label="Profile" pathname={pathname} onClick={() => setMobileSidebarOpen(false)} />
              <MobileNavLink href="/settings" icon={Settings} label="Settings" pathname={pathname} onClick={() => setMobileSidebarOpen(false)} />

              <div className="my-2 h-px bg-border" />

              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent',
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
              <div className="mb-1 px-2.5 text-xs font-medium text-muted-foreground">Workspaces</div>
              {workspaces.map((ws: any) => (
                <Link
                  key={ws.id}
                  href={`/workspaces/${ws.id}`}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors hover:bg-accent',
                    ws.id === workspaceId && 'bg-accent font-medium'
                  )}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
                    {ws.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="truncate text-muted-foreground">{ws.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <div className={cn('flex flex-1 flex-col transition-all duration-200', sidebarCollapsed ? 'md:ml-16' : 'md:ml-60')}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {currentWorkspace && (
            <div className="flex items-center gap-2 text-sm">
              <Link href="/workspaces" className="text-muted-foreground hover:text-foreground">
                Workspaces
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{currentWorkspace.name}</span>
            </div>
          )}

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-1.5 h-3.5 w-3.5" />
            Search
            <kbd className="ml-2 flex h-4 items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[10px] font-medium">
              <span>⌘</span>K
            </kbd>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-4 w-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </span>
            )}
          </Button>

          <div className="relative">
            <button
              className="flex h-8 items-center gap-2 rounded-md border bg-card px-2 hover:bg-accent"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <Avatar className="h-5 w-5">
                <AvatarImage src={session?.user?.image || undefined} />
                <AvatarFallback className="text-[10px]">
                  {session?.user?.name?.[0]?.toUpperCase() ||
                    session?.user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-xs md:inline">{session?.user?.name}</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 animate-scale-in rounded-lg border bg-card p-1 shadow-lg">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => setProfileOpen(false)}
                >
                  <User className="h-3.5 w-3.5" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Link>
                <div className="my-0.5 h-px bg-border" />
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

/**
 * A sidebar navigation link used in the desktop sidebar.
 * Highlights when the current path matches the link href.
 */
function GlobalNavLink({
  href,
  icon: Icon,
  label,
  pathname,
  collapsed,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent',
        isActive ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground',
        collapsed && 'justify-center px-0'
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

/**
 * A navigation link used in the mobile sidebar drawer.
 * Highlights when the current path matches the link href.
 */
function MobileNavLink({
  href,
  icon: Icon,
  label,
  pathname,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pathname: string;
  onClick: () => void;
}) {
  const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors hover:bg-accent',
        isActive ? 'bg-accent font-medium' : 'text-muted-foreground'
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
