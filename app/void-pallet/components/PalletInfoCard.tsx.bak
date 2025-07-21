'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CubeIcon,
  NumberedListIcon,
  MapPinIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { PalletInfo } from '../types';
import { format } from 'date-fns';

interface PalletInfoCardProps {
  pallet: PalletInfo;
  className?: string;
}

export function PalletInfoCard({ pallet, className = '' }: PalletInfoCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
    } catch {
      return dateString;
    }
  };

  const getLocationBadgeColor = (location: string | null) => {
    if (!location) return 'secondary';

    switch (location.toLowerCase()) {
      case 'injection':
        return 'default';
      case 'pipeline':
        return 'secondary';
      case 'warehouse':
        return 'outline';
      case 'qc':
        return 'destructive';
      case 'shipping':
        return 'default';
      case 'voided':
        return 'destructive';
      case 'damaged':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className={`border-gray-700 bg-gray-800 ${className}`}>
      <CardHeader>
        <CardTitle className='flex items-center text-xl font-semibold text-red-400'>
          <CubeIcon className='mr-2 h-5 w-5' />
          Pallet Information
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Basic information */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <NumberedListIcon className='h-4 w-4 text-gray-400' />
              <span className='text-sm text-gray-400'>Pallet Number:</span>
              <span className='font-mono text-white'>{pallet.plt_num}</span>
            </div>

            <div className='flex items-center space-x-2'>
              <CubeIcon className='h-4 w-4 text-gray-400' />
              <span className='text-sm text-gray-400'>Product Code:</span>
              <span className='font-mono text-white'>{pallet.product_code}</span>
            </div>

            <div className='flex items-center space-x-2'>
              <span className='text-sm text-gray-400'>Quantity:</span>
              <Badge variant='outline' className='border-gray-600 text-white'>
                {pallet.product_qty}
              </Badge>
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <MapPinIcon className='h-4 w-4 text-gray-400' />
              <span className='text-sm text-gray-400'>Location:</span>
              <Badge variant={getLocationBadgeColor(pallet.plt_loc)}>
                {pallet.plt_loc || 'N/A'}
              </Badge>
            </div>

            {pallet.series && (
              <div className='flex items-center space-x-2'>
                <span className='text-sm text-gray-400'>Series:</span>
                <span className='font-mono text-sm text-white'>{pallet.series}</span>
              </div>
            )}

            {pallet.creation_date && (
              <div className='flex items-center space-x-2'>
                <CalendarIcon className='h-4 w-4 text-gray-400' />
                <span className='text-sm text-gray-400'>Created:</span>
                <span className='text-sm text-white'>{formatDate(pallet.creation_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Remarks */}
        {pallet.plt_remark && (
          <div className='border-t border-gray-700 pt-4'>
            <div className='flex items-start space-x-2'>
              <ChatBubbleLeftRightIcon className='mt-0.5 h-4 w-4 text-gray-400' />
              <div className='flex-1'>
                <span className='text-sm text-gray-400'>Remarks:</span>
                <div className='mt-1 rounded border border-gray-600 bg-gray-900 p-2'>
                  <p className='whitespace-pre-wrap text-sm text-white'>{pallet.plt_remark}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ACO Warning */}
        {pallet.plt_remark?.includes('ACO Ref') && (
          <div className='border-t border-gray-700 pt-4'>
            <div className='rounded-lg border border-amber-600/30 bg-amber-900/20 p-3'>
              <div className='flex items-center space-x-2'>
                <div className='h-2 w-2 rounded-full bg-amber-500'></div>
                <span className='text-sm font-medium text-amber-400'>ACO Order Pallet</span>
              </div>
              <p className='mt-1 text-xs text-amber-300'>
                This pallet is linked to an ACO order. Damage processing will automatically set to
                full quantity.
              </p>
            </div>
          </div>
        )}

        {/* User information */}
        {pallet.user_id && (
          <div className='border-t border-gray-700 pt-4'>
            <div className='flex items-center space-x-2 text-xs text-gray-500'>
              <UserIcon className='h-3 w-3' />
              <span>Created by User ID: {pallet.user_id}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
