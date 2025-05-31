'use client';

import React from 'react';
import { PerformanceOptimizedForm } from '../components/qc-label-form/PerformanceOptimizedForm';
import { ErrorBoundary } from '../components/qc-label-form/ErrorBoundary';
// import ReviewTemplate from '../components/print-label-pdf/ReviewTemplate';
// import PdfPreview from '../components/print-label-pdf/PdfPreview';

export default function PrintLabelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white relative overflow-hidden">
      {/* 背景裝飾元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 動態漸層球體 */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        
        {/* 網格背景 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* 主要內容區域 */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* 頁面標題區域 */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent mb-3">
              QC Label Generator
            </h1>
            {/* <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Generate and print quality control labels with precision and efficiency
            </p> */}
            
            {/* 狀態指示器 */}
            <div className="flex items-center justify-center mt-6 space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-400">System Ready</span>
            </div>
          </div>

          {/* 表單容器 */}
          <div className="relative">
            {/* 表單背景卡片 */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-3xl blur-xl"></div>
            
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-blue-900/20">
              <ErrorBoundary>
                <PerformanceOptimizedForm />
              </ErrorBoundary>
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