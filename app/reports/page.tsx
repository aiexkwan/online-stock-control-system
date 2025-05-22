'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase';
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
  const supabase = createClient();
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">生成報告</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">庫存報告</h2>
          {/* 添加庫存報告生成選項 */}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">移動記錄報告</h2>
          {/* 添加移動記錄報告生成選項 */}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">統計報告</h2>
          {/* 添加統計報告生成選項 */}
        </div>
      </div>
    </div>
  );
} 