"use client";

import React from 'react';
// 使用新版本的 GrnLabelFormV2 組件（使用 useReducer 統一管理狀態）
import GrnLabelFormV2 from './components/GrnLabelFormV2';
import FloatingInstructions from '@/components/ui/floating-instructions';
import GrnErrorStats from './components/ErrorStats';

export default function PrintGrnLabelPage() {
  return (
    <div>
      {/* 主要內容區域 */}
      <div className="container mx-auto px-4 py-8">
          {/* Instructions Section */}
          <div className="flex justify-end mb-6">
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
      
      {/* 錯誤統計組件 - 僅在開發環境顯示 */}
      <GrnErrorStats />
    </div>
  );
} 