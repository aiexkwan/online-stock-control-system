/**
 * ACO Order Progress 小部件
 * 支援三種尺寸：
 * - Small: 只顯示未完成訂單數量
 * - Medium: 顯示訂單列表和進度
 * - Large: 完整功能包括訂單選擇和詳細進度，加入 latest_update 顯示
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetCard } from '../WidgetCard';
import { ClipboardDocumentListIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { WidgetStyles } from '@/app/utils/widgetStyles';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { WidgetTitle, WidgetText, WidgetLabel, WidgetValue } from '../WidgetTypography';
import { useWidgetData } from '@/app/admin/hooks/useWidgetData';

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
  latest_update?: string;
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

  // Define loadIncompleteOrders function
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
    } catch (err: any) {
      console.error('Error loading ACO orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Use widget data hook for refresh management
  useWidgetData({
    loadFunction: loadIncompleteOrders,
    dependencies: [],
    isEditMode
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load order progress when selected order changes
  useEffect(() => {
    if (selectedOrderRef) {
      loadOrderProgress(selectedOrderRef);
    }
  }, [selectedOrderRef]);

  // Auto-select first order for large size
  useEffect(() => {
    if (size === WidgetSize.LARGE && incompleteOrders.length > 0 && !selectedOrderRef) {
      setSelectedOrderRef(incompleteOrders[0].order_ref);
    }
  }, [incompleteOrders, size, selectedOrderRef]);

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
        completion_percentage: Math.round(((item.required_qty - item.remain_qty) / item.required_qty) * 100),
        latest_update: item.latest_update
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
      <WidgetCard size={widget.config.size} widgetType="ACO_ORDER_PROGRESS" isEditMode={isEditMode}>
        <CardContent className="p-2 h-full flex flex-col justify-center items-center">
          <WidgetTitle size="xs" glow="gray" className="mb-1">ACO Orders</WidgetTitle>
          {loading ? (
            <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
          ) : error ? (
            <WidgetText size="xs" glow="red">Error</WidgetText>
          ) : (
            <>
              <WidgetValue size="large" glow="orange">{incompleteOrders.length}</WidgetValue>
              <WidgetLabel size="xs" glow="gray" className="mt-0.5">Incomplete</WidgetLabel>
            </>
          )}
        </CardContent>
      </WidgetCard>
    );
  }

  // Medium size - show order list
  if (size === WidgetSize.MEDIUM) {
    return (
      <WidgetCard size={widget.config.size} widgetType="ACO_ORDER_PROGRESS" isEditMode={isEditMode}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
            </div>
            <WidgetTitle size="small" glow="white">ACO Orders</WidgetTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-white/10 rounded animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : incompleteOrders.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardDocumentListIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <WidgetText size="small" glow="gray">No incomplete orders</WidgetText>
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
                    className="bg-black/20 rounded-lg p-2 border border-slate-700/50"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <WidgetText size="xs" glow="white" className="font-medium text-[11px]">
                        Order {order.order_ref}
                      </WidgetText>
                      <div className={`bg-indigo-500/20 border border-indigo-400/30 ${WidgetStyles.text.tableData} px-2 py-0.5 rounded text-[10px]`}>
                        {order.remain_qty} remain
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {incompleteOrders.length > 5 && (
                <WidgetLabel size="xs" glow="gray" className="text-center pt-2">
                  +{incompleteOrders.length - 5} more orders
                </WidgetLabel>
              )}
            </div>
          )}
        </CardContent>
      </WidgetCard>
    );
  }

  // Large size - full functionality
  return (
    <WidgetCard size={widget.config.size} widgetType="ACO_ORDER_PROGRESS" isEditMode={isEditMode}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
            </div>
            <WidgetTitle size="small" glow="orange" className="bg-gradient-to-r from-orange-300 via-amber-300 to-orange-200 bg-clip-text text-transparent">
              ACO Order Progress
            </WidgetTitle>
          </div>
          
          {/* Order Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-2 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-md transition-all duration-300 text-xs border border-slate-600/30"
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
                  className="absolute right-0 top-full mt-2 bg-black/80 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[200px] max-h-60 overflow-y-auto"
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
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 transition-all duration-300 first:rounded-t-xl last:rounded-b-xl ${
                          selectedOrderRef === order.order_ref ? 'bg-white/10 text-orange-400' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>Order {order.order_ref}</span>
                          <div className="bg-orange-500/20 border border-orange-400/30 text-orange-300 px-2 py-0.5 rounded-lg text-[10px]">
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
            <div className="h-4 bg-white/10 rounded animate-pulse"></div>
            <div className="h-4 bg-white/10 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-white/10 rounded animate-pulse w-1/2"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-sm">{error}</div>
        ) : orderProgress.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <WidgetText size="large" glow="gray">Select an ACO order to view progress</WidgetText>
          </div>
        ) : (
          <div className="space-y-6">
            {orderProgress.map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="flex justify-between items-center">
                  <WidgetText size="xs" glow="white" className="font-medium text-xs">{item.code}</WidgetText>
                  <span className={`text-[10px] ${WidgetStyles.text.tableData} bg-white/5 px-2 py-0.5 rounded-full`}>
                    {item.completed_qty} / {item.required_qty}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-400 h-3 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: `${item.completion_percentage}%` }}
                  >
                    {item.completion_percentage > 25 && (
                      <WidgetLabel size="xs" glow="strong" className="font-bold">
                        {item.completion_percentage}%
                      </WidgetLabel>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  {item.completion_percentage <= 25 ? (
                    <WidgetText size="xs" glow="white" className="font-bold text-xs">
                      {item.completion_percentage}%
                    </WidgetText>
                  ) : (
                    <span></span>
                  )}
                  {item.latest_update && (
                    <WidgetLabel size="xs" glow="subtle" className="text-[10px]">
                      Last updated: {format(new Date(item.latest_update), 'MMM dd, yyyy HH:mm')}
                    </WidgetLabel>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </WidgetCard>
  );
}