'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DocumentIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

interface PalletStats {
  palletsDone: number;
  palletsTransferred: number;
}

export default function PalletRatio() {
  const [stats, setStats] = useState<PalletStats>({
    palletsDone: 3256,  // 設置默認值
    palletsTransferred: 123  // 設置默認值
  });

  useEffect(() => {
    async function fetchPalletStats() {
      try {
        // 獲取已完成的 pallets
        const { count: donePallets, error: doneError } = await supabase
          .from('record_palletinfo')
          .select('*', { count: 'exact', head: true });

        if (doneError) throw doneError;

        // 獲取已轉移的 pallets
        const { count: transferredPallets, error: transferError } = await supabase
          .from('inventory_movements')
          .select('*', { count: 'exact', head: true })
          .eq('type', 'transfer');

        if (transferError) throw transferError;

        setStats({
          palletsDone: donePallets || 0,
          palletsTransferred: transferredPallets || 0
        });
      } catch (error) {
        console.error('Error fetching pallet stats:', error);
      }
    }

    fetchPalletStats();
  }, []);

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

      {/* Pallets Transferred Card */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center">
          <div className="bg-purple-500 bg-opacity-20 rounded-full p-3">
            <ArrowsRightLeftIcon className="h-8 w-8 text-purple-500" />
          </div>
          <div className="ml-4">
            <h2 className="text-sm font-medium text-gray-400">Pallets Transferred</h2>
            <p className="text-2xl font-semibold text-white">{stats.palletsTransferred}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 