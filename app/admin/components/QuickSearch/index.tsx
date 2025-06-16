'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useInventorySearch } from '../../hooks/useAdminDashboard';
import { cn } from '@/lib/utils';

export function QuickSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const { result, loading, search } = useInventorySearch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchQuery);
  };

  const locations = [
    { key: 'injection', label: 'Injection', color: 'text-blue-400' },
    { key: 'pipeline', label: 'Pipeline', color: 'text-purple-400' },
    { key: 'await', label: 'Await', color: 'text-yellow-400' },
    { key: 'fold', label: 'Fold', color: 'text-green-400' },
    { key: 'bulk', label: 'Bulk', color: 'text-orange-400' },
    { key: 'backcarpark', label: 'Back Car Park', color: 'text-cyan-400' },
    { key: 'damage', label: 'Damage', color: 'text-red-400' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-3xl blur-xl"></div>
        
        <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
          
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
          
          <div className="relative z-10">
            <h2 className="text-xl font-semibold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent flex items-center gap-3 mb-6">
              <MagnifyingGlassIcon className="w-6 h-6 text-blue-400" />
              Quick Search
            </h2>

            <form onSubmit={handleSubmit} className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter product code..."
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 pr-12"
                />
                <button
                  type="submit"
                  disabled={loading || !searchQuery.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300 disabled:text-slate-500 transition-colors duration-300"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-slate-300">Product Code:</span>
                    <span className="text-lg font-bold text-blue-400">{result.product_code}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {locations.map(({ key, label, color }) => {
                      const value = result[key as keyof typeof result] as number;
                      if (value === 0) return null;
                      
                      return (
                        <div key={key} className="flex justify-between items-center">
                          <span className={cn("text-sm", color)}>{label}:</span>
                          <span className="text-white font-medium">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-600/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-300">Total:</span>
                      <span className="text-xl font-bold text-green-400">{result.total}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {searchQuery && !loading && !result && (
              <div className="text-center py-4 text-slate-400 text-sm">
                No inventory found for product code "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}