'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X, Search, User } from 'lucide-react';

interface TaskFiltersProps {
  members: any[];
  onFilterChange: (filters: TaskFilterState) => void;
}

export interface TaskFilterState {
  search: string;
  assignee: string;
  priority: string;
  labels: string[];
}

export function TaskFilters({ members, onFilterChange }: TaskFiltersProps) {
  const [filters, setFilters] = useState<TaskFilterState>({
    search: '',
    assignee: 'all',
    priority: 'all',
    labels: [],
  });
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof TaskFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = { search: '', assignee: 'all', priority: 'all', labels: [] };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const hasActiveFilters =
    filters.search || filters.assignee !== 'all' || filters.priority !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-8"
          />
        </div>

        <Button
          variant={hasActiveFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="mr-1 h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-4 w-4 rounded-full p-0 text-[10px]">
              {[filters.assignee !== 'all', filters.priority !== 'all'].filter(Boolean).length}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 rounded-lg border bg-card p-3">
          <div className="w-48">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Assignee</label>
            <Select
              value={filters.assignee}
              onValueChange={(value) => updateFilter('assignee', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map((member: any) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.user?.name || member.user?.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Priority</label>
            <Select
              value={filters.priority}
              onValueChange={(value) => updateFilter('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

export function filterTasks(tasks: any[], filters: TaskFilterState) {
  return tasks.filter((task) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const matchesSearch =
        task.title.toLowerCase().includes(search) ||
        (task.description?.toLowerCase().includes(search) ?? false);
      if (!matchesSearch) return false;
    }

    if (filters.assignee && filters.assignee !== 'all') {
      if (filters.assignee === 'unassigned') {
        if (task.assigneeId) return false;
      } else {
        if (task.assigneeId !== filters.assignee) return false;
      }
    }

    if (filters.priority && filters.priority !== 'all') {
      const taskPriority = task.priority || 'none';
      if (taskPriority !== filters.priority) return false;
    }

    return true;
  });
}
