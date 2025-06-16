/**
 * ACO Order Progress 小部件
 * 支援三種尺寸：
 * - Small: 只顯示未完成訂單數量
 * - Medium: 顯示訂單列表和進度
 * - Large: 完整功能包括訂單選擇和詳細進度
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardDocumentListIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface AcoOrder {
  order_ref: number;
  code: string;
  required_qty: number;
  remain_qty: number;
  latest_update: string;
}

interface AcoOrderProgress {
  code: string;
  required_qty: number;
  remain_qty: number;
  completed_qty: number;
  completion_percentage: number;
}

export function AcoOrderProgressWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [incompleteOrders, setIncompleteOrders] = useState<AcoOrder[]>([]);
  const [selectedOrderRef, setSelectedOrderRef] = useState<number | null>(null);
  const [orderProgress, setOrderProgress] = useState<AcoOrderProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const size = widget.config.size || WidgetSize.SMALL;

  useEffect(() => {
    loadIncompleteOrders();
    
    if (widget.config.refreshInterval) {
      const interval = setInterval(loadIncompleteOrders, widget.config.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [widget.config]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedOrderRef) {
      loadOrderProgress(selectedOrderRef);
    }
  }, [selectedOrderRef]);

  const loadIncompleteOrders = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('record_aco')
        .select('*')
        .gt('remain_qty', 0)
        .order('order_ref', { ascending: false });

      if (error) throw error;

      setIncompleteOrders(data || []);
      
      // Auto-select first order for large size
      if (size === WidgetSize.LARGE && data && data.length > 0 && !selectedOrderRef) {
        setSelectedOrderRef(data[0].order_ref);
      }
    } catch (err: any) {
      console.error('Error loading ACO orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderProgress = async (orderRef: number) => {
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
        completion_percentage: Math.round(((item.required_qty - item.remain_qty) / item.required_qty) * 100)
      }));

      setOrderProgress(progress);
    } catch (err: any) {
      console.error('Error loading order progress:', err);
      setError(err.message);
    }
  };

  const handleOrderSelect = (orderRef: number) => {
    setSelectedOrderRef(orderRef);
    setIsDropdownOpen(false);
  };

  // Small size - only show count
  if (size === WidgetSize.SMALL) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-orange-500/50' : ''}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center mb-2">
            <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">ACO Orders</h3>
          {loading ? (
            <div className="h-12 w-20 bg-slate-700 rounded animate-pulse"></div>
          ) : error ? (
            <div className="text-red-400 text-sm">Error</div>
          ) : (
            <>
              <div className="text-4xl font-bold text-white">{incompleteOrders.length}</div>
              <p className="text-xs text-slate-400 mt-1">Incomplete</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Medium size - show order list
  if (size === WidgetSize.MEDIUM) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-orange-500/50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-200">ACO Orders</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-700 rounded animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : incompleteOrders.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardDocumentListIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No incomplete orders</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {incompleteOrders.slice(0, 5).map((order) => {
                const completionPercentage = Math.round(
                  ((order.required_qty - order.remain_qty) / order.required_qty) * 100
                );
                return (
                  <div 
                    key={order.order_ref} 
                    className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-200">
                        Order {order.order_ref}
                      </span>
                      <div className="bg-orange-500/20 border border-orange-400/30 text-orange-300 px-2 py-0.5 rounded text-xs">
                        {order.remain_qty} remain
                      </div>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {incompleteOrders.length > 5 && (
                <p className="text-xs text-slate-400 text-center pt-2">
                  +{incompleteOrders.length - 5} more orders
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Large size - full functionality
  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-orange-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-orange-500/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-medium bg-gradient-to-r from-orange-300 via-amber-300 to-orange-200 bg-clip-text text-transparent">
              ACO Order Progress
            </CardTitle>
          </div>
          
          {/* Order Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-sm border border-slate-600/30"
              disabled={loading || isEditMode}
            >
              <ClipboardDocumentListIcon className="w-4 h-4" />
              {selectedOrderRef ? `Order ${selectedOrderRef}` : 'Select Order'}
              <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-2 bg-slate-900/98 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[200px] max-h-60 overflow-y-auto"
                >
                  {incompleteOrders.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400">
                      No incomplete orders
                    </div>
                  ) : (
                    incompleteOrders.map((order) => (
                      <button
                        key={order.order_ref}
                        onClick={() => handleOrderSelect(order.order_ref)}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-700/50 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                          selectedOrderRef === order.order_ref ? 'bg-slate-700/50 text-orange-400' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>Order {order.order_ref}</span>
                          <div className="bg-orange-500/20 border border-orange-400/30 text-orange-300 px-2 py-1 rounded-lg text-xs">
                            {order.remain_qty} remain
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-slate-700/50 rounded animate-pulse"></div>
            <div className="h-4 bg-slate-700/50 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-slate-700/50 rounded animate-pulse w-1/2"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : orderProgress.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">Select an ACO order to view progress</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orderProgress.map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-slate-200">{item.code}</span>
                  <span className="text-sm text-slate-400 bg-slate-700/30 px-3 py-1 rounded-full">
                    {item.completed_qty} / {item.required_qty}
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-400 h-3 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: `${item.completion_percentage}%` }}
                  >
                    {item.completion_percentage > 25 && (
                      <span className="text-xs text-white font-bold">
                        {item.completion_percentage}%
                      </span>
                    )}
                  </div>
                </div>
                {item.completion_percentage <= 25 && (
                  <div className="text-right">
                    <span className="text-sm text-orange-400 font-bold">
                      {item.completion_percentage}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}