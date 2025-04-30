'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import { ChartBarIcon, ClockIcon, DocumentTextIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface ProductSummary {
  total_products: number;
  total_quantity: number;
  low_stock_count: number;
  zero_stock_count: number;
}

interface LocationSummary {
  location: string;
  product_count: number;
  total_quantity: number;
}

interface RecentMovement {
  id: number;
  product_name: string;
  type: string;
  quantity: number;
  created_at: string;
  created_by: string;
}

interface InventoryMovement {
  id: number;
  product_id: number;
  products?: {
    name: string;
  };
  type: string;
  quantity: number;
  created_at: string;
  created_by: string;
}

export default function ReportsPage() {
  const [productSummary, setProductSummary] = useState<ProductSummary>({
    total_products: 0,
    total_quantity: 0,
    low_stock_count: 0,
    zero_stock_count: 0
  });
  const [locationSummary, setLocationSummary] = useState<LocationSummary[]>([]);
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReportData() {
      setLoading(true);
      
      try {
        // 獲取產品摘要
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, quantity');
          
        if (productsError) throw productsError;
        
        // 計算產品摘要數據
        const summary: ProductSummary = {
          total_products: products?.length || 0,
          total_quantity: products?.reduce((sum, product) => sum + (product.quantity || 0), 0) || 0,
          low_stock_count: products?.filter(p => p.quantity > 0 && p.quantity <= 5).length || 0,
          zero_stock_count: products?.filter(p => p.quantity <= 0).length || 0
        };
        
        setProductSummary(summary);
        
        // 獲取位置摘要
        const { data: locations, error: locationsError } = await supabase
          .from('products')
          .select('location, quantity')
          .not('location', 'is', null);
          
        if (locationsError) throw locationsError;
        
        // 按位置分組
        const locationMap = new Map<string, { count: number, total: number }>();
        
        locations?.forEach(item => {
          const location = item.location || 'Unknown';
          const current = locationMap.get(location) || { count: 0, total: 0 };
          
          locationMap.set(location, {
            count: current.count + 1,
            total: current.total + (item.quantity || 0)
          });
        });
        
        // 轉換為數組
        const locationData: LocationSummary[] = Array.from(locationMap.entries())
          .map(([location, data]) => ({
            location,
            product_count: data.count,
            total_quantity: data.total
          }))
          .sort((a, b) => b.total_quantity - a.total_quantity);
          
        setLocationSummary(locationData);
        
        // 獲取最近的庫存移動
        const { data: movements, error: movementsError } = await supabase
          .from('inventory_movements')
          .select('id, product_id, products(name), type, quantity, created_at, created_by')
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (movementsError) throw movementsError;
        
        // 格式化移動數據
        const formattedMovements: RecentMovement[] = [];
        
        if (movements) {
          movements.forEach((movement: any) => {
            formattedMovements.push({
              id: movement.id,
              product_name: movement.products?.name || 'Unknown Product',
              type: movement.type,
              quantity: movement.quantity,
              created_at: movement.created_at,
              created_by: movement.created_by
            });
          });
        }
        
        setRecentMovements(formattedMovements);
        
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchReportData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">報表</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">庫存報表</h1>
      
      {/* 報表類型卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Link href="/reports/inventory-history" className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex items-start space-x-4 border border-gray-100">
          <div className="rounded-full bg-indigo-50 p-3">
            <ClockIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">庫存變動歷史</h2>
            <p className="text-gray-600 text-sm">查看所有入庫、出庫和轉移記錄</p>
            <div className="mt-3 flex items-center text-sm text-indigo-500">
              <span>查看詳情</span>
              <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 ml-1.5" />
            </div>
          </div>
        </Link>
        
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex items-start space-x-4 border border-gray-100">
          <div className="rounded-full bg-amber-50 p-3">
            <DocumentTextIcon className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">月度報表</h2>
            <p className="text-gray-600 text-sm">查看按月匯總的庫存報表</p>
            <div className="mt-3 flex items-center text-sm text-amber-500">
              <span>即將推出</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex items-start space-x-4 border border-gray-100">
          <div className="rounded-full bg-emerald-50 p-3">
            <ChartBarIcon className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-1">庫存分析</h2>
            <p className="text-gray-600 text-sm">庫存周轉率和其他高級分析</p>
            <div className="mt-3 flex items-center text-sm text-emerald-500">
              <span>即將推出</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 庫存概覽卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-500">
          <h2 className="text-sm font-medium text-gray-500 uppercase">總產品數</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{productSummary.total_products}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-green-500">
          <h2 className="text-sm font-medium text-gray-500 uppercase">總庫存量</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{productSummary.total_quantity}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-yellow-500">
          <h2 className="text-sm font-medium text-gray-500 uppercase">低庫存產品數</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{productSummary.low_stock_count}</p>
          <p className="text-sm text-gray-500">庫存小於或等於 5</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-red-500">
          <h2 className="text-sm font-medium text-gray-500 uppercase">零庫存產品數</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{productSummary.zero_stock_count}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 按位置的庫存分佈 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">按位置的庫存分佈</h2>
          {locationSummary.length > 0 ? (
            <div className="space-y-4">
              {locationSummary.map(location => (
                <div key={location.location} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{location.location}</span>
                    <span className="text-sm text-gray-500">{location.product_count} 產品</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, (location.total_quantity / productSummary.total_quantity) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm text-gray-600 mt-1">
                    {location.total_quantity} 件
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">沒有位置數據</p>
          )}
        </div>
        
        {/* 最近庫存移動 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">最近庫存操作</h2>
          {recentMovements.length > 0 ? (
            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      時間
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      產品
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      數量
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentMovements.map(movement => (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {new Date(movement.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {movement.product_name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
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
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {movement.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">沒有操作記錄</p>
          )}
        </div>
      </div>
    </div>
  );
} 