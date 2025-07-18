import React from 'react';
import { DatabaseRecord } from '@/lib/types/database';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, TrendingDown, Clock, ChevronRight, RefreshCw } from 'lucide-react';
import { Anomaly } from './AnomalyDetectionButton';

interface AnomalyDisplayProps {
  anomalies: Anomaly[];
  onRefresh?: () => void;
  onViewDetails?: (anomaly: Anomaly) => void;
}

export function AnomalyDisplay({ anomalies, onRefresh, onViewDetails }: AnomalyDisplayProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'stuck_pallets':
        return <Package className='h-5 w-5' />;
      case 'inventory_mismatch':
        return <TrendingDown className='h-5 w-5' />;
      case 'overdue_orders':
        return <Clock className='h-5 w-5' />;
      default:
        return <AlertTriangle className='h-5 w-5' />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-500/10';
      case 'high':
        return 'border-orange-500 bg-orange-500/10';
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-blue-500 bg-blue-500/10';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  if (anomalies.length === 0) {
    return (
      <Card className='border-green-600 bg-green-900/20'>
        <div className='p-6 text-center'>
          <div className='mb-4 flex justify-center'>
            <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-600/20'>
              <svg
                className='h-8 w-8 text-green-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
          </div>
          <h3 className='mb-2 text-lg font-medium text-white'>All Systems Normal</h3>
          <p className='text-slate-400'>No anomalies detected in your warehouse operations.</p>
          {onRefresh && (
            <Button
              variant='outline'
              size='sm'
              onClick={onRefresh}
              className='mt-4 border-slate-600 bg-slate-700 hover:bg-slate-600'
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              Check Again
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Summary Header */}
      <div className='mb-4 flex items-center justify-between'>
        <h3 className='text-lg font-medium text-white'>Anomaly Detection Results</h3>
        {onRefresh && (
          <Button
            variant='outline'
            size='sm'
            onClick={onRefresh}
            className='border-slate-600 bg-slate-700 hover:bg-slate-600'
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        )}
      </div>

      {/* Anomaly Cards */}
      {anomalies.map((anomaly, index) => (
        <Card
          key={index}
          className={`border-2 ${getSeverityColor(anomaly.severity)} cursor-pointer transition-all hover:bg-slate-800/50`}
          onClick={() => onViewDetails?.(anomaly)}
        >
          <div className='p-4'>
            <div className='flex items-start justify-between'>
              <div className='flex items-start gap-3'>
                <div className={`mt-1 ${getSeverityTextColor(anomaly.severity)}`}>
                  {getIcon(anomaly.type)}
                </div>
                <div className='flex-1'>
                  <h4 className='mb-1 font-medium text-white'>{anomaly.title}</h4>
                  <p className='mb-2 text-sm text-slate-400'>{anomaly.description}</p>

                  {/* Sample Data Preview */}
                  {anomaly.data.length > 0 && (
                    <div className='mt-3 space-y-1'>
                      <p className='mb-1 text-xs text-slate-500'>Examples:</p>
                      {anomaly.data.slice(0, 3).map((item, idx) => (
                        <div key={idx} className='text-xs text-slate-400'>
                          • {formatDataPreview(anomaly.type, item)}
                        </div>
                      ))}
                      {anomaly.data.length > 3 && (
                        <p className='text-xs text-slate-500'>
                          ... and {anomaly.data.length - 3} more
                        </p>
                      )}
                    </div>
                  )}

                  {/* Suggested Action */}
                  <div className='mt-3 rounded bg-slate-800/50 p-2'>
                    <p className='text-xs text-slate-300'>
                      <span className='font-medium'>Action: </span>
                      {anomaly.suggestedAction}
                    </p>
                  </div>
                </div>
              </div>

              {/* Severity Badge */}
              <div className='flex items-center gap-2'>
                <span
                  className={`text-xs font-medium uppercase ${getSeverityTextColor(anomaly.severity)}`}
                >
                  {anomaly.severity}
                </span>
                <ChevronRight className='h-4 w-4 text-slate-500' />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// 格式化數據預覽
function formatDataPreview(type: string, item: DatabaseRecord): string {
  switch (type) {
    case 'stuck_pallets':
      return `Pallet ${item.plt_num} (${item.product_code}) - ${item.days_stuck} days in ${item.current_location || 'Unknown'}`;

    case 'inventory_mismatch':
      return `${item.product_code}: System shows ${item.stock_level}, actual ${item.pallet_total} (${Math.round(item.variance_percentage)}% variance)`;

    case 'overdue_orders':
      return `Order ${item.order_ref} - ${item.remaining_qty} units pending for ${item.days_overdue} days`;

    default:
      return JSON.stringify(item);
  }
}
