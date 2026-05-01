'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { format, subDays } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
} from 'lucide-react';

interface AnalyticsData {
  tasks: any[];
  members: any[];
  activityLogs: any[];
  boards: any[];
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const priorityColors: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981',
};

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const stats = useMemo(() => {
    const totalTasks = data.tasks.length;
    const completedTasks = data.tasks.filter((t) => t.status === 'DONE').length;
    const inProgressTasks = data.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const blockedTasks = data.tasks.filter((t) => t.status === 'BLOCKED').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const totalMembers = data.members.length;
    const totalBoards = data.boards.length;
    const recentActivity = data.activityLogs.slice(0, 10);

    const now = new Date();
    const lastWeek = subDays(now, 7);
    const thisWeekTasks = data.tasks.filter((t) => new Date(t.createdAt) >= lastWeek).length;
    const lastWeekTasks = data.tasks.filter((t) => {
      const created = new Date(t.createdAt);
      return created >= subDays(now, 14) && created < lastWeek;
    }).length;
    const taskGrowth =
      lastWeekTasks > 0 ? Math.round(((thisWeekTasks - lastWeekTasks) / lastWeekTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      completionRate,
      totalMembers,
      totalBoards,
      taskGrowth,
      recentActivity,
    };
  }, [data]);

  const taskStatusData = useMemo(
    () => [
      { name: 'Todo', value: data.tasks.filter((t) => t.status === 'TODO').length },
      { name: 'In Progress', value: data.tasks.filter((t) => t.status === 'IN_PROGRESS').length },
      { name: 'In Review', value: data.tasks.filter((t) => t.status === 'IN_REVIEW').length },
      { name: 'Done', value: data.tasks.filter((t) => t.status === 'DONE').length },
      { name: 'Blocked', value: data.tasks.filter((t) => t.status === 'BLOCKED').length },
    ],
    [data.tasks]
  );

  const taskByPriorityData = useMemo(() => {
    const priorityCount: Record<string, number> = {};
    data.tasks.forEach((task) => {
      const priority = task.priority || 'none';
      priorityCount[priority] = (priorityCount[priority] || 0) + 1;
    });
    return Object.entries(priorityCount).map(([name, value]) => ({ name, value }));
  }, [data.tasks]);

  const dailyActivityData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStr = format(date, 'MMM dd');
      const dayTasks = data.tasks.filter(
        (t) => format(new Date(t.createdAt), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      const dayCompleted = dayTasks.filter((t) => t.status === 'DONE').length;
      return {
        date: dayStr,
        created: dayTasks.length,
        completed: dayCompleted,
      };
    });
    return days;
  }, [data.tasks]);

  const memberProductivityData = useMemo(() => {
    return data.members
      .slice(0, 8)
      .map((member: any) => ({
        name: member.user?.name || member.user?.email || 'Unknown',
        tasks: data.tasks.filter((t) => t.assigneeId === member.userId).length,
        completed: data.tasks.filter((t) => t.assigneeId === member.userId && t.status === 'DONE')
          .length,
      }))
      .sort((a, b) => b.tasks - a.tasks);
  }, [data.members, data.tasks]);

  const velocityData = useMemo(() => {
    const weeks = Array.from({ length: 4 }, (_, i) => {
      const weekStart = subDays(new Date(), (3 - i) * 7);
      const weekEnd = subDays(new Date(), (3 - i) * 7 + 7);
      const weekTasks = data.tasks.filter((t) => {
        const created = new Date(t.createdAt);
        return created >= weekStart && created < weekEnd;
      });
      return {
        week: `Week ${i + 1}`,
        velocity: weekTasks.filter((t) => t.status === 'DONE').length * 5,
      };
    });
    return weeks;
  }, [data.tasks]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {stats.taskGrowth >= 0 ? (
                <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              )}
              <span className={stats.taskGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                {stats.taskGrowth >= 0 ? '+' : ''}
                {stats.taskGrowth}%
              </span>
              <span className="ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="mt-1 text-xs text-muted-foreground">{stats.totalBoards} active boards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Tasks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blockedTasks}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.inProgressTasks} in progress
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyActivityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="2"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {taskStatusData.map((item, index) => (
                <Badge key={item.name} variant="outline" className="text-xs">
                  <span
                    className="mr-1 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {item.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Velocity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="velocity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Member Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={memberProductivityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="tasks" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
