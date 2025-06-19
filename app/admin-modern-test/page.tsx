/**
 * 簡化的測試頁面 - 測試新的 Production 佈局
 */

'use client';

import React from 'react';

export default function AdminModernTestPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Modern - Production Layout Test</h1>
      
      <div className="space-y-4">
        {/* 頂部三個 2x4 數據 widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg"></div>
              <h3 className="text-sm font-medium">Today Production</h3>
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-1">273</div>
            <div className="text-sm text-slate-400">Total Pallets</div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-black/20 rounded p-2">
                <div className="text-lg font-semibold text-cyan-400">30.3</div>
                <div className="text-xs text-slate-500">Avg/Hour</div>
              </div>
              <div className="bg-black/20 rounded p-2">
                <div className="text-lg font-semibold text-teal-400">91%</div>
                <div className="text-xs text-slate-500">Target</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"></div>
              <h3 className="text-sm font-medium">Machine Efficiency</h3>
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-1">84.2%</div>
            <div className="text-sm text-slate-400">Average Efficiency</div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-black/20 rounded p-2">
                <div className="text-lg font-semibold text-green-400">4/6</div>
                <div className="text-xs text-slate-500">Running</div>
              </div>
              <div className="bg-black/20 rounded p-2">
                <div className="text-lg font-semibold text-yellow-400">1</div>
                <div className="text-xs text-slate-500">Warning</div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg"></div>
              <h3 className="text-sm font-medium">Target Hit Rate</h3>
            </div>
            <div className="text-3xl font-bold text-green-400 mb-1">94.5%</div>
            <div className="text-sm text-slate-400">Weekly Average</div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-black/20 rounded p-2">
                <div className="text-lg font-semibold text-emerald-400">4/6</div>
                <div className="text-xs text-slate-500">Days Hit</div>
              </div>
              <div className="bg-black/20 rounded p-2">
                <div className="text-lg font-semibold text-teal-400">105%</div>
                <div className="text-xs text-slate-500">Best Day</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 下方三個 6x6 圖表 widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 h-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Today Production Analysis</h3>
              <div className="text-right">
                <div className="text-xl font-bold text-blue-400">273</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
            </div>
            <div className="h-5/6 bg-black/20 rounded-lg flex items-center justify-center text-slate-500">
              Area Chart
            </div>
          </div>
          
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 h-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Machine Efficiency Overview</h3>
              <div className="text-right">
                <div className="text-xl font-bold text-purple-400">84.2%</div>
                <div className="text-xs text-slate-400">Average</div>
              </div>
            </div>
            <div className="h-5/6 bg-black/20 rounded-lg flex items-center justify-center text-slate-500">
              Bar Chart
            </div>
          </div>
          
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 h-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Target Achievement Analysis</h3>
              <div className="text-right">
                <div className="text-xl font-bold text-green-400">94.5%</div>
                <div className="text-xs text-slate-400">Weekly</div>
              </div>
            </div>
            <div className="h-5/6 bg-black/20 rounded-lg flex items-center justify-center text-slate-500">
              Radial + Line Chart
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}