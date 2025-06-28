'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function NavigationSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-x-0 mx-auto w-fit bottom-[1%] bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-2 z-50"
    >
      <div className="flex items-center justify-between gap-8 w-full">
        {/* Navigation Items Skeleton */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-24 h-12 bg-white/5 rounded-xl animate-pulse"
            />
          ))}
        </div>
        
        {/* User Info Skeleton */}
        <div className="flex items-center gap-4">
          <div className="h-8 w-px bg-white/20" />
          
          {/* Text Skeleton */}
          <div className="text-right">
            <div className="w-20 h-3 bg-white/10 rounded animate-pulse mb-1" />
            <div className="w-24 h-4 bg-white/10 rounded animate-pulse" />
          </div>
          
          {/* Avatar Skeleton */}
          <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
          
          {/* Logout Button Skeleton */}
          <div className="w-10 h-10 rounded-lg bg-white/10 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

// Mobile Skeleton
export function MobileNavigationSkeleton() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="aspect-square bg-white/5 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}