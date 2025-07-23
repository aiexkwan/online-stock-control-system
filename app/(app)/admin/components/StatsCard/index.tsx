'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTimeRange } from '../../hooks/useAdminDashboard';
import { DashboardStats } from '@/types/services/admin';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  icon: React.ReactNode;
  stats: DashboardStats;
  type: 'generated' | 'transferred';
  colorScheme: {
    gradient: string;
    text: string;
    hover: string;
  };
  loading?: boolean;
}

export function StatsCard({
  title,
  icon,
  stats,
  type,
  colorScheme,
  loading = false,
}: StatsCardProps) {
  const { timeRange, setTimeRange, isOpen, setIsOpen, getDataForTimeRange } = useTimeRange();

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  const timeRangeOptions = ['Today', 'Yesterday', 'Past 3 days', 'This week'];
  const value = getDataForTimeRange(stats, type);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='flex-1'>
      <div className='group relative'>
        <div className={`absolute inset-0 ${colorScheme.gradient} rounded-xl blur-xl`}></div>
        <div
          className={cn(
            'relative rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 shadow-xl backdrop-blur-xl',
            colorScheme.hover,
            'transition-all duration-300'
          )}
        >
          <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/5 via-transparent to-emerald-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>

          <div className='relative z-10'>
            <div className='mb-3 flex items-center justify-between'>
              <h3 className={cn('text-sm font-medium', colorScheme.text)}>
                {icon}
                {title}
              </h3>

              {/* Time Range Dropdown */}
              <div className='relative z-50' ref={dropdownRef}>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                  }}
                  className='flex items-center gap-1 rounded-md border border-slate-600/30 bg-slate-700/50 px-2 py-1 text-xs text-slate-300 transition-all duration-300 hover:bg-slate-600/50 hover:text-white'
                >
                  <ClockIcon className='h-3 w-3' />
                  {timeRange}
                  <ChevronDownIcon
                    className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className='bg-slate-900/98 absolute right-0 top-full z-[99999] mt-1 min-w-[100px] rounded-xl border border-slate-600/50 shadow-2xl backdrop-blur-xl'
                    >
                      {timeRangeOptions.map((option: string) => (
                        <button
                          key={option}
                          onClick={() => {
                            setTimeRange(option);
                            setIsOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-xs transition-all duration-300 first:rounded-t-xl last:rounded-b-xl hover:bg-slate-700/50 ${
                            timeRange === option
                              ? 'bg-slate-700/50 text-green-400'
                              : 'text-slate-300'
                          }`}
                        >
                          <div className='flex items-center justify-between'>
                            <span>{option}</span>
                            <span className='text-xs text-slate-400'>
                              {getDataForTimeRange(stats, type)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className='flex flex-1 items-center justify-center'>
              {loading ? (
                <div className='h-2 w-16 bg-green-500 rounded-full opacity-75'></div>
              ) : (
                <div className='text-5xl font-bold text-white'>{value}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
