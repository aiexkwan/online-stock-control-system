"use client";

import React from 'react';
import GrnLabelForm from './components/GrnLabelForm';
import FloatingInstructions from '@/components/ui/floating-instructions';

export default function PrintGrnLabelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white relative overflow-hidden">
      {/* 背景裝飾元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 動態漸層球體 - 橙色主題 */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* 網格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(251,146,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,146,60,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* 固定位置的 Instructions 按鈕 */}
      <div className="fixed top-6 right-6 z-[9999]">
        <FloatingInstructions
          title="GRN Label Instructions"
          variant="floating"
          position="top-right"
          steps={[
            {
              title: "1. Fill GRN Details",
              description: "Enter GRN number, supplier information, delivery date and other basic information. The system will automatically validate the GRN number format."
            },
            {
              title: "2. Select Pallet & Package Types",
              description: "Choose appropriate pallet type and packaging method from available options. Each type has specific label formats."
            },
            {
              title: "3. Configure Weight Information",
              description: "Enter weight information for each pallet. The system will automatically calculate total weight and validate data reasonableness."
            },
            {
              title: "4. Generate and Print Labels",
              description: "Click 'Print Label' button to generate GRN labels. Download PDF files or print directly when completed."
            }
          ]}
        />
      </div>

      {/* 主要內容區域 */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* 頁面標題區域 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl mb-6 shadow-lg shadow-orange-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-orange-300 bg-clip-text text-transparent mb-3">
              GRN Label Generator
            </h1>
            
            {/* 狀態指示器 */}
            <div className="flex items-center justify-center mt-6 space-x-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-400">System Ready</span>
            </div>
          </div>

          {/* 表單容器 */}
          <div className="relative">
            {/* 表單背景卡片 */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-3xl blur-xl"></div>
            
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-orange-900/20">
              <GrnLabelForm />
            </div>
          </div>

          {/* 底部裝飾 */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-2 text-slate-500 text-sm">
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
              <span>Pennine Manufacturing Stock Control System</span>
              <div className="w-1 h-1 bg-slate-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 