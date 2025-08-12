/**
 * Vertical Timeline Card - Activity History
 * 使用現代化 Timeline UI 顯示活動記錄
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Clock, RefreshCw, User, Package, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@apollo/client';
import { GET_RECORD_HISTORY } from '@/lib/graphql/queries/record-history.graphql';
import { Timeline } from '../ui/timeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VerticalTimelineCardProps } from '../types/ui-navigation';

// Merged timeline item interface from GraphQL
interface MergedTimelineItem {
  id: string;
  operatorId: number;
  operatorName: string;
  action: string;
  count: number;
  palletNumbers: string[];
  timeStart: string;
  timeEnd: string;
  remark?: string;
  duration?: number;
  efficiency?: number;
  locations?: string[];
  isSequential?: boolean;
}

// Debounce hook for filter inputs
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Get action icon and color based on action type
const getActionIconAndColor = (action: string) => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('qc')) {
    return { 
      icon: <CheckCircle className="h-3 w-3" />,
      dotColor: 'bg-green-400'
    };
  }
  if (actionLower.includes('grn')) {
    return { 
      icon: <Package className="h-3 w-3" />,
      dotColor: 'bg-purple-400'
    };
  }
  if (actionLower.includes('error')) {
    return { 
      icon: <AlertCircle className="h-3 w-3" />,
      dotColor: 'bg-orange-400'
    };
  }
  if (actionLower.includes('upload')) {
    return { 
      icon: <Upload className="h-3 w-3" />,
      dotColor: 'bg-blue-400'
    };
  }
  if (actionLower.includes('transfer')) {
    return { 
      icon: <RefreshCw className="h-3 w-3" />,
      dotColor: 'bg-yellow-400'
    };
  }
  if (actionLower.includes('void')) {
    return { 
      icon: <AlertCircle className="h-3 w-3" />,
      dotColor: 'bg-red-400'
    };
  }
  if (actionLower.includes('print')) {
    return { 
      icon: <Package className="h-3 w-3" />,
      dotColor: 'bg-cyan-400'
    };
  }
  
  return { 
    icon: <User className="h-3 w-3" />,
    dotColor: 'bg-gray-400'
  };
};

export const VerticalTimelineCard: React.FC<VerticalTimelineCardProps> = ({
  height = '600px',
  className,
  isEditMode = false,
  limit = 10,
}) => {
  // State management
  const [nameFilter, setNameFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [palletFilter, setPalletFilter] = useState('');
  const displayCount = limit; // Use limit directly as Timeline component handles pagination

  // Debounce filters to reduce API calls
  const debouncedNameFilter = useDebounce(nameFilter, 300);
  const debouncedActionFilter = useDebounce(actionFilter, 300);
  const debouncedPalletFilter = useDebounce(palletFilter, 300);

  // Build GraphQL query variables
  const queryVariables = useMemo(() => ({
    filters: {
      ...(debouncedNameFilter && {
        operatorName: debouncedNameFilter,
      }),
      ...(debouncedActionFilter && {
        actions: [debouncedActionFilter],
      }),
      ...(debouncedPalletFilter && {
        pltNum: debouncedPalletFilter,
      }),
    },
    pagination: {
      limit: displayCount,
      offset: 0,
    },
    sorting: {
      field: 'TIME_START',
      direction: 'DESC',
    },
    mergingConfig: {
      timeWindowMinutes: 0, // Not used in new logic, but kept for compatibility
      sameOperatorOnly: true,
      sameActionOnly: true,
      minOperationsToMerge: 1, // Merge even single operations for consistent display
      maxOperationsPerGroup: 100,
    },
  }), [debouncedNameFilter, debouncedActionFilter, debouncedPalletFilter, displayCount]);

  // GraphQL query
  const { data, loading, error, refetch } = useQuery(GET_RECORD_HISTORY, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Transform data for Timeline component
  const timelineItems = useMemo(() => {
    if (!data?.recordHistory?.mergedRecords) return [];
    
    return data.recordHistory.mergedRecords.map((record: MergedTimelineItem) => {
      // Format date and time
      const date = new Date(record.timeStart);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const formattedTime = `${day.toString().padStart(2, '0')}-${month} ${hours}:${minutes}`;

      // Format pallet info - show all pallets or range
      let palletInfo = '';
      if (record.palletNumbers && record.palletNumbers.length > 0) {
        if (record.palletNumbers.length === 1) {
          palletInfo = ` (${record.palletNumbers[0]})`;
        } else if (record.palletNumbers.length <= 3) {
          // For small number of pallets, show all
          palletInfo = ` (${record.palletNumbers.join(', ')})`;
        } else {
          // For many pallets, show first and last with count
          const first = record.palletNumbers[0];
          const last = record.palletNumbers[record.palletNumbers.length - 1];
          palletInfo = ` (${first} - ${last})`;
        }
      }

      // Build natural language title with color coding
      let naturalTitle = '';
      let titleColor = '';
      const operatorName = record.operatorName || `Operator ${record.operatorId}`;
      const action = record.action;
      const actionLower = action.toLowerCase();
      
      // Check if this is a merged record with multiple operations
      const isMerged = record.count > 1;
      let timeDisplay = '';
      
      if (isMerged) {
        // For merged records, show time span with full dates
        const endDate = new Date(record.timeEnd);
        const endDay = endDate.getDate();
        const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
        const endHours = endDate.getHours().toString().padStart(2, '0');
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
        const formattedEndTime = `${endDay.toString().padStart(2, '0')}-${endMonth} ${endHours}:${endMinutes}`;
        
        // Always show full date and time for both start and end
        timeDisplay = `${formattedTime} - ${formattedEndTime}`;
      } else {
        // Single record - just show single time
        timeDisplay = formattedTime;
      }
      
      // Convert action to more natural language with color coding
      if (actionLower.includes('order') && actionLower.includes('upload')) {
        naturalTitle = `${operatorName} uploaded order${palletInfo} at ${timeDisplay}`;
        titleColor = 'text-blue-400'; // Blue for uploads
      } else if (actionLower.includes('upload')) {
        // Generic upload without "order"
        const uploadType = actionLower.replace('upload', '').trim();
        naturalTitle = `${operatorName} uploaded ${uploadType}${palletInfo} at ${timeDisplay}`;
        titleColor = 'text-blue-400'; // Blue for uploads
      } else if (actionLower.includes('qc') || actionLower.includes('quality') || actionLower.includes('finished qc')) {
        // Handle both "QC" and "Finished QC"
        naturalTitle = `${operatorName} performed QC${palletInfo} at ${timeDisplay}`;
        titleColor = 'text-green-400'; // Green for QC
      } else if (actionLower.includes('grn')) {
        naturalTitle = `${operatorName} processed GRN${palletInfo} at ${timeDisplay}`;
        titleColor = 'text-purple-400'; // Purple for GRN
      } else if (actionLower.includes('transfer')) {
        naturalTitle = `${operatorName} transferred stock${palletInfo} at ${timeDisplay}`;
        titleColor = 'text-yellow-400'; // Yellow for transfers
      } else if (actionLower.includes('void')) {
        naturalTitle = `${operatorName} voided pallet${palletInfo} at ${timeDisplay}`;
        titleColor = 'text-red-400'; // Red for voids
      } else if (actionLower.includes('print')) {
        naturalTitle = `${operatorName} printed label${palletInfo} at ${timeDisplay}`;
        titleColor = 'text-cyan-400'; // Cyan for printing
      } else if (actionLower.includes('error')) {
        naturalTitle = `${operatorName} ${actionLower}${palletInfo} at ${timeDisplay}`;
        titleColor = 'text-orange-400'; // Orange for errors
      } else {
        // Default format for unknown actions - use original action text
        naturalTitle = `${operatorName} ${actionLower}${palletInfo} at ${timeDisplay}`;
        titleColor = 'text-gray-300'; // Light gray for default
      }

      // Remove count display - not needed per user request
      
      // Get icon and dot color
      const { icon, dotColor } = getActionIconAndColor(record.action);

      return {
        id: record.id,
        date: record.timeStart,
        title: naturalTitle,
        description: record.remark || undefined, // Only show remark if exists
        icon,
        className: titleColor, // Add color class for title
        dotClassName: dotColor, // Add color class for dot
      };
    });
  }, [data]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div 
      className={cn(
        "flex flex-col rounded-lg border",
        className
      )}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor: 'transparent',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        background: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}
    >
      <div className="p-4 pb-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-white/70" />
            <span className="font-semibold text-white">Record History</span>
          </div>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="icon"
            disabled={loading}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
        
        {/* Filter Inputs */}
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            placeholder="ID/Name filter"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:border-white/40"
          />
          <input
            type="text"
            placeholder="Action filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:border-white/40"
          />
          <input
            type="text"
            placeholder="Pallet filter"
            value={palletFilter}
            onChange={(e) => setPalletFilter(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm bg-white/10 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:border-white/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-0">
        {loading && timelineItems.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60"></div>
          </div>
        )}
        
        {error && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-red-400">Error loading data</p>
              <p className="text-xs text-white/60 mt-1">{error.message}</p>
            </div>
          </div>
        )}
        
        {!loading && !error && timelineItems.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/60">No records found</p>
          </div>
        )}
        
        {!loading && !error && timelineItems.length > 0 && (
          <div className="px-4 py-2">
            <Timeline
              items={timelineItems}
              initialCount={displayCount}
              showMoreText="Load More"
              showLessText="Show Less"
              className="max-w-full"
              lineClassName="border-white/20"
              titleClassName="text-sm font-medium text-white"
              descriptionClassName="text-xs text-white/70"
              buttonVariant="outline"
              buttonSize="sm"
              showAnimation={true}
              animationDuration={0.2}
              animationDelay={0.05}
            />
            
            {/* Loading more indicator */}
            {loading && timelineItems.length > 0 && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/60"></div>
              </div>
            )}
            
            {/* End of list indicator */}
            {displayCount >= 100 && (
              <div className="text-center py-4 text-sm text-white/60">
                Maximum 100 records displayed
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Export with display name for debugging
VerticalTimelineCard.displayName = 'VerticalTimelineCard';

export default VerticalTimelineCard;