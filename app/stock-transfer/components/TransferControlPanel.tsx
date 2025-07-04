'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserCheck, MapPin, Package } from 'lucide-react';
import { TransferDestinationSelector } from './TransferDestinationSelector';

interface PalletInfo {
  plt_num: string;
  product_code: string;
  product_qty: number;
  plt_remark?: string | null;
  current_plt_loc?: string | null;
}

interface TransferControlPanelProps {
  selectedPallet: PalletInfo | null;
  selectedDestination: string;
  verifiedClockNumber: string | null;
  verifiedName: string | null;
  onDestinationChange: (destination: string) => void;
  onClockNumberVerified: (clockNumber: string, name: string) => void;
  isProcessing: boolean;
}

export function TransferControlPanel({
  selectedPallet,
  selectedDestination,
  verifiedClockNumber,
  verifiedName,
  onDestinationChange,
  onClockNumberVerified,
  isProcessing
}: TransferControlPanelProps) {
  const [clockNumber, setClockNumber] = useState('');
  const [clockError, setClockError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const clockNumberRef = useRef<HTMLInputElement>(null);
  const [currentLocation, setCurrentLocation] = useState('Await');

  // 更新當前位置
  useEffect(() => {
    if (selectedPallet) {
      setCurrentLocation(selectedPallet.current_plt_loc || 'Await');
    }
  }, [selectedPallet]);

  // 設置默認目標位置
  useEffect(() => {
    if (!selectedDestination) {
      const getDefaultDestination = (location: string): string => {
        switch (location) {
          case 'Await':
          case 'Await_grn':
            return 'Fold Mill';
          case 'Fold Mill':
          case 'PipeLine':
            return 'Production';
          default:
            return 'Fold Mill';
        }
      };
      onDestinationChange(getDefaultDestination(currentLocation));
    }
  }, [currentLocation, selectedDestination, onDestinationChange]);

  const validateClockNumber = async (clockNum: string): Promise<boolean> => {
    try {
      const client = createClient();
      
      const { data, error } = await client
        .from('data_id')
        .select('id, name')
        .eq('id', parseInt(clockNum, 10))
        .single();

      if (error || !data) {
        setClockError('Clock number not found');
          return false;
      }

      setClockError('');
      onClockNumberVerified(clockNum, data.name);
      return true;
    } catch (error) {
      console.error('[TransferControlPanel] Error validating clock number:', error);
      setClockError('Validation error occurred');
      return false;
    }
  };

  const handleClockNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setClockNumber(value);
      if (clockError) {
        setClockError('');
      }
      // Clear verified status if changing number
      if (verifiedClockNumber && value !== verifiedClockNumber) {
        onClockNumberVerified('', '');
      }
      // Auto-verify when 4 digits entered
      if (value.length === 4) {
        handleVerifyClockNumber(value);
      }
    }
  };

  const handleVerifyClockNumber = async (numberToVerify?: string) => {
    const clockNum = numberToVerify || clockNumber;
    if (!clockNum || clockNum.length !== 4) {
      return;
    }

    setIsVerifying(true);
    await validateClockNumber(clockNum);
    setIsVerifying(false);
  };



  return (
    <div className="h-full flex flex-col space-y-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* 標題 */}
      <div className="border-b border-gray-700 pb-4">
        <h2 className="text-xl font-semibold text-blue-400 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select destination
        </h2>
      </div>

      {/* Transfer Status Display */}
      <div className="space-y-4">
        {/* Selected Pallet Info */}
        {selectedPallet && (
          <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-medium text-blue-400">Selected Pallet</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Pallet:</span>
                <span className="ml-2 text-white font-medium">{selectedPallet.plt_num}</span>
              </div>
              <div>
                <span className="text-gray-500">Product:</span>
                <span className="ml-2 text-white font-medium">{selectedPallet.product_code}</span>
              </div>
              <div>
                <span className="text-gray-500">Quantity:</span>
                <span className="ml-2 text-white font-medium">{selectedPallet.product_qty}</span>
              </div>
              <div>
                <span className="text-gray-500">Location:</span>
                <span className="ml-2 text-white font-medium">{selectedPallet.current_plt_loc || 'Await'}</span>
              </div>
            </div>
            {selectedPallet.plt_remark && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <span className="text-gray-500 text-sm">Remark:</span>
                <p className="text-white text-sm mt-1">{selectedPallet.plt_remark}</p>
              </div>
            )}
          </div>
        )}


      </div>

      {/* 位置選擇器和員工驗證 - 始終顯示 */}
      <div className="flex-1 space-y-6">
        <TransferDestinationSelector
          currentLocation={currentLocation}
          selectedDestination={selectedDestination}
          onDestinationChange={onDestinationChange}
          disabled={isProcessing}
        />

        {/* 員工驗證區域 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Clock Number</label>
            <Input
              ref={clockNumberRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={clockNumber}
              onChange={handleClockNumberChange}
              placeholder="Enter 4-digit clock number"
              className={`w-full bg-gray-700 border-gray-600 placeholder-gray-500 text-white focus:ring-blue-500 focus:border-blue-500 ${
                clockError ? 'border-red-500 focus:ring-red-500' : ''
              } ${
                isVerifying ? 'opacity-50' : ''
              }`}
              disabled={isProcessing}
              autoComplete="off"
              maxLength={4}
            />
            
            {/* Status indicators */}
            {isVerifying && (
              <p className="text-blue-400 text-sm flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verifying...
              </p>
            )}
            
            {clockError && !isVerifying && (
              <p className="text-red-400 text-sm">{clockError}</p>
            )}
            
            {verifiedName && !isVerifying && (
              <p className="text-green-400 text-sm">
                ✓ Verified: <span className="font-medium">{verifiedName}</span>
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}