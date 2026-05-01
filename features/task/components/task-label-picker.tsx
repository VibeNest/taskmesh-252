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
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
            <button onClick={() => onRemove(label.id)} className="ml-0.5 hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={() => setShowPicker(!showPicker)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {showPicker && (
        <div className="space-y-1 rounded-md border bg-card p-2">
          {unassignedLabels.length === 0 ? (
            <p className="text-xs text-muted-foreground">No more labels available</p>
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
                {label.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
