'use client';

import React, { useState, useEffect } from 'react';
import { CloudIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface SyncStatusIndicatorProps {
  lastSyncTime?: Date;
  isSyncing?: boolean;
  hasError?: boolean;
}

export function SyncStatusIndicator({ 
  lastSyncTime, 
  isSyncing = false, 
  hasError = false 
}: SyncStatusIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusIcon = () => {
    if (hasError) {
      return <ExclamationCircleIcon className="w-4 h-4 text-red-400" />;
    }
    if (isSyncing) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <CloudIcon className="w-4 h-4 text-blue-400" />
        </motion.div>
      );
    }
    return <CheckCircleIcon className="w-4 h-4 text-green-400" />;
  };

  const getStatusText = () => {
    if (hasError) return 'Sync error';
    if (isSyncing) return 'Syncing...';
    if (lastSyncTime) {
      const now = new Date();
      const diff = now.getTime() - lastSyncTime.getTime();
      const minutes = Math.floor(diff / 60000);
      
      if (minutes < 1) return 'Just synced';
      if (minutes === 1) return '1 minute ago';
      if (minutes < 60) return `${minutes} minutes ago`;
      
      const hours = Math.floor(minutes / 60);
      if (hours === 1) return '1 hour ago';
      if (hours < 24) return `${hours} hours ago`;
      
      return 'More than a day ago';
    }
    return 'Not synced';
  };

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
      >
        {getStatusIcon()}
      </button>
      
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs whitespace-nowrap z-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-300">Cloud sync:</span>
              <span className={hasError ? 'text-red-400' : 'text-slate-400'}>
                {getStatusText()}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}