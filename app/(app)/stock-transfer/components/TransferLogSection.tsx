import React, { useMemo } from 'react';
import { TransferLogItem } from './TransferLogItem';
import type { ActivityLogEntry } from '@/app/hooks/useActivityLog';
import type { OptimisticTransfer } from '@/app/actions/stockTransferActions';

interface TransferLogSectionProps {
  activityLog: ActivityLogEntry[];
  optimisticTransfers?: OptimisticTransfer[];
}

/**
 * 轉移日誌區域組件
 * 顯示所有的活動日誌記錄
 */
export const TransferLogSection: React.FC<TransferLogSectionProps> = React.memo(
  ({ activityLog, optimisticTransfers }) => {
    // 優化：只在需要時計算相關的樂觀轉移
    const findRelatedOptimistic = useMemo(() => {
      return (activity: ActivityLogEntry) => {
        return optimisticTransfers?.find(
          t => activity.message.includes(t.pltNum) && t.status === 'pending'
        );
      };
    }, [optimisticTransfers]);

    return (
      <div className='group relative'>
        {/* 卡片背景 */}
        <div className='absolute inset-0 rounded-3xl bg-gradient-to-r from-slate-800/50 to-blue-900/30 blur-xl'></div>

        <div className='relative rounded-3xl border border-slate-700/50 bg-slate-800/40 p-8 shadow-2xl shadow-blue-900/20 backdrop-blur-xl transition-all duration-300 hover:border-blue-500/30'>
          {/* 卡片內部光效 */}
          <div className='absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>

          {/* 頂部邊框光效 */}
          <div className='absolute left-0 right-0 top-0 h-px rounded-t-3xl bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100'></div>

          <div className='relative z-10'>
            <h2 className='mb-6 bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-2xl font-semibold text-transparent'>
              Transfer Log
            </h2>

            <div
              className='custom-scrollbar h-96 space-y-3 overflow-y-auto pr-2'
              role='list'
              aria-label='Transfer activity log'
            >
              {activityLog.length === 0 ? (
                <div className='flex h-32 items-center justify-center text-slate-400'>
                  <div className='text-center'>
                    <svg
                      className='mx-auto mb-3 h-12 w-12 opacity-50'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      aria-hidden='true'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={1.5}
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
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
  }
);

TransferLogSection.displayName = 'TransferLogSection';
