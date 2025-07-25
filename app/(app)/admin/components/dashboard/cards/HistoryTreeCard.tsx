/**
 * HistoryTreeCard Component
 * Operations頁面專用的操作歷史樹狀卡片
 * 適配Cards系統架構，使用GraphQL查詢
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  User,
  Package,
  MapPin,
  Clock,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ensureString } from '@/utils/graphql-types';

// GraphQL Query for Operations History
const OPERATIONS_HISTORY_QUERY = gql`
  query OperationsHistoryTree($input: HistoryTreeInput) {
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
        }
        pallet {
          number
          series
          quantity
          product {
            code
            description
            type
            colour
          }
        }
      }
      totalCount
      hasNextPage
    }
  }
`;

interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  location: string;
  remark: string;
  user: {
    id: string;
    name: string;
    department: string;
    position: string;
  };
  pallet: {
    number: string;
    series: string;
    quantity: number;
    product: {
      code: string;
      description: string;
      type: string;
      colour: string;
    };
  };
}

interface HistoryTreeCardProps {
  /** Grid area for CSS Grid positioning */
  gridArea?: string;
  /** Custom class names */
  className?: string;
  /** Maximum entries to display */
  maxEntries?: number;
}

/**
 * HistoryTreeCard - Operations頁面操作歷史樹狀顯示
 * 顯示即時的操作歷史，用於右側邊欄
 */
export const HistoryTreeCard: React.FC<HistoryTreeCardProps> = ({
  gridArea = 'hist',
  className,
  maxEntries = 20,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // GraphQL query for history data
  const { data, loading, error, refetch } = useQuery(OPERATIONS_HISTORY_QUERY, {
    variables: {
      input: {
        limit: maxEntries,
        sortBy: 'timestamp',
        sortOrder: 'DESC',
      },
    },
    pollInterval: 30000, // 每30秒自動刷新
    errorPolicy: 'all',
  });

  // Filter entries based on search term
  const filteredEntries = useMemo(() => {
    if (!data?.historyTree?.entries) return [];

    const entries = data.historyTree.entries as HistoryEntry[];

    if (!searchTerm) return entries;

    return entries.filter(
      entry =>
        entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.pallet.product.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  // Toggle expanded state for tree items
  const toggleExpanded = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-GB', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Get action color based on action type
  const getActionColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create') || actionLower.includes('add')) return 'text-green-400';
    if (actionLower.includes('update') || actionLower.includes('modify')) return 'text-blue-400';
    if (actionLower.includes('delete') || actionLower.includes('remove')) return 'text-red-400';
    if (actionLower.includes('transfer') || actionLower.includes('move')) return 'text-purple-400';
    return 'text-slate-300';
  };

  // Render history entry
  const renderHistoryEntry = (entry: HistoryEntry, index: number) => {
    const isExpanded = expandedItems.has(entry.id);
    const actionColor = getActionColor(entry.action);

    return (
      <motion.div
        key={entry.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className='group'
      >
        {/* Main entry */}
        <div
          className={cn(
            'flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors',
            'hover:bg-slate-700/50 focus:bg-slate-700/50 focus:outline-none',
            isExpanded && 'bg-slate-700/30'
          )}
          onClick={() => toggleExpanded(entry.id)}
          role='button'
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`History entry: ${entry.action} at ${formatTimestamp(entry.timestamp)}`}
        >
          {/* Expand/Collapse Icon */}
          <div className='mt-0.5 flex-shrink-0'>
            {isExpanded ? (
              <ChevronDown className='h-4 w-4 text-slate-400' />
            ) : (
              <ChevronRight className='h-4 w-4 text-slate-400' />
            )}
          </div>

          {/* Timeline dot */}
          <div className='relative mt-1.5 flex-shrink-0'>
            <div className='h-2 w-2 rounded-full bg-purple-400' />
            {index < filteredEntries.length - 1 && (
              <div className='absolute left-1 top-3 h-6 w-px bg-slate-600' />
            )}
          </div>

          {/* Entry content */}
          <div className='min-w-0 flex-1'>
            <div className='flex items-center gap-2'>
              <span className={cn('text-sm font-medium', actionColor)}>
                {ensureString(entry.action)}
              </span>
              <span className='text-xs text-slate-500'>{formatTimestamp(entry.timestamp)}</span>
            </div>
            <div className='mt-1 text-xs text-slate-400'>
              <MapPin className='mr-1 inline h-3 w-3' />
              {ensureString(entry.location)}
            </div>
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className='ml-10 overflow-hidden'
            >
              <div className='space-y-2 border-l border-slate-600 pb-3 pl-4'>
                {/* User info */}
                <div className='flex items-center gap-2 text-xs'>
                  <User className='h-3 w-3 text-slate-500' />
                  <span className='text-slate-300'>{ensureString(entry.user.name)}</span>
                  <span className='text-slate-500'>({ensureString(entry.user.department)})</span>
                </div>

                {/* Pallet info */}
                {entry.pallet && (
                  <div className='flex items-center gap-2 text-xs'>
                    <Package className='h-3 w-3 text-slate-500' />
                    <span className='text-slate-300'>
                      {ensureString(entry.pallet.number)} -{' '}
                      {ensureString(entry.pallet.product.code)}
                    </span>
                    <span className='text-slate-500'>({entry.pallet.quantity} pcs)</span>
                  </div>
                )}

                {/* Remark */}
                {entry.remark && (
                  <div className='text-xs text-slate-400'>{ensureString(entry.remark)}</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{ gridArea }}
      className={cn(
        'flex h-full flex-col rounded-lg border border-slate-600/20 bg-slate-800/50 backdrop-blur-sm',
        className
      )}
      role='region'
      aria-label='Operations history timeline'
    >
      {/* Header */}
      <div className='flex items-center justify-between border-b border-slate-600/20 p-4'>
        <div className='flex items-center gap-2'>
          <History className='h-5 w-5 text-purple-400' />
          <h3 className='text-sm font-semibold text-slate-200'>Operations History</h3>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => refetch()}
            className='h-8 w-8 p-0 text-slate-400 hover:text-slate-200'
            aria-label='Refresh history'
          >
            <RefreshCw className='h-4 w-4' />
          </Button>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowFilters(!showFilters)}
            className='h-8 w-8 p-0 text-slate-400 hover:text-slate-200'
            aria-label='Toggle filters'
          >
            <Filter className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className='border-b border-slate-600/20 p-4'
        >
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
            <Input
              type='text'
              placeholder='Search history...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='border-slate-600 bg-slate-700/50 pl-10 text-slate-200 placeholder:text-slate-400'
            />
          </div>
        </motion.div>
      )}

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-4'>
        {loading && (
          <div className='space-y-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='flex gap-3'>
                <Skeleton className='h-4 w-4 rounded-full bg-slate-700' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-3/4 bg-slate-700' />
                  <Skeleton className='h-3 w-1/2 bg-slate-700' />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <AlertCircle className='mb-3 h-12 w-12 text-red-400' />
            <p className='mb-2 text-sm text-red-400'>Failed to load history</p>
            <p className='mb-4 text-xs text-slate-500'>{error.message}</p>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              className='border-slate-600 text-slate-300'
            >
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && filteredEntries.length === 0 && (
          <div className='flex flex-col items-center justify-center py-8 text-center'>
            <History className='mb-3 h-12 w-12 text-slate-500' />
            <p className='text-sm text-slate-400'>No history found</p>
            {searchTerm && (
              <p className='mt-1 text-xs text-slate-500'>Try adjusting your search terms</p>
            )}
          </div>
        )}

        {!loading && !error && filteredEntries.length > 0 && (
          <div className='space-y-1'>
            {filteredEntries.map((entry, index) => renderHistoryEntry(entry, index))}
          </div>
        )}
      </div>

      {/* Footer with stats */}
      {!loading && !error && filteredEntries.length > 0 && (
        <div className='border-t border-slate-600/20 p-3'>
          <div className='flex items-center justify-between text-xs text-slate-500'>
            <span>
              Showing {filteredEntries.length}
              {data?.historyTree?.totalCount && ` of ${data.historyTree.totalCount}`} entries
            </span>
            <div className='flex items-center gap-1'>
              <Clock className='h-3 w-3' />
              <span>Auto-refresh: 30s</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
