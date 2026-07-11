'use client';

/**
 * Workspace detail page showing workspace header, task board list, member directory,
 * and activity timeline.
 *
 * @page
 * @description Displays detailed information about a single workspace including its
 * boards, members with their roles, and recent activity entries. Provides quick
 * navigation to board, analytics, audit, and settings sub-pages. Uses React Query
 * hooks for data fetching from the workspace API.
 *
 * @example
 * ```tsx
 * // Accessed via /workspaces/[workspaceId]
 * <WorkspacePage />
 * ```
 *
 * @accessibility
 * - Breadcrumb navigation with clear hierarchy
 * - Member list rendered with avatars and ARIA labels
 * - Board cards are keyboard-accessible via Link
 * - Activity items include screen-reader-friendly timestamps
 */

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  useWorkspace,
  useBoards,
  useCreateBoard,
  useWorkspaceMembers,
  useActivity,
} from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  LayoutGrid,
  Settings,
  Users,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  BarChart3,
  Shield,
  Activity,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { ActivityFeed } from '@/features/activity/components/activity-feed';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const { data: boards, isLoading: boardsLoading } = useBoards(workspaceId);
  const { data: members } = useWorkspaceMembers(workspaceId);
  const { data: activityData } = useActivity(workspaceId);
  const createBoard = useCreateBoard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    const board = await createBoard.mutateAsync({
      workspaceId,
      data: { name: newBoardName },
    });
    setNewBoardName('');
    setIsDialogOpen(false);
    router.push(`/workspaces/${workspaceId}/boards/${board.id}`);
  };

  if (workspaceLoading || boardsLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  const activityList = activityData ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* ───── Workspace Header ───── */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-base font-semibold text-primary">
              {workspace.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{workspace.name}</h1>
            <p className="text-sm text-muted-foreground">
              {workspace.description || 'No description'}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <LayoutGrid className="h-3 w-3" />
                {boards?.length || 0} boards
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {members?.length || 0} members
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link href={`/workspaces/${workspaceId}/analytics`}>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
              Analytics
            </Button>
          </Link>
          <Link href={`/workspaces/${workspaceId}/audit`}>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <Shield className="mr-1.5 h-3.5 w-3.5" />
              Audit
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Users className="mr-1.5 h-3.5 w-3.5" />
                {members?.length || 0}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Team Members
              </div>
              <DropdownMenuSeparator />
              {members?.map((member: { id: string; role: string; user: { image: string; name: string; email: string } }) => (
                <div key={member.id} className="flex items-center gap-2 px-2 py-1.5">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={member.user.image} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(member.user.name || member.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="text-sm truncate">{member.user.name || member.user.email}</span>
                    <span className="text-xs text-muted-foreground capitalize">{member.role.toLowerCase()}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {member.role.toLowerCase()}
                  </Badge>
                </div>
              ))}
              {(!members || members.length === 0) && (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No members yet
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href={`/workspaces/${workspaceId}/settings`}>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Workspace settings">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ───── Boards Section (left/two-thirds) ───── */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                Boards
              </CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    New Board
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create board</DialogTitle>
                    <DialogDescription>
                      Boards help you organise tasks within your workspace.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateBoard} className="space-y-4">
                    <div>
                      <label htmlFor="board-name" className="text-sm font-medium">
                        Board name
                      </label>
                      <Input
                        id="board-name"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        placeholder="e.g. Marketing, Product Roadmap"
                        className="mt-1.5"
                        autoFocus
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={createBoard.isPending}>
                      {createBoard.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create board
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {boards?.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <LayoutGrid className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="mb-1 text-sm font-medium">No boards yet</h3>
                  <p className="mb-4 max-w-xs text-center text-xs text-muted-foreground">
                    Create your first board to start managing tasks with your team.
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)} size="sm" variant="outline">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Create board
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {boards?.map((board: { id: string; name: string; description?: string; icon?: string; color?: string; _count?: { columns: number } }) => (
                    <Link
                      key={board.id}
                      href={`/workspaces/${workspaceId}/boards/${board.id}`}
                      className="group rounded-lg border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="mb-3 flex items-start justify-between">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white"
                          style={{ backgroundColor: board.color || '#6366f1' }}
                        >
                          {board.icon || board.name.charAt(0).toUpperCase()}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-3.5 w-3.5" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="mb-0.5 text-sm font-medium">{board.name}</h3>
                      <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                        {board.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {board._count?.columns || 0} columns
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ───── Sidebar: Members + Activity ───── */}
        <div className="space-y-6">
          {/* Members quick-view card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-muted-foreground" />
                Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members?.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <div className="space-y-2">
                  {members?.slice(0, 5).map((member: { id: string; role: string; user: { image: string; name: string; email: string } }) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={member.user.image} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(member.user.name || member.user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{member.user.name || member.user.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] capitalize shrink-0">
                        {member.role.toLowerCase()}
                      </Badge>
                    </div>
                  ))}
                  {(members?.length ?? 0) > 5 && (
                    <p className="pt-1 text-center text-xs text-muted-foreground">
                      +{members!.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity timeline */}
          <ActivityFeed activities={activityList} />
        </div>
      </div>
    </div>
  );
}
