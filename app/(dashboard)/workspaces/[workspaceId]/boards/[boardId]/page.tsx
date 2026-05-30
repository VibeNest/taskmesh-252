'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useBoard, useMoveTask, useWorkspaceMembers } from '@/hooks/use-api';
import { useBoardStore } from '@/stores/board-store';
import { useBoardSocket } from '@/hooks/use-socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { SortableTaskCard } from '@/features/board/components/sortable-task-card';
import { TaskCard } from '@/features/board/components/task-card';
import { ColumnHeader } from '@/features/board/components/column-header';
import {
  TaskFilters,
  TaskFilterState,
  filterTasks,
} from '@/features/board/components/task-filters';
import { TaskDetailPanel } from '@/features/task/components/task-detail-panel';
import { ArrowLeft, Plus, Loader2, Users } from 'lucide-react';
import type { TaskWithDetails } from '@/types';

export default function BoardPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const boardId = params.boardId as string;

  const { data: boardData, isLoading } = useBoard(workspaceId, boardId);
  const { data: members } = useWorkspaceMembers(workspaceId);
  const { board, setBoard, moveTask: storeMoveTask } = useBoardStore();
  const { emitTaskMove } = useBoardSocket(boardId);
  const moveTask = useMoveTask();

  const [activeTask, setActiveTask] = useState<TaskWithDetails | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState<string | null>(null);

  const [filters, setFilters] = useState<TaskFilterState>({
    search: '',
    assignee: 'all',
    priority: 'all',
    labels: [],
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (boardData) {
      setBoard(boardData);
    }
  }, [boardData, setBoard]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeColumn = board?.columns.find((col) =>
      col.tasks.some((task) => task.id === active.id)
    );
    const task = activeColumn?.tasks.find((task) => task.id === active.id);
    if (task) {
      setActiveTask(task as TaskWithDetails);
    }
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over || !board) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const sourceColumn = board.columns.find((col) =>
        col.tasks.some((task) => task.id === activeId)
      );

      let destinationColumn = board.columns.find((col) =>
        col.tasks.some((task) => task.id === overId)
      );

      if (!destinationColumn) {
        destinationColumn = board.columns.find((col) => col.id === overId);
      }

      if (!sourceColumn || !destinationColumn) return;

      const sourceTaskIds = sourceColumn.tasks.map((t) => t.id);
      const destTaskIds = destinationColumn.tasks.map((t) => t.id);

      let newSourceTaskIds: string[];
      let newDestTaskIds: string[];
      let newPosition: number;

      if (sourceColumn.id === destinationColumn.id) {
        const oldIndex = sourceTaskIds.indexOf(activeId);
        const newIndex = destTaskIds.indexOf(overId);

        if (oldIndex === newIndex) return;

        newSourceTaskIds = [...sourceTaskIds];
        newSourceTaskIds.splice(oldIndex, 1);
        newSourceTaskIds.splice(newIndex, 0, activeId);
        newDestTaskIds = newSourceTaskIds;
        newPosition = newIndex;
      } else {
        const newIndex = destTaskIds.indexOf(overId);
        newSourceTaskIds = sourceTaskIds.filter((id) => id !== activeId);
        newDestTaskIds = [...destTaskIds];
        newDestTaskIds.splice(newIndex >= 0 ? newIndex : destTaskIds.length, 0, activeId);
        newPosition = newIndex >= 0 ? newIndex : destTaskIds.length;
      }

      storeMoveTask({
        taskId: activeId,
        sourceColumnId: sourceColumn.id,
        destinationColumnId: destinationColumn.id,
        newPosition,
      });

      try {
        await moveTask.mutateAsync({
          taskId: activeId,
          sourceColumnId: sourceColumn.id,
          destinationColumnId: destinationColumn.id,
          newPosition,
        });
        emitTaskMove({
          taskId: activeId,
          sourceColumnId: sourceColumn.id,
          destinationColumnId: destinationColumn.id,
          newPosition,
        });
      } catch (error) {
        console.error('Failed to move task:', error);
      }
    },
    [board, storeMoveTask, moveTask, emitTaskMove]
  );

  const handleAddTask = async (columnId: string) => {
    if (!newTaskTitle.trim()) return;
    setIsAddingTask(columnId);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columnId,
          title: newTaskTitle,
          boardId,
        }),
      });
      if (response.ok) {
        setNewTaskTitle('');
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsAddingTask(null);
    }
  };

  const handleTaskClick = (task: TaskWithDetails) => {
    setSelectedTask(task);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Board not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Link
            href={`/workspaces/${workspaceId}`}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-sm font-medium">{board.name}</h1>
            {board.description && (
              <p className="text-xs text-muted-foreground">{board.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Users className="mr-1.5 size-3.5" />
            Share
          </Button>
        </div>
      </header>

      <div className="border-b px-4 py-2">
        <TaskFilters members={members || []} onFilterChange={setFilters} />
      </div>

      <main className="flex-1 overflow-x-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-4">
            {board.columns.map((column) => (
              <div key={column.id} className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50">
                <ColumnHeader column={column} workspaceId={workspaceId} boardId={boardId} />

                <div className="flex-1 overflow-y-auto p-2">
                  <SortableContext
                    items={column.tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-2">
                      {filterTasks(column.tasks, filters).map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className="cursor-pointer"
                        >
                          <SortableTaskCard
                            task={task}
                            workspaceId={workspaceId}
                            boardId={boardId}
                          />
                        </div>
                      ))}
                    </div>
                  </SortableContext>

                  {isAddingTask === column.id ? (
                    <div className="mt-2 animate-fade-in rounded-lg border bg-card p-2">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title..."
                        className="mb-2 h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTask(column.id);
                          if (e.key === 'Escape') {
                            setIsAddingTask(null);
                            setNewTaskTitle('');
                          }
                        }}
                      />
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleAddTask(column.id)}>
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => {
                            setIsAddingTask(null);
                            setNewTaskTitle('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                      onClick={() => setIsAddingTask(column.id)}
                    >
                      <Plus className="size-3.5" />
                      Add task
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              className="flex h-10 w-72 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed text-xs text-muted-foreground hover:border-primary/30 hover:text-primary"
              onClick={() => {
                const name = prompt('Enter column name:');
                if (name) {
                  fetch(`/api/workspaces/${workspaceId}/boards/${boardId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'column',
                      data: { name },
                    }),
                  });
                }
              }}
            >
              <Plus className="size-3.5" />
              Add column
            </button>
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskCard task={activeTask} workspaceId={workspaceId} boardId={boardId} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          workspaceId={workspaceId}
          boardId={boardId}
          members={members || []}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
