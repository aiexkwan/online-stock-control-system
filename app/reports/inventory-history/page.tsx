'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  sku: string;
}

// 從 Supabase 返回的原始數據類型
interface RawInventoryMovement {
  id: number;
  product_id: number;
  quantity: number;
  type: string;
  from_location: string | null;
  to_location: string | null;
  created_by: string;
  created_at: string;
  notes: string | null;
  products: {
    name: string;
    sku: string;
  } | null;
}

// 處理後的數據類型，用於在頁面中顯示
interface InventoryMovement {
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

export default function InventoryHistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // 篩選條件
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // 排序
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // 分頁
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;
  
  // 初始化標記，避免重複請求
  const [initialized, setInitialized] = useState(false);
  
  // 使用 useCallback 記憶化獲取移動記錄的函數
  const fetchMovements = useCallback(async (shouldReset = false) => {
    if (shouldReset) {
      setCurrentPage(1);
    }
    
    setLoading(true);
    
    try {
      // 建立查詢
      let query = supabase
        .from('inventory_movements')
        .select(`
          id,
          product_id,
          quantity,
          type,
          from_location,
          to_location,
          created_by,
          created_at,
          notes,
          products(name, sku)
        `, { count: 'exact' })
        .order(sortField, { ascending: sortDirection === 'asc' });
      
      // 添加篩選條件
      if (selectedProduct) {
        query = query.eq('product_id', selectedProduct);
      }
      
      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }
      
      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00`);
      }
      
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59`);
      }
      
      // 計算分頁範圍
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query.range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      if (count !== null) {
        setTotalRecords(count);
      }
      
      // 格式化數據
      const formattedData: InventoryMovement[] = (data as unknown as any[] || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products ? item.products.name : 'Unknown',
        product_sku: item.products ? item.products.sku : '',
        quantity: item.quantity,
        type: item.type,
        from_location: item.from_location || '',
        to_location: item.to_location || '',
        created_by: item.created_by,
        created_at: item.created_at,
        notes: item.notes || ''
      }));
      
      setMovements(formattedData);
    } catch (error) {
      console.error('Error fetching inventory movements:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, selectedType, startDate, endDate, sortField, sortDirection, currentPage, pageSize]);
  
  // 載入產品列表
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('data_product')  // 確保表名正確
        .select('id, name, sku')
        .order('name', { ascending: true });
        
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);
  
  // 初始加載數據
  useEffect(() => {
    if (!initialized) {
      fetchProducts();
      fetchMovements();
      setInitialized(true);
    }
  }, [initialized, fetchProducts, fetchMovements]);
  
  // 當篩選、排序或分頁更改時重新獲取數據
  useEffect(() => {
    if (initialized) {
      fetchMovements();
    }
  }, [initialized, currentPage, sortField, sortDirection, fetchMovements]);
  
  // 應用篩選器時重置頁面並獲取數據
  const applyFilters = () => {
    fetchMovements(true);
  };
  
  const handleSort = (field: string) => {
    // 如果點擊當前排序字段，則切換排序方向
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // 默認降序
    }
  };
  
  const handleExport = () => {
    if (movements.length === 0) return;
    
    // 創建 CSV 內容
    const headers = [
      '編號', '產品 ID', '產品名稱', '產品編號', '數量', '操作類型', 
      '來源位置', '目標位置', '操作人', '操作時間', '備註'
    ];
    
    const rows = movements.map(m => [
      m.id,
      m.product_id,
      m.product_name,
      m.product_sku,
      m.quantity,
      m.type === 'in' ? '入庫' : m.type === 'out' ? '出庫' : '轉移',
      m.from_location,
      m.to_location,
      m.created_by,
      new Date(m.created_at).toLocaleString(),
      m.notes
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // 創建下載鏈接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // 設置文件名
    const now = new Date();
    const fileName = `inventory_history_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">庫存變動歷史</h1>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          返回報表
        </button>
      </div>
      
      {/* 篩選選項 */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">產品</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={selectedProduct || ''}
              onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">全部產品</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作類型</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">全部操作</option>
              <option value="in">入庫</option>
              <option value="out">出庫</option>
              <option value="transfer">轉移</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">開始日期</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">結束日期</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
          >
            應用篩選
          </button>
          
          <button
            onClick={handleExport}
            disabled={movements.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            導出 CSV
          </button>
        </div>
      </div>
      
      {/* 數據表格 */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('id')}
                    >
                      ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('products.name')}
                    >
                      產品 {sortField === 'products.name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('quantity')}
                    >
                      數量 {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('type')}
                    >
                      操作類型 {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      位置
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_at')}
                    >
                      時間 {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('created_by')}
                    >
                      操作人 {sortField === 'created_by' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.length > 0 ? (
                    movements.map((movement) => (
                      <tr key={movement.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movement.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{movement.product_name}</div>
                          <div className="text-sm text-gray-500">{movement.product_sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            movement.type === 'in' 
                              ? 'bg-green-100 text-green-800' 
                              : movement.type === 'out' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {movement.type === 'in' ? '入庫' : movement.type === 'out' ? '出庫' : '轉移'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movement.type === 'in' && (
                            <span>入庫至 {movement.to_location}</span>
                          )}
                          {movement.type === 'out' && (
                            <span>從 {movement.from_location} 出庫</span>
                          )}
                          {movement.type === 'transfer' && (
                            <span>{movement.from_location} → {movement.to_location}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(movement.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movement.created_by}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        沒有找到符合條件的記錄
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* 分頁 */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              顯示 {movements.length} 條記錄 (共 {totalRecords} 條)
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一頁
              </button>
              
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一頁
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 