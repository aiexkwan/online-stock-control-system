'use client';

import React, { useMemo } from 'react';
// Note: Migrated to REST API - GraphQL hooks removed
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface UserActivityHeatmapProps {
  timeFrame?: {
    start: Date;
    end: Date;
  };
}

const UserActivityHeatmap = React.memo(function UserActivityHeatmap({
  timeFrame,
}: UserActivityHeatmapProps) {
  // Feature flag removed - using REST API only

  // Use useMemo to prevent date objects from changing on every render
  const variables = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7); // Last 7 days
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, []); // Empty dependency array means dates are calculated only once

  // TODO: Replace with REST API call
  const { data, loading, error } = { data: null as unknown, loading: false, error: null };

  const heatmapData = useMemo(() => {
    // 類型守衛：檢查 data 是否有預期的結構
    if (
      !data ||
      typeof data !== 'object' ||
      !data ||
      !('historyCollection' in data) ||
      typeof data.historyCollection !== 'object' ||
      !data.historyCollection ||
      !('edges' in data.historyCollection) ||
      !Array.isArray((data.historyCollection as Record<string, unknown>).edges)
    ) {
      return [];
    }

    // Process data into hourly buckets for each user
    const activityMap = new Map<string, Map<number, number>>();

    const historyCollection = data.historyCollection as {
      edges: Array<{ node: Record<string, unknown> }>;
    };

    historyCollection.edges.forEach(({ node }: { node: Record<string, unknown> }) => {
      const userName =
        node.data_id && typeof node.data_id === 'object' && 'name' in node.data_id
          ? String(node.data_id.name)
          : `User ${node.uuid || 'Unknown'}`;
      // Safe date parsing with type guard
      const timeValue = node.time;
      let hour = 0;
      if (
        typeof timeValue === 'string' ||
        typeof timeValue === 'number' ||
        timeValue instanceof Date
      ) {
        try {
          hour = new Date(timeValue).getHours();
        } catch (error) {
          console.warn('Invalid date format in user activity data:', timeValue);
          hour = 0;
        }
      }

      if (!activityMap.has(userName)) {
        activityMap.set(userName, new Map());
      }

      const userHours = activityMap.get(userName)!;
      userHours.set(hour, (userHours.get(hour) || 0) + 1);
    });

    // Convert to array format and get top 10 active users
    const userActivities = Array.from(activityMap.entries())
      .map(([user, hours]) => {
        const totalActivity = Array.from(hours.values()).reduce((sum, count) => sum + count, 0);
        return { user, hours, totalActivity };
      })
      .sort((a, b) => b.totalActivity - a.totalActivity)
      .slice(0, 10);

    return userActivities;
  }, [data]);

  // Feature flag removed - using REST API only

  if (loading) {
    return (
      <div className='flex h-full w-full flex-col gap-4'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='flex-1' />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant='destructive'>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          Failed to load activity data: {(error as { message: string }).message}
        </AlertDescription>
      </Alert>
    );
  }

  // Generate hour labels
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Get max activity for color scaling
  const maxActivity = Math.max(...heatmapData.flatMap(user => Array.from(user.hours.values())), 1);

  const getHeatColor = (count: number) => {
    const intensity = count / maxActivity;
    if (intensity === 0) return 'rgba(120, 120, 120, 0.1)';
    if (intensity < 0.2) return 'rgba(34, 197, 94, 0.3)';
    if (intensity < 0.4) return 'rgba(34, 197, 94, 0.5)';
    if (intensity < 0.6) return 'rgba(251, 146, 60, 0.6)';
    if (intensity < 0.8) return 'rgba(239, 68, 68, 0.7)';
    return 'rgba(239, 68, 68, 0.9)';
  };

  return (
    <div className='flex h-full w-full flex-col'>
      <div className='mb-4'>
        <p className='text-sm text-white/60'>
          User activity distribution over the last 7 days (hourly statistics)
        </p>
      </div>

      <div className='flex-1 overflow-auto'>
        <div className='min-w-full'>
          {/* Hour labels */}
          <div className='mb-2 flex items-center'>
            <div className='w-32 shrink-0' />
            <div className='flex gap-1'>
              {hours.map((hour: number) => (
                <div key={hour} className='w-6 text-center text-xs text-white/50'>
                  {hour}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap rows */}
          {heatmapData.map(({ user, hours }) => (
            <div key={user} className='mb-1 flex items-center'>
              <div className='w-32 shrink-0 truncate pr-2 text-sm'>{user}</div>
              <div className='flex gap-1'>
                {Array.from({ length: 24 }, (_, hour) => {
                  const count = hours.get(hour) || 0;
                  return (
                    <div
                      key={hour}
                      className='h-6 w-6 cursor-pointer rounded transition-all hover:scale-110'
                      style={{ backgroundColor: getHeatColor(count) }}
                      title={`${user} - ${hour}:00: ${count} operations`}
                    />
                  );
                })}
              </div>
              <div className='ml-2 text-xs text-white/60'>
                Total: {Array.from(hours.values()).reduce((sum, count) => sum + count, 0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className='mt-4 flex items-center justify-center gap-4 text-xs'>
        <div className='flex items-center gap-2'>
          <div
            className='h-4 w-4 rounded'
            style={{ backgroundColor: 'rgba(120, 120, 120, 0.1)' }}
          />
          <span>No Activity</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-4 w-4 rounded' style={{ backgroundColor: 'rgba(34, 197, 94, 0.5)' }} />
          <span>Low</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-4 w-4 rounded' style={{ backgroundColor: 'rgba(251, 146, 60, 0.6)' }} />
          <span>Medium</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='h-4 w-4 rounded' style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)' }} />
          <span>High</span>
        </div>
      </div>
    </div>
  );
});

export default UserActivityHeatmap;
