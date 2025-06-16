'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCwIcon, 
  AlertCircleIcon, 
  CheckCircleIcon,
  ActivityIcon,
  DatabaseIcon
} from 'lucide-react';

interface MonitorData {
  dateStr: string;
  sequenceMax: number;
  actualMax: number;
  bufferCount?: number;
  bufferUsed?: number;
  generationErrors?: number;
  recentPallets: Array<{
    pltNum: string;
    generateTime: string;
  }>;
  sequenceInfo: any;
}

export const PalletGenerationMonitor: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const supabase = createClient();

  const fetchMonitorData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 獲取當前日期
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      }).split('/').join('');
      
      // 獲取序列信息
      const { data: sequenceData } = await supabase
        .from('daily_pallet_sequence')
        .select('*')
        .eq('date_str', dateStr)
        .single();
      
      // 獲取實際最大值
      const { data: palletData } = await supabase
        .from('record_palletinfo')
        .select('plt_num')
        .like('plt_num', `${dateStr}/%`)
        .order('plt_num', { ascending: false })
        .limit(1);
      
      let actualMax = 0;
      if (palletData && palletData.length > 0) {
        const numPart = palletData[0].plt_num.split('/')[1];
        actualMax = parseInt(numPart) || 0;
      }
      
      // 獲取最近生成的托盤
      const { data: recentPallets } = await supabase
        .from('record_palletinfo')
        .select('plt_num, generate_time')
        .like('plt_num', `${dateStr}/%`)
        .order('generate_time', { ascending: false })
        .limit(10);
      
      // 嘗試獲取緩衝區信息（如果表存在）
      let bufferInfo = { count: 0, used: 0 };
      try {
        const { data: bufferData } = await supabase
          .from('pallet_number_buffer')
          .select('used')
          .eq('date_str', dateStr);
        
        if (bufferData) {
          bufferInfo.count = bufferData.length;
          bufferInfo.used = bufferData.filter(b => b.used).length;
        }
      } catch (e) {
        // 表可能不存在
      }
      
      setMonitorData({
        dateStr,
        sequenceMax: sequenceData?.current_max || 0,
        actualMax,
        bufferCount: bufferInfo.count,
        bufferUsed: bufferInfo.used,
        recentPallets: recentPallets?.map(p => ({
          pltNum: p.plt_num,
          generateTime: p.generate_time
        })) || [],
        sequenceInfo: sequenceData
      });
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testGeneration = async (count: number = 1) => {
    setTesting(true);
    try {
      const response = await fetch('/api/debug-pallet-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      
      const result = await response.json();
      if (result.success) {
        alert(`Successfully generated ${count} pallet numbers:\n${result.generated.join('\n')}`);
        fetchMonitorData(); // 刷新數據
      } else {
        alert(`Generation failed: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const fixSequence = async () => {
    if (!monitorData) return;
    
    const confirmed = confirm(
      `This will update the sequence to match the actual max (${monitorData.actualMax}). Continue?`
    );
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('daily_pallet_sequence')
        .update({ 
          current_max: monitorData.actualMax,
          last_updated: new Date().toISOString()
        })
        .eq('date_str', monitorData.dateStr);
      
      if (error) throw error;
      
      alert('Sequence updated successfully');
      fetchMonitorData();
    } catch (err: any) {
      alert(`Failed to update sequence: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchMonitorData();
    const interval = setInterval(fetchMonitorData, 30000); // 每30秒刷新
    return () => clearInterval(interval);
  }, []);

  const isOutOfSync = monitorData && monitorData.sequenceMax !== monitorData.actualMax;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="h-5 w-5" />
          Pallet Generation Monitor
        </CardTitle>
        <Button 
          onClick={() => fetchMonitorData()} 
          disabled={loading}
          size="sm"
          variant="outline"
        >
          <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {monitorData && (
          <div className="space-y-4">
            {/* 狀態概覽 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-600">Date String</p>
                <p className="text-lg font-semibold">{monitorData.dateStr}</p>
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-600">Sequence Max</p>
                <p className="text-lg font-semibold">{monitorData.sequenceMax}</p>
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-600">Actual Max</p>
                <p className="text-lg font-semibold">{monitorData.actualMax}</p>
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex items-center gap-1">
                  {isOutOfSync ? (
                    <>
                      <AlertCircleIcon className="h-5 w-5 text-yellow-500" />
                      <span className="text-yellow-600 font-medium">Out of Sync</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span className="text-green-600 font-medium">In Sync</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* 緩衝區信息 */}
            {monitorData.bufferCount !== undefined && (
              <div className="bg-blue-50 rounded p-4">
                <h3 className="font-medium mb-2">Buffer Status</h3>
                <div className="flex items-center justify-between">
                  <span>Total: {monitorData.bufferCount}</span>
                  <span>Used: {monitorData.bufferUsed}</span>
                  <span>Available: {monitorData.bufferCount - monitorData.bufferUsed!}</span>
                </div>
              </div>
            )}
            
            {/* 同步警告 */}
            {isOutOfSync && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <div className="flex items-start gap-2">
                  <AlertCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-yellow-800 font-medium">Sequence Out of Sync</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      The sequence counter ({monitorData.sequenceMax}) doesn't match the actual maximum ({monitorData.actualMax}).
                    </p>
                    <Button 
                      onClick={fixSequence}
                      size="sm"
                      variant="outline"
                      className="mt-2"
                    >
                      Fix Sequence
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* 最近生成的托盤 */}
            <div>
              <h3 className="font-medium mb-2">Recent Pallets</h3>
              <div className="bg-gray-50 rounded p-3 max-h-48 overflow-y-auto">
                {monitorData.recentPallets.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {monitorData.recentPallets.map((pallet, idx) => (
                      <li key={idx} className="flex justify-between">
                        <span className="font-mono">{pallet.pltNum}</span>
                        <span className="text-gray-500">
                          {new Date(pallet.generateTime).toLocaleTimeString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No pallets generated today</p>
                )}
              </div>
            </div>
            
            {/* 測試按鈕 */}
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={() => testGeneration(1)}
                disabled={testing}
                size="sm"
                variant="outline"
              >
                Test Generate 1
              </Button>
              <Button 
                onClick={() => testGeneration(5)}
                disabled={testing}
                size="sm"
                variant="outline"
              >
                Test Generate 5
              </Button>
              <Button 
                onClick={() => testGeneration(10)}
                disabled={testing}
                size="sm"
                variant="outline"
              >
                Test Generate 10
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};