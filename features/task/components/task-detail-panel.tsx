'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Calendar, User, Tag, CheckSquare, MessageSquare, Loader2, Send } from 'lucide-react';
import { SubtaskList } from './subtask-list';
import { TaskLabelPicker } from './task-label-picker';
import {
  useUpdateTask,
  useCreateSubtask,
  useDeleteSubtask,
  useAddTaskLabel,
  useRemoveTaskLabel,
  useCreateComment,
  useSubtasks,
  useTaskLabels,
  useWorkspaceLabels,
} from '@/hooks/use-api';

interface TaskDetailPanelProps {
  task: any;
  workspaceId: string;
  boardId: string;
  members: any[];
  onClose: () => void;
}

export function TaskDetailPanel({
  task,
  workspaceId,
  boardId,
  members,
  onClose,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [comment, setComment] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);

  const updateTask = useUpdateTask();
  const createSubtask = useCreateSubtask();
  const deleteSubtask = useDeleteSubtask();
  const addLabel = useAddTaskLabel();
  const removeLabel = useRemoveTaskLabel();
  const createComment = useCreateComment();

  const { data: subtasks } = useSubtasks(task.id);
  const { data: taskLabelsData } = useTaskLabels(task.id);
  const { data: availableLabels } = useWorkspaceLabels(workspaceId);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
  }, [task]);

  const handleTitleSave = () => {
    if (title.trim() && title !== task.title) {
      updateTask.mutate({ taskId: task.id, data: { title: title.trim() } });
    }
    setEditingTitle(false);
  };

  const handleDescriptionSave = () => {
    updateTask.mutate({ taskId: task.id, data: { description } });
  };

  const handleToggleSubtask = (id: string, completed: boolean) => {
    // Optimistic update would go here, for now just call the API
  };

  const handleCreateSubtask = (title: string) => {
    createSubtask.mutate({ taskId: task.id, data: { title } });
  };

  const handleDeleteSubtask = (id: string) => {
    deleteSubtask.mutate(id);
  };

  const handleAddLabel = (labelId: string) => {
    addLabel.mutate({ taskId: task.id, labelId });
  };

  const handleRemoveLabel = (labelId: string) => {
    removeLabel.mutate({ taskId: task.id, labelId });
  };

  const handleCreateComment = () => {
    if (comment.trim()) {
      createComment.mutate({ taskId: task.id, content: comment.trim() });
      setComment('');
    }
  };

  const priorityColors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-blue-100 text-blue-800',
    low: 'bg-green-100 text-green-800',
  };

  const labels = taskLabelsData?.map((tl: any) => tl.label) || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="fixed inset-0 bg-black/20" />

      <div
        className="relative z-50 flex h-full w-full max-w-xl flex-col bg-background shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {task.column?.name || 'Unknown column'}
            </Badge>
            {task.priority && (
              <Badge variant="outline" className={`text-xs ${priorityColors[task.priority] || ''}`}>
                {task.priority}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-4">
            {editingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') {
                    setTitle(task.title);
                    setEditingTitle(false);
                  }
                }}
                className="text-xl font-bold"
                autoFocus
              />
            ) : (
              <h2
                className="-m-1 cursor-pointer rounded p-1 text-xl font-bold hover:bg-accent/50"
                onClick={() => setEditingTitle(true)}
              >
                {title}
              </h2>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Assignee
                </label>
                <Select
                  value={task.assigneeId || 'unassigned'}
                  onValueChange={(value) => {
                    updateTask.mutate({
                      taskId: task.id,
                      data: { assigneeId: value === 'unassigned' ? undefined : value },
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members.map((member: any) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.user?.name || member.user?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </label>
                <Input
                  type="date"
                  value={task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    updateTask.mutate({
                      taskId: task.id,
                      data: { dueDate: e.target.value ? new Date(e.target.value) : undefined },
                    });
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  Priority
                </label>
                <Select
                  value={task.priority || 'none'}
                  onValueChange={(value) => {
                    updateTask.mutate({
                      taskId: task.id,
                      data: { priority: value === 'none' ? undefined : value },
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  Tags
                </label>
                <Input
                  placeholder="Add tags (comma separated)"
                  defaultValue={(task.tags || []).join(', ')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const tags = (e.target as HTMLInputElement).value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean);
                      updateTask.mutate({ taskId: task.id, data: { tags } });
                    }
                  }}
                />
              </div>
            </div>

            {labels.length > 0 && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Labels
                </label>
                <div className="flex flex-wrap gap-1">
                  {labels.map((label: any) => (
                    <span
                      key={label.id}
                      className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-white"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name}
                      <button
                        onClick={() => handleRemoveLabel(label.id)}
                        className="hover:opacity-70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {availableLabels && (
              <TaskLabelPicker
                labels={labels}
                availableLabels={availableLabels}
                onAdd={handleAddLabel}
                onRemove={handleRemoveLabel}
              />
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                placeholder="Add a description..."
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <CheckSquare className="h-4 w-4" />
                Subtasks
              </label>
              <SubtaskList
                subtasks={subtasks || []}
                onToggle={handleToggleSubtask}
                onCreate={handleCreateSubtask}
                onDelete={handleDeleteSubtask}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Comments
              </label>
              <div className="space-y-3">
                {task.comments?.map((comment: any) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={comment.author?.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {comment.author?.name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.author?.name || comment.author?.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">ME</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Write a comment..."
                      rows={2}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateComment();
                        }
                      }}
                    />
                    <div className="mt-1 flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleCreateComment}
                        disabled={!comment.trim() || createComment.isPending}
                      >
                        {createComment.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span className="ml-1">Comment</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t p-3 text-xs text-muted-foreground">
          <span>Created {format(new Date(task.createdAt), 'MMM dd, yyyy')}</span>
          <span>Updated {format(new Date(task.updatedAt), 'MMM dd, yyyy')}</span>
        </div>
      </div>
    </div>
  );
}
