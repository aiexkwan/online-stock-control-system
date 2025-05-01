'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DocumentIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import PalletDonutChart from './PalletDonutChart';

interface PalletStats {
  palletsDone: number;
  palletsTransferred: number;
}

export default function PalletRatio() {
  const [stats, setStats] = useState<PalletStats>({
    palletsDone: 3256,  // 默認值
    palletsTransferred: 123  // 默認值
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPalletStats() {
      try {
        console.log('開始獲取 pallet 統計數據...');

        // 獲取已完成的 pallets
        const { data: donePallets, error: doneError, count: doneCount } = await supabase
          .from('record_palletinfo')
          .select('*', { count: 'exact' });

        console.log('已完成 pallets 查詢結果:', { donePallets, doneError, doneCount });

        if (doneError) {
          console.error('獲取已完成 pallets 時出錯:', doneError);
          setError(doneError.message);
          return;
        }

        // 獲取已轉移的 pallets
        const { data: transferredPallets, error: transferError, count: transferCount } = await supabase
          .from('inventory_movements')
          .select('*', { count: 'exact' })
          .eq('type', 'transfer');

        console.log('已轉移 pallets 查詢結果:', { transferredPallets, transferError, transferCount });

        if (transferError) {
          console.error('獲取已轉移 pallets 時出錯:', transferError);
          setError(transferError.message);
          return;
        }

        const doneCount2 = donePallets?.length || 0;
        const transferCount2 = transferredPallets?.length || 0;

        console.log('設置新的統計數據:', { doneCount2, transferCount2 });

        setStats({
          palletsDone: doneCount2,
          palletsTransferred: transferCount2
        });
      } catch (error) {
        console.error('獲取 pallet 統計數據時發生錯誤:', error);
        setError(error instanceof Error ? error.message : '未知錯誤');
      }
    }

    fetchPalletStats();
  }, []);

  // 如果有錯誤，顯示錯誤信息
  if (error) {
    return (
      <div className="w-full p-4 bg-red-500 bg-opacity-10 rounded-lg">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 w-full">
      {/* Pallets Done Card */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center">
          <div className="bg-blue-500 bg-opacity-20 rounded-full p-3">
            <DocumentIcon className="h-8 w-8 text-blue-500" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-400">Pallets Done</h2>
            <p className="text-2xl font-semibold text-white">{stats.palletsDone}</p>
          </div>
        </div>
      </div>

      {/* Pallets Transferred Card + 百分比冬甩圖 */}
      <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
        <div className="flex items-center">
          <div className="bg-purple-500 bg-opacity-20 rounded-full p-3">
            <ArrowsRightLeftIcon className="h-8 w-8 text-purple-500" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-400">Pallets Transferred</h2>
            <p className="text-2xl font-semibold text-white">{stats.palletsTransferred}</p>
          </div>
        </div>
        {/* 百分比冬甩圖 */}
        <PalletDonutChart done={stats.palletsDone} transferred={stats.palletsTransferred} />
      </div>
    </div>
  );
} 