'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  palletsDone: number; // Pallets Generated
  palletsTransferred: number; // Pallets Transferred
  loading?: boolean; // Loading state
}

export default function PalletDonutChart({
  palletsDone,
  palletsTransferred,
  loading = false,
}: Props) {
  const palletsGenerated = palletsDone;

  // Calculate percentage and progress
  const percent =
    palletsGenerated > 0 ? Math.round((palletsTransferred / palletsGenerated) * 100) : 0;
  const progress = palletsGenerated > 0 ? palletsTransferred / palletsGenerated : 0;

  // Chart dimensions and calculations
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference * (1 - progress);

  // Color based on efficiency
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return '#10b981'; // green-500
    if (percentage >= 60) return '#f59e0b'; // amber-500
    if (percentage >= 40) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  const progressColor = getProgressColor(percent);

  if (loading) {
    return (
      <div className='flex items-center justify-center' style={{ width: '100%', height: size }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className='h-16 w-16 rounded-full border-4 border-slate-600 border-t-blue-500'
        />
      </div>
    );
  }

  return (
    <div className='flex w-full items-center justify-center'>
      {/* Center - Donut Chart */}
      <div className='flex-shrink-0'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                className='relative flex cursor-pointer flex-col items-center justify-center'
                style={{ width: size, height: size }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                whileHover={{ scale: 1.05 }}
              >
                {/* Background glow effect */}
                <div
                  className='absolute inset-0 rounded-full opacity-20 blur-xl'
                  style={{
                    background: `radial-gradient(circle, ${progressColor}40 0%, transparent 70%)`,
                  }}
                />

                {/* SVG Chart */}
                <svg width={size} height={size} className='-rotate-90 transform'>
                  {/* Background circle */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke='#334155'
                    strokeWidth={strokeWidth}
                    fill='transparent'
                    className='opacity-30'
                  />

                  {/* Progress circle with gradient */}
                  <defs>
                    <linearGradient id='progressGradient' x1='0%' y1='0%' x2='100%' y2='0%'>
                      <stop offset='0%' stopColor={progressColor} />
                      <stop offset='100%' stopColor={`${progressColor}80`} />
                    </linearGradient>
                  </defs>

                  <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke='url(#progressGradient)'
                    strokeWidth={strokeWidth}
                    fill='transparent'
                    strokeLinecap='round'
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.2 }}
                    style={{
                      filter: `drop-shadow(0 0 8px ${progressColor}60)`,
                    }}
                  />
                </svg>

                {/* Center content */}
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className='text-center'
                  >
                    <div className='mb-1 text-3xl font-bold text-white'>{percent}%</div>
                    <div className='text-xs uppercase tracking-wide text-slate-400'>
                      Transfer Rate
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </TooltipTrigger>

            <TooltipContent className='rounded-lg border-slate-600 bg-slate-800 p-4 text-white shadow-xl'>
              <div className='space-y-2'>
                <div className='mb-2 text-center font-semibold'>Performance Overview</div>
                <div className='text-xxxs grid grid-cols-2 gap-4'>
                  <div className='text-center'>
                    <div className='text-xxxs font-bold text-blue-400'>{palletsGenerated}</div>
                    <div className='text-slate-300'>Pallets Generated</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-xxxs font-bold text-green-400'>{palletsTransferred}</div>
                    <div className='text-slate-300'>Pallets Transferred</div>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
