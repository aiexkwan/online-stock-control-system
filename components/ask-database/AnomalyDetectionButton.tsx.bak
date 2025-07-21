import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { AnomalyDisplay } from './AnomalyDisplay';
import { useAuth } from '@/app/hooks/useAuth';

export interface Anomaly {
  type: 'stuck_pallets' | 'inventory_mismatch' | 'overdue_orders';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  count: number;
  data: Record<string, unknown>[];
  suggestedAction: string;
  detectedAt: string;
}

interface AnomalyDetectionButtonProps {
  onResultsReady?: (anomalies: Anomaly[]) => void;
  className?: string;
}

export function AnomalyDetectionButton({ onResultsReady, className }: AnomalyDetectionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [anomalies, setAnomalies] = useState<Anomaly[] | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { user } = useAuth();

  // 權限檢查
  const hasAccess = user?.email === 'akwan@pennineindustries.com';

  if (!hasAccess) {
    return null; // 無權限則不顯示
  }

  const runAnomalyDetection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/anomaly-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to detect anomalies');
      }

      const data = await response.json();
      const results = data.anomalies || [];

      setAnomalies(results);
      setShowResults(true);
      onResultsReady?.(results);

      // 如果有異常，生成自然語言查詢
      if (results.length > 0) {
        console.log('[AnomalyDetection] Found', results.length, 'anomalies');
      }
    } catch (error) {
      console.error('[AnomalyDetection] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (anomaly: Anomaly) => {
    // 生成相關的查詢
    let query = '';
    switch (anomaly.type) {
      case 'stuck_pallets':
        query = 'Show all pallets that have not moved for over 30 days';
        break;
      case 'inventory_mismatch':
        query = 'Show products where inventory count does not match system records';
        break;
      case 'overdue_orders':
        query = 'Show all orders that are overdue by more than 7 days';
        break;
    }

    // 觸發查詢
    if (query && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('askDatabaseQuery', { detail: { query } }));
    }
  };

  if (showResults && anomalies) {
    return (
      <div className='w-full'>
        <AnomalyDisplay
          anomalies={anomalies}
          onRefresh={runAnomalyDetection}
          onViewDetails={handleViewDetails}
        />
        <Button
          variant='outline'
          size='sm'
          onClick={() => setShowResults(false)}
          className='mt-4 border-slate-600 bg-slate-700 hover:bg-slate-600'
        >
          Hide Results
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={runAnomalyDetection}
      disabled={isLoading}
      className={`border-orange-600 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Detecting Anomalies...
        </>
      ) : (
        <>
          <AlertTriangle className='mr-2 h-4 w-4' />
          Run Anomaly Detection
        </>
      )}
    </Button>
  );
}
