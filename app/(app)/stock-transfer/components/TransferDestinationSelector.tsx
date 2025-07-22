import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Package2, Factory, Truck } from 'lucide-react';

interface TransferDestinationSelectorProps {
  currentLocation: string;
  selectedDestination: string;
  onDestinationChange: (destination: string) => void;
  disabled?: boolean;
}

// 定義每個位置可以轉移到嘅目標
const LOCATION_DESTINATIONS: Record<string, string[]> = {
  Await: ['Fold Mill', 'Production', 'PipeLine'],
  Await_grn: ['Fold Mill', 'Production', 'PipeLine'],
  'Fold Mill': ['Production', 'PipeLine'],
  PipeLine: ['Production', 'Fold Mill'],
  Production: ['Fold Mill', 'PipeLine'],
  Damage: [], // 不能從 Damage 轉移
  Voided: [], // 不能從 Voided 轉移
};

// 目標位置嘅圖標同顏色
const DESTINATION_CONFIG = {
  'Fold Mill': {
    icon: Package2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-700',
    description: 'Transfer to Fold Mill warehouse',
  },
  Production: {
    icon: Factory,
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-700',
    description: 'Transfer to Production area',
  },
  PipeLine: {
    icon: Truck,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-700',
    description: 'Transfer to Pipeline storage',
  },
};

// Validate if transfer is allowed based on location rules
export function validateTransfer(
  fromLocation: string,
  toLocation: string
): {
  isValid: boolean;
  errorMessage?: string;
} {
  // Normalize location names for comparison
  const normalizeLocation = (loc: string) => {
    // Handle special cases
    if (loc.toLowerCase() === 'await_grn') return 'Await_grn';
    if (loc.toLowerCase() === 'await') return 'Await';
    if (loc.toLowerCase() === 'fold mill') return 'Fold Mill';
    if (loc.toLowerCase() === 'pipeline') return 'PipeLine';
    if (loc.toLowerCase() === 'production') return 'Production';
    if (loc.toLowerCase() === 'damage') return 'Damage';
    if (loc.toLowerCase() === 'voided') return 'Voided';
    if (loc.toLowerCase() === 'bulk') return 'Bulk';
    if (loc.toLowerCase() === 'injection') return 'Injection';
    if (loc.toLowerCase() === 'prebook') return 'Prebook';
    if (loc.toLowerCase() === 'backcarpark') return 'BackCarPark';
    return loc;
  };

  const normalizedFrom = normalizeLocation(fromLocation);
  const normalizedTo = normalizeLocation(toLocation);

  // Check if transferring from Voided location
  if (normalizedFrom === 'Voided') {
    return {
      isValid: false,
      errorMessage: 'Cannot transfer from Voided location',
    };
  }

  // Check if transferring to same location
  if (normalizedFrom === normalizedTo) {
    return {
      isValid: false,
      errorMessage: 'Cannot transfer to the same location',
    };
  }

  // Get allowed destinations
  const allowedDestinations = LOCATION_DESTINATIONS[normalizedFrom] || [];

  // If no rules defined, default to not allowed
  if (allowedDestinations.length === 0) {
    return {
      isValid: false,
      errorMessage: `No transfer allowed from ${normalizedFrom}`,
    };
  }

  // Check if target location is in allowed list
  if (!allowedDestinations.includes(normalizedTo)) {
    return {
      isValid: false,
      errorMessage: `Cannot transfer from ${normalizedFrom} to ${normalizedTo}. Allowed destinations: ${allowedDestinations.join(', ')}`,
    };
  }

  return { isValid: true };
}

export function TransferDestinationSelector({
  currentLocation,
  selectedDestination,
  onDestinationChange,
  disabled = false,
}: TransferDestinationSelectorProps) {
  // 獲取當前位置可以轉移到嘅目標
  const availableDestinations = LOCATION_DESTINATIONS[currentLocation] || [];

  // 過濾掉與當前位置相同嘅目標（防止轉移到相同位置）
  const filteredDestinations = availableDestinations.filter(dest => dest !== currentLocation);

  // 如果當前位置唔可以轉移或者過濾後無有效目標
  if (availableDestinations.length === 0) {
    return <div className='text-sm text-red-400'>⚠️ Cannot transfer from {currentLocation}</div>;
  }

  if (filteredDestinations.length === 0) {
    return (
      <div className='text-sm text-yellow-400'>
        ⚠️ No valid destinations available (already at all possible locations)
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium text-gray-300'>Select Destination</label>

      <RadioGroup
        value={selectedDestination}
        onValueChange={onDestinationChange}
        disabled={disabled}
        className='space-y-3'
      >
        {filteredDestinations.map(destination => {
          const config = DESTINATION_CONFIG[destination as keyof typeof DESTINATION_CONFIG];
          const Icon = config?.icon || Package2;

          return (
            <div key={destination} className='relative'>
              <RadioGroupItem value={destination} id={destination} className='peer sr-only' />
              <Label
                htmlFor={destination}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-all duration-200 ${config?.bgColor || 'bg-gray-800'} ${config?.borderColor || 'border-gray-700'} hover:border-opacity-80 peer-checked:${config?.borderColor || 'border-gray-500'} peer-checked:${config?.bgColor || 'bg-gray-700'} peer-disabled:cursor-not-allowed peer-disabled:opacity-50`}
              >
                <div className={`rounded-full p-2 ${config?.bgColor || 'bg-gray-700'}`}>
                  <Icon className={`h-5 w-5 ${config?.color || 'text-gray-400'}`} />
                </div>

                <div className='flex-1'>
                  <div className={`font-medium ${config?.color || 'text-gray-300'}`}>
                    {destination}
                  </div>
                  <div className='text-xs text-gray-500'>
                    {config?.description || `Transfer to ${destination}`}
                  </div>
                </div>

                {/* 選中指示器 */}
                <div
                  className={`h-4 w-4 rounded-full border-2 ${
                    selectedDestination === destination
                      ? `${config?.borderColor || 'border-gray-500'} bg-white`
                      : 'border-gray-600'
                  } `}
                />
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
