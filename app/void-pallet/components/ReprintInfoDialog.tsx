'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Package, Hash, Printer, X } from 'lucide-react';
import { ReprintInfoInput, PalletInfo } from '../types';

interface ReprintInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reprintInfo: ReprintInfoInput) => void;
  type: 'damage' | 'wrong_qty' | 'wrong_code';
  palletInfo: PalletInfo;
  remainingQuantity?: number; // For damage cases
  isProcessing?: boolean;
}

export function ReprintInfoDialog({
  isOpen,
  onClose,
  onConfirm,
  type,
  palletInfo,
  remainingQuantity,
  isProcessing = false
}: ReprintInfoDialogProps) {
  const [correctedQuantity, setCorrectedQuantity] = useState<string>('');
  const [correctedProductCode, setCorrectedProductCode] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCorrectedQuantity('');
      setCorrectedProductCode('');
      setErrors({});
      
      // Pre-fill based on type
      if (type === 'damage' && remainingQuantity) {
        setCorrectedQuantity(remainingQuantity.toString());
      } else if (type === 'wrong_qty') {
        setCorrectedQuantity(palletInfo.product_qty.toString());
      } else if (type === 'wrong_code') {
        setCorrectedProductCode(palletInfo.product_code);
      }
    }
  }, [isOpen, type, palletInfo, remainingQuantity]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (type === 'wrong_qty' || type === 'damage') {
      const qty = parseInt(correctedQuantity);
      if (!correctedQuantity.trim() || isNaN(qty) || qty <= 0) {
        newErrors.quantity = 'Please enter a valid quantity greater than 0';
      }
      if (type === 'damage' && qty > palletInfo.product_qty) {
        newErrors.quantity = `Quantity cannot exceed original quantity (${palletInfo.product_qty})`;
      }
    }

    if (type === 'wrong_code') {
      if (!correctedProductCode.trim()) {
        newErrors.productCode = 'Please enter a valid product code';
      }
      if (correctedProductCode.trim() === palletInfo.product_code) {
        newErrors.productCode = 'New product code must be different from original';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) return;

    const reprintInfo: ReprintInfoInput = {
      type,
      originalPalletInfo: palletInfo,
    };

    if (type === 'damage') {
      reprintInfo.remainingQuantity = remainingQuantity;
    } else if (type === 'wrong_qty') {
      reprintInfo.correctedQuantity = parseInt(correctedQuantity);
    } else if (type === 'wrong_code') {
      reprintInfo.correctedProductCode = correctedProductCode.trim();
    }

    onConfirm(reprintInfo);
  };

  const getDialogConfig = () => {
    switch (type) {
      case 'damage':
        return {
          title: 'Confirm Reprint for Remaining Quantity',
          description: `Original pallet will be marked as damaged. A new pallet will be created for the remaining quantity.`,
          icon: <AlertCircle className="h-5 w-5 text-orange-500" />,
          badge: 'Partial Damage',
          badgeVariant: 'destructive' as const
        };
      case 'wrong_qty':
        return {
          title: 'Correct Quantity and Reprint',
          description: 'Please enter the correct quantity for the new pallet.',
          icon: <Hash className="h-5 w-5 text-blue-500" />,
          badge: 'Wrong Quantity',
          badgeVariant: 'secondary' as const
        };
      case 'wrong_code':
        return {
          title: 'Correct Product Code and Reprint',
          description: 'Please enter the correct product code for the new pallet.',
          icon: <Package className="h-5 w-5 text-green-500" />,
          badge: 'Wrong Code',
          badgeVariant: 'secondary' as const
        };
    }
  };

  const config = getDialogConfig();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with higher z-index */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
        onClick={onClose}
        style={{ zIndex: 60 }}
      />
      
      {/* Dialog with highest z-index */}
      <div 
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ zIndex: 70 }}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              {config.icon}
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {config.title}
                </h2>
                <Badge variant={config.badgeVariant} className="mt-1">
                  {config.badge}
                </Badge>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isProcessing}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              {config.description}
            </p>

            {/* Original Pallet Info */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Original Pallet Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Pallet:</span>
                  <span className="ml-2 font-mono text-gray-900">{palletInfo.plt_num}</span>
                </div>
                <div>
                  <span className="text-gray-500">Code:</span>
                  <span className="ml-2 font-mono text-gray-900">{palletInfo.product_code}</span>
                </div>
                <div>
                  <span className="text-gray-500">Quantity:</span>
                  <span className="ml-2 text-gray-900">{palletInfo.product_qty}</span>
                </div>
                <div>
                  <span className="text-gray-500">Location:</span>
                  <span className="ml-2 text-gray-900">{palletInfo.plt_loc || 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-3">
              {(type === 'wrong_qty' || type === 'damage') && (
                <div>
                  <Label htmlFor="quantity" className="text-black font-medium">
                    {type === 'damage' ? 'Remaining Quantity' : 'Correct Quantity'}
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={correctedQuantity}
                    onChange={(e) => setCorrectedQuantity(e.target.value)}
                    placeholder="Enter quantity"
                    min="1"
                    max={type === 'damage' ? palletInfo.product_qty : undefined}
                    disabled={type === 'damage'} // Read-only for damage
                    className={`text-black ${errors.quantity ? 'border-red-500' : ''}`}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-500 mt-1">{errors.quantity}</p>
                  )}
                </div>
              )}

              {type === 'wrong_code' && (
                <div>
                  <Label htmlFor="productCode" className="text-black font-medium">Correct Product Code</Label>
                  <Input
                    id="productCode"
                    type="text"
                    value={correctedProductCode}
                    onChange={(e) => setCorrectedProductCode(e.target.value.toUpperCase())}
                    placeholder="Enter correct product code"
                    className={`text-black ${errors.productCode ? 'border-red-500' : ''}`}
                  />
                  {errors.productCode && (
                    <p className="text-sm text-red-500 mt-1">{errors.productCode}</p>
                  )}
                </div>
              )}
            </div>

            {/* Auto Reprint Notice */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Printer className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Auto Reprint</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                A new pallet label will be automatically generated and printed after confirmation.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="mb-2 sm:mb-0 text-black border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 mr-2" />
                  Confirm & Auto Reprint
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
} 