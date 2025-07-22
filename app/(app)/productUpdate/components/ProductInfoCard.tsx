'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Edit, Hash, FileText, Palette, Calculator, Tag } from 'lucide-react';
import { ProductData } from '@/app/actions/productActions';

interface ProductInfoCardProps {
  productData: ProductData;
  onEdit: () => void;
  isLoading?: boolean;
}

export default function ProductInfoCard({
  productData,
  onEdit,
  isLoading = false,
}: ProductInfoCardProps) {
  return (
    <Card className='border-blue-400 bg-gray-800 text-white'>
      <CardHeader>
        <CardTitle className='flex items-center text-blue-400'>
          <Package className='mr-2 h-5 w-5' />
          Product Information
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* 產品基本信息 */}
        <div className='space-y-3'>
          <InfoRow
            icon={<Hash className='h-4 w-4' />}
            label='Product Code'
            value={productData.code}
          />
          <InfoRow
            icon={<FileText className='h-4 w-4' />}
            label='Description'
            value={productData.description}
          />
          <InfoRow
            icon={<Palette className='h-4 w-4' />}
            label='Colour'
            value={productData.colour || 'Not specified'}
          />
          <InfoRow
            icon={<Calculator className='h-4 w-4' />}
            label='Standard Qty'
            value={productData.standard_qty || 'Not specified'}
          />
          <InfoRow
            icon={<Tag className='h-4 w-4' />}
            label='Type'
            value={productData.type || 'Not specified'}
          />
        </div>

        {/* 編輯按鈕 */}
        <div className='border-t border-gray-600 pt-4'>
          <Button
            onClick={onEdit}
            disabled={isLoading}
            className='w-full bg-blue-600 text-white hover:bg-blue-700'
          >
            <Edit className='mr-2 h-4 w-4' />
            Edit Product
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: unknown;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  // 策略4: unknown + type narrowing - 安全轉換為 ReactNode
  const displayValue =
    typeof value === 'string' || typeof value === 'number'
      ? value
      : value && typeof value === 'object' && 'toString' in value
        ? String(value)
        : 'N/A';

  return (
    <div className='flex items-start space-x-3'>
      <div className='mt-0.5 flex-shrink-0 text-gray-400'>{icon}</div>
      <div className='flex-1'>
        <span className='block font-medium text-gray-300'>{label}:</span>
        <span className='mt-1 block text-white'>{displayValue}</span>
      </div>
    </div>
  );
}
