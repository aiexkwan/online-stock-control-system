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
      <div className='group relative'>
        <div className='absolute inset-0 rounded-3xl bg-gradient-to-r from-slate-800/50 to-blue-900/30 blur-xl'></div>

        <div className='relative rounded-3xl border border-slate-700/50 bg-slate-800/40 p-8 shadow-2xl shadow-blue-900/20 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30'>
          <div className='absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>

          <div className='absolute left-0 right-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>

          <div className='relative z-10'>
            <h2 className='mb-6 flex items-center gap-3 bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-xl font-semibold text-transparent'>
              <MagnifyingGlassIcon className='h-6 w-6 text-blue-400' />
              Quick Search
            </h2>

            <form onSubmit={handleSubmit} className='mb-4'>
              <div className='relative'>
                <input
                  type='text'
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder='Enter product code...'
                  className='w-full rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-3 pr-12 text-white placeholder-slate-400 transition-all duration-300 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
                />
                <button
                  type='submit'
                  disabled={loading || !searchQuery.trim()}
                  className='absolute right-2 top-1/2 -translate-y-1/2 transform p-2 text-blue-400 transition-colors duration-300 hover:text-blue-300 disabled:text-slate-500'
                >
                  {loading ? (
                    <div className='h-1.5 w-6 bg-blue-500 rounded-full opacity-75'></div>
                  ) : (
                    <MagnifyingGlassIcon className='h-5 w-5' />
                  )}
                </button>
              </div>
            </form>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className='space-y-3'
              >
                <div className='rounded-lg bg-slate-700/30 p-4'>
                  <div className='mb-3 flex items-center justify-between'>
                    <span className='text-sm font-medium text-slate-300'>Product Code:</span>
                    <span className='text-lg font-bold text-blue-400'>{result.product_code}</span>
                  </div>

                  <div className='space-y-2'>
                    {locations.map(({ key, label, color }) => {
                      const value = result[key as keyof typeof result] as number;
                      if (value === 0) return null;

                      return (
                        <div key={key} className='flex items-center justify-between'>
                          <span className={cn('text-sm', color)}>{label}:</span>
                          <span className='font-medium text-white'>{value}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className='mt-3 border-t border-slate-600/50 pt-3'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium text-slate-300'>Total:</span>
                      <span className='text-xl font-bold text-green-400'>{result.total}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {searchQuery && !loading && !result && (
              <div className='py-4 text-center text-sm text-slate-400'>
                No inventory found for product code &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
