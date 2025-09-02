/**
 * VoidPalletCard Component
 * 基於 BaseOperationCard 的托盤作廢卡片
 * 遷移自 VoidPalletWidget
 *
 * Features:
 * - 托盤搜尋（掃描/輸入）
 * - 作廢確認流程
 * - 批量作廢支援
 * - 損壞數量處理
 * - 標籤重印功能
 */

'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, List, Package2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cardTextStyles } from '@/lib/card-system/theme';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SimpleQRScanner } from '@/components/business/scanning/simple-qr-scanner';
// Removed design-system import - using direct Tailwind classes
import { OperationCard } from '@/lib/card-system/EnhancedGlassmorphicCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  SearchInput,
  SearchInputRef,
  StepIndicator,
  Step,
  StatusOverlay,
} from '@/components/compatibility';
import type { VoidPalletCardProps } from '../types/data-management';
import { VOID_REASONS } from '../constants/voidPallet';
import { useVoidPallet } from '../hooks/useVoidPallet';

// Step configuration
const voidSteps: Step[] = [
  { id: 'search', label: 'Search', number: 1 },
  { id: 'confirm', label: 'Confirm', number: 2 },
  { id: 'result', label: 'Result', number: 3 },
];

// Main component
export const VoidPalletCard: React.FC<VoidPalletCardProps> = ({
  className,
  isEditMode = false,
  onVoidComplete,
}) => {
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use the void pallet hook
  const { state, actions } = useVoidPallet({
    searchInputRef,
    onVoidComplete: onVoidComplete,
    onVoidError: error => {
      console.error('Void error:', error);
    },
  });

  // Destructure state and actions for easier access
  const {
    currentStep,
    voidMode,
    searchValue,
    showQrScanner,
    foundPallet,
    voidReason,
    voidResult,
    showConfirmDialog,
    showAlreadyVoidedDialog,
    alreadyVoidedPalletNum,
    batchItems,
    isLoading,
  } = state;

  const {
    setCurrentStep,
    setVoidMode,
    setSearchValue,
    setShowQrScanner,
    setVoidReason,
    setShowConfirmDialog,
    setFoundPallet,
    setBatchItems,
    setShowAlreadyVoidedDialog,
    handleSearch,
    handleVoid,
    handleQrScan,
    resetToSearch,
    toggleBatchItemSelection,
    removeBatchItem,
    selectAllBatchItems,
    focusSearchInput,
  } = actions;

  // Render content based on step
  const renderContent = () => {
    switch (currentStep) {
      case 'search':
        return (
          <div className='space-y-4'>
            {/* Mode toggle */}
            <div className='flex gap-2'>
              <Button
                variant={voidMode === 'single' ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setVoidMode('single');
                  setBatchItems([]);
                }}
                disabled={isLoading || isEditMode}
                className='flex-1'
              >
                <Package2 className='mr-2 h-4 w-4' />
                Single Mode
              </Button>
              <Button
                variant={voidMode === 'batch' ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setVoidMode('batch');
                  setFoundPallet(null);
                }}
                disabled={isLoading || isEditMode}
                className='flex-1'
              >
                <List className='mr-2 h-4 w-4' />
                Batch Mode
              </Button>
            </div>

            {/* Search input */}
            <div className='space-y-2'>
              <Label className='text-white'>Pallet Number</Label>
              <SearchInput
                ref={searchInputRef}
                value={searchValue}
                onChange={setSearchValue}
                onSearch={() => handleSearch()}
                onQrScan={() => setShowQrScanner(true)}
                placeholder='Enter pallet number or scan QR...'
                searchType='pallet'
                autoDetect={true}
                showQrButton={true}
                showTypeIndicator={false}
                isLoading={isLoading}
                disabled={isEditMode}
                className=''
              />
            </div>

            {/* Batch list */}
            {voidMode === 'batch' && batchItems.length > 0 && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label className='text-white'>
                    Batch List ({batchItems.length} items,{' '}
                    {batchItems.filter(item => item.selected).length} selected)
                  </Label>
                  <div className='flex gap-2'>
                    <Button variant='ghost' size='sm' onClick={() => selectAllBatchItems(true)}>
                      Select All
                    </Button>
                    <Button variant='ghost' size='sm' onClick={() => selectAllBatchItems(false)}>
                      Clear All
                    </Button>
                  </div>
                </div>
                <div className='max-h-40 space-y-1 overflow-y-auto rounded-lg border bg-muted/30 p-2'>
                  {batchItems.map(item => (
                    <div
                      key={item.id}
                      className='flex items-center justify-between rounded p-2 hover:bg-muted/50'
                    >
                      <div className='flex items-center gap-2'>
                        <input
                          type='checkbox'
                          checked={item.selected}
                          onChange={() => toggleBatchItemSelection(item.id)}
                          className='h-4 w-4'
                        />
                        <span className='text-sm font-medium'>{item.palletId}</span>
                        <Badge variant='secondary' className='text-xs'>
                          {item.product_code}
                        </Badge>
                        <span className='text-xs text-muted-foreground'>
                          {item.product_qty} units
                        </span>
                      </div>
                      <Button variant='ghost' size='sm' onClick={() => removeBatchItem(item.id)}>
                        <XCircle className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant='default'
                  className='w-full'
                  onClick={() => {
                    setVoidReason('Print Extra Label'); // 批量模式自動設置
                    setCurrentStep('confirm');
                  }}
                  disabled={batchItems.filter(item => item.selected).length === 0}
                >
                  Proceed to Confirm ({batchItems.filter(item => item.selected).length} items)
                </Button>
              </div>
            )}
          </div>
        );

      case 'confirm':
        return (
          <div className='space-y-4'>
            {/* Pallet info (single mode) */}
            {voidMode === 'single' && foundPallet && (
              <div className='rounded-lg border border-white/10 bg-white/5 p-4'>
                <h4 className={cn(cardTextStyles.label, 'mb-3 text-white')}>Pallet Information</h4>
                <div className='grid grid-cols-2 gap-3'>
                  <div>
                    <p className={cn(cardTextStyles.labelSmall, 'text-white/60')}>Pallet Number</p>
                    <p className={cn(cardTextStyles.body, 'font-medium text-white')}>
                      {foundPallet.plt_num}
                    </p>
                  </div>
                  <div>
                    <p className={cn(cardTextStyles.labelSmall, 'text-white/60')}>Product Code</p>
                    <p className={cn(cardTextStyles.body, 'text-white')}>
                      {foundPallet.product_code}
                    </p>
                  </div>
                  <div>
                    <p className={cn(cardTextStyles.labelSmall, 'text-white/60')}>Product Name</p>
                    <p className={cn(cardTextStyles.body, 'text-white')}>
                      {foundPallet.description || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={cn(cardTextStyles.labelSmall, 'text-white/60')}>Product Type</p>
                    <p className={cn(cardTextStyles.body, 'text-white')}>
                      {foundPallet.type || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={cn(cardTextStyles.labelSmall, 'text-white/60')}>
                      Pallet Quantity
                    </p>
                    <p className={cn(cardTextStyles.body, 'text-white')}>
                      {foundPallet.product_qty} units
                    </p>
                  </div>
                  <div>
                    <p className={cn(cardTextStyles.labelSmall, 'text-white/60')}>Pallet Remark</p>
                    <p className={cn(cardTextStyles.body, 'text-white')}>
                      {foundPallet.plt_remark || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={cn(cardTextStyles.labelSmall, 'text-white/60')}>
                      Pallet Current Location
                    </p>
                    <p className={cn(cardTextStyles.body, 'text-white')}>
                      {foundPallet.plt_loc || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className={cn(cardTextStyles.labelSmall, 'text-white/60')}>Created At</p>
                    <p className={cn(cardTextStyles.body, 'text-white')}>
                      {foundPallet.generate_time
                        ? new Date(foundPallet.generate_time).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Batch info */}
            {voidMode === 'batch' && (
              <div className='rounded-lg border border-white/10 bg-white/5 p-4'>
                <h4 className={cn(cardTextStyles.label, 'mb-3 text-white')}>
                  Batch Void Confirmation
                </h4>
                <p className='text-sm text-white/70'>
                  {batchItems.filter(item => item.selected).length} pallets selected for void
                </p>
              </div>
            )}

            {/* Void reason */}
            <div className='space-y-2'>
              <Label className='text-white'>Void Reason</Label>
              <Select
                value={voidReason}
                onValueChange={setVoidReason}
                disabled={isEditMode || voidMode === 'batch'}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select reason...' />
                </SelectTrigger>
                <SelectContent>
                  {voidMode === 'batch' ? (
                    <SelectItem value='Print Extra Label'>Print Extra Label (Batch)</SelectItem>
                  ) : (
                    VOID_REASONS.map(reason => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={resetToSearch}
                disabled={isLoading}
                className='flex-1'
              >
                Back to Search
              </Button>
              <Button
                variant='destructive'
                onClick={() => setShowConfirmDialog(true)}
                disabled={isLoading || (voidMode === 'single' && !voidReason)}
                className='flex-1'
              >
                <AlertTriangle className='mr-2 h-4 w-4' />
                Confirm Void
              </Button>
            </div>
          </div>
        );

      case 'result':
        // Render full screen overlay for result
        return null; // Content will be shown in overlay

      default:
        return null;
    }
  };

  return (
    <>
      <OperationCard className={cn('h-full', className)} borderGlow={false} isHoverable={false}>
        <div className='border-0 bg-transparent'>
          {/* Step indicator */}
          <StepIndicator
            steps={voidSteps}
            currentStepId={currentStep}
            className='mb-6'
            completedColor='green-400'
            activeColor='white'
            pendingColor='white/60'
          />

          <Separator className='mb-4' />

          {/* Step content */}
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </OperationCard>

      {/* QR Scanner */}
      {showQrScanner && (
        <SimpleQRScanner
          open={showQrScanner}
          onClose={() => setShowQrScanner(false)}
          onScan={handleQrScan}
          title='Scan Pallet QR Code'
        />
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-red-600'>
              <AlertTriangle className='h-5 w-5' />
              Void Action Cannot Be Undo
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='text-base'>
                <p>Please Confirm Before Execute</p>
                {voidMode === 'single' && foundPallet && (
                  <div className='mt-4 space-y-2 rounded-lg bg-gray-100 p-3 text-sm'>
                    <div>
                      <span className='font-medium'>Pallet:</span> {foundPallet.plt_num}
                    </div>
                    <div>
                      <span className='font-medium'>Product:</span> {foundPallet.product_code}
                    </div>
                    <div>
                      <span className='font-medium'>Quantity:</span> {foundPallet.product_qty} units
                    </div>
                    <div>
                      <span className='font-medium'>Reason:</span> {voidReason}
                    </div>
                  </div>
                )}
                {voidMode === 'batch' && (
                  <div className='mt-4 rounded-lg bg-gray-100 p-3 text-sm'>
                    <div>
                      <span className='font-medium'>Selected Pallets:</span>{' '}
                      {batchItems.filter(item => item.selected).length}
                    </div>
                    <div>
                      <span className='font-medium'>Reason:</span> {voidReason || 'Print Extra'}
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-red-600 hover:bg-red-700'
              onClick={() => {
                setShowConfirmDialog(false);
                handleVoid();
              }}
            >
              Execute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Already Voided Dialog */}
      <AlertDialog open={showAlreadyVoidedDialog} onOpenChange={setShowAlreadyVoidedDialog}>
        <AlertDialogContent className='max-w-md'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2 text-red-600'>
              <XCircle className='h-5 w-5' />
              Pallet Already Been Voided
            </AlertDialogTitle>
            <AlertDialogDescription className='space-y-2 text-base'>
              <span className='block font-medium'>
                Pallet {alreadyVoidedPalletNum} Already Been Voided
              </span>
              <span className='block'>Please Check Again</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowAlreadyVoidedDialog(false);
                focusSearchInput();
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Full Screen Result Overlay - Using StatusOverlay */}
      <StatusOverlay
        open={currentStep === 'result' && !!voidResult}
        status={voidResult?.success ? 'success' : 'error'}
        mode='fullscreen'
        title={voidResult?.success ? 'Success' : 'Failed'}
        message={voidResult?.message}
        onClose={resetToSearch}
        onClickOutside={voidResult?.success ? resetToSearch : undefined}
      />
    </>
  );
};

export default VoidPalletCard;
