import React from 'react';
import FloatingInstructions from '@/components/ui/floating-instructions';

/**
 * 頁面標題組件
 * 包含標題和操作說明
 */
export const PageHeader: React.FC = () => {
  return (
    <div className="text-center mb-12">
      <div className="flex items-center justify-center relative">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent mb-3 flex items-center justify-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl mr-4 shadow-lg shadow-blue-500/25">
            <svg 
              className="w-6 h-6 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
              />
            </svg>
          </div>
          Pallet Transfer
        </h1>
        
        {/* Instructions 按鈕在標題右邊 */}
        <div className="absolute right-0 top-0">
          <FloatingInstructions
            title="Stock Transfer Instructions"
            variant="hangover"
            steps={[
              {
                title: "1. Scan or Enter Pallet",
                description: "Scan QR code or manually enter complete pallet number."
              },
              {
                title: "2. Scan Clock ID Code", 
                description: "Scan your clock ID code for confirmation."
              },
              {
                title: "3. View Results",
                description: "Operation update and previous activity log will be shown in the transfer log section."
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
};