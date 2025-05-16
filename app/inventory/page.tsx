'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Product {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  location: string;
}

type OperationType = 'receive' | 'issue' | 'transfer';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [operationType, setOperationType] = useState<OperationType>('receive');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    productId: 0,
    quantity: 1,
    fromLocation: '',
    toLocation: '',
    notes: ''
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const clockNumber = localStorage.getItem('loggedInUserClockNumber');
      if (clockNumber) {
        setUserId(clockNumber);
      } else {
        console.warn('[InventoryPage] loggedInUserClockNumber not found in localStorage.');
        setUserId(null); // Or handle appropriately
      }
    }
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  // 當選擇產品時更新表單數據
  function handleProductSelection(e: React.ChangeEvent<HTMLSelectElement>) {
    const productId = parseInt(e.target.value);
    const selectedProduct = products.find(p => p.id === productId);
    
    if (selectedProduct) {
      setFormData({
        ...formData,
        productId,
        fromLocation: selectedProduct.location,
        toLocation: selectedProduct.location
      });
    }
  }

  // 處理表單提交
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    
    // 基本驗證
    if (!formData.productId) {
      setErrorMessage('請選擇產品');
      return;
    }
    
    if (formData.quantity <= 0) {
      setErrorMessage('數量必須大於零');
      return;
    }
    
    if (operationType === 'issue' || operationType === 'transfer') {
      const selectedProduct = products.find(p => p.id === formData.productId);
      if (selectedProduct && formData.quantity > selectedProduct.quantity) {
        setErrorMessage('出庫數量不能大於當前庫存量');
        return;
      }
    }
    
    if (operationType === 'transfer' && formData.fromLocation === formData.toLocation) {
      setErrorMessage('轉移的目標位置不能與當前位置相同');
      return;
    }
    
    // 顯示確認對話框
    setShowConfirmModal(true);
  }
  
  // 確認並執行庫存操作
  async function confirmOperation() {
    try {
      setLoadingAction(true);
      setShowConfirmModal(false);
      
      const selectedProduct = products.find(p => p.id === formData.productId);
      if (!selectedProduct) throw new Error('找不到選定的產品');
      
      // 創建庫存移動記錄
      const movementData = {
        product_id: formData.productId,
        quantity: formData.quantity,
        type: operationType,
        from_location: operationType === 'receive' ? '' : formData.fromLocation,
        to_location: operationType === 'issue' ? '' : (operationType === 'transfer' ? formData.toLocation : formData.fromLocation),
        created_by: userId,
        notes: formData.notes
      };
      
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([movementData]);
      
      if (movementError) throw movementError;
      
      // 更新產品數量和位置
      let newQuantity = selectedProduct.quantity;
      let newLocation = selectedProduct.location;
      
      if (operationType === 'receive') {
        newQuantity += formData.quantity;
      } else if (operationType === 'issue') {
        newQuantity -= formData.quantity;
      } else if (operationType === 'transfer') {
        newLocation = formData.toLocation;
      }
      
      const { error: updateError } = await supabase
        .from('products')
        .update({
          quantity: newQuantity,
          location: newLocation,
          last_updated: new Date().toISOString()
        })
        .eq('id', formData.productId);
      
      if (updateError) throw updateError;
      
      // 操作成功
      await fetchProducts(); // 刷新產品列表
      
      // 根據操作類型顯示成功訊息
      if (operationType === 'receive') {
        setSuccessMessage(`成功入庫 ${formData.quantity} 件 ${selectedProduct.name}`);
      } else if (operationType === 'issue') {
        setSuccessMessage(`成功出庫 ${formData.quantity} 件 ${selectedProduct.name}`);
      } else if (operationType === 'transfer') {
        setSuccessMessage(`成功將 ${selectedProduct.name} 從 ${formData.fromLocation} 轉移到 ${formData.toLocation}`);
      }
      
      // 重置表單
      setFormData({
        productId: 0,
        quantity: 1,
        fromLocation: '',
        toLocation: '',
        notes: ''
      });
      
    } catch (error) {
      console.error('操作失敗', error);
      setErrorMessage('操作失敗: ' + (error instanceof Error ? error.message : '未知錯誤'));
    } finally {
      setLoadingAction(false);
    }
  }

  // 過濾產品列表
  const filteredProducts = products.filter((product) => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">庫存操作</h1>
      
      {/* 操作選擇按鈕 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setOperationType('receive')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              operationType === 'receive'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            入庫
          </button>
          <button
            onClick={() => setOperationType('issue')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              operationType === 'issue'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            出庫
          </button>
          <button
            onClick={() => setOperationType('transfer')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              operationType === 'transfer'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            轉移
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側表單 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">
              {operationType === 'receive' && '入庫操作'}
              {operationType === 'issue' && '出庫操作'}
              {operationType === 'transfer' && '庫存轉移'}
            </h2>
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                {successMessage}
              </div>
            )}
            
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                {errorMessage}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  搜尋產品
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="輸入產品名稱或編號"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  選擇產品
                </label>
                <select
                  value={formData.productId || ''}
                  onChange={handleProductSelection}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">-- 選擇產品 --</option>
                  {filteredProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku}) - 庫存: {product.quantity}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  數量
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              {(operationType === 'issue' || operationType === 'transfer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    當前位置
                  </label>
                  <input
                    type="text"
                    value={formData.fromLocation}
                    onChange={(e) => setFormData({...formData, fromLocation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    readOnly
                  />
                </div>
              )}
              
              {(operationType === 'receive' || operationType === 'transfer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {operationType === 'receive' ? '入庫位置' : '目標位置'}
                  </label>
                  <input
                    type="text"
                    value={formData.toLocation}
                    onChange={(e) => setFormData({...formData, toLocation: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備註
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>
              
              <button
                type="submit"
                disabled={loadingAction}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {loadingAction ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    處理中...
                  </span>
                ) : (
                  <>確認操作</>
                )}
              </button>
            </form>
          </div>
          
          {/* 右側產品列表 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">庫存列表</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">產品</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">編號</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">數量</th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">位置</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{product.sku}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          product.quantity <= 0 ? 'text-red-600' : 'text-gray-900'
                        }`}>{product.quantity}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{product.location}</div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">
                        沒有找到產品
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* 確認操作對話框 */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">確認操作</h2>
            <p className="mb-6">
              {operationType === 'receive' && `您確定要入庫 ${formData.quantity} 件產品到位置 ${formData.toLocation} 嗎？`}
              {operationType === 'issue' && `您確定要從位置 ${formData.fromLocation} 出庫 ${formData.quantity} 件產品嗎？`}
              {operationType === 'transfer' && `您確定要將產品從位置 ${formData.fromLocation} 轉移到位置 ${formData.toLocation} 嗎？`}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={confirmOperation}
                className={`px-4 py-2 text-white rounded-md ${
                  operationType === 'receive' ? 'bg-green-600 hover:bg-green-700' :
                  operationType === 'issue' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 