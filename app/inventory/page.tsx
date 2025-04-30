'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Product {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  location: string;
}

interface InventoryRecord {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  type: string;
  from_location: string;
  to_location: string;
  created_by: string;
  created_at: string;
  notes: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [operationType, setOperationType] = useState<'in' | 'out' | 'transfer'>('in');
  const [quantity, setQuantity] = useState<number>(1);
  const [fromLocation, setFromLocation] = useState<string>('');
  const [toLocation, setToLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    // 從本地存儲獲取用戶信息
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
    
    fetchProducts();
    fetchInventoryRecords();
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
  
  async function fetchInventoryRecords() {
    try {
      setRecordsLoading(true);
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*, products(name, sku)')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      // 轉換數據結構以匹配 InventoryRecord 介面
      const formattedRecords = data?.map(record => ({
        id: record.id,
        product_id: record.product_id,
        product_name: record.products?.name || '',
        product_sku: record.products?.sku || '',
        quantity: record.quantity,
        type: record.type,
        from_location: record.from_location || '',
        to_location: record.to_location || '',
        created_by: record.created_by,
        created_at: record.created_at,
        notes: record.notes || ''
      })) || [];
      
      setInventoryRecords(formattedRecords);
    } catch (error) {
      console.error('Error fetching inventory records:', error);
    } finally {
      setRecordsLoading(false);
    }
  }
  
  async function handleInventorySubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedProduct) {
      alert('請選擇產品');
      return;
    }
    
    if (quantity <= 0) {
      alert('數量必須大於 0');
      return;
    }
    
    if (operationType === 'transfer' && (!fromLocation || !toLocation)) {
      alert('轉移操作需要指定來源和目標位置');
      return;
    }
    
    if (operationType === 'in' && !toLocation) {
      alert('入庫操作需要指定目標位置');
      return;
    }
    
    if (operationType === 'out' && !fromLocation) {
      alert('出庫操作需要指定來源位置');
      return;
    }
    
    try {
      // 創建庫存移動記錄
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert([{
          product_id: selectedProduct.id,
          quantity: quantity,
          type: operationType,
          from_location: operationType === 'in' ? null : fromLocation,
          to_location: operationType === 'out' ? null : toLocation,
          created_by: user?.id || 'unknown',
          notes: notes
        }]);
        
      if (movementError) throw movementError;
      
      // 更新產品數量和位置
      let newQuantity = selectedProduct.quantity;
      let newLocation = selectedProduct.location;
      
      if (operationType === 'in') {
        newQuantity += quantity;
        if (!selectedProduct.location) {
          newLocation = toLocation;
        }
      } else if (operationType === 'out') {
        newQuantity -= quantity;
        if (newQuantity < 0) newQuantity = 0;
      } else if (operationType === 'transfer') {
        newLocation = toLocation;
      }
      
      const { error: productError } = await supabase
        .from('products')
        .update({
          quantity: newQuantity,
          location: newLocation,
          last_updated: new Date().toISOString()
        })
        .eq('id', selectedProduct.id);
        
      if (productError) throw productError;
      
      // 重置表單
      setSelectedProduct(null);
      setQuantity(1);
      setFromLocation('');
      setToLocation('');
      setNotes('');
      
      // 重新獲取數據
      fetchProducts();
      fetchInventoryRecords();
      
      alert('庫存操作已成功記錄');
    } catch (error) {
      console.error('Error processing inventory movement:', error);
      alert('處理庫存移動時出錯');
    }
  }
  
  // 過濾產品列表
  const filteredProducts = searchTerm 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">庫存管理</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：庫存操作表單 */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">庫存操作</h2>
            
            <form onSubmit={handleInventorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  操作類型
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="operationType"
                      value="in"
                      checked={operationType === 'in'}
                      onChange={() => setOperationType('in')}
                    />
                    <span className="ml-2">入庫</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="operationType"
                      value="out"
                      checked={operationType === 'out'}
                      onChange={() => setOperationType('out')}
                    />
                    <span className="ml-2">出庫</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="operationType"
                      value="transfer"
                      checked={operationType === 'transfer'}
                      onChange={() => setOperationType('transfer')}
                    />
                    <span className="ml-2">轉移</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  選擇產品
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="搜尋產品..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                  {loading ? (
                    <div className="p-3 text-center text-sm text-gray-500">載入中...</div>
                  ) : filteredProducts.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {filteredProducts.map(product => (
                        <li 
                          key={product.id}
                          className={`p-2 cursor-pointer hover:bg-gray-50 ${selectedProduct?.id === product.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                          onClick={() => setSelectedProduct(product)}
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-gray-500">
                            SKU: {product.sku} | 數量: {product.quantity} | 位置: {product.location || '-'}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-center text-sm text-gray-500">
                      沒有找到產品
                    </div>
                  )}
                </div>
              </div>
              
              {selectedProduct && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="font-medium">{selectedProduct.name}</p>
                  <p className="text-sm">目前數量: {selectedProduct.quantity}</p>
                  <p className="text-sm">目前位置: {selectedProduct.location || '-'}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  數量
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              {(operationType === 'out' || operationType === 'transfer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    來源位置
                  </label>
                  <input
                    type="text"
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    placeholder={selectedProduct?.location || '請輸入位置'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
              
              {(operationType === 'in' || operationType === 'transfer') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    目標位置
                  </label>
                  <input
                    type="text"
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  備註
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                ></textarea>
              </div>
              
              <div>
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={!selectedProduct}
                >
                  提交庫存操作
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* 右側：近期庫存記錄 */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">近期庫存記錄</h2>
            
            {recordsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">產品</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">數量</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">位置</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作者</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inventoryRecords.length > 0 ? (
                      inventoryRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.created_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{record.product_name}</div>
                            <div className="text-sm text-gray-500">{record.product_sku}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.type === 'in' 
                                ? 'bg-green-100 text-green-800' 
                                : record.type === 'out' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {record.type === 'in' ? '入庫' : record.type === 'out' ? '出庫' : '轉移'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {record.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {record.type === 'in' 
                              ? `→ ${record.to_location}` 
                              : record.type === 'out' 
                                ? `${record.from_location} →` 
                                : `${record.from_location} → ${record.to_location}`}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {record.created_by}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 text-center text-sm text-gray-500">
                          沒有庫存記錄
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 