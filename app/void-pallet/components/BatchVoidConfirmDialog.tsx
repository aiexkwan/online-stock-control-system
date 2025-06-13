'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BatchPalletItem } from '../types/batch';
import { AlertTriangle, Package, Hash } from 'lucide-react';

interface BatchVoidConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BatchPalletItem[];
  voidReason: string;
  damageQuantity?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BatchVoidConfirmDialog({
  open,
  onOpenChange,
  items,
  voidReason,
  damageQuantity,
  onConfirm,
  onCancel,
}: BatchVoidConfirmDialogProps) {
  const selectedItems = items.filter(item => item.selected);
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.palletInfo.product_qty, 0);
  const hasACOPallets = selectedItems.some(item => 
    item.palletInfo.plt_remark?.includes('ACO')
  );
  const hasGRNPallets = selectedItems.some(item => 
    item.palletInfo.plt_remark?.includes('Material GRN')
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Confirm Batch Void Operation
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4 mt-4">
              {/* Warning message */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  This will void {selectedItems.length} pallet{selectedItems.length > 1 ? 's' : ''} with a total quantity of {totalQuantity} units.
                  This action cannot be undone.
                </p>
              </div>

              {/* Void reason */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Void Reason:</h4>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2">
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {voidReason}
                    {voidReason === 'Damage' && damageQuantity && ` (${damageQuantity} units per pallet)`}
                  </p>
                </div>
              </div>

              {/* Selected pallets list */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Selected Pallets:</h4>
                <div className="max-h-48 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                  <div className="space-y-2">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <Hash className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">{item.palletInfo.plt_num}</span>
                          <span className="text-gray-500">|</span>
                          <Package className="h-3 w-3 text-gray-500" />
                          <span>{item.palletInfo.product_code}</span>
                          <span className="text-gray-500">({item.palletInfo.product_qty} units)</span>
                        </div>
                        {item.palletInfo.plt_remark && (
                          <span className="text-xs text-gray-500">{item.palletInfo.plt_remark}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Special warnings */}
              {hasACOPallets && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>ACO Order Pallets detected:</strong> ACO order remaining quantities will be updated.
                    Note: ACO pallets do not support partial damage.
                  </p>
                </div>
              )}
              
              {hasGRNPallets && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Material GRN Pallets detected:</strong> GRN records will be deleted.
                  </p>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Summary:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600 dark:text-gray-400">Total Pallets:</div>
                  <div className="font-medium">{selectedItems.length}</div>
                  
                  <div className="text-gray-600 dark:text-gray-400">Total Quantity:</div>
                  <div className="font-medium">{totalQuantity} units</div>
                  
                  {voidReason === 'Damage' && damageQuantity && (
                    <>
                      <div className="text-gray-600 dark:text-gray-400">Total Damage:</div>
                      <div className="font-medium text-red-600">
                        {selectedItems.length * damageQuantity} units
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Confirm Batch Void
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}