'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardDocumentListIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAcoOrders, useAcoOrderProgress } from '../../hooks/useAdminDashboard';
import { cn } from '@/lib/utils';

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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-3xl blur-xl"></div>
        
        <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-orange-900/20 hover:border-orange-500/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
          
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 bg-clip-text text-transparent flex items-center gap-3">
                <ClipboardDocumentListIcon className="w-6 h-6 text-orange-400" />
                ACO Order Progress
              </h2>
              
              {/* Order Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl transition-all duration-300 text-sm border border-slate-600/30"
                  disabled={ordersLoading}
                >
                  <ClipboardDocumentListIcon className="w-4 h-4" />
                  {selectedOrderRef ? `Order ${selectedOrderRef}` : 'Select Order'}
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 bg-slate-900/98 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto"
                    >
                      {orders.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-400">No incomplete orders</div>
                      ) : (
                        orders.map((order) => (
                          <button
                            key={order.order_ref}
                            onClick={() => {
                              setSelectedOrderRef(order.order_ref);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-4 py-3 text-left text-sm hover:bg-slate-700/50 transition-all duration-300",
                              "first:rounded-t-xl last:rounded-b-xl",
                              selectedOrderRef === order.order_ref ? 'bg-slate-700/50 text-orange-400' : 'text-slate-300'
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <span>Order {order.order_ref}</span>
                              <span className="text-xs text-slate-500">
                                {order.remain_qty > 0 ? `${order.remain_qty} remaining` : 'Complete'}
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
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {progressLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-slate-400">Loading progress...</span>
                </div>
              ) : progress.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  {selectedOrderRef ? 'No items found for this order' : 'Select an order to view progress'}
                </div>
              ) : (
                progress.map((item, index) => (
                  <div 
                    key={index} 
                    className="bg-slate-700/30 rounded-lg p-4 hover:bg-slate-700/50 transition-all duration-300"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-200">{item.code}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        item.completion_percentage === 100 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-orange-500/20 text-orange-400"
                      )}>
                        {item.completion_percentage}%
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>Required: {item.required_qty}</span>
                      <span>Completed: {item.completed_qty}</span>
                      <span>Remaining: {item.remain_qty}</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-500",
                          item.completion_percentage === 100 ? "bg-green-500" : "bg-orange-500"
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
    </motion.div>
  );
}