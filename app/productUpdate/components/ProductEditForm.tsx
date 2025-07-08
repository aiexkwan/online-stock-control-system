'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Save, X, Plus, Edit } from 'lucide-react';
import { ProductData } from '../../actions/productActions';
import { PRODUCT_COLOURS, PRODUCT_TYPES, VALIDATION_RULES } from '../constants';

interface ProductEditFormProps {
  initialData?: ProductData | null;
  isCreating: boolean;
  onSubmit: (data: ProductData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  code?: string;
  description?: string;
  colour?: string;
  standard_qty?: string;
  type?: string;
}

export default function ProductEditForm({
  initialData,
  isCreating,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProductEditFormProps) {
  const [formData, setFormData] = useState<ProductData>({
    code: '',
    description: '',
    colour: '',
    standard_qty: 0,
    type: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表單數據
  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        description: initialData.description || '',
        colour: initialData.colour || '',
        standard_qty: initialData.standard_qty || 0,
        type: initialData.type || '',
      });
    }
  }, [initialData]);

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 驗證產品代碼
    if (!formData.code.trim()) {
      newErrors.code = VALIDATION_RULES.code.message;
    } else if (formData.code.length > VALIDATION_RULES.code.maxLength) {
      newErrors.code = `Product Code must be less than ${VALIDATION_RULES.code.maxLength} characters`;
    }

    // 驗證產品描述
    if (!formData.description.trim()) {
      newErrors.description = VALIDATION_RULES.description.message;
    } else if (formData.description.length > VALIDATION_RULES.description.maxLength) {
      newErrors.description = `Description must be less than ${VALIDATION_RULES.description.maxLength} characters`;
    }

    // 驗證標準數量
    if (formData.standard_qty < 0) {
      newErrors.standard_qty = 'Standard quantity cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理輸入變更
  const handleInputChange = (field: keyof ProductData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // 清除該字段的錯誤
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // 處理下拉選擇變更
  const handleSelectChange = (field: keyof ProductData, value: string) => {
    handleInputChange(field, value);
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = isLoading || isSubmitting;

  return (
    <Card className='border-blue-400 bg-gray-800 text-white'>
      <CardHeader>
        <CardTitle className='flex items-center text-blue-400'>
          {isCreating ? (
            <>
              <Plus className='mr-2 h-5 w-5' />
              Create New Product
            </>
          ) : (
            <>
              <Edit className='mr-2 h-5 w-5' />
              Edit Product
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Product Code */}
          <div className='space-y-2'>
            <label htmlFor='code' className='text-sm font-medium text-gray-300'>
              Product Code <span className='text-red-400'>*</span>
            </label>
            <Input
              id='code'
              value={formData.code}
              onChange={e => handleInputChange('code', e.target.value)}
              disabled={isFormDisabled || !isCreating} // 編輯時不允許修改代碼
              placeholder='Enter product code...'
              className='border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400'
            />
            {errors.code && <p className='text-sm text-red-400'>{errors.code}</p>}
          </div>

          {/* Product Description */}
          <div className='space-y-2'>
            <label htmlFor='description' className='text-sm font-medium text-gray-300'>
              Product Description <span className='text-red-400'>*</span>
            </label>
            <Input
              id='description'
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              disabled={isFormDisabled}
              placeholder='Enter product description...'
              className='border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400'
            />
            {errors.description && <p className='text-sm text-red-400'>{errors.description}</p>}
          </div>

          {/* Product Colour */}
          <div className='space-y-2'>
            <label htmlFor='colour' className='text-sm font-medium text-gray-300'>
              Product Colour
            </label>
            <select
              id='colour'
              value={formData.colour}
              onChange={e => handleSelectChange('colour', e.target.value)}
              disabled={isFormDisabled}
              className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
            >
              {PRODUCT_COLOURS.map(colour => (
                <option key={colour.value} value={colour.value}>
                  {colour.label}
                </option>
              ))}
            </select>
            {errors.colour && <p className='text-sm text-red-400'>{errors.colour}</p>}
          </div>

          {/* Standard Qty */}
          <div className='space-y-2'>
            <label htmlFor='standard_qty' className='text-sm font-medium text-gray-300'>
              Standard Qty
            </label>
            <Input
              id='standard_qty'
              type='number'
              min='0'
              value={formData.standard_qty}
              onChange={e => handleInputChange('standard_qty', parseInt(e.target.value) || 0)}
              disabled={isFormDisabled}
              placeholder='Enter standard quantity...'
              className='border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400'
            />
            {errors.standard_qty && <p className='text-sm text-red-400'>{errors.standard_qty}</p>}
          </div>

          {/* Product Type */}
          <div className='space-y-2'>
            <label htmlFor='type' className='text-sm font-medium text-gray-300'>
              Product Type
            </label>
            <select
              id='type'
              value={formData.type}
              onChange={e => handleSelectChange('type', e.target.value)}
              disabled={isFormDisabled}
              className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400'
            >
              {PRODUCT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && <p className='text-sm text-red-400'>{errors.type}</p>}
          </div>

          {/* 按鈕區域 */}
          <div className='flex space-x-3 border-t border-gray-600 pt-4'>
            <Button
              type='submit'
              disabled={isFormDisabled}
              className='flex-1 bg-blue-600 text-white hover:bg-blue-700'
            >
              <Save className='mr-2 h-4 w-4' />
              {isCreating ? 'Create Product' : 'Update Product'}
            </Button>
            <Button
              type='button'
              onClick={onCancel}
              disabled={isFormDisabled}
              variant='outline'
              className='flex-1 border-gray-600 text-gray-300 hover:bg-gray-700'
            >
              <X className='mr-2 h-4 w-4' />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
