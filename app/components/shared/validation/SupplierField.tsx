'use client';

import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SupplierInput } from './SupplierInput';
import type { SupplierInfo } from './SupplierInput';

export interface SupplierFieldProps {
  /** Label for supplier code */
  codeLabel?: string;
  /** Label for supplier name */
  nameLabel?: string;
  /** Initial supplier code */
  initialCode?: string;
  /** Callback when supplier changes */
  onSupplierChange?: (supplier: SupplierInfo | null) => void;
  /** Show supplier info in a card */
  showCard?: boolean;
  /** Card title */
  cardTitle?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
  /** Error message */
  error?: string;
}

/**
 * Compound supplier field with code input and name display
 * 包含代碼輸入和名稱顯示的複合供應商欄位
 *
 * @example
 * ```tsx
 * <SupplierField
 *   codeLabel="Supplier Code"
 *   nameLabel="Supplier Name"
 *   showCard
 *   cardTitle="Supplier Information"
 *   onSupplierChange={(supplier) => {
 *     process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.log('Selected supplier:', supplier);
 *   }}
 * />
 * ```
 */
export function SupplierField({
  codeLabel = 'Supplier Code',
  nameLabel = 'Supplier Name',
  initialCode = '',
  onSupplierChange,
  showCard = false,
  cardTitle = 'Supplier Details',
  required = false,
  disabled = false,
  className,
  error,
}: SupplierFieldProps) {
  const [supplierCode, setSupplierCode] = useState(initialCode);
  const [supplierInfo, setSupplierInfo] = useState<SupplierInfo | null>(null);

  useEffect(() => {
    setSupplierCode(initialCode);
  }, [initialCode]);

  const handleSupplierValidated = (supplier: SupplierInfo | null) => {
    setSupplierInfo(supplier);
    onSupplierChange?.(supplier);
  };

  const content = (
    <div className={cn('space-y-4', className)}>
      <SupplierInput
        label={codeLabel}
        required={required}
        value={supplierCode}
        onChange={setSupplierCode}
        onSupplierValidated={handleSupplierValidated}
        showSupplierName={false}
        enableSuggestions
        autoSelectSingleMatch
        disabled={disabled}
        placeholder='Enter supplier code'
        errorMessage={error}
      />

      <div>
        {nameLabel && <label className='text-sm font-medium text-gray-700'>{nameLabel}</label>}
        <Input
          value={supplierInfo?.supplier_name || ''}
          readOnly
          disabled
          placeholder='Supplier name will appear here'
          className={cn('bg-gray-50', supplierInfo && 'font-medium text-green-700')}
        />
      </div>
    </div>
  );

  if (showCard) {
    return (
      <Card className={className}>
        <div className='p-6'>
          <div className='mb-4 flex items-center gap-2'>
            <Building2 className='h-5 w-5 text-gray-500' />
            <h3 className='text-lg font-semibold'>{cardTitle}</h3>
          </div>
          {content}
        </div>
      </Card>
    );
  }

  return content;
}
