'use client';

import React from 'react';

export default function TestDashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard Layout Test</h1>
      
      {/* Production Tab Layout */}
      <div className="space-y-4">
        {/* Top row - 3 data widgets (2x4) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 h-48">
            <h3 className="text-sm font-medium text-slate-200 mb-2">Today Production (2x4)</h3>
            <div className="text-3xl font-bold text-blue-400">273</div>
            <div className="text-sm text-slate-400">Total Pallets</div>
          </div>
          
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 h-48">
            <h3 className="text-sm font-medium text-slate-200 mb-2">Machine Efficiency (2x4)</h3>
            <div className="text-3xl font-bold text-purple-400">84.2%</div>
            <div className="text-sm text-slate-400">Average</div>
          </div>
          
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 h-48">
            <h3 className="text-sm font-medium text-slate-200 mb-2">Target Hit Rate (2x4)</h3>
            <div className="text-3xl font-bold text-green-400">94.5%</div>
            <div className="text-sm text-slate-400">Weekly Avg</div>
          </div>
        </div>
        
        {/* Bottom row - 3 chart widgets (6x6) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 h-96">
            <h3 className="text-lg font-medium text-slate-200 mb-4">Today Production Chart (6x6)</h3>
            <div className="h-full flex items-center justify-center text-slate-500">
              Chart Area
            </div>
          </div>
          
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 h-96">
            <h3 className="text-lg font-medium text-slate-200 mb-4">Machine Efficiency Chart (6x6)</h3>
            <div className="h-full flex items-center justify-center text-slate-500">
              Chart Area
            </div>
          </div>
          
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 h-96">
            <h3 className="text-lg font-medium text-slate-200 mb-4">Target Hit Rate Chart (6x6)</h3>
            <div className="h-full flex items-center justify-center text-slate-500">
              Chart Area
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}