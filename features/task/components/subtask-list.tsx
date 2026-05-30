'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface Subtask {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  position: number;
  assignee?: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
}

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle: (id: string, completed: boolean) => void;
  onCreate: (title: string) => void;
  onDelete: (id: string) => void;
}

export function SubtaskList({ subtasks, onToggle, onCreate, onDelete }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleCreate = () => {
    if (newTitle.trim()) {
      onCreate(newTitle.trim());
      setNewTitle('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setNewTitle('');
      setIsAdding(false);
    }
  };

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (totalCount === 0 && !isAdding) {
    return (
      <button
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Add subtask
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {totalCount > 0 && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium">
              {completedCount}/{totalCount}
            </span>
            <span className="text-[10px] text-muted-foreground">{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-0.5">
        {subtasks
          .sort((a, b) => a.position - b.position)
          .map((subtask) => (
            <div
              key={subtask.id}
              className="group flex items-center gap-2 rounded-md p-1.5 hover:bg-accent/50"
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={(checked) => onToggle(subtask.id, Boolean(checked))}
                className="h-3.5 w-3.5 flex-shrink-0"
              />
              <span
                className={`flex-1 text-sm ${
                  subtask.completed ? 'text-muted-foreground line-through' : ''
                }`}
              >
                {subtask.title}
              </span>
              {subtask.assignee && (
                <Avatar className="h-5 w-5">
                  <AvatarImage src={subtask.assignee.image || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {subtask.assignee.name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              )}
              <button
                className="flex h-5 w-5 items-center justify-center rounded opacity-0 hover:bg-accent group-hover:opacity-100"
                onClick={() => onDelete(subtask.id)}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          ))}
      </div>

      {isAdding && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add a subtask..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-xs"
            autoFocus
          />
          <Button size="sm" className="h-7 text-xs" onClick={handleCreate} disabled={!newTitle.trim()}>
            Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setNewTitle('');
              setIsAdding(false);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {!isAdding && totalCount > 0 && (
        <button
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add subtask
        </button>
      )}
    </div>
  );
}
