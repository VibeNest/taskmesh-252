'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useWorkspace, useBoards, useCreateBoard } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

export default function BoardsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(workspaceId);
  const { data: boards, isLoading: boardsLoading } = useBoards(workspaceId);
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/workspaces/${workspaceId}`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {workspace.name}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Boards</span>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Boards</h1>
          <p className="text-sm text-muted-foreground">
            {boards?.length || 0} board{boards?.length !== 1 ? 's' : ''} in {workspace.name}
          </p>
        </div>

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
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            All Boards
          </CardTitle>
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
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {boards?.map(
                (board: {
                  id: string;
                  name: string;
                  description?: string;
                  icon?: string;
                  color?: string;
                  _count?: { columns: number };
                }) => (
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
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
