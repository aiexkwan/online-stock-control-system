'use client';

import React from 'react';
import { MobileButton, MobileInput, MobileCard } from '@/components/ui/mobile';
import { mobileConfig, cn } from '@/lib/mobile-config';
import {
  UserIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { UnifiedSearch } from '@/components/ui/unified-search';
import { SimpleQRScanner } from '@/components/qr-scanner/simple-qr-scanner';
import { toast } from 'sonner';

interface MobileOrderLoadingProps {
  // ID Input
  idNumber: string;
  isIdValid: boolean;
  isCheckingId: boolean;
  onIdChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onIdBlur: () => void;

  // Order Selection
  availableOrders: string[];
  orderSummaries: Map<string, any>;
  selectedOrderRef: string | null;
  orderSearchQuery: string;
  onOrderSearchChange: (query: string) => void;
  onOrderSelect: (orderRef: string) => void;
  onChangeUser: () => void;

  // Order Data
  orderData: any[];
  isLoadingOrders: boolean;

  // Search
  searchValue: string;
  isSearching: boolean;
  onSearchChange: (value: string) => void;
  onSearchSelect: (result: any) => void;

  // Recent Loads
  recentLoads: any[];
  onUndoClick: (load: any) => void;

  // Refs
  idInputRef: React.RefObject<HTMLInputElement>;
  searchInputRef: React.RefObject<any>;
}

export default function MobileOrderLoading({
  idNumber,
  isIdValid,
  isCheckingId,
  onIdChange,
  onIdBlur,
  availableOrders,
  orderSummaries,
  selectedOrderRef,
  orderSearchQuery,
  onOrderSearchChange,
  onOrderSelect,
  onChangeUser,
  orderData,
  isLoadingOrders,
  searchValue,
  isSearching,
  onSearchChange,
  onSearchSelect,
  recentLoads,
  onUndoClick,
  idInputRef,
  searchInputRef,
}: MobileOrderLoadingProps) {
  // Mobile-optimized view with single column layout
  const showOrderSelection = isIdValid && availableOrders.length > 0;
  const showOrderDetails = selectedOrderRef && orderData.length > 0;

  return (
    <div className={cn(mobileConfig.spacing.stack)}>
      {/* Step 1: ID Input */}
      {!showOrderSelection && (
        <MobileCard>
          <div className={mobileConfig.spacing.stack}>
            <div className='flex items-center'>
              <UserIcon className='mr-2 h-6 w-6 text-blue-400' />
              <h3 className={mobileConfig.fontSize.h3}>Enter ID Number</h3>
            </div>

            <MobileInput
              ref={idInputRef}
              type='text'
              inputMode='numeric'
              pattern='[0-9]*'
              value={idNumber}
              onChange={onIdChange}
              onBlur={onIdBlur}
              placeholder='Enter 4-digit ID...'
              maxLength={4}
              size='lg'
              disabled={isCheckingId}
              error={
                idNumber.length === 4 && !isCheckingId && !isIdValid
                  ? 'ID does not exist'
                  : undefined
              }
            />

            <p className={cn(mobileConfig.fontSize.bodySmall, 'text-slate-400')}>
              Please enter your 4-digit employee ID
            </p>

            {isCheckingId && (
              <div className='flex items-center justify-center py-2'>
                <div className='h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
                <span className='ml-2 text-slate-400'>Verifying ID...</span>
              </div>
            )}
          </div>
        </MobileCard>
      )}

      {/* Step 2: Order Selection */}
      {showOrderSelection && !selectedOrderRef && (
        <MobileCard>
          <div className={mobileConfig.spacing.stack}>
            <div className='flex items-center'>
              <ClipboardDocumentListIcon className='mr-2 h-6 w-6 text-green-400' />
              <h3 className={mobileConfig.fontSize.h3}>Select Order</h3>
            </div>

            {/* Order Search */}
            <MobileInput
              type='text'
              placeholder='Search orders...'
              value={orderSearchQuery}
              onChange={e => onOrderSearchChange(e.target.value)}
              size='md'
            />

            {/* Order List */}
            <div className='max-h-[60vh] space-y-2 overflow-y-auto' id='mobile-order-list'>
              {availableOrders
                .filter(orderRef => orderRef.toLowerCase().includes(orderSearchQuery.toLowerCase()))
                .map(orderRef => {
                  const summary = orderSummaries.get(orderRef);
                  const isComplete = summary && summary.percentage >= 100;

                  return (
                    <MobileButton
                      key={orderRef}
                      variant='secondary'
                      size='lg'
                      fullWidth
                      onClick={() => onOrderSelect(orderRef)}
                      className={cn(
                        'justify-start text-left',
                        isComplete && 'border-green-700/30 bg-green-900/20'
                      )}
                    >
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <span className={mobileConfig.fontSize.bodyLarge}>Order #{orderRef}</span>
                          {isComplete && (
                            <span className='rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400'>
                              ✓ Complete
                            </span>
                          )}
                        </div>
                        {summary && (
                          <div className='mt-1 space-y-1'>
                            <div className={cn(mobileConfig.fontSize.bodySmall, 'text-slate-400')}>
                              {summary.completedItems}/{summary.itemCount} items •
                              {summary.loadedQty}/{summary.totalQty} units
                            </div>
                            <div className='h-2 w-full overflow-hidden rounded-full bg-slate-600/30'>
                              <div
                                className={cn(
                                  'h-full transition-all duration-500',
                                  isComplete ? 'bg-green-500' : 'bg-blue-500'
                                )}
                                style={{ width: `${summary.percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </MobileButton>
                  );
                })}
            </div>
          </div>
        </MobileCard>
      )}

      {/* Step 3: Loading Interface */}
      {selectedOrderRef && (
        <>
          {/* Back Button and Order Info */}
          <MobileCard padding={false}>
            <div className='border-b border-slate-700/50 p-4'>
              <div className='flex items-center justify-between'>
                <MobileButton
                  variant='ghost'
                  size='sm'
                  onClick={() => {
                    // Go back to order selection
                    window.location.reload();
                  }}
                  icon={<ArrowLeftIcon className='h-5 w-5' />}
                >
                  Back
                </MobileButton>
                <span className={cn(mobileConfig.fontSize.bodyLarge, 'font-medium')}>
                  Order #{selectedOrderRef}
                </span>
              </div>
            </div>

            {/* Order Summary */}
            {orderSummaries.has(selectedOrderRef) && (
              <div className='grid grid-cols-2 gap-2 p-4'>
                <div className='rounded-lg bg-slate-700/30 p-3 text-center'>
                  <div className={cn(mobileConfig.fontSize.h3, 'font-bold text-cyan-300')}>
                    {orderSummaries.get(selectedOrderRef)!.percentage.toFixed(0)}%
                  </div>
                  <div className={cn(mobileConfig.fontSize.bodySmall, 'text-slate-400')}>
                    Progress
                  </div>
                </div>
                <div className='rounded-lg bg-slate-700/30 p-3 text-center'>
                  <div className={cn(mobileConfig.fontSize.h3, 'font-bold text-yellow-300')}>
                    {orderSummaries.get(selectedOrderRef)!.loadedQty}
                  </div>
                  <div className={cn(mobileConfig.fontSize.bodySmall, 'text-slate-400')}>
                    Units Loaded
                  </div>
                </div>
              </div>
            )}
          </MobileCard>

          {/* Search Interface */}
          <MobileCard>
            <div className={mobileConfig.spacing.stack}>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <MagnifyingGlassIcon className='mr-2 h-6 w-6 text-purple-400' />
                  <h3 className={mobileConfig.fontSize.h3}>Scan Pallet</h3>
                </div>
              </div>

              <UnifiedSearch
                value={searchValue}
                onChange={onSearchChange}
                onSelect={onSearchSelect}
                isLoading={isSearching}
                placeholder='Scan or enter pallet number...'
                autoFocus
                ref={searchInputRef}
                productCodes={[]}
                enableProductSearch={false}
              />

              {/* Recent Loads List */}
              {recentLoads.length > 0 && (
                <div className='max-h-40 space-y-2 overflow-y-auto'>
                  {recentLoads.slice(0, 5).map(load => (
                    <div
                      key={load.uuid}
                      className='flex items-center justify-between rounded-lg bg-slate-700/30 p-3'
                    >
                      <div className='flex-1'>
                        <span className='font-mono text-cyan-300'>{load.pallet_num}</span>
                        <span className='mx-2 text-slate-400'>•</span>
                        <span className='text-green-300'>Qty: {load.quantity}</span>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <span className={cn(mobileConfig.fontSize.bodySmall, 'text-slate-500')}>
                          {new Date(load.time).toLocaleTimeString()}
                        </span>
                        <MobileButton
                          variant='ghost'
                          size='sm'
                          onClick={() => onUndoClick(load)}
                          className='h-8 w-8 p-0 text-red-400'
                        >
                          <XMarkIcon className='h-5 w-5' />
                        </MobileButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </MobileCard>

          {/* Product List */}
          {showOrderDetails && (
            <MobileCard>
              <h3 className={cn(mobileConfig.fontSize.h3, 'mb-4')}>Order Items</h3>
              <div className='space-y-3'>
                {orderData.map((order, index) => {
                  const totalQty = parseInt(order.product_qty || '0');
                  const loadedQty = parseInt(order.loaded_qty || '0');
                  const percentage = totalQty > 0 ? (loadedQty / totalQty) * 100 : 0;
                  const isComplete = loadedQty >= totalQty;
                  const remainingQty = totalQty - loadedQty;
                  const isNearComplete = percentage >= 90 && percentage < 100;

                  return (
                    <div
                      key={index}
                      className={cn(
                        'rounded-lg border bg-slate-700/30 p-4',
                        isComplete ? 'border-green-600/30' : 'border-slate-600/30'
                      )}
                    >
                      {/* Overload Warning */}
                      {isNearComplete && (
                        <div className='mb-3 rounded-lg border border-orange-600/50 bg-orange-900/30 p-2'>
                          <div className='flex items-center text-orange-400'>
                            <ExclamationTriangleIcon className='mr-2 h-5 w-5' />
                            <span className={mobileConfig.fontSize.body}>
                              Only {remainingQty} units remaining!
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Product Info */}
                      <div className='mb-3'>
                        <div className='flex items-start justify-between'>
                          <span
                            className={cn(
                              mobileConfig.fontSize.bodyLarge,
                              'font-mono text-cyan-300'
                            )}
                          >
                            {order.product_code}
                          </span>
                          <span
                            className={cn(
                              mobileConfig.fontSize.body,
                              'font-medium',
                              isComplete ? 'text-green-400' : 'text-yellow-400'
                            )}
                          >
                            {isComplete ? '✓ Complete' : `${percentage.toFixed(0)}%`}
                          </span>
                        </div>
                        <p className={cn(mobileConfig.fontSize.body, 'mt-1 text-slate-300')}>
                          {order.product_desc}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className='mb-1 flex justify-between text-sm'>
                          <span className='text-slate-400'>
                            {loadedQty} / {totalQty} loaded
                          </span>
                        </div>
                        <div className='h-3 w-full overflow-hidden rounded-full bg-slate-600/30'>
                          <div
                            className={cn(
                              'h-full transition-all duration-500',
                              isComplete
                                ? 'bg-gradient-to-r from-green-500 to-green-400'
                                : isNearComplete
                                  ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-400'
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </MobileCard>
          )}
        </>
      )}
    </div>
  );
}
