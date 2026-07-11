'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpdateWorkspace } from '@/hooks/use-api';
import { Loader2, Save } from 'lucide-react';

interface WorkspaceSettingsFormProps {
  workspaceId: string;
  name: string;
  description: string | null;
}

export function WorkspaceSettingsForm({
  workspaceId,
  name: initialName,
  description: initialDescription,
}: WorkspaceSettingsFormProps) {
  const updateWorkspace = useUpdateWorkspace();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? '');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateWorkspace.mutateAsync({
      workspaceId,
      data: { name, description },
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm">General</CardTitle>
        <CardDescription className="text-xs">
          Update your workspace name and description
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="ws-name" className="text-sm font-medium">
              Workspace name
            </label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="ws-desc" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="ws-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>
          <Button type="submit" size="sm" disabled={updateWorkspace.isPending}>
            {updateWorkspace.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Save className="mr-1.5 size-3.5" />
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
