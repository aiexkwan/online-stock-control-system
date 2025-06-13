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
import { PalletInfo } from '../types';
import { AlertTriangle, Package, Hash, MapPin, Calendar } from 'lucide-react';

interface VoidConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  palletInfo: PalletInfo | null;
  voidReason: string;
  damageQuantity?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function VoidConfirmDialog({
  open,
  onOpenChange,
  palletInfo,
  voidReason,
  damageQuantity,
  onConfirm,
  onCancel,
}: VoidConfirmDialogProps) {
  if (!palletInfo) return null;

  const isDamage = voidReason === 'Damage';
  const isPartialDamage = isDamage && damageQuantity && damageQuantity < palletInfo.product_qty;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-500">
            <AlertTriangle className="h-5 w-5" />
            Confirm Void Operation
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4 mt-4">
              {/* Warning message */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  This action cannot be undone. Please review the details carefully.
                </p>
              </div>

              {/* Pallet details */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Pallet Information:</h4>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Hash className="h-4 w-4" />
                    <span>Pallet:</span>
                  </div>
                  <div className="font-medium">{palletInfo.plt_num}</div>

                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Package className="h-4 w-4" />
                    <span>Product:</span>
                  </div>
                  <div className="font-medium">{palletInfo.product_code}</div>

                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Package className="h-4 w-4" />
                    <span>Quantity:</span>
                  </div>
                  <div className="font-medium">
                    {isDamage && damageQuantity ? (
                      <span>
                        <span className="text-red-500">{damageQuantity}</span> / {palletInfo.product_qty}
                      </span>
                    ) : (
                      palletInfo.product_qty
                    )}
                  </div>

                  {palletInfo.plt_loc && (
                    <>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span>Location:</span>
                      </div>
                      <div className="font-medium">{palletInfo.plt_loc}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Void reason */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Void Reason:</h4>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2">
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {voidReason}
                    {isPartialDamage && ' (Partial)'}
                  </p>
                </div>
              </div>

              {/* Special warnings */}
              {palletInfo.plt_remark && (
                <>
                  {palletInfo.plt_remark.includes('ACO') && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>ACO Order Pallet:</strong> This will update the ACO order remaining quantity.
                      </p>
                    </div>
                  )}
                  
                  {palletInfo.plt_remark.includes('Material GRN') && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Material GRN Pallet:</strong> The GRN record will be deleted.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Reprint notice */}
              {['Wrong Label', 'Wrong Qty', 'Wrong Product Code'].includes(voidReason) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    A reprint will be required after voiding.
                  </p>
                </div>
              )}

              {isPartialDamage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    A new label will be printed for the remaining {palletInfo.product_qty - damageQuantity!} units.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Confirm Void
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}