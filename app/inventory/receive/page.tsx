'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  MinusIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function ReceiveInventoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // 載入用戶數據
    const loadUserData = () => {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            setUser(userData);
            if (!userData.permissions.receive && !userData.permissions.qc) {
              // 如果用戶沒有入庫權限，返回首頁
              router.push('/');
            }
          } catch (e) {
            console.error('無法解析用戶數據', e);
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      }
    };
    
    loadUserData();
    fetchProducts();
  }, [router]);

  // 過濾產品列表
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // 獲取產品列表
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_product')
        .select('*')
        .order('id');
      
      if (error) throw error;
      
      if (data) {
        setProducts(data);
        setFilteredProducts(data);
      }
    } catch (error) {
      console.error('獲取產品列表時出錯:', error);
    } finally {
      setLoading(false);
    }
  };

  // 提交入庫記錄
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      setErrorMessage('請選擇一個產品');
      return;
    }
    
    if (quantity <= 0) {
      setErrorMessage('數量必須大於 0');
      return;
    }
    
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // 1. 查詢當前庫存
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('record_inventory')
        .select('*')
        .eq('product_id', selectedProduct.id)
        .maybeSingle();
      
      if (inventoryError) throw inventoryError;
      
      let currentInventory = inventoryData?.quantity || 0;
      let inventoryId = inventoryData?.id;
      
      // 2. 更新庫存或創建新庫存記錄
      if (inventoryData) {
        // 更新現有庫存
        const { error: updateError } = await supabase
          .from('record_inventory')
          .update({ 
            quantity: currentInventory + quantity,
            updated_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', inventoryId);
        
        if (updateError) throw updateError;
      } else {
        // 創建新庫存記錄
        const { data: newInventory, error: createError } = await supabase
          .from('record_inventory')
          .insert({
            product_id: selectedProduct.id,
            quantity: quantity,
            created_by: user.id,
            updated_by: user.id
          })
          .select();
        
        if (createError) throw createError;
        inventoryId = newInventory?.[0]?.id;
      }
      
      // 3. 創建入庫歷史記錄
      const { error: historyError } = await supabase
        .from('record_history')
        .insert({
          product_id: selectedProduct.id,
          type: 'receive',
          quantity: quantity,
          previous_quantity: currentInventory,
          new_quantity: currentInventory + quantity,
          description: description || '正常入庫',
          created_by: user.id,
          status: 'completed'
        });
      
      if (historyError) throw historyError;
      
      // 成功處理
      setSuccessMessage(`成功入庫 ${quantity} 件 ${selectedProduct.name}`);
      
      // 重置表單
      setSelectedProduct(null);
      setQuantity(1);
      setDescription('');
      setSearchTerm('');
      
    } catch (error: any) {
      console.error('入庫操作失敗:', error);
      setErrorMessage(`入庫失敗: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        {/* 頂部導航區 */}
        <div className="mb-6 flex items-center">
          <button 
            onClick={() => router.back()} 
            className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">庫存入庫</h1>
        </div>

        {/* 成功/錯誤訊息 */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage('')}
              className="ml-auto p-1 hover:bg-green-100 rounded-full"
            >
              <XMarkIcon className="h-4 w-4 text-green-500" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <XMarkIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{errorMessage}</span>
            <button 
              onClick={() => setErrorMessage('')}
              className="ml-auto p-1 hover:bg-red-100 rounded-full"
            >
              <XMarkIcon className="h-4 w-4 text-red-500" />
            </button>
          </div>
        )}

        {/* 入庫表單 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* 產品選擇 */}
              <div className="relative">
                <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
                  選擇產品 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="flex">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        id="product"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowDropdown(true);
                        }}
                        onClick={() => setShowDropdown(true)}
                        placeholder="搜索產品 ID 或名稱"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  
                  {showDropdown && filteredProducts.length > 0 && (
                    <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-y-auto z-10 border border-gray-200">
                      {filteredProducts.map((product) => (
                        <div 
                          key={product.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setSelectedProduct(product);
                            setSearchTerm(`${product.id} - ${product.name}`);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="font-medium">{product.id} - {product.name}</div>
                          <div className="text-sm text-gray-500 truncate">{product.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedProduct && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium">{selectedProduct.name}</div>
                    <div className="text-sm text-gray-600">{selectedProduct.description}</div>
                  </div>
                )}
              </div>

              {/* 數量 */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  數量 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <button 
                    type="button"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="p-2 rounded-l-lg bg-gray-100 hover:bg-gray-200 border border-gray-300"
                  >
                    <MinusIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-24 px-4 py-2 border-y border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button 
                    type="button"
                    onClick={() => setQuantity(prev => prev + 1)}
                    className="p-2 rounded-r-lg bg-gray-100 hover:bg-gray-200 border border-gray-300"
                  >
                    <PlusIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* 描述 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  備註
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="添加入庫備註..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* 提交按鈕 */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !selectedProduct}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      處理中...
                    </div>
                  ) : (
                    '確認入庫'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 