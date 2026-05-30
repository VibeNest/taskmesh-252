'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { ColumnWithTasks } from '@/types';

interface ColumnHeaderProps {
  column: ColumnWithTasks;
  workspaceId: string;
  boardId: string;
}

export function ColumnHeader({ column, workspaceId, boardId }: ColumnHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const queryClient = useQueryClient();

  const handleRename = async () => {
    if (name.trim() === column.name) {
      setIsEditing(false);
      return;
    }

    try {
      await fetch(`/api/columns/${column.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    } catch (error) {
      console.error('Failed to rename column:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this column and all its tasks?')) return;

    try {
      await fetch(`/api/columns/${column.id}`, {
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    } catch (error) {
      console.error('Failed to delete column:', error);
    }
  };

  return (
    <div className="flex items-center justify-between border-b px-3 py-2.5">
      {isEditing ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-7 text-sm"
          autoFocus
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') {
              setName(column.name);
              setIsEditing(false);
            }
          }}
        />
      ) : (
        <div className="flex items-center gap-2">
          <h3
            className="text-sm font-medium"
            onDoubleClick={() => setIsEditing(true)}
          >
            {column.name}
          </h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] text-muted-foreground">
            {column.tasks.length}
          </span>
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
