'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ClockIcon, 
  DocumentIcon, 
  ExclamationTriangleIcon,
  InboxIcon,
  ChevronDownIcon 
} from '@heroicons/react/24/outline';

interface ProductSummary {
  product_code: string;
  total_qty: number;
  total_pallets: number;
}

type TimeRange = 'Today' | 'Yesterday' | 'Past 3 days' | 'Past 7 days';

const TIME_RANGE_OPTIONS: TimeRange[] = ['Today', 'Yesterday', 'Past 3 days', 'Past 7 days'];

export default function FinishedProduct() {
  const supabase = createClient();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('Today');
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    fetchProductSummary(selectedTimeRange, true);
  }, [selectedTimeRange]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get date range based on selected time range
  const getDateRange = (timeRange: TimeRange) => {
    const today = new Date();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    
    switch (timeRange) {
      case 'Today': {
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return { start: startOfDay.toISOString(), end: endOfDay.toISOString() };
      }
      case 'Yesterday': {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
        return { start: startOfYesterday.toISOString(), end: endOfYesterday.toISOString() };
      }
      case 'Past 3 days': {
        const threeDaysAgo = new Date(today);
        threeDaysAgo.setDate(today.getDate() - 3);
        threeDaysAgo.setHours(0, 0, 0, 0);
        return { start: threeDaysAgo.toISOString(), end: endOfDay.toISOString() };
      }
      case 'Past 7 days': {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return { start: sevenDaysAgo.toISOString(), end: endOfDay.toISOString() };
      }
      default:
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return { start: startOfDay.toISOString(), end: endOfDay.toISOString() };
    }
  };

  async function fetchProductSummary(timeRange: TimeRange, reset = false) {
    try {
    setLoading(true);
      setError(null);
      
      const { start, end } = getDateRange(timeRange);
      
      const { data, error: fetchError } = await supabase
      .from('record_palletinfo')
        .select('product_code, product_qty, plt_num, plt_remark')
        .gte('generate_time', start)
        .lte('generate_time', end)
        .not('plt_remark', 'ilike', '%Material GRN-%')
        .order('product_code', { ascending: true });
      
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      
      if (data) {
        // Group by product_code and calculate totals
        const productMap = new Map<string, ProductSummary>();
        
        for (const record of data) {
          const { product_code, product_qty } = record;
          
          if (!productMap.has(product_code)) {
            productMap.set(product_code, {
              product_code,
              total_qty: 0,
              total_pallets: 0
            });
          }
          
          const productSummary = productMap.get(product_code)!;
          productSummary.total_qty += product_qty;
          productSummary.total_pallets += 1;
        }
        
        // Convert to array and sort by total_qty descending
        const productSummaries = Array.from(productMap.values())
          .sort((a, b) => b.total_qty - a.total_qty);
        
        setProducts(productSummaries);
      }
    } catch (err: any) {
      console.error('[FinishedProduct] Error fetching data:', err);
      setError(err.message || 'Failed to load finished product data');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  // Retry function
  const handleRetry = () => {
    setError(null);
    setProducts([]);
    setInitialLoading(true);
    fetchProductSummary(selectedTimeRange, true);
  };

  // Handle time range change
  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
    setIsDropdownOpen(false);
  };

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-3">
          <Skeleton className="h-4 w-24 bg-slate-700" />
          <Skeleton className="h-4 w-16 bg-slate-700" />
          <Skeleton className="h-4 w-16 bg-slate-700" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header with time range dropdown - Always visible */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DocumentIcon className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium text-slate-300">Finished Product</span>
        </div>
        
        {/* Time Range Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-xs"
          >
            <ClockIcon className="w-3 h-3" />
            {selectedTimeRange}
            <ChevronDownIcon className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 min-w-[140px]"
              >
                {TIME_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleTimeRangeChange(option)}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedTimeRange === option ? 'bg-slate-700 text-blue-400' : 'text-slate-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Summary stats */}
      {/*products.length > 0 && (
        <div className="flex gap-4 text-xs">
          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
            {products.length} products
          </Badge>
          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
            {products.reduce((sum, p) => sum + p.total_pallets, 0)} pallets
          </Badge>
          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
            {products.reduce((sum, p) => sum + p.total_qty, 0)} total qty
          </Badge>
        </div>
      )}

      {/* Content Area */}
      {/* Error state */}
      {error && products.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-3" />
          <p className="text-slate-400 mb-4">Failed to load finished product data</p>
          <p className="text-sm text-slate-500 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            Try Again
          </button>
        </motion.div>
      ) : !initialLoading && products.length === 0 && !error ? (
        /* Empty state */
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-8 text-center"
        >
          <InboxIcon className="w-12 h-12 text-slate-500 mb-3" />
          <p className="text-slate-400 mb-2">No finished products found</p>
          <p className="text-sm text-slate-500">Products will appear here once pallets are generated in the selected time range</p>
        </motion.div>
      ) : (
        /* Table container */
        <div className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-800/30" style={{ maxHeight: '320px' }}>
          {initialLoading ? (
            <div className="p-4">
              <LoadingSkeleton />
            </div>
          ) : (
            <div className="overflow-auto" style={{ maxHeight: '320px' }}>
              <table className="min-w-full">
                <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xxxs font-medium text-slate-400 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xxxs font-medium text-slate-400 uppercase tracking-wider">
                      TTL Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xxxs font-medium text-slate-400 uppercase tracking-wider">
                      TTL Pallet
                    </th>
          </tr>
        </thead>
                <tbody className="divide-y divide-slate-700/50">
                  <AnimatePresence>
                    {products.map((product, index) => (
                      <motion.tr 
                        key={product.product_code}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
                            <span className="font-medium text-slate-300">{product.product_code}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <Badge variant="outline" className="border-slate-600 text-green-300 text-xs">
                            {product.total_qty.toLocaleString()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs">
                          <Badge variant="outline" className="border-slate-600 text-blue-300 text-xs">
                            {product.total_pallets}
                          </Badge>
              </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {/* Loading more indicator */}
              {loading && products.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-4 border-t border-slate-700"
                >
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                    Loading...
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error banner for partial failures */}
      {error && products.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded-lg"
        >
          <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-300">Failed to load data</span>
          <button
            onClick={handleRetry}
            className="ml-auto text-xs text-red-300 hover:text-red-200 underline"
          >
            Retry
          </button>
        </motion.div>
      )}
    </div>
  );
} 