'use client';

import React from 'react';
import { grnErrorHandler } from '../services/ErrorHandler';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { isDevelopment } from '@/lib/utils/env';

/**
 * 錯誤統計組件 - 用於開發和調試
 * 顯示 GRN 系統的錯誤統計信息
 */
export const GrnErrorStats: React.FC = () => {
  const [stats, setStats] = React.useState(grnErrorHandler.getErrorStats());
  const [isOpen, setIsOpen] = React.useState(false);

  const refreshStats = () => {
    setStats(grnErrorHandler.getErrorStats());
  };

  const clearReports = () => {
    grnErrorHandler.clearErrorReports();
    refreshStats();
  };

  // 只在開發環境顯示
  if (!isDevelopment()) {
    return null;
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size='sm'
        variant='outline'
        className='fixed bottom-4 right-4 z-50'
      >
        <AlertCircle className='mr-1 h-4 w-4' />
        Error Stats
      </Button>
    );
  }

  return (
    <Card className='fixed bottom-4 right-4 z-50 w-80 p-4 shadow-lg'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-sm font-semibold'>GRN Error Statistics</h3>
        <Button onClick={() => setIsOpen(false)} size='sm' variant='ghost'>
          ×
        </Button>
      </div>

      <div className='space-y-3'>
        <div className='text-sm'>
          <strong>Total Errors:</strong> {stats.total}
        </div>

        {stats.total > 0 && (
          <>
            <div className='space-y-1'>
              <div className='text-sm font-medium'>By Severity:</div>
              <div className='grid grid-cols-2 gap-2 text-xs'>
                {Object.entries(stats.bySeverity).map(([severity, count]) => (
                  <div key={severity} className='flex items-center'>
                    {severity === 'critical' && (
                      <AlertCircle className='mr-1 h-3 w-3 text-red-500' />
                    )}
                    {severity === 'high' && (
                      <AlertTriangle className='mr-1 h-3 w-3 text-orange-500' />
                    )}
                    {severity === 'medium' && <Info className='mr-1 h-3 w-3 text-yellow-500' />}
                    {severity === 'low' && <CheckCircle className='mr-1 h-3 w-3 text-blue-500' />}
                    <span className='capitalize'>
                      {severity}: {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className='space-y-1'>
              <div className='text-sm font-medium'>By Component:</div>
              <div className='space-y-1 text-xs'>
                {Object.entries(stats.byComponent).map(([component, count]) => (
                  <div key={component} className='flex justify-between'>
                    <span className='truncate'>{component}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className='space-y-1'>
              <div className='text-sm font-medium'>By Action:</div>
              <div className='space-y-1 text-xs'>
                {Object.entries(stats.byAction).map(([action, count]) => (
                  <div key={action} className='flex justify-between'>
                    <span className='truncate'>{action}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className='flex gap-2 pt-2'>
          <Button onClick={refreshStats} size='sm' variant='outline' className='flex-1'>
            Refresh
          </Button>
          <Button onClick={clearReports} size='sm' variant='outline' className='flex-1'>
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default GrnErrorStats;
