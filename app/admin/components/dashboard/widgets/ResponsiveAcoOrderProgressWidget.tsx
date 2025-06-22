/**
 * Responsive ACO Order Progress Widget
 * 根據大小顯示不同內容的 ACO 訂單進度 Widget
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { ResponsiveWidgetWrapper } from '../ResponsiveWidgetWrapper';
import { ContentLevel } from '@/app/admin/types/widgetContentLevel';
import { ClipboardDocumentListIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/app/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AcoOrder {
  order_ref: number;
  code: string;
  required_qty: number;
  remain_qty: number;
  latest_update: string;
  unique_id?: string;
}

interface AcoOrderProgress {
  code: string;
  required_qty: number;
  remain_qty: number;
  completed_qty: number;
  completion_percentage: number;
  latest_update?: string;
}

const ResponsiveAcoOrderProgressWidget = React.memo<WidgetComponentProps>(({ widget, isEditMode }) => {
  const [incompleteOrders, setIncompleteOrders] = useState<AcoOrder[]>([]);
  const [selectedOrderRef, setSelectedOrderRef] = useState<number | null>(null);
  const [orderProgress, setOrderProgress] = useState<AcoOrderProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load incomplete orders
  const loadIncompleteOrders = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('record_aco')
        .select('*')
        .gt('remain_qty', 0)
        .order('order_ref', { ascending: false });

      if (error) throw error;

      const ordersWithUniqueId = (data || []).map((order, index) => ({
        ...order,
        unique_id: `${order.order_ref}-${order.code}-${index}`
      }));

      setIncompleteOrders(ordersWithUniqueId);
    } catch (err: any) {
      console.error('Error loading ACO orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load order progress
  const loadOrderProgress = useCallback(async (orderRef: number) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('record_aco')
        .select('*')
        .eq('order_ref', orderRef);

      if (error) throw error;

      const progress: AcoOrderProgress[] = (data || []).map(item => ({
        code: item.code,
        required_qty: item.required_qty,
        remain_qty: item.remain_qty,
        completed_qty: item.required_qty - item.remain_qty,
        completion_percentage: Math.round(((item.required_qty - item.remain_qty) / item.required_qty) * 100),
        latest_update: item.latest_update
      }));

      setOrderProgress(progress);
    } catch (err: any) {
      console.error('Error loading order progress:', err);
      setError(err.message);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!isEditMode) {
      loadIncompleteOrders();
    }
  }, [isEditMode, loadIncompleteOrders]);

  // Load order progress when selected
  useEffect(() => {
    if (selectedOrderRef && !isEditMode) {
      loadOrderProgress(selectedOrderRef);
    }
  }, [selectedOrderRef, isEditMode, loadOrderProgress]);

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <ResponsiveWidgetWrapper widget={widget} isEditMode={isEditMode}>
      {(level) => {
        // MINIMAL (1格) - 只顯示數字
        if (level === ContentLevel.MINIMAL) {
          return (
            <div className="widget-content flex flex-col items-center justify-center h-full">
              <ClipboardDocumentListIcon className="w-6 h-6 text-orange-500 mb-1" />
              {loading ? (
                <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
              ) : error ? (
                <span className="text-red-400 text-xs">Error</span>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{incompleteOrders.length}</div>
                  <span className="text-xs text-gray-400">Orders</span>
                </>
              )}
            </div>
          );
        }

        // COMPACT (3格) - 顯示前 3 個訂單
        if (level === ContentLevel.COMPACT) {
          return (
            <div className="widget-content flex flex-col h-full p-3">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardDocumentListIcon className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-medium text-white">ACO Orders</h3>
                <span className="ml-auto text-xs text-orange-400 font-medium">
                  {incompleteOrders.length} incomplete
                </span>
              </div>
              
              {loading ? (
                <div className="space-y-2 flex-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-white/10 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-red-400 text-xs">{error}</div>
              ) : incompleteOrders.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No incomplete orders</span>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-hidden">
                  {incompleteOrders.slice(0, 3).map((order) => {
                    const completionPercentage = Math.round(
                      ((order.required_qty - order.remain_qty) / order.required_qty) * 100
                    );
                    return (
                      <div key={order.unique_id} className="bg-slate-800 rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-white font-medium">Order {order.order_ref}</span>
                          <span className="text-xs text-orange-400">{order.remain_qty} left</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-amber-400 h-1.5 rounded-full"
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // STANDARD (5格) - 顯示前 5 個訂單 + 基本信息
        if (level === ContentLevel.STANDARD) {
          return (
            <div className="widget-content flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">ACO Order Progress</h3>
                    <p className="text-xs text-gray-400">{incompleteOrders.length} incomplete orders</p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2 flex-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-white/10 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm">{error}</div>
              ) : incompleteOrders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <ClipboardDocumentListIcon className="w-12 h-12 text-gray-600 mb-2" />
                  <span className="text-gray-400">No incomplete orders</span>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {incompleteOrders.slice(0, 5).map((order) => {
                    const completionPercentage = Math.round(
                      ((order.required_qty - order.remain_qty) / order.required_qty) * 100
                    );
                    return (
                      <div key={order.unique_id} className="bg-slate-800 rounded-lg p-3 hover:bg-slate-700 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <span className="text-sm text-white font-medium">Order {order.order_ref}</span>
                            <span className="text-xs text-gray-400 ml-2">{order.code}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-orange-400 font-medium">{order.remain_qty} remain</div>
                            <div className="text-xs text-gray-500">of {order.required_qty}</div>
                          </div>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full flex items-center justify-end pr-1"
                            style={{ width: `${completionPercentage}%` }}
                          >
                            {completionPercentage > 30 && (
                              <span className="text-[10px] text-white font-medium">{completionPercentage}%</span>
                            )}
                          </div>
                        </div>
                        {completionPercentage <= 30 && (
                          <div className="text-xs text-gray-400 mt-1">{completionPercentage}% complete</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // DETAILED & FULL (7格+) - 顯示訂單選擇器 + 詳細進度
        return (
          <div className="widget-content flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">ACO Order Progress</h3>
                  <p className="text-sm text-gray-400">Track manufacturing progress</p>
                </div>
              </div>

              {/* Order Selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                  disabled={loading || isEditMode}
                >
                  <ClipboardDocumentListIcon className="w-4 h-4 text-orange-400" />
                  <span className="text-white">
                    {selectedOrderRef ? `Order ${selectedOrderRef}` : 'Select Order'}
                  </span>
                  <ChevronDownIcon className={cn(
                    "w-4 h-4 text-gray-400 transition-transform",
                    isDropdownOpen && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[200px] max-h-60 overflow-y-auto"
                    >
                      {incompleteOrders.map((order) => (
                        <button
                          key={order.unique_id}
                          onClick={() => {
                            setSelectedOrderRef(order.order_ref);
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left hover:bg-slate-800 transition-colors",
                            selectedOrderRef === order.order_ref && "bg-slate-800"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-white">Order {order.order_ref}</span>
                            <span className="text-xs text-orange-400">{order.remain_qty} remain</span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Progress Details */}
            <div className="flex-1 overflow-y-auto">
              {!selectedOrderRef ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <ClipboardDocumentListIcon className="w-16 h-16 text-gray-600 mb-4" />
                  <p className="text-gray-400 text-center">Select an order to view detailed progress</p>
                </div>
              ) : orderProgress.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-white/10 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {orderProgress.map((item, index) => (
                    <div key={`${selectedOrderRef}-${item.code}-${index}`} className="bg-slate-800 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-sm font-medium text-white">{item.code}</h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {item.completed_qty} of {item.required_qty} completed
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-orange-400">{item.completion_percentage}%</div>
                          <div className="text-xs text-gray-500">{item.remain_qty} remaining</div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-amber-400 h-3 rounded-full transition-all duration-700"
                          style={{ width: `${item.completion_percentage}%` }}
                        />
                      </div>

                      {item.latest_update && (
                        <div className="text-xs text-gray-500">
                          Last updated: {format(new Date(item.latest_update), 'MMM dd, yyyy HH:mm')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }}
    </ResponsiveWidgetWrapper>
  );
});

ResponsiveAcoOrderProgressWidget.displayName = 'ResponsiveAcoOrderProgressWidget';

export default ResponsiveAcoOrderProgressWidget;