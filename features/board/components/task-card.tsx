'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
} from 'lucide-react';
import { TaskWithDetails } from '@/types';
import { getInitials, formatDate } from '@/lib/utils';
import { useCreateComment, useUpdateTask, useDeleteTask } from '@/hooks/use-api';
import { usePresenceStore } from '@/stores/presence-store';

interface TaskCardProps {
  task: TaskWithDetails;
  workspaceId: string;
  boardId: string;
  isDragging?: boolean;
}

export function TaskCard({ task, workspaceId, boardId, isDragging }: TaskCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();
  const createComment = useCreateComment();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { getTypingUsers } = usePresenceStore();

  const typingUsers = getTypingUsers(task.id);

  const handleSave = async () => {
    await updateTask.mutateAsync({
      taskId: task.id,
      data: { title, description },
    });
    setIsEditing(false);
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
  };

  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id);
    setIsOpen(false);
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    await createComment.mutateAsync({ taskId: task.id, content: comment });
    setComment('');
    queryClient.invalidateQueries({ queryKey: ['board', boardId] });
  };

  const priorityStyles: Record<string, string> = {
    urgent: 'bg-destructive/10 text-destructive border-destructive/20',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <>
      <div
        className={`rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm ${isDragging ? 'shadow-md' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        {task.priority && (
          <span
            className={`mb-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityStyles[task.priority] || ''}`}
          >
            {task.priority}
          </span>
        )}

        <p className="text-sm font-medium">{task.title}</p>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {task.assignee && (
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignee.image || undefined} />
                <AvatarFallback className="text-[8px]">
                  {getInitials(task.assignee.name || '')}
                </AvatarFallback>
              </Avatar>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
          {task._count?.comments ? (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          ) : null}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-base font-medium"
                  autoFocus
                />
              ) : (
                <span className="text-base">{task.title}</span>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="mt-2"
                  rows={3}
                />
              ) : (
                task.description || 'No description'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {task.assignee && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={task.assignee.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(task.assignee.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.assignee.name}</span>
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(!isEditing)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    {isEditing ? 'Cancel edit' : 'Edit'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={updateTask.isPending}>
                  Save changes
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : null}

            <div className="border-t pt-4">
              <h4 className="mb-2 text-sm font-medium">Comments</h4>

              {typingUsers.length > 0 && (
                <p className="mb-2 text-xs text-muted-foreground">
                  {typingUsers.map((u) => u.name).join(', ')} typing...
                </p>
              )}

              <div className="space-y-3">
                {task.comments?.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={c.author.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(c.author.name || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{c.author.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(c.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[60px] text-sm"
                />
              </div>
              <Button
                onClick={handleAddComment}
                disabled={!comment.trim() || createComment.isPending}
                size="sm"
                className="mt-2"
              >
                Add comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
