/**
 * Example usage of the rpc_get_inventory_ordered_analysis function
 * This demonstrates how to call the RPC function from your application
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types for the response
interface InventoryLocation {
  injection: number;
  pipeline: number;
  prebook: number;
  await: number;
  fold: number;
  bulk: number;
  backcarpark: number;
  damage: number;
  await_grn: number;
}

interface InventoryData {
  total: number;
  locations: InventoryLocation;
  last_update: string;
}

interface OrderData {
  total_orders: number;
  total_ordered_qty: number;
  total_loaded_qty: number;
  total_outstanding_qty: number;
}

interface AnalysisData {
  fulfillment_rate: number;
  inventory_gap: number;
  status: 'Sufficient' | 'Insufficient' | 'Out of Stock' | 'No Orders';
}

interface ProductAnalysis {
  product_code: string;
  product_description: string;
  product_type: string;
  standard_qty: number;
  inventory: InventoryData;
  orders: OrderData;
  analysis: AnalysisData;
}

interface AnalysisSummary {
  total_products: number;
  total_inventory_value: number;
  total_outstanding_orders_value: number;
  overall_fulfillment_rate: number;
  products_sufficient: number;
  products_insufficient: number;
  products_out_of_stock: number;
  products_no_orders: number;
}

interface InventoryOrderedAnalysisResponse {
  success: boolean;
  summary: AnalysisSummary;
  data: ProductAnalysis[];
  generated_at: string;
}

/**
 * Get inventory vs ordered analysis for all products
 */
export async function getInventoryOrderedAnalysis(): Promise<InventoryOrderedAnalysisResponse | null> {
  const { data, error } = await supabase.rpc('rpc_get_inventory_ordered_analysis');

  if (error) {
    console.error('Error fetching inventory analysis:', error);
    return null;
  }

  return data as InventoryOrderedAnalysisResponse;
}

/**
 * Get inventory vs ordered analysis filtered by product type
 */
export async function getInventoryOrderedAnalysisByType(
  productType: string
): Promise<InventoryOrderedAnalysisResponse | null> {
  const { data, error } = await supabase.rpc('rpc_get_inventory_ordered_analysis', {
    p_product_type: productType,
  });

  if (error) {
    console.error('Error fetching inventory analysis:', error);
    return null;
  }

  return data as InventoryOrderedAnalysisResponse;
}

/**
 * Example React component using the analysis
 */
export function InventoryAnalysisExample() {
  const [analysis, setAnalysis] = useState<InventoryOrderedAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const fetchAnalysis = async (productType?: string) => {
    setLoading(true);
    try {
      const data = productType
        ? await getInventoryOrderedAnalysisByType(productType)
        : await getInventoryOrderedAnalysis();

      setAnalysis(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis(selectedType || undefined);
  }, [selectedType]);

  if (loading) return <div>Loading analysis...</div>;
  if (!analysis) return <div>No data available</div>;

  return (
    <div>
      {/* Summary Statistics */}
      <div className='summary-stats'>
        <h2>Inventory Analysis Summary</h2>
        <div className='stats-grid'>
          <div>Total Products: {analysis.summary.total_products}</div>
          <div>Total Inventory: {analysis.summary.total_inventory_value}</div>
          <div>Total Outstanding Orders: {analysis.summary.total_outstanding_orders_value}</div>
          <div>Overall Fulfillment Rate: {analysis.summary.overall_fulfillment_rate}%</div>
        </div>

        <div className='status-breakdown'>
          <div className='sufficient'>Sufficient Stock: {analysis.summary.products_sufficient}</div>
          <div className='insufficient'>
            Insufficient Stock: {analysis.summary.products_insufficient}
          </div>
          <div className='out-of-stock'>Out of Stock: {analysis.summary.products_out_of_stock}</div>
          <div className='no-orders'>No Orders: {analysis.summary.products_no_orders}</div>
        </div>
      </div>

      {/* Product Details Table */}
      <table className='analysis-table'>
        <thead>
          <tr>
            <th>Product Code</th>
            <th>Description</th>
            <th>Type</th>
            <th>Total Inventory</th>
            <th>Outstanding Orders</th>
            <th>Fulfillment Rate</th>
            <th>Gap</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {analysis.data.map(product => (
            <tr
              key={product.product_code}
              className={`status-${product.analysis.status.toLowerCase().replace(' ', '-')}`}
            >
              <td>{product.product_code}</td>
              <td>{product.product_description}</td>
              <td>{product.product_type}</td>
              <td>{product.inventory.total}</td>
              <td>{product.orders.total_outstanding_qty}</td>
              <td>{product.analysis.fulfillment_rate}%</td>
              <td className={product.analysis.inventory_gap < 0 ? 'negative' : 'positive'}>
                {product.analysis.inventory_gap}
              </td>
              <td>
                <span
                  className={`status-badge ${product.analysis.status.toLowerCase().replace(' ', '-')}`}
                >
                  {product.analysis.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Server Action usage example (Next.js App Router)
 */
export async function getInventoryAnalysisAction(productType?: string) {
  'use server';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server actions
  );

  const { data, error } = await supabase.rpc(
    'rpc_get_inventory_ordered_analysis',
    productType ? { p_product_type: productType } : {}
  );

  if (error) {
    throw new Error(`Failed to fetch inventory analysis: ${error.message}`);
  }

  return data as InventoryOrderedAnalysisResponse;
}
