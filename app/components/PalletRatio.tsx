'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface PalletStats {
  palletsDone: number;
  palletsTransferred: number;
}

export default function PalletRatio() {
  const [stats, setStats] = useState<PalletStats>({
    palletsDone: 0,
    palletsTransferred: 0
  });

  useEffect(() => {
    async function fetchPalletStats() {
      try {
        // 獲取已完成的 pallets
        const { data: donePallets, error: doneError } = await supabase
          .from('record_palletinfo')
          .select('count', { count: 'exact' });

        if (doneError) throw doneError;

        // 獲取已轉移的 pallets
        const { data: transferredPallets, error: transferError } = await supabase
          .from('inventory_movements')
          .select('count', { count: 'exact' })
          .eq('type', 'transfer');

        if (transferError) throw transferError;

        setStats({
          palletsDone: donePallets.length || 0,
          palletsTransferred: transferredPallets.length || 0
        });
      } catch (error) {
        console.error('Error fetching pallet stats:', error);
      }
    }

    fetchPalletStats();
  }, []);

  const percentage = stats.palletsTransferred > 0
    ? Math.round((stats.palletsDone / stats.palletsTransferred) * 100)
    : 0;

  return (
    <div className="relative w-32 h-32">
      {/* 背景圓圈 */}
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r="60"
          className="stroke-current text-gray-200"
          strokeWidth="8"
          fill="none"
        />
        {/* 進度圓圈 */}
        <circle
          cx="64"
          cy="64"
          r="60"
          className="stroke-current text-blue-500"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 3.77} 377`}
        />
      </svg>
      {/* 百分比文字 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <span className="text-2xl font-bold text-gray-700">{percentage}%</span>
        <span className="block text-xs text-gray-500">完成率</span>
      </div>
    </div>
  );
} 