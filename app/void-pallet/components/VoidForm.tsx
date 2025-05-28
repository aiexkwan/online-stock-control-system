'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { 
  ExclamationTriangleIcon, 
  LockClosedIcon,
  NumberedListIcon 
} from '@heroicons/react/24/outline';
import { VOID_REASONS } from '../types';

interface VoidFormProps {
  voidReason: string;
  password: string;
  damageQuantity: number;
  showDamageQuantityInput: boolean;
  isACOPallet: boolean;
  isProcessing: boolean;
  isDisabled: boolean;
  canExecuteVoid: boolean;
  maxQuantity: number;
  onVoidReasonChange: (reason: string) => void;
  onPasswordChange: (password: string) => void;
  onDamageQuantityChange: (quantity: number) => void;
  onExecuteVoid: () => void;
}

export function VoidForm({
  voidReason,
  password,
  damageQuantity,
  showDamageQuantityInput,
  isACOPallet,
  isProcessing,
  isDisabled,
  canExecuteVoid,
  maxQuantity,
  onVoidReasonChange,
  onPasswordChange,
  onDamageQuantityChange,
  onExecuteVoid,
}: VoidFormProps) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-red-400 flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          Void Operation
        </CardTitle>
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
          <p className="text-red-400 font-medium text-sm flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
            Warning: Void operation cannot be undone
          </p>
          <p className="text-red-300 text-xs mt-1">
            Please confirm all information is correct before executing void operation
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Void reason selection */}
        <div className="space-y-2">
          <Label htmlFor="voidReason" className="text-sm font-medium text-gray-300">
            Void Reason *
          </Label>
          <Combobox
            value={voidReason}
            onValueChange={onVoidReasonChange}
            items={VOID_REASONS.map(reason => ({
              value: reason.value,
              label: reason.label
            }))}
            placeholder="Select or enter void reason"
            disabled={isDisabled || isProcessing}
            className="w-full bg-gray-900 text-white placeholder-gray-400 border border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500"
          />
          {voidReason && (
            <div className="text-xs text-gray-400">
              {VOID_REASONS.find(r => r.value === voidReason)?.allowsReprint && (
                <span className="text-blue-400">This reason supports label reprinting</span>
              )}
            </div>
          )}
        </div>

        {/* Damage quantity input */}
        {showDamageQuantityInput && (
          <div className="space-y-2">
            <Label htmlFor="damageQuantity" className="text-sm font-medium text-gray-300">
              Damage Quantity *
            </Label>
            <div className="relative">
              <NumberedListIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="damageQuantity"
                type="number"
                value={damageQuantity || ''}
                onChange={(e) => onDamageQuantityChange(parseInt(e.target.value) || 0)}
                placeholder={`Enter damage quantity (max: ${maxQuantity})`}
                disabled={isDisabled || isProcessing || (isACOPallet && voidReason === 'Damage')}
                min="1"
                max={maxQuantity}
                className="w-full pl-10 bg-gray-900 text-white placeholder-gray-400 border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            {isACOPallet && voidReason === 'Damage' && (
              <p className="text-xs text-amber-600">
                This pallet is linked to an ACO order. Damage quantity is automatically set to total quantity.
              </p>
            )}
            {damageQuantity > 0 && damageQuantity < maxQuantity && (
              <p className="text-xs text-blue-400">
                Remaining quantity: {maxQuantity - damageQuantity}, will automatically create new pallet
              </p>
            )}
          </div>
        )}

        {/* Password confirmation */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-300">
            User Password *
          </Label>
          <div className="relative">
            <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Enter login password to confirm operation"
              disabled={isDisabled || isProcessing}
              className="w-full pl-10 bg-gray-900 text-white placeholder-gray-400 border-gray-600 rounded-md focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Execute button */}
        <Button
          onClick={onExecuteVoid}
          disabled={!canExecuteVoid}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 text-lg"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            'Confirm Void Pallet'
          )}
        </Button>

        {/* Operation hints */}
        <div className="text-center text-xs text-gray-500">
          <p>After executing void, pallet status will be updated to voided</p>
          {VOID_REASONS.find(r => r.value === voidReason)?.allowsReprint && (
            <p className="text-blue-400 mt-1">You will be guided to reprint label after completion</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 