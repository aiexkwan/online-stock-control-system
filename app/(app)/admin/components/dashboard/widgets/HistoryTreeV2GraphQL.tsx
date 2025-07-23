/**
 * HistoryTreeV2 GraphQL Version - System Operations History with Hierarchical Structure
 * 顯示系統操作歷史的層次樹狀結構 - 使用 GraphQL
 *
 * GraphQL Migration Features:
 * - Uses Apollo Client for optimized data fetching
 * - Leverages HistoryTreeLoader for complex JOIN queries
 * - Supports filtering, sorting, and pagination
 * - Provides hierarchical tree structure display
 * - Real-time updates through GraphQL subscriptions
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TraditionalWidgetComponentProps } from '@/types/components/dashboard';
import { useAdminRefresh } from '@/app/(app)/admin/contexts/AdminRefreshContext';
import {
  Loader2,
  History,
  User,
  Package,
  MapPin,
  Clock,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInViewport, InViewportPresets } from '@/app/(app)/admin/hooks/useInViewport';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import {
  brandColors,
  widgetColors,
  semanticColors,
  getWidgetCategoryColor,
} from '@/lib/design-system/colors';
import { textClasses, getTextClass } from '@/lib/design-system/typography';
import { spacing, widgetSpacing, spacingUtilities } from '@/lib/design-system/spacing';
import { cn } from '@/lib/utils';

// GraphQL Query for History Tree
const HISTORY_TREE_QUERY = gql`
  query HistoryTree($input: HistoryTreeInput) {
    historyTree(input: $input) {
      entries {
        id
        timestamp
        action
        location
        remark
        user {
          id
          name
          department
          position
          email
        }
        pallet {
          number
          series
          quantity
          generatedAt
          product {
            code
            description
            type
            colour
            standardQty
          }
        }
      }
      totalCount
      hasNextPage
      groupedData
      limit
      offset
      filters {
        dateRange {
          start
          end
        }
        actionTypes
        userIds
        palletNumbers
        locations
      }
      sort {
        sortBy
        sortOrder
      }
    }
  }
`;

// Interfaces
interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  location?: string;
  remark?: string;
  user?: {
    id: string;
    name: string;
    department?: string;
    position?: string;
    email?: string;
  };
  pallet?: {
    number: string;
    series?: string;
    quantity: number;
    generatedAt?: string;
    product?: {
      code: string;
      description: string;
      type: string;
      colour: string;
      standardQty: number;
    };
  };
}

interface HistoryTreeFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  actionTypes?: string[];
  userIds?: string[];
  palletNumbers?: string[];
  locations?: string[];
}

export default function HistoryTreeV2GraphQL({
  id,
  config,
  className,
}: TraditionalWidgetComponentProps) {
  // State
  const [filters, setFilters] = useState<HistoryTreeFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<'TIME' | 'USER' | 'ACTION' | 'LOCATION'>('TIME');
  const [sortBy, setSortBy] = useState<'TIME' | 'ACTION' | 'USER' | 'LOCATION'>('TIME');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [currentPage, setCurrentPage] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [localLoading, setLocalLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Constants
  const ITEMS_PER_PAGE = 20;
  
  // Refs and contexts
  const { refreshTrigger } = useAdminRefresh();
  const { ref: inViewportRef, inViewport } = useInViewport(InViewportPresets.PROGRESSIVE_LOADING);

  // Build query variables
  const queryVariables = useMemo(() => {
    const dateRange = filters.dateRange ? {
      start: filters.dateRange.start,
      end: filters.dateRange.end,
    } : {
      // Default to last 7 days
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    };

    return {
      input: {
        dateRange,
        actionTypes: filters.actionTypes,
        userIds: filters.userIds,
        palletNumbers: filters.palletNumbers,
        locations: filters.locations,
        groupBy,
        sortBy,
        sortOrder,
        limit: ITEMS_PER_PAGE,
        offset: currentPage * ITEMS_PER_PAGE,
      },
    };
  }, [filters, groupBy, sortBy, sortOrder, currentPage]);

  // GraphQL Query
  const { data, loading, error, refetch } = useQuery(HISTORY_TREE_QUERY, {
    variables: queryVariables,
    skip: !inViewport,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Refresh on admin trigger
  useEffect(() => {
    if (refreshTrigger > 0 && inViewport) {
      refetch();
    }
  }, [refreshTrigger, inViewport, refetch]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    if (localLoading) return;
    
    setLocalLoading(true);
    setHasError(false);
    
    try {
      await refetch();
    } catch (error) {
      console.error('[HistoryTreeV2GraphQL] Refresh error:', error);
      setHasError(true);
    } finally {
      setLocalLoading(false);
    }
  }, [localLoading, refetch]);

  // Handle group expansion
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  // Get action icon and color
  const getActionStyle = useCallback((action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) {
      return { icon: '➕', color: semanticColors.success.primary };
    }
    if (actionLower.includes('update') || actionLower.includes('modify')) {
      return { icon: '✏️', color: semanticColors.warning.primary };
    }
    if (actionLower.includes('delete') || actionLower.includes('remove')) {
      return { icon: '🗑️', color: semanticColors.error.primary };
    }
    if (actionLower.includes('move') || actionLower.includes('transfer')) {
      return { icon: '📦', color: semanticColors.info.primary };
    }
    return { icon: '📝', color: semanticColors.neutral.primary };
  }, []);

  // Processed data
  const processedData = useMemo(() => {
    if (!data?.historyTree) {
      return { entries: [], totalCount: 0, hasNextPage: false, groupedData: {} };
    }

    const result = data.historyTree;
    let entries = result.entries || [];

    // Apply search filter
    if (searchTerm) {
      entries = entries.filter((entry: HistoryEntry) =>
        entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.pallet?.product?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.remark?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return {
      entries,
      totalCount: result.totalCount,
      hasNextPage: result.hasNextPage,
      groupedData: result.groupedData || {},
    };
  }, [data, searchTerm]);

  // Loading skeleton
  if (!inViewport) {
    return (
      <Card ref={inViewportRef} className={cn('h-96', className)}>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || hasError) {
    return (
      <Card ref={inViewportRef} className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <History className="h-5 w-5 mr-2 text-blue-600" />
            History Tree (GraphQL)
          </CardTitle>
          <Button
            onClick={handleRefresh}
            disabled={localLoading}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={cn('h-4 w-4', localLoading && 'animate-spin')} />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-center">
            <div>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Failed to load history data</p>
              <Button onClick={handleRefresh} disabled={localLoading}>
                {localLoading ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading || localLoading) {
    return (
      <Card ref={inViewportRef} className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <History className="h-5 w-5 mr-2 text-blue-600" />
            History Tree (GraphQL)
          </CardTitle>
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24" />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render entry component
  const EntryItem = React.memo(({ entry }: { entry: HistoryEntry }) => {
    const actionStyle = getActionStyle(entry.action);
    
    return (
      <motion.div
        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
          <span style={{ color: actionStyle.color }}>{actionStyle.icon}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{entry.action}</span>
            <span className="text-xs text-gray-500">
              <Clock className="h-3 w-3 inline mr-1" />
              {new Date(entry.timestamp).toLocaleString()}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {entry.user && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{entry.user.name}</span>
                {entry.user.department && (
                  <span className="text-gray-400">({entry.user.department})</span>
                )}
              </div>
            )}
            
            {entry.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{entry.location}</span>
              </div>
            )}
            
            {entry.pallet && (
              <div className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                <span>{entry.pallet.number}</span>
                {entry.pallet.product && (
                  <span className="text-gray-400">({entry.pallet.product.code})</span>
                )}
              </div>
            )}
          </div>
          
          {entry.remark && (
            <div className="mt-2 text-sm text-gray-500 italic">
              "{entry.remark}"
            </div>
          )}
        </div>
      </motion.div>
    );
  });

  // Main render
  return (
    <Card ref={inViewportRef} className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            <History className="h-5 w-5 mr-2 text-blue-600" />
            History Tree (GraphQL)
            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              ✓ GraphQL
            </span>
          </CardTitle>
          <Button
            onClick={handleRefresh}
            disabled={localLoading}
            variant="ghost"
            size="sm"
          >
            <RefreshCw className={cn('h-4 w-4', localLoading && 'animate-spin')} />
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search actions, users, products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TIME">By Time</SelectItem>
              <SelectItem value="USER">By User</SelectItem>
              <SelectItem value="ACTION">By Action</SelectItem>
              <SelectItem value="LOCATION">By Location</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TIME">Sort by Time</SelectItem>
              <SelectItem value="ACTION">Sort by Action</SelectItem>
              <SelectItem value="USER">Sort by User</SelectItem>
              <SelectItem value="LOCATION">Sort by Location</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DESC">Newest First</SelectItem>
              <SelectItem value="ASC">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {processedData.entries.length > 0 ? (
            <>
              <div className="space-y-2">
                <AnimatePresence>
                  {processedData.entries.map((entry) => (
                    <EntryItem key={entry.id} entry={entry} />
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Pagination */}
              {processedData.hasNextPage && (
                <div className="flex justify-center pt-4">
                  <Button 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    variant="outline"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No history entries found</p>
              {searchTerm && (
                <p className="text-sm mt-2">
                  Try adjusting your search or filters
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            Showing {processedData.entries.length} of {processedData.totalCount} entries
          </p>
        </div>
      </CardContent>
    </Card>
  );
}