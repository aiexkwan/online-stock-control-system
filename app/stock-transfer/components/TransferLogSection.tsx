import React, { useMemo } from 'react';
import { TransferLogItem } from './TransferLogItem';
import type { ActivityLogEntry } from '@/app/hooks/useActivityLog';
import type { OptimisticTransfer } from '@/app/hooks/useStockTransfer';

interface TransferLogSectionProps {
  activityLog: ActivityLogEntry[];
  optimisticTransfers: OptimisticTransfer[];
}

/**
 * 轉移日誌區域組件
 * 顯示所有的活動日誌記錄
 */
export const TransferLogSection: React.FC<TransferLogSectionProps> = React.memo(({
  activityLog,
  optimisticTransfers
}) => {
  // 優化：只在需要時計算相關的樂觀轉移
  const findRelatedOptimistic = useMemo(() => {
    return (activity: ActivityLogEntry) => {
      return optimisticTransfers.find(t => 
        activity.message.includes(t.pltNum) && t.status === 'pending'
      );
    };
  }, [optimisticTransfers]);

  return (
    <div className="relative group">
      {/* 卡片背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-blue-900/30 rounded-3xl blur-xl"></div>
      
      <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-blue-900/20 hover:border-blue-500/30 transition-all duration-300">
        {/* 卡片內部光效 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
        
        {/* 頂部邊框光效 */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-3xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent mb-6">
            Transfer Log
          </h2>
          
          <div 
            className="h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar"
            role="list"
            aria-label="Transfer activity log"
          >
            {activityLog.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-400">
                <div className="text-center">
                  <svg 
                    className="w-12 h-12 mx-auto mb-3 opacity-50" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                    />
                  </svg>
                  <p>No transfer records found</p>
                </div>
              </div>
            ) : (
              activityLog.map((activity, index) => (
                <TransferLogItem
                  key={`${activity.timestamp}-${index}`}
                  activity={activity}
                  relatedOptimistic={findRelatedOptimistic(activity)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

TransferLogSection.displayName = 'TransferLogSection';