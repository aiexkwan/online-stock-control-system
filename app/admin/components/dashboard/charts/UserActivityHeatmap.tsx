'use client';

import React, { useMemo } from 'react';
import { gql, useGraphQLQuery } from '@/lib/graphql-client-stable';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const GET_USER_ACTIVITY = gql`
  query GetUserActivity($startDate: Datetime!, $endDate: Datetime!) {
    record_historyCollection(
      filter: {
        time: { gte: $startDate, lte: $endDate }
      }
      orderBy: [{ time: DescNullsLast }]
    ) {
      edges {
        node {
          id
          action
          time
          data_id {
            name
            department
          }
        }
      }
    }
  }
`;

interface UserActivityHeatmapProps {
  timeFrame?: any;
}

const UserActivityHeatmap = React.memo(function UserActivityHeatmap({ timeFrame }: UserActivityHeatmapProps) {
  // Use useMemo to prevent date objects from changing on every render
  const variables = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7); // Last 7 days
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  }, []); // Empty dependency array means dates are calculated only once

  const { data, loading, error } = useGraphQLQuery(GET_USER_ACTIVITY, variables);

  const heatmapData = useMemo(() => {
    if (!data?.record_historyCollection?.edges) return [];

    // Process data into hourly buckets for each user
    const activityMap = new Map<string, Map<number, number>>();
    
    data.record_historyCollection.edges.forEach(({ node }: any) => {
      const userName = node.data_id?.name || `User ${node.id}`;
      const hour = new Date(node.time).getHours();
      
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

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load activity data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Generate hour labels
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Get max activity for color scaling
  const maxActivity = Math.max(
    ...heatmapData.flatMap(user => 
      Array.from(user.hours.values())
    ),
    1
  );

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
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
        <p className="text-sm text-white/60">
          User activity distribution over the last 7 days (hourly statistics)
        </p>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Hour labels */}
          <div className="flex items-center mb-2">
            <div className="w-32 shrink-0" />
            <div className="flex gap-1">
              {hours.map(hour => (
                <div 
                  key={hour} 
                  className="w-6 text-center text-xs text-white/50"
                >
                  {hour}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap rows */}
          {heatmapData.map(({ user, hours }) => (
            <div key={user} className="flex items-center mb-1">
              <div className="w-32 shrink-0 text-sm truncate pr-2">
                {user}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 24 }, (_, hour) => {
                  const count = hours.get(hour) || 0;
                  return (
                    <div
                      key={hour}
                      className="w-6 h-6 rounded transition-all hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: getHeatColor(count) }}
                      title={`${user} - ${hour}:00: ${count} operations`}
                    />
                  );
                })}
              </div>
              <div className="ml-2 text-xs text-white/60">
                Total: {Array.from(hours.values()).reduce((sum, count) => sum + count, 0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(120, 120, 120, 0.1)' }} />
          <span>No Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.5)' }} />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(251, 146, 60, 0.6)' }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.9)' }} />
          <span>High</span>
        </div>
      </div>
    </div>
  );
});

export default UserActivityHeatmap;