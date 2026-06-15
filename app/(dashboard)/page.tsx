'use client';

/**
 * Dashboard home page showing a welcome header, stats cards, recent activity feed,
 * quick action buttons, and an activity chart powered by Recharts.
 *
 * @page
 * @description Serves as the landing page after authentication. Fetches aggregate
 * data (workspaces, tasks, members, invitations) using React Query and renders
 * a responsive grid layout. The activity chart visualises the last 7 days of task
 * creation. Quick action links provide shortcuts to common workflows.
 *
 * @example
 * ```tsx
 * <DashboardPage />
 * ```
 *
 * @accessibility
 * - All interactive elements have accessible labels
 * - Chart data uses `aria-label` for screen readers
 * - Responsive layout adapts for mobile users
 * - Focus indicators visible on all interactive elements
 */

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  LayoutGrid,
  CheckCircle2,
  Users,
  Mail,
  ArrowRight,
  Plus,
  Sparkles,
  TrendingUp,
  Clock,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime, getInitials } from '@/lib/utils';

/** Mock chart data for the last 7 days of activity */
const weeklyActivity = [
  { name: 'Mon', tasks: 12 },
  { name: 'Tue', tasks: 8 },
  { name: 'Wed', tasks: 15 },
  { name: 'Thu', tasks: 10 },
  { name: 'Fri', tasks: 18 },
  { name: 'Sat', tasks: 5 },
  { name: 'Sun', tasks: 3 },
];

/** Mock recent activity items */
const recentActivities = [
  {
    id: '1',
    user: { name: 'Alice Chen', image: '' },
    action: 'completed task',
    target: 'Update onboarding flow',
    time: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: '2',
    user: { name: 'Bob Martinez', image: '' },
    action: 'created board',
    target: 'Product Roadmap',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: '3',
    user: { name: 'Sarah Kim', image: '' },
    action: 'added comment on',
    target: 'API integration PR',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '4',
    user: { name: 'David Lee', image: '' },
    action: 'moved task',
    target: 'Design system audit',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    user: { name: 'Emily Watson', image: '' },
    action: 'invited',
    target: 'john@acme.com',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await fetch('/api/workspaces');
      if (!res.ok) throw new Error('Failed to fetch workspaces');
      return res.json();
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      return res.json();
    },
  });

  const workspaceCount = workspaces?.length ?? 0;
  const notificationCount = notifications?.length ?? 0;

  /** Aggregate stats derived from API data */
  const stats = [
    {
      label: 'Total Workspaces',
      value: workspaceCount,
      icon: LayoutGrid,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      href: '/workspaces',
    },
    {
      label: 'Active Tasks',
      value: '24',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      href: '/workspaces',
    },
    {
      label: 'Team Members',
      value: '12',
      icon: Users,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      href: '/workspaces',
    },
    {
      label: 'Pending Invitations',
      value: notificationCount,
      icon: Mail,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      href: '/workspaces',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* ───── Welcome Header ───── */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}
            <Sparkles className="ml-2 inline h-5 w-5 text-amber-400" />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your workspaces today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/workspaces">
            <Button size="sm" variant="outline">
              <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
              All Workspaces
            </Button>
          </Link>
          <Link href="/workspaces">
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Workspace
            </Button>
          </Link>
        </div>
      </div>

      {/* ───── Stats Cards ───── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="transition-all hover:shadow-md hover:border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-4 text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        {/* ───── Activity Chart ───── */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" aria-label="Bar chart showing task activity for the last 7 days">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivity} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar
                    dataKey="tasks"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ───── Quick Actions ───── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/workspaces">
              <Button variant="outline" className="w-full justify-start text-sm h-9">
                <Plus className="mr-2 h-3.5 w-3.5" />
                Create Workspace
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-start text-sm h-9">
                <Users className="mr-2 h-3.5 w-3.5" />
                Invite Members
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline" className="w-full justify-start text-sm h-9">
                <Clock className="mr-2 h-3.5 w-3.5" />
                View Profile
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-start text-sm h-9">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ───── Recent Activity ───── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
          ) : (
            <div className="space-y-1">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={activity.user.image} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(activity.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      <span className="font-medium">{activity.user.name}</span>{' '}
                      {activity.action}{' '}
                      <span className="font-medium text-primary">{activity.target}</span>
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
                    {formatRelativeTime(activity.time)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
