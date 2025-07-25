/**
 * ProductUpdateCard Component
 * 使用 FormCard 統一架構實現的產品管理功能
 * 
 * 遷移自: ProductUpdateWidgetV2
 * 支援: 產品搜尋、編輯、創建、狀態管理
 * 採用簡化策略：複製原邏輯到customSubmitHandler，保持所有業務流程
 */

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CubeIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { FormCard, FormType, FormDataRecord, SubmitSuccessData, FormSubmitError } from './FormCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWidgetErrorHandler } from '@/app/(app)/admin/hooks/useWidgetErrorHandler';
import {
  getProductByCode,
  createProduct,
  updateProduct,
  ProductData,
} from '@/app/actions/productActions';
import { cn } from '@/lib/utils';

// 內部狀態類型
interface StatusMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

type ViewMode = 'search' | 'display' | 'edit' | 'create';

// ProductUpdateCard 專用 Props
export interface ProductUpdateCardProps {
  // 顯示選項
  title?: string;
  showHeader?: boolean;
  showProgress?: boolean;
  
  // 樣式
  className?: string;
  height?: number | string;
  
  // 編輯模式（用於 A/B 測試）
  isEditMode?: boolean;
  
  // 回調
  onSuccess?: (data: SubmitSuccessData) => void;
  onError?: (error: FormSubmitError) => void;
  onCancel?: () => void;
}

export const ProductUpdateCard: React.FC<ProductUpdateCardProps> = ({
  title,
  showHeader = true,
  showProgress = false,
  className,
  height = 'auto',
  isEditMode = false,
  onSuccess,
  onError,
  onCancel,
}) => {
  // Error handler hook
  const { handleError, handleFetchError, handleSubmitError: handleWidgetSubmitError, handleSuccess, handleWarning } =
    useWidgetErrorHandler('ProductUpdateCard');

  // 內部狀態管理（保持與原Widget相同的狀態結構）
  const [currentMode, setCurrentMode] = useState<ViewMode>('search');
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [searchedCode, setSearchedCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);

  // 處理表單提交 - 完整複製原Widget邏輯
  const handleFormSubmit = useCallback(async (formData: FormDataRecord): Promise<SubmitSuccessData> => {
    // 檢查是否為搜尋模式
    if (currentMode === 'search' || formData.searchCode) {
      // 搜尋邏輯
      const searchCode = formData.searchCode as string;
      
      if (!searchCode?.trim()) {
        throw new Error('Please enter a product code');
      }

      setSearchedCode(searchCode.trim());
      setStatusMessage(null);

      try {
        const result = await getProductByCode(searchCode.trim());

        if (result.success && result.data) {
          // 產品找到
          setProductData(result.data);
          setCurrentMode('display');
          setShowCreateConfirm(false);
          setStatusMessage({
            type: 'success',
            message: `Found: ${result.data.code}`,
          });
          
          handleSuccess(`Product ${result.data.code} found`, 'search_product', {
            productCode: result.data.code,
          });

          return {
            id: result.data.code,
            message: `Product found: ${result.data.code}`,
            productData: result.data,
          };
        } else {
          // 產品未找到
          setProductData(null);
          setCurrentMode('search');
          setShowCreateConfirm(true);
          setStatusMessage({
            type: 'warning',
            message: `"${searchCode.trim()}" not found`,
          });
          
          handleWarning(`Product "${searchCode.trim()}" not found`, 'search_product');

          throw new Error(`Product "${searchCode.trim()}" not found. You can create it.`);
        }
      } catch (error) {
        handleFetchError(error, 'product_search');
        setStatusMessage({
          type: 'error',
          message: 'Search failed. Please try again.',
        });
        throw error;
      }
    } else {
      // 創建/編輯邏輯
      try {
        if (currentMode === 'edit' && productData) {
          // 更新現有產品
          const { code: _, ...updateData } = formData as unknown as ProductData;
          if (typeof updateData.standard_qty === 'string') {
            updateData.standard_qty = parseInt(updateData.standard_qty) || 0;
          }
          
          const result = await updateProduct(productData.code, updateData);

          if (result.success && result.data) {
            setProductData(result.data);
            setCurrentMode('display');
            setStatusMessage({
              type: 'success',
              message: 'Updated successfully!',
            });
            
            handleSuccess('Product updated successfully', 'update_product', {
              productCode: productData.code,
              changes: updateData,
            });

            return {
              id: result.data.code,
              message: 'Product updated successfully',
              productData: result.data,
            };
          } else {
            throw new Error(result.error || 'Update failed');
          }
        } else {
          // 創建新產品
          const productDataToCreate = { ...formData } as unknown as ProductData;
          if (typeof productDataToCreate.standard_qty === 'string') {
            productDataToCreate.standard_qty = parseInt(productDataToCreate.standard_qty) || 0;
          }
          
          const result = await createProduct(productDataToCreate);
          
          if (result.success && result.data) {
            setProductData(result.data);
            setCurrentMode('display');
            setShowCreateConfirm(false);
            setStatusMessage({
              type: 'success',
              message: 'Created successfully!',
            });
            
            handleSuccess('Product created successfully', 'create_product', {
              productCode: formData.code,
            });

            return {
              id: result.data.code,
              message: 'Product created successfully',
              productData: result.data,
            };
          } else {
            throw new Error(result.error || 'Creation failed');
          }
        }
      } catch (error) {
        const action = currentMode === 'edit' ? 'update_product' : 'create_product';
        handleWidgetSubmitError(error, {
          action,
          productCode: currentMode === 'edit' ? productData?.code : formData.code,
          formData,
        });
        setStatusMessage({
          type: 'error',
          message: 'Operation failed. Please try again.',
        });
        throw error;
      }
    }
  }, [currentMode, productData, searchedCode, handleSuccess, handleWarning, handleFetchError, handleWidgetSubmitError]);

  // FormCard 提交成功回調
  const handleSubmitSuccess = useCallback((data: SubmitSuccessData) => {
    onSuccess?.(data);
  }, [onSuccess]);

  // FormCard 提交失敗回調
  const handleSubmitError = useCallback((error: FormSubmitError) => {
    onError?.(error);
  }, [onError]);

  // 重置到搜尋模式
  const handleReset = useCallback(() => {
    setCurrentMode('search');
    setProductData(null);
    setSearchedCode('');
    setStatusMessage(null);
    setShowCreateConfirm(false);
  }, []);

  // 開始編輯
  const handleEdit = useCallback(() => {
    if (productData) {
      setCurrentMode('edit');
      setStatusMessage({
        type: 'info',
        message: 'Edit mode: Modify the product details below',
      });
    }
  }, [productData]);

  // 確認創建
  const handleConfirmCreate = useCallback(() => {
    setCurrentMode('create');
    setShowCreateConfirm(false);
    setStatusMessage({
      type: 'info',
      message: 'Fill in product details',
    });
  }, []);

  // 取消操作
  const handleCancel = useCallback(() => {
    if (currentMode === 'edit') {
      setCurrentMode('display');
    } else if (currentMode === 'create') {
      setCurrentMode('search');
      setShowCreateConfirm(false);
    }
    setStatusMessage(null);
    onCancel?.();
  }, [currentMode, onCancel]);

  // 動態獲取預填數據
  const getPrefilledData = useCallback(() => {
    if (currentMode === 'edit' && productData) {
      return productData;
    } else if (currentMode === 'create') {
      return { 
        code: searchedCode,
        description: '',
        colour: '',
        standard_qty: 0,
        type: '',
      };
    }
    return {};
  }, [currentMode, productData, searchedCode]);

  return (
    <div className={cn('w-full flex flex-col space-y-4', className)} style={{ height }}>
      {/* 狀態消息 */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'rounded-lg p-3 text-sm',
              statusMessage.type === 'success'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : statusMessage.type === 'error'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : statusMessage.type === 'warning'
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            )}
          >
            {statusMessage.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 創建確認對話框 */}
      <AnimatePresence>
        {showCreateConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-yellow-500/30 bg-yellow-500/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-400 mb-1">Product Not Found</h4>
                    <p className="text-sm text-gray-300 mb-3">
                      Product "{searchedCode}" was not found. Would you like to create it?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleConfirmCreate}
                        size="sm"
                        disabled={isEditMode}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircleIcon className="mr-1 h-4 w-4" />
                        Create Product
                      </Button>
                      <Button
                        onClick={() => setShowCreateConfirm(false)}
                        size="sm"
                        variant="outline"
                        disabled={isEditMode}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 產品顯示模式 */}
      <AnimatePresence>
        {currentMode === 'display' && productData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-blue-400 bg-gray-800 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-blue-400 flex items-center">
                    <CubeIcon className="mr-2 h-5 w-5" />
                    Product Information
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleEdit}
                      size="sm"
                      disabled={isEditMode}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <PencilIcon className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={handleReset}
                      size="sm"
                      variant="outline"
                      disabled={isEditMode}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <ArrowPathIcon className="mr-1 h-4 w-4" />
                      New Search
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Code" value={productData.code} />
                  <InfoRow label="Type" value={productData.type} />
                  <InfoRow label="Description" value={productData.description} />
                  <InfoRow label="Colour" value={productData.colour} />
                  <InfoRow label="Standard Qty" value={productData.standard_qty.toString()} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FormCard 組件 - 根據當前模式動態切換表單類型 */}
      <div className="flex-1">
        {currentMode === 'search' ? (
          <FormCard
            formType={FormType.PRODUCT_UPDATE}
            showHeader={showHeader}
            showProgress={showProgress}
            isEditMode={isEditMode}
            onSubmitSuccess={handleSubmitSuccess}
            onSubmitError={handleSubmitError}
            onCancel={handleCancel}
            customSubmitHandler={handleFormSubmit}
            className="h-full"
          />
        ) : (
          <FormCard
            formType={FormType.PRODUCT_EDIT}
            prefilledData={getPrefilledData()}
            showHeader={showHeader}
            showProgress={showProgress}
            isEditMode={isEditMode}
            onSubmitSuccess={handleSubmitSuccess}
            onSubmitError={handleSubmitError}
            onCancel={handleCancel}
            customSubmitHandler={handleFormSubmit}
            className="h-full"
          />
        )}
      </div>
    </div>
  );
};

// 資訊顯示行組件
interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center p-2 bg-gray-700/30 rounded">
      <span className="text-gray-400 text-sm">{label}:</span>
      <span className="text-white font-medium text-sm">{value || '-'}</span>
    </div>
  );
}

export default ProductUpdateCard;