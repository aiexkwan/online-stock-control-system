'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CubeIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  PencilIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  getProductByCode, 
  createProduct, 
  updateProduct,
  ProductData 
} from '../../actions/productActions';

interface ProductUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatusMessageType {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export default function ProductUpdateDialog({ isOpen, onClose }: ProductUpdateDialogProps) {
  // 狀態管理
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchedCode, setSearchedCode] = useState('');
  const [statusMessage, setStatusMessage] = useState<StatusMessageType | null>(null);
  
  // 表單狀態
  const [formData, setFormData] = useState<ProductData>({
    code: '',
    description: '',
    colour: '',
    standard_qty: 0,
    type: ''
  });

  // 重置狀態
  const resetState = useCallback(() => {
    setProductData(null);
    setIsEditing(false);
    setShowCreateDialog(false);
    setShowForm(false);
    setSearchedCode('');
    setStatusMessage(null);
    setFormData({
      code: '',
      description: '',
      colour: '',
      standard_qty: 0,
      type: ''
    });
  }, []);

  // 關閉 dialog
  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // 搜尋產品
  const handleSearch = useCallback(async (code: string) => {
    if (!code.trim()) {
      setStatusMessage({
        type: 'error',
        message: 'Please enter a product code'
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    setSearchedCode(code.trim());
    
    try {
      const result = await getProductByCode(code.trim());
      
      if (result.success && result.data) {
        // 搜尋成功 - 顯示產品信息
        setProductData(result.data);
        setIsEditing(false);
        setShowForm(false);
        setShowCreateDialog(false);
        setStatusMessage({
          type: 'success',
          message: `Product found: ${result.data.code}`
        });
      } else {
        // 搜尋失敗 - 詢問是否新增
        setProductData(null);
        setShowCreateDialog(true);
        setShowForm(false);
        setIsEditing(false);
        setStatusMessage({
          type: 'warning',
          message: `Product "${code.trim()}" not found. Would you like to create it?`
        });
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: 'An unexpected error occurred during the search.'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 開始編輯
  const handleEdit = useCallback(() => {
    if (productData) {
      setFormData(productData);
      setIsEditing(true);
      setShowForm(true);
      setShowCreateDialog(false);
    }
  }, [productData]);

  // 確認新增產品
  const handleConfirmCreate = useCallback(() => {
    setFormData({
      code: searchedCode,
      description: '',
      colour: '',
      standard_qty: 0,
      type: ''
    });
    setIsEditing(false);
    setShowForm(true);
    setShowCreateDialog(false);
    setStatusMessage({
      type: 'info',
      message: 'Fill in the product details below to create a new product.'
    });
  }, [searchedCode]);

  // 取消操作
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setShowForm(false);
    setShowCreateDialog(false);
    setStatusMessage(null);
  }, []);

  // 提交表單
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let result;
      
      if (isEditing && productData) {
        // 更新現有產品
        const { code: _, ...updateData } = formData;
        
        // 確保數據類型正確
        if (typeof updateData.standard_qty === 'string') {
          updateData.standard_qty = parseInt(updateData.standard_qty) || 0;
        }
        
        result = await updateProduct(productData.code, updateData);
        
        if (result.success) {
          setProductData(result.data!);
          setStatusMessage({
            type: 'success',
            message: 'Product details updated successfully!'
          });
        }
      } else {
        // 新增產品
        result = await createProduct(formData);
        if (result.success) {
          setProductData(result.data!);
          setStatusMessage({
            type: 'success',
            message: 'Product created successfully!'
          });
        }
      }
      
      if (!result.success) {
        setStatusMessage({
          type: 'error',
          message: result.error || 'Operation failed'
        });
        return;
      }
      
      // 成功後重置狀態
      setIsEditing(false);
      setShowForm(false);
      setShowCreateDialog(false);
      
    } catch (error) {
      console.error('[ProductUpdate] Unexpected error:', error);
      setStatusMessage({
        type: 'error',
        message: 'An unexpected error occurred.'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isEditing, productData, formData]);

  // 處理表單輸入變化
  const handleInputChange = useCallback((field: keyof ProductData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // 處理 Enter 鍵搜尋
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      const target = e.target as HTMLInputElement;
      handleSearch(target.value);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" 
        onClick={handleClose}
        style={{ zIndex: 60 }}
      />
      
      {/* Dialog */}
      <div 
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ zIndex: 70 }}
      >
        <div className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-600/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-orange-300 via-amber-300 to-yellow-300 bg-clip-text text-transparent">
                  Product Update
                </h2>
                <p className="text-sm text-slate-400">Search, view, and manage product information</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
              disabled={isLoading}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-900/50 via-orange-900/20 to-slate-800/50">
            {/* Search Section */}
            {!showForm && (
              <div className="relative group mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-2xl blur-xl"></div>
                <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-orange-900/20 hover:border-orange-500/30 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                  <div className="relative z-10">
                    <h3 className="text-lg font-medium bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent mb-4">
                      Product Search
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="search" className="text-slate-200 font-medium">
                          Product Code
                        </Label>
                        <div className="flex gap-3 mt-2">
                          <Input
                            id="search"
                            type="text"
                            placeholder="Enter product code and press Enter..."
                            onKeyPress={handleKeyPress}
                            className="flex-1 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70 hover:border-orange-500/50 hover:bg-slate-700/60 transition-all duration-300"
                            disabled={isLoading || showCreateDialog}
                          />
                          <Button
                            onClick={() => {
                              const input = document.getElementById('search') as HTMLInputElement;
                              if (input) handleSearch(input.value);
                            }}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 shadow-lg hover:shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Searching...
                              </>
                            ) : (
                              <>
                                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                                Search
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          Enter a product code and press Enter to search (case-insensitive)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* New Search Button */}
            {showForm && (
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-white via-orange-100 to-amber-100 bg-clip-text text-transparent">
                  {isEditing ? 'Edit Product' : 'Create New Product'}
                </h3>
                <Button
                  onClick={resetState}
                  variant="outline"
                  className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10 hover:border-orange-400/70 bg-slate-800/50 backdrop-blur-sm"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  New Search
                </Button>
              </div>
            )}

            {/* Status Message */}
            {statusMessage && (
              <div className={`p-4 rounded-xl mb-6 backdrop-blur-sm border ${
                statusMessage.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
                statusMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
                statusMessage.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-blue-500/10 border-blue-500/30'
              }`}>
                <p className={`text-sm ${
                  statusMessage.type === 'success' ? 'text-green-400' :
                  statusMessage.type === 'error' ? 'text-red-400' :
                  statusMessage.type === 'warning' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>
                  {statusMessage.message}
                </p>
              </div>
            )}

            {/* Create Confirmation Dialog */}
            {showCreateDialog && (
              <div className="relative group mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-yellow-900/30 rounded-2xl blur-xl"></div>
                <div className="relative bg-slate-800/40 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6 shadow-xl shadow-yellow-900/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-amber-500/5 opacity-100 rounded-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-start space-x-4">
                      <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-yellow-400 mb-2">
                          Product Not Found
                        </h3>
                        <p className="text-slate-300 mb-4">
                          The product code "{searchedCode}" was not found in the database. 
                          Would you like to create a new product with this code?
                        </p>
                        <div className="flex space-x-3">
                          <Button
                            onClick={handleConfirmCreate}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-green-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                          >
                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                            Yes, Create Product
                          </Button>
                          <Button
                            onClick={handleCancel}
                            variant="outline"
                            className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/70 hover:text-white transition-all duration-300"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Info Display */}
            {productData && !showForm && (
              <div className="max-w-2xl mx-auto">
                {/* Product Information Card */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-2xl blur-xl"></div>
                  <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-orange-900/20 hover:border-orange-500/30 transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-t-2xl"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium bg-gradient-to-r from-orange-300 to-amber-300 bg-clip-text text-transparent">
                          Product Information
                        </h4>
                        <Button
                          onClick={handleEdit}
                          size="sm"
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                        >
                          <PencilIcon className="w-4 h-4 mr-2" />
                          Edit Product
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <ProductInfoRow label="Product Code" value={productData.code} />
                        <ProductInfoRow label="Description" value={productData.description} />
                        <ProductInfoRow label="Colour" value={productData.colour} />
                        <ProductInfoRow label="Standard Quantity" value={productData.standard_qty.toString()} />
                        <ProductInfoRow label="Type" value={productData.type} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Product Form */}
            {showForm && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-2xl blur-xl"></div>
                <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-orange-900/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-100 rounded-2xl"></div>
                  <div className="relative z-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="code" className="text-slate-200 font-medium">
                            Product Code *
                          </Label>
                          <Input
                            id="code"
                            type="text"
                            value={formData.code}
                            onChange={(e) => handleInputChange('code', e.target.value)}
                            disabled={isEditing}
                            className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="type" className="text-slate-200 font-medium">
                            Type *
                          </Label>
                          <Input
                            id="type"
                            type="text"
                            value={formData.type}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="description" className="text-slate-200 font-medium">
                            Description *
                          </Label>
                          <Input
                            id="description"
                            type="text"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="colour" className="text-slate-200 font-medium">
                            Colour
                          </Label>
                          <Input
                            id="colour"
                            type="text"
                            value={formData.colour}
                            onChange={(e) => handleInputChange('colour', e.target.value)}
                            className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70"
                          />
                        </div>

                        <div>
                          <Label htmlFor="standard_qty" className="text-slate-200 font-medium">
                            Standard Quantity *
                          </Label>
                          <Input
                            id="standard_qty"
                            type="number"
                            value={formData.standard_qty}
                            onChange={(e) => handleInputChange('standard_qty', parseInt(e.target.value) || 0)}
                            className="mt-2 bg-slate-700/50 border-slate-600/50 text-slate-200 placeholder-slate-400 focus:border-orange-500/70 focus:bg-slate-700/70"
                            min="0"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3 pt-6">
                        <Button
                          type="button"
                          onClick={handleCancel}
                          variant="outline"
                          className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/70 hover:text-white transition-all duration-300"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:from-slate-600 disabled:to-slate-600 text-white shadow-lg hover:shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all duration-300"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              {isEditing ? 'Updating...' : 'Creating...'}
                            </>
                          ) : (
                            <>
                              {isEditing ? (
                                <PencilIcon className="h-4 w-4 mr-2" />
                              ) : (
                                <PlusIcon className="h-4 w-4 mr-2" />
                              )}
                              {isEditing ? 'Update Product' : 'Create Product'}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !productData && !showCreateDialog && !showForm && (
              <div className="text-center py-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 to-orange-900/30 rounded-2xl blur-xl"></div>
                  <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 shadow-xl shadow-orange-900/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-amber-500/5 opacity-100 rounded-2xl"></div>
                    <div className="relative z-10">
                      <CubeIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <p className="text-xl text-slate-300 mb-2">Ready to Search</p>
                      <p className="text-slate-400">Enter a product code to search for existing products or create new ones</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-slate-600/50 bg-slate-800/50">
            <Button
              onClick={handleClose}
              variant="outline"
              className="border-slate-600/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500/70 hover:text-white transition-all duration-300"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

interface ProductInfoRowProps {
  label: string;
  value: string;
}

function ProductInfoRow({ label, value }: ProductInfoRowProps) {
  return (
    <div className="flex justify-between items-center py-2 px-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
      <span className="text-slate-300 font-medium">{label}:</span>
      <span className="text-slate-200">{value || 'N/A'}</span>
    </div>
  );
} 