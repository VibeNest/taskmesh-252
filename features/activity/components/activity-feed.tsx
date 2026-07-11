'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityItem } from './activity-item';
import { Clock } from 'lucide-react';

interface ActivityEntry {
  id: string;
  action: string;
  user: {
    name: string | null;
    image: string | null;
  };
  createdAt: string;
}

interface ActivityFeedProps {
  activities: ActivityEntry[];
  className?: string;
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Clock className="mb-2 h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/60">
              Activity will appear as team members make changes.
            </p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {activities.map((item, idx) => (
              <ActivityItem
                key={item.id}
                id={item.id}
                action={item.action}
                user={item.user}
                createdAt={item.createdAt}
                isLast={idx === activities.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
