'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace, useBoards, useCreateBoard, useWorkspaceMembers } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  ArrowLeft,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  BarChart3,
  Shield,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const { data: boards, isLoading: boardsLoading } = useBoards(workspaceId);
  const { data: members } = useWorkspaceMembers(workspaceId);
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
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
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

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/workspaces"
            className="flex size-8 items-center justify-center rounded-md border text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-sm font-semibold text-primary">
              {workspace.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">{workspace.name}</h1>
            <p className="text-xs text-muted-foreground">
              {boards?.length || 0} boards &middot; {members?.length || 0} members
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link href={`/workspaces/${workspaceId}/analytics`}>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <BarChart3 className="mr-1.5 size-3.5" />
              Analytics
            </Button>
          </Link>
          <Link href={`/workspaces/${workspaceId}/audit`}>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              <Shield className="mr-1.5 size-3.5" />
              Audit
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                <Users className="mr-1.5 size-3.5" />
                {members?.length || 0}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {members?.map((member: { id: string; role: string; user: { image: string; name: string; email: string } }) => (
                <div key={member.id} className="flex items-center gap-2 px-2 py-1.5">
                  <Avatar className="size-6">
                    <AvatarImage src={member.user.image} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(member.user.name || member.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm">{member.user.name || member.user.email}</span>
                    <span className="text-xs text-muted-foreground">{member.role}</span>
                  </div>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href={`/workspaces/${workspaceId}/settings`}>
            <Button variant="ghost" size="icon" className="size-8">
              <Settings className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-medium">Boards</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 size-3.5" />
              New Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create board</DialogTitle>
              <DialogDescription>
                Boards help you organize tasks within your workspace.
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
                />
              </div>
              <Button type="submit" className="w-full" disabled={createBoard.isPending}>
                {createBoard.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Create board
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {boards?.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12">
          <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-muted">
            <LayoutGrid className="size-6 text-muted-foreground" />
          </div>
          <h3 className="mb-1 text-base font-medium">No boards yet</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
            Create your first board to start managing tasks with your team.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="mr-1.5 size-3.5" />
            Create board
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards?.map((board: { id: string; name: string; description?: string; icon?: string; color?: string; _count?: { columns: number } }) => (
            <Link key={board.id} href={`/workspaces/${workspaceId}/boards/${board.id}`}>
              <div className="group rounded-lg border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div
                    className="flex size-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: board.color || '#6366f1' }}
                  >
                    <span className="text-sm font-semibold text-white">
                      {board.icon || board.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                      <Button variant="ghost" size="icon" className="size-7">
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil className="mr-2 size-3.5" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 size-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="mb-0.5 text-sm font-medium">{board.name}</h3>
                <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                  {board.description || 'No description'}
                </p>
                <div className="text-xs text-muted-foreground">
                  {board._count?.columns || 0} columns
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
