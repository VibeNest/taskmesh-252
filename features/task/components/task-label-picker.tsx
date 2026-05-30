'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Tag } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface TaskLabelPickerProps {
  labels: Label[];
  availableLabels: Label[];
  onAdd: (labelId: string) => void;
  onRemove: (labelId: string) => void;
  onCreateLabel?: (name: string, color: string) => void;
}

export function TaskLabelPicker({
  labels,
  availableLabels,
  onAdd,
  onRemove,
}: TaskLabelPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const unassignedLabels = availableLabels.filter((al) => !labels.some((l) => l.id === al.id));

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
            <button onClick={() => onRemove(label.id)} className="ml-0.5 hover:opacity-70">
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        <button
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-accent"
          onClick={() => setShowPicker(!showPicker)}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {showPicker && (
        <div className="animate-scale-in space-y-0.5 rounded-md border bg-card p-1.5">
          {unassignedLabels.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">No more labels available</p>
          ) : (
            unassignedLabels.map((label) => (
              <button
                key={label.id}
                onClick={() => {
                  onAdd(label.id);
                  setShowPicker(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
              >
                <Tag className="h-3 w-3" style={{ color: label.color }} />
                <span className="text-xs">{label.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
