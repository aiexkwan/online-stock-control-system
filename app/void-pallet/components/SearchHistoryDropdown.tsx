'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, X, Search, TrendingUp } from 'lucide-react';
import {
  SearchHistoryItem,
  getSearchHistory,
  removeFromSearchHistory,
  clearSearchHistory,
  getFrequentSearches,
} from '../utils/searchHistory';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchHistoryDropdownProps {
  isOpen: boolean;
  onSelect: (value: string, type: 'qr' | 'pallet_num') => void;
  onClose: () => void;
  currentValue: string;
}

export function SearchHistoryDropdown({
  isOpen,
  onSelect,
  onClose,
  currentValue,
}: SearchHistoryDropdownProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [frequentSearches, setFrequentSearches] = useState<
    Array<{
      value: string;
      count: number;
      lastUsed: Date;
    }>
  >([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'frequent'>('recent');

  useEffect(() => {
    if (isOpen) {
      setHistory(getSearchHistory());
      setFrequentSearches(getFrequentSearches());
    }
  }, [isOpen]);

  const handleRemove = (id: string) => {
    removeFromSearchHistory(id);
    setHistory(getSearchHistory());
    setFrequentSearches(getFrequentSearches());
  };

  const handleClearAll = () => {
    if (confirm('Clear all search history?')) {
      clearSearchHistory();
      setHistory([]);
      setFrequentSearches([]);
      onClose();
    }
  };

  const handleSelect = (item: SearchHistoryItem) => {
    onSelect(item.value, item.type);
    onClose();
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen || (history.length === 0 && frequentSearches.length === 0)) return null;

  return (
    <>
      {/* Backdrop */}
      <div className='fixed inset-0 z-40' onClick={onClose} />

      {/* Dropdown */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className='absolute z-50 mt-1 w-full'
        >
          <Card className='border-slate-700/50 bg-slate-800/95 shadow-xl backdrop-blur-xl'>
            {/* Header */}
            <div className='border-b border-slate-700/50 p-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Button
                    variant={activeTab === 'recent' ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => setActiveTab('recent')}
                    className='h-7 text-xs'
                  >
                    <Clock className='mr-1 h-3 w-3' />
                    Recent
                  </Button>
                  <Button
                    variant={activeTab === 'frequent' ? 'default' : 'ghost'}
                    size='sm'
                    onClick={() => setActiveTab('frequent')}
                    className='h-7 text-xs'
                  >
                    <TrendingUp className='mr-1 h-3 w-3' />
                    Frequent
                  </Button>
                </div>

                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleClearAll}
                  className='h-7 text-xs text-red-400 hover:text-red-300'
                >
                  Clear All
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className='max-h-64 overflow-y-auto'>
              {activeTab === 'recent' ? (
                <div className='p-2'>
                  {history.map(item => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='group flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-slate-700/50'
                      onClick={() => handleSelect(item)}
                    >
                      <div className='flex items-center gap-3'>
                        <Search className='h-4 w-4 text-gray-400' />
                        <div>
                          <div className='font-medium text-white'>{item.value}</div>
                          {item.palletInfo && (
                            <div className='text-xs text-gray-400'>
                              {item.palletInfo.product_code} • {item.palletInfo.product_qty} units
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-gray-500'>{formatTime(item.timestamp)}</span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation();
                            handleRemove(item.id);
                          }}
                          className='h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100'
                        >
                          <X className='h-3 w-3' />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className='p-2'>
                  {frequentSearches.map((item, index) => (
                    <motion.div
                      key={item.value}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className='flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-slate-700/50'
                      onClick={() => {
                        const historyItem = history.find(h => h.value === item.value);
                        if (historyItem) {
                          handleSelect(historyItem);
                        }
                      }}
                    >
                      <div className='flex items-center gap-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-orange-600/20 text-xs font-medium text-orange-400'>
                          {item.count}
                        </div>
                        <div className='font-medium text-white'>{item.value}</div>
                      </div>

                      <span className='text-xs text-gray-500'>
                        Last: {formatTime(item.lastUsed)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
