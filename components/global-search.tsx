'use client';

import { useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from 'cmdk';
import { useRouter, useParams } from 'next/navigation';
import {
  Plus,
  Layout,
  Search,
  Settings,
  Users,
  BarChart3,
  ClipboardList,
  CheckSquare,
  Tag,
} from 'lucide-react';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaces: any[];
  boards: any[];
  tasks?: any[];
}

export function GlobalSearch({
  open,
  onOpenChange,
  workspaces,
  boards,
  tasks = [],
}: GlobalSearchProps) {
  const router = useRouter();
  const params = useParams();
  const [search, setSearch] = useState('');

  const handleSelect = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const filteredWorkspaces = workspaces.filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBoards = boards.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  const filteredTasks = tasks.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect('/workspaces')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workspace
          </CommandItem>
          <CommandItem
            onSelect={() =>
              handleSelect(
                params.workspaceId
                  ? `/workspaces/${params.workspaceId}/analytics`
                  : '/workspaces'
              )
            }
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            View Analytics
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Workspaces">
          {filteredWorkspaces.map((workspace) => (
            <CommandItem
              key={workspace.id}
              onSelect={() => handleSelect(`/workspaces/${workspace.id}`)}
            >
              <Layout className="mr-2 h-4 w-4" />
              {workspace.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Boards">
          {filteredBoards.map((board) => (
            <CommandItem
              key={board.id}
              onSelect={() => handleSelect(`/workspaces/${board.workspaceId}/boards/${board.id}`)}
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              {board.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Tasks">
          {filteredTasks.slice(0, 5).map((task) => (
            <CommandItem
              key={task.id}
              onSelect={() =>
                handleSelect(
                  `/workspaces/${task.column?.board?.workspaceId}/boards/${task.column?.boardId}`
                )
              }
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              {task.title}
              {task.priority && <Tag className="ml-auto h-3 w-3 text-muted-foreground" />}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => handleSelect('/profile')}>
            <Settings className="mr-2 h-4 w-4" />
            Profile Settings
          </CommandItem>
          {params.workspaceId && (
            <CommandItem
              onSelect={() => handleSelect(`/workspaces/${params.workspaceId}/settings`)}
            >
              <Users className="mr-2 h-4 w-4" />
              Workspace Settings
            </CommandItem>
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
