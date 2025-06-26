'use client';

import React from 'react';
import { PerformanceOptimizedForm } from '../components/qc-label-form/PerformanceOptimizedForm';
import { ErrorBoundary } from '../components/qc-label-form/ErrorBoundary';
import FloatingInstructions from '@/components/ui/floating-instructions';
// import ReviewTemplate from '../components/print-label-pdf/ReviewTemplate';
// import PdfPreview from '../components/print-label-pdf/PdfPreview';

export default function PrintLabelPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Instructions Section */}
      <div className="flex justify-end mb-6">
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
  );
}