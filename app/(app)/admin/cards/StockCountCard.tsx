'use client';

import React from 'react';
import { GlassmorphicCard } from '../components/GlassmorphicCard';
import { ClockIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export interface StockCountCardProps {
  className?: string;
}

export const StockCountCard: React.FC<StockCountCardProps> = ({ className }) => {
  return (
    <div className={`h-full ${className || ''}`}>
      <GlassmorphicCard
        variant="default"
        hover={false}
        borderGlow={false}
        className="h-full overflow-hidden"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-slate-700/50 p-4">
            <h2 className="text-lg font-semibold text-white">Stock Count</h2>
            <p className="text-sm text-slate-400">Perform stock counting and inventory checks</p>
          </div>

          {/* Coming Soon Content */}
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <ClipboardDocumentListIcon className="h-24 w-24 text-slate-600" />
                  <ClockIcon className="absolute -bottom-2 -right-2 h-8 w-8 text-amber-500" />
                </div>
              </div>
              
              <h3 className="mb-2 text-xl font-semibold text-white">Coming Soon</h3>
              <p className="mb-4 text-slate-400">
                Stock counting functionality is under development
              </p>
              
              <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3">
                <p className="text-sm text-amber-300">
                  This feature will allow you to perform stock counts and inventory audits
                </p>
              </div>
            </div>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );
};

export default StockCountCard;