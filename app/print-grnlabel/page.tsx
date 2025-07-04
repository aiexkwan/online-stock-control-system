"use client";

import React from 'react';
// 使用新版本的 GrnLabelFormV2 組件（使用 useReducer 統一管理狀態）
import GrnLabelFormV2 from './components/GrnLabelFormV2';
import FloatingInstructions from '@/components/ui/floating-instructions';
import GrnErrorStats from './components/ErrorStats';
import { PrintQueueMonitor } from '@/lib/printing';

export default function PrintGrnLabelPage() {
  return (
    <div>
      {/* Print Queue Monitor - Fixed Position */}
      <div className="fixed top-4 left-4 z-40 w-80">
        <PrintQueueMonitor compact />
      </div>

      {/* 主要內容區域 */}
      <div className="container mx-auto px-4">
          {/* Instructions Section */}
          <div className="flex justify-end mb-1">
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
      </div>
      
      {/* 錯誤統計組件 - 僅在開發環境顯示 */}
      <GrnErrorStats />
    </div>
  );
} 