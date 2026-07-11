'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ActivityItemProps {
  id: string;
  action: string;
  user: {
    name: string | null;
    image: string | null;
  };
  target?: string;
  createdAt: string;
  isLast?: boolean;
  className?: string;
}

export function ActivityItem({
  action,
  user,
  target,
  createdAt,
  isLast = false,
  className,
}: ActivityItemProps) {
  return (
    <div className={cn('relative flex gap-3 pb-4 pl-5', isLast && 'pb-0', className)}>
      {!isLast && (
        <div className="absolute left-[7px] top-3 h-full w-px bg-border" />
      )}
      <div className="absolute left-0 top-1.5 flex h-3.5 w-3.5 items-center justify-center">
        <div className="h-2 w-2 rounded-full bg-primary/40" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{user.name || 'Someone'}</span>{' '}
          <span className="text-muted-foreground">{action}</span>
          {target && (
            <>
              {' '}
              <span className="font-medium text-primary">{target}</span>
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(createdAt)}
        </p>
      </div>
    </div>
  );
}
