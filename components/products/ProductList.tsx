'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Product {
  code: string;
  description: string | null;
  colour: string | null;
  standard_qty: string | null;
  type: string | null;
  inventory?: {
    await: number | null;
    backcarpark: number | null;
    bulk: number | null;
    fold: number | null;
    injection: number | null;
    pipeline: number | null;
    prebook: number | null;
  };
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data: productData, error: productError } = await supabase
        .from('data_code')
        .select(`
          code,
          description,
          colour,
          standard_qty,
          type,
          record_inventory (
            await,
            backcarpark,
            bulk,
            fold,
            injection,
            pipeline,
            prebook
          )
        `);

      if (productError) throw productError;
      
      const products = productData?.map(product => ({
        ...product,
        inventory: product.record_inventory?.[0] || null
      })) || [];
      
      setProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>載入中...</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              產品代碼
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              描述
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              顏色
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              標準數量
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              類型
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              庫存
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.code}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {product.code}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {product.description || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {product.colour || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {product.standard_qty || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {product.type || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {product.inventory ? (
                  <div className="space-y-1">
                    <div>等待: {product.inventory.await || 0}</div>
                    <div>後停車場: {product.inventory.backcarpark || 0}</div>
                    <div>散裝: {product.inventory.bulk || 0}</div>
                    <div>折疊: {product.inventory.fold || 0}</div>
                    <div>注塑: {product.inventory.injection || 0}</div>
                    <div>管道: {product.inventory.pipeline || 0}</div>
                    <div>預訂: {product.inventory.prebook || 0}</div>
                  </div>
                ) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 