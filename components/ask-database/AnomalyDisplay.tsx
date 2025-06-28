import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Package, 
  TrendingDown, 
  Clock,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
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
        return <Package className="w-5 h-5" />;
      case 'inventory_mismatch':
        return <TrendingDown className="w-5 h-5" />;
      case 'overdue_orders':
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
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
      <Card className="bg-green-900/20 border-green-600">
        <div className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">All Systems Normal</h3>
          <p className="text-slate-400">No anomalies detected in your warehouse operations.</p>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="mt-4 bg-slate-700 border-slate-600 hover:bg-slate-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Again
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">
          Anomaly Detection Results
        </h3>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="bg-slate-700 border-slate-600 hover:bg-slate-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      {/* Anomaly Cards */}
      {anomalies.map((anomaly, index) => (
        <Card 
          key={index} 
          className={`border-2 ${getSeverityColor(anomaly.severity)} cursor-pointer hover:bg-slate-800/50 transition-all`}
          onClick={() => onViewDetails?.(anomaly)}
        >
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${getSeverityTextColor(anomaly.severity)}`}>
                  {getIcon(anomaly.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-1">{anomaly.title}</h4>
                  <p className="text-sm text-slate-400 mb-2">{anomaly.description}</p>
                  
                  {/* Sample Data Preview */}
                  {anomaly.data.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-slate-500 mb-1">Examples:</p>
                      {anomaly.data.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="text-xs text-slate-400">
                          • {formatDataPreview(anomaly.type, item)}
                        </div>
                      ))}
                      {anomaly.data.length > 3 && (
                        <p className="text-xs text-slate-500">
                          ... and {anomaly.data.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Suggested Action */}
                  <div className="mt-3 p-2 bg-slate-800/50 rounded">
                    <p className="text-xs text-slate-300">
                      <span className="font-medium">Action: </span>
                      {anomaly.suggestedAction}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Severity Badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium uppercase ${getSeverityTextColor(anomaly.severity)}`}>
                  {anomaly.severity}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// 格式化數據預覽
function formatDataPreview(type: string, item: any): string {
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