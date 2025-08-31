'use client';

import React, { useState, useCallback } from 'react';
import { Package, AlertCircle, CheckCircle } from 'lucide-react';
import {
  StockMovementLayout,
  StatusMessage,
} from '@/components/ui/universal-stock-movement-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getProductByCode,
  createProduct,
  updateProduct,
  // updateProductOptimized, // 新增優化版本 - TODO: Remove if not used
  ProductData,
} from '@/app/actions/productActions';
import ProductSearchForm from './components/ProductSearchForm';
import ProductInfoCard from './components/ProductInfoCard';
import ProductEditForm from './components/ProductEditForm';

interface StatusMessageType {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function ProductUpdatePage() {
  // 狀態管理
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchedCode, setSearchedCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<StatusMessageType | null>(null);

  // 搜尋產品
  const handleSearch = useCallback(async (code: string) => {
    setIsLoading(true);
    setStatusMessage(null);
    setSearchedCode(code);

    try {
      const result = await getProductByCode(code);

      if (result.success && result.data) {
        // 搜尋成功 - 顯示產品信息
        setProductData(result.data);
        setIsEditing(false);
        setShowForm(false);
        setShowCreateDialog(false);
        setStatusMessage({
          type: 'success',
          message: `Product found: ${result.data.code}`,
        });
      } else {
        // 搜尋失敗 - 詢問是否新增
        setProductData(null);
        setShowCreateDialog(true);
        setShowForm(false);
        setIsEditing(false);
        setStatusMessage({
          type: 'warning',
          message: `Product "${code}" not found. Would you like to create it?`,
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        message: 'An unexpected error occurred during the search.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 開始編輯
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setShowForm(true);
    setShowCreateDialog(false);
  }, []);

  // 確認新增產品
  const handleConfirmCreate = useCallback(() => {
    setIsEditing(false);
    setShowForm(true);
    setShowCreateDialog(false);
    setStatusMessage({
      type: 'info',
      message: 'Fill in the product details below to create a new product.',
    });
  }, []);

  // 取消操作
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setShowForm(false);
    setShowCreateDialog(false);
    setStatusMessage(null);
  }, []);

  // 提交表單
  const handleSubmit = useCallback(
    async (formData: ProductData) => {
      setIsLoading(true);

      try {
        let result;

        if (isEditing && productData) {
          // 更新現有產品 - 使用優化的 SQL 方法
          if (process.env.NODE_ENV !== 'production') {
            console.log('[ProductUpdate] Using optimized SQL update method');
            console.log('[ProductUpdate] productData.code:', productData.code);
            console.log('[ProductUpdate] formData:', formData);
            console.log('[ProductUpdate] isEditing:', isEditing);
          }

          // 移除 formData 中的 code 字段，因為它不應該被更新
          const { code: _, ...updateData } = formData;

          // 確保數據類型與資料庫匹配
          // 資料庫中 standard_qty 現在是 int4 類型，確保它是數字
          if (typeof updateData.standard_qty === 'string') {
            updateData.standard_qty = parseInt(updateData.standard_qty) || 0;
          }

          if (process.env.NODE_ENV !== 'production') {
            console.log('[ProductUpdate] updateData (without code):', updateData);
          }

          result = await updateProduct(productData.code, updateData);

          if (process.env.NODE_ENV !== 'production') {
            console.log('[ProductUpdate] updateProduct result:', result);
          }

          if (result.success) {
            setProductData(result.data!);
            setStatusMessage({
              type: 'success',
              message: 'Product details updated successfully!',
            });
          }
        } else {
          // 新增產品
          if (process.env.NODE_ENV !== 'production') {
            console.log('[ProductUpdate] Creating new product');
            console.log('[ProductUpdate] formData:', formData);
          }

          result = await createProduct(formData);
          if (result.success) {
            setProductData(result.data!);
            setStatusMessage({
              type: 'success',
              message: 'Product created successfully!',
            });
          }
        }

        if (!result.success) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[ProductUpdate] Operation failed:', result.error);
          }
          setStatusMessage({
            type: 'error',
            message: result.error || 'Operation failed',
          });
          return;
        }

        // 成功後重置狀態
        setIsEditing(false);
        setShowForm(false);
        setShowCreateDialog(false);
      } catch {
        console.error('[ProductUpdate] Unexpected error');
        setStatusMessage({
          type: 'error',
          message: 'An unexpected error occurred.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isEditing, productData]
  );

  // 重置所有狀態
  const handleReset = useCallback(() => {
    setProductData(null);
    setIsEditing(false);
    setShowForm(false);
    setShowCreateDialog(false);
    setSearchedCode('');
    setStatusMessage(null);
  }, []);

  return (
    <StockMovementLayout
      title='Product Update'
      description='Search, view, and manage product information'
      isLoading={isLoading}
      loadingText='Processing...'
    >
      <div className='space-y-6'>
        {/* 搜尋區域 - 只在沒有顯示表單時顯示 */}
        {!showForm && (
          <ProductSearchForm
            onSearch={handleSearch}
            isLoading={isLoading}
            disabled={showCreateDialog}
          />
        )}

        {/* 重新搜尋按鈕 - 只在顯示表單時顯示 */}
        {showForm && (
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-white'>
              {isEditing ? 'Edit Product' : 'Create New Product'}
            </h2>
            <Button
              onClick={handleReset}
              variant='outline'
              className='border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white'
            >
              New Search
            </Button>
          </div>
        )}

        {/* 狀態消息 */}
        {statusMessage && (
          <StatusMessage
            type={statusMessage.type}
            message={statusMessage.message}
            onDismiss={() => setStatusMessage(null)}
          />
        )}

        {/* 新增確認對話框 */}
        {showCreateDialog && (
          <Card className='border-yellow-400 bg-gray-800 text-white'>
            <CardContent className='p-6'>
              <div className='flex items-start space-x-4'>
                <AlertCircle className='mt-1 h-6 w-6 text-yellow-400' />
                <div className='flex-1'>
                  <h3 className='mb-2 text-lg font-medium text-yellow-400'>Product Not Found</h3>
                  <p className='mb-4 text-gray-300'>
                    The product code &quot;{searchedCode}&quot; was not found in the database. Would
                    you like to create a new product with this code?
                  </p>
                  <div className='flex space-x-3'>
                    <Button
                      onClick={handleConfirmCreate}
                      className='bg-blue-600 text-white hover:bg-blue-700'
                    >
                      <CheckCircle className='mr-2 h-4 w-4' />
                      Yes, Create Product
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant='outline'
                      className='border-gray-600 text-gray-300 hover:bg-gray-700'
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 結果展示區域 */}
        {productData && !showForm && (
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* 產品信息卡片 */}
            <ProductInfoCard productData={productData} onEdit={handleEdit} isLoading={isLoading} />

            {/* 空白區域或其他信息 */}
            <Card className='border-gray-600 bg-gray-800 text-white'>
              <CardContent className='py-12 text-center'>
                <Package className='mx-auto mb-4 h-16 w-16 text-gray-400' />
                <p className='mb-2 text-xl text-gray-400'>Product Details</p>
                <p className='text-gray-500'>
                  Click &quot;Edit Product&quot; to modify the product information
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 表單區域 */}
        {showForm && (
          <div className='mx-auto max-w-2xl'>
            <ProductEditForm
              initialData={
                isEditing
                  ? productData
                  : {
                      code: searchedCode,
                      description: '',
                      colour: '',
                      standard_qty: 0,
                      type: '',
                    }
              }
              isCreating={!isEditing}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* 空狀態 */}
        {!isLoading && !productData && !showCreateDialog && !showForm && (
          <Card className='border-gray-600 bg-gray-800 text-white'>
            <CardContent className='py-12 text-center'>
              <Package className='mx-auto mb-4 h-16 w-16 text-gray-400' />
              <p className='mb-2 text-xl text-gray-400'>Ready to Search</p>
              <p className='text-gray-500'>
                Enter a product code to search for existing products or create new ones
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </StockMovementLayout>
  );
}
