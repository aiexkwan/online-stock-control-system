'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function NavigationSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className='fixed inset-x-0 bottom-[1%] z-50 mx-auto w-fit rounded-2xl border border-white/10 bg-black/80 p-2 shadow-2xl backdrop-blur-xl'
    >
      <div className='flex w-full items-center justify-between gap-8'>
        {/* Navigation Items Skeleton */}
        <div className='flex items-center gap-2'>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className='h-12 w-24 animate-pulse rounded-xl bg-white/5' />
          ))}
        </div>

        {/* User Info Skeleton */}
        <div className='flex items-center gap-4'>
          <div className='h-8 w-px bg-white/20' />

          {/* Text Skeleton */}
          <div className='text-right'>
            <div className='mb-1 h-3 w-20 animate-pulse rounded bg-white/20' />
            <div className='h-4 w-24 animate-pulse rounded bg-white/20' />
          </div>

          {/* Avatar Skeleton */}
          <div className='h-10 w-10 animate-pulse rounded-full bg-white/20' />

          {/* Logout Button Skeleton */}
          <div className='h-10 w-10 animate-pulse rounded-lg bg-white/20' />
        </div>
      </div>
    </motion.div>
  );
}

// Mobile Skeleton
export function MobileNavigationSkeleton() {
  return (
    <div className='fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/90 p-4 backdrop-blur-xl'>
      <div className='grid grid-cols-3 gap-4'>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className='aspect-square animate-pulse rounded-2xl bg-white/5' />
        ))}
      </div>
    </div>
  );
}
