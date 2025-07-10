'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardDocumentListIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAcoOrders, useAcoOrderProgress } from '../../hooks/useAdminDashboard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function AcoOrderProgress() {
  const [selectedOrderRef, setSelectedOrderRef] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { orders, loading: ordersLoading } = useAcoOrders();
  const { progress, loading: progressLoading } = useAcoOrderProgress(selectedOrderRef);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-select first order
  useEffect(() => {
    if (orders.length > 0 && !selectedOrderRef) {
      setSelectedOrderRef(orders[0].order_ref);
    }
  }, [orders, selectedOrderRef]);

  // Check unified service state
  const [isUsingUnifiedService, setIsUsingUnifiedService] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsUsingUnifiedService(localStorage.getItem('useUnifiedAcoOrderService') === 'true');
    }
  }, []);

  const toggleUnifiedService = (enabled: boolean) => {
    setIsUsingUnifiedService(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('useUnifiedAcoOrderService', enabled.toString());
      toast.info(`Switched to ${enabled ? 'Unified' : 'Legacy'} ACO order service`);
      // Trigger reload to fetch with new service
      window.location.reload();
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className='group relative'>
        <div className='absolute inset-0 rounded-3xl bg-gradient-to-r from-slate-800/50 to-orange-900/30 blur-xl'></div>

        <div className='relative rounded-3xl border border-slate-700/50 bg-slate-800/40 p-8 shadow-2xl shadow-orange-900/20 backdrop-blur-xl transition-all duration-300 hover:border-orange-500/30'>
          <div className='absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>

          <div className='absolute left-0 right-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-orange-400/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>

          <div className='relative z-10'>
            <div className='mb-6 flex items-center justify-between'>
              <h2 className='flex items-center gap-3 bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 bg-clip-text text-xl font-semibold text-transparent'>
                <ClipboardDocumentListIcon className='h-6 w-6 text-orange-400' />
                ACO Order Progress
              </h2>

              {/* Order Dropdown */}
              <div className='relative' ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className='flex items-center gap-2 rounded-xl border border-slate-600/30 bg-slate-700/50 px-4 py-2 text-sm text-slate-300 transition-all duration-300 hover:bg-slate-600/50 hover:text-white'
                  disabled={ordersLoading}
                >
                  <ClipboardDocumentListIcon className='h-4 w-4' />
                  {selectedOrderRef ? `Order ${selectedOrderRef}` : 'Select Order'}
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className='bg-slate-900/98 absolute right-0 top-full z-50 mt-2 max-h-[300px] min-w-[200px] overflow-y-auto rounded-xl border border-slate-600/50 shadow-2xl backdrop-blur-xl'
                    >
                      {orders.length === 0 ? (
                        <div className='px-4 py-3 text-sm text-slate-400'>No incomplete orders</div>
                      ) : (
                        orders.map(order => (
                          <button
                            key={order.order_ref}
                            onClick={() => {
                              setSelectedOrderRef(order.order_ref);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full px-4 py-3 text-left text-sm transition-all duration-300 hover:bg-slate-700/50',
                              'first:rounded-t-xl last:rounded-b-xl',
                              selectedOrderRef === order.order_ref
                                ? 'bg-slate-700/50 text-orange-400'
                                : 'text-slate-300'
                            )}
                          >
                            <div className='flex items-center justify-between'>
                              <span>Order {order.order_ref}</span>
                              <span className='text-xs text-slate-500'>
                                {order.remain_qty > 0
                                  ? `${order.remain_qty} remaining`
                                  : 'Complete'}
                              </span>
                            </div>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Progress List */}
            <div className='max-h-[400px] space-y-3 overflow-y-auto'>
              {progressLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <div className='h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent'></div>
                  <span className='ml-3 text-slate-400'>Loading progress...</span>
                </div>
              ) : progress.length === 0 ? (
                <div className='py-8 text-center text-slate-400'>
                  {selectedOrderRef
                    ? 'No items found for this order'
                    : 'Select an order to view progress'}
                </div>
              ) : (
                progress.map((item, index) => (
                  <div
                    key={index}
                    className='rounded-lg bg-slate-700/30 p-4 transition-all duration-300 hover:bg-slate-700/50'
                  >
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='text-sm font-medium text-slate-200'>{item.code}</span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-1 text-xs',
                          item.completion_percentage === 100
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-orange-500/20 text-orange-400'
                        )}
                      >
                        {item.completion_percentage}%
                      </span>
                    </div>
                    <div className='mb-2 flex justify-between text-xs text-slate-400'>
                      <span>Required: {item.required_qty}</span>
                      <span>Completed: {item.completed_qty}</span>
                      <span>Remaining: {item.remain_qty}</span>
                    </div>
                    <div className='h-2 w-full rounded-full bg-slate-600'>
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all duration-500',
                          item.completion_percentage === 100 ? 'bg-green-500' : 'bg-orange-500'
                        )}
                        style={{ width: `${item.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Service Toggle - Development Only */}
      {(process.env.NODE_ENV as string) !== 'production' && (
        <div className='mt-4 rounded-lg border border-gray-700 bg-gray-800/50 p-3'>
          <div className='flex items-center justify-between'>
            <label className='text-xs text-gray-400'>Use Unified ACO Service:</label>
            <input
              type='checkbox'
              checked={isUsingUnifiedService}
              onChange={e => toggleUnifiedService(e.target.checked)}
              className='h-4 w-4'
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
