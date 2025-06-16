"use client";

import React from 'react';
// 使用新版本的 GrnLabelFormV2 組件（使用 useReducer 統一管理狀態）
import GrnLabelFormV2 from './components/GrnLabelFormV2';
import FloatingInstructions from '@/components/ui/floating-instructions';
import MotionBackground from '../components/MotionBackground';
import GrnErrorStats from './components/ErrorStats';

export default function PrintGrnLabelPage() {
  return (
    <MotionBackground>
      {/* 主要內容區域 */}
      <div className="relative">
        <div className="container mx-auto px-4 py-8">
          {/* 頁面標題卡片 */}
          <div className="relative mb-8">
            {/* 標題卡片背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-2xl blur-xl"></div>
            
            <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl shadow-orange-900/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl mr-4 shadow-lg shadow-orange-500/25">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-orange-300 bg-clip-text text-transparent">
                      GRN Label Generator
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Generate GRN labels for goods received</p>
                  </div>
                </div>
                
                {/* Instructions 按鈕 */}
                <div>
                  <FloatingInstructions
                    title="GRN Label Instructions"
                    variant="hangover"
                    steps={[
                      {
                        title: "1. Fill GRN Details",
                        description: "Enter GRN number, supplier information and materials code."
                      },
                      {
                        title: "2. Select Pallet & Package Types",
                        description: "Choose appropriate pallet type and packaging method from available options."
                      },
                      {
                        title: "3. Enter Gross Weight",
                        description: "Enter gross weight for each pallet."
                      },
                      {
                        title: "4. Enter Clock Number",
                        description: "Enter your clock number to confirm the GRN label generation."
                      },
                      {
                        title: "5. Generate and Print Labels",
                        description: "Click 'Print Label' button to print."
                      }
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 表單區域 - 獨立卡片佈局 */}
          <GrnLabelFormV2 />

          {/* 底部資訊卡片 */}
          <div className="relative mt-8">
            {/* 底部卡片背景 */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 to-orange-700/20 rounded-2xl blur-xl"></div>
            
            <div className="relative bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 rounded-2xl p-4 shadow-xl shadow-orange-900/10">
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
      </div>
      
      {/* 錯誤統計組件 - 僅在開發環境顯示 */}
      <GrnErrorStats />
    </MotionBackground>
  );
} 