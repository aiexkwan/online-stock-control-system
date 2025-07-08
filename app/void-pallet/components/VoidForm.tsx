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
  NumberedListIcon,
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
    <Card className='border-gray-700 bg-gray-800'>
      <CardHeader>
        <CardTitle className='flex items-center text-xl font-semibold text-red-400'>
          <ExclamationTriangleIcon className='mr-2 h-5 w-5' />
          Void Operation
        </CardTitle>
        <div className='rounded-lg border border-red-600/30 bg-red-900/20 p-3'>
          <p className='flex items-center text-sm font-medium text-red-400'>
            <ExclamationTriangleIcon className='mr-2 h-4 w-4' />
            Warning: Void operation cannot be undone
          </p>
          <p className='mt-1 text-xs text-red-300'>
            Please confirm all information is correct before executing void operation
          </p>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Void reason selection */}
        <div className='space-y-2'>
          <Label htmlFor='voidReason' className='text-sm font-medium text-gray-300'>
            Void Reason *
          </Label>
          <Combobox
            value={voidReason}
            onValueChange={onVoidReasonChange}
            items={VOID_REASONS.map(reason => ({
              value: reason.value,
              label: reason.label,
            }))}
            placeholder='Select or enter void reason'
            disabled={isDisabled || isProcessing}
            className='w-full rounded-md border border-gray-600 bg-gray-900 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500'
          />
          {voidReason && (
            <div className='text-xs text-gray-400'>
              {VOID_REASONS.find(r => r.value === voidReason)?.allowsReprint && (
                <span className='text-blue-400'>This reason supports label reprinting</span>
              )}
            </div>
          )}
        </div>

        {/* Damage quantity input */}
        {showDamageQuantityInput && (
          <div className='space-y-2'>
            <Label htmlFor='damageQuantity' className='text-sm font-medium text-gray-300'>
              Damage Quantity *
            </Label>
            <div className='relative'>
              <NumberedListIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
              <Input
                id='damageQuantity'
                type='number'
                value={damageQuantity || ''}
                onChange={e => onDamageQuantityChange(parseInt(e.target.value) || 0)}
                placeholder={`Enter damage quantity (max: ${maxQuantity})`}
                disabled={isDisabled || isProcessing || (isACOPallet && voidReason === 'Damage')}
                min='1'
                max={maxQuantity}
                className='w-full rounded-md border-gray-600 bg-gray-900 pl-10 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500'
              />
            </div>
            {isACOPallet && voidReason === 'Damage' && (
              <p className='text-xs text-amber-600'>
                This pallet is linked to an ACO order. Damage quantity is automatically set to total
                quantity.
              </p>
            )}
            {damageQuantity > 0 && damageQuantity < maxQuantity && (
              <p className='text-xs text-blue-400'>
                Remaining quantity: {maxQuantity - damageQuantity}, will automatically create new
                pallet
              </p>
            )}
          </div>
        )}

        {/* Password confirmation */}
        <div className='space-y-2'>
          <Label htmlFor='password' className='text-sm font-medium text-gray-300'>
            User Password *
          </Label>
          <div className='relative'>
            <LockClosedIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
            <Input
              id='password'
              type='password'
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              placeholder='Enter login password to confirm operation'
              disabled={isDisabled || isProcessing}
              className='w-full rounded-md border-gray-600 bg-gray-900 pl-10 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500'
            />
          </div>
        </div>

        {/* Execute button */}
        <Button
          onClick={onExecuteVoid}
          disabled={!canExecuteVoid}
          className='w-full bg-red-600 py-3 text-lg font-semibold text-white hover:bg-red-700'
        >
          {isProcessing ? (
            <div className='flex items-center justify-center'>
              <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-white'></div>
              Processing...
            </div>
          ) : (
            'Confirm Void Pallet'
          )}
        </Button>

        {/* Operation hints */}
        <div className='text-center text-xs text-gray-500'>
          <p>After executing void, pallet status will be updated to voided</p>
          {VOID_REASONS.find(r => r.value === voidReason)?.allowsReprint && (
            <p className='mt-1 text-blue-400'>
              You will be guided to reprint label after completion
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
