'use client';

import React from 'react';
import { PalletGenerationMonitor } from '@/app/components/admin/PalletGenerationMonitor';
import MotionBackground from '@/app/components/MotionBackground';

export default function PalletMonitorPage() {
  return (
    <MotionBackground>
      <div className="container mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl"></div>
          
          <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-blue-900/20">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                  Pallet Generation Monitor
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Monitor and diagnose pallet number generation system
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 監控組件 */}
        <div className="flex justify-center">
          <PalletGenerationMonitor />
        </div>

        {/* 底部資訊 */}
        <div className="relative mt-8">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 to-blue-700/20 rounded-2xl blur-xl"></div>
          
          <div className="relative bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-4 shadow-xl shadow-blue-900/10">
            <div className="text-center">
              <p className="text-slate-400 text-sm">
                System Admin Tools • Pennine Manufacturing
              </p>
            </div>
          </div>
        </div>
      </div>
    </MotionBackground>
  );
}