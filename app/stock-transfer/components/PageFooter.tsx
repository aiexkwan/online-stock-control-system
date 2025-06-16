import React from 'react';

/**
 * 頁面底部組件
 * 顯示系統信息
 */
export const PageFooter: React.FC = () => {
  return (
    <div className="text-center mt-12">
      <div className="inline-flex items-center space-x-2 text-slate-500 text-sm">
        <div className="w-1 h-1 bg-slate-500 rounded-full" aria-hidden="true"></div>
        <span>Pennine Manufacturing Stock Transfer System</span>
        <div className="w-1 h-1 bg-slate-500 rounded-full" aria-hidden="true"></div>
      </div>
    </div>
  );
};