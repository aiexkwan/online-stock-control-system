'use client';

import React from 'react';
import { PerformanceOptimizedForm } from '../components/qc-label-form/PerformanceOptimizedForm';
import { ErrorBoundary } from '../components/qc-label-form/ErrorBoundary';
import FloatingInstructions from '@/components/ui/floating-instructions';
import MotionBackground from '../components/MotionBackground';
// import ReviewTemplate from '../components/print-label-pdf/ReviewTemplate';
// import PdfPreview from '../components/print-label-pdf/PdfPreview';

export default function PrintLabelPage() {
  return (
    <MotionBackground>
      {/* 主要內容區域 */}
      <div className="container mx-auto px-4 py-8">
        {/* 頁面標題卡片 */}
        <div className="relative mb-8">
          {/* 標題卡片背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-2xl blur-xl"></div>
          
          <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-blue-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-4 shadow-lg shadow-blue-500/25">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                    QC Label Generator
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">Generate QC labels for quality control</p>
                </div>
              </div>
              
              {/* Instructions 按鈕 */}
              <div>
                <FloatingInstructions
                  title="QC Label Instructions"
                  variant="hangover"
                  steps={[
                    {
                      title: "1. Enter Pallet Information",
                      description: "Fill in product code, quantity, count, and operator details(optional)."
                    },
                    {
                      title: "2. Configure Product Settings",
                      description: "For ACO & Slate products, enter order reference and product details."
                    },
                    {
                      title: "3. Generate and Print Labels",
                      description: "Click 'Print Label' button to generate QC labels."
                    },
                    {
                      title: "4. Enter Clock Number",
                      description: "Enter your clock number to confirm the QC label generation."
                    },
                    {
                      title: "5. Check Progress",
                      description: "The label will be generated and able to download. Press 'Print' button to print the label."
                    }
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 表單區域 - 獨立卡片佈局 */}
        <ErrorBoundary>
          <PerformanceOptimizedForm />
        </ErrorBoundary>

        {/* 底部資訊卡片 */}
        <div className="relative mt-8">
          {/* 底部卡片背景 */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 to-blue-700/20 rounded-2xl blur-xl"></div>
          
          <div className="relative bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-4 shadow-xl shadow-blue-900/10">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-slate-400 text-sm">
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <span>Pennine Manufacturing Stock Control System</span>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionBackground>
  );
}