'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MotionBackground from '@/app/components/MotionBackground';
import StockTakeNav from '../components/StockTakeNav';
import { DocumentChartBarIcon, ArrowDownTrayIcon, CalendarIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/app/utils/supabase/client';
import { format } from 'date-fns';
import { Toaster, toast } from 'sonner';

interface StockCountSummary {
  product_code: string;
  product_desc: string;
  initial_qty: number;
  counted_qty: number;
  remain_qty: number;
  system_stock: number; // Current stock level from system
  variance: number; // Difference between system stock and counted
  variance_percentage: number;
  pallet_count: number;
  last_count_time: string;
}

interface DailySummary {
  total_products: number;
  counted_products: number;
  pending_products: number;
  completion_rate: number;
  total_variance: number;
  high_variance_count: number;
}

export default function StockReportPage() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stockCounts, setStockCounts] = useState<StockCountSummary[]>([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterVariance, setFilterVariance] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [selectedDate]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();

      // Fetch stock count records for selected date
      const startOfDay = `${selectedDate} 00:00:00`;
      const endOfDay = `${selectedDate} 23:59:59`;

      const { data: countData, error: countError } = await supabase
        .from('record_stocktake')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false });
        
      // Also fetch current stock levels
      const { data: stockLevels, error: stockError } = await supabase
        .from('stock_level')
        .select('stock, stock_level');

      if (countError) {
        console.error('Error fetching stock count data:', countError);
        // If table doesn't exist or no permissions, show appropriate message
        if (countError.message?.includes('relation') || countError.message?.includes('permission')) {
          setError('Stock count reports are not yet configured. Please contact your administrator.');
        } else {
          throw countError;
        }
        setLoading(false);
        return;
      }

      // Check if we have data
      if (!countData || countData.length === 0) {
        setStockCounts([]);
        setDailySummary({
          total_products: 0,
          counted_products: 0,
          pending_products: 0,
          completion_rate: 0,
          total_variance: 0,
          high_variance_count: 0
        });
        setLoading(false);
        return;
      }
      
      // Create stock level map
      const stockLevelMap = new Map<string, number>();
      if (stockLevels) {
        stockLevels.forEach(item => {
          stockLevelMap.set(item.stock, item.stock_level);
        });
      }

      // Group by product and calculate summaries
      const productSummaries = new Map<string, StockCountSummary>();
      
      // First pass - find initial records (plt_num is null or empty)
      const initialRecords = countData.filter(record => !record.plt_num || record.plt_num === '');
      
      // Set up initial quantities from first records
      initialRecords.forEach(record => {
        productSummaries.set(record.product_code, {
          product_code: record.product_code,
          product_desc: record.product_desc,
          initial_qty: record.remain_qty, // This is the starting stock level
          counted_qty: 0,
          remain_qty: record.remain_qty,
          system_stock: stockLevelMap.get(record.product_code) || 0,
          variance: 0,
          variance_percentage: 0,
          pallet_count: 0,
          last_count_time: record.created_at
        });
      });
      
      // Second pass - process actual count records
      countData.forEach(record => {
        if (!record.plt_num || record.plt_num === '') return; // Skip initial records
        
        const key = record.product_code;
        let summary = productSummaries.get(key);
        
        if (!summary) {
          // If no initial record found, create one (shouldn't happen normally)
          summary = {
            product_code: record.product_code,
            product_desc: record.product_desc,
            initial_qty: 0,
            counted_qty: 0,
            remain_qty: record.remain_qty,
            system_stock: stockLevelMap.get(record.product_code) || 0,
            variance: 0,
            variance_percentage: 0,
            pallet_count: 0,
            last_count_time: record.created_at
          };
          productSummaries.set(key, summary);
        }
        
        // Update summary
        summary.counted_qty += record.counted_qty || 0;
        summary.pallet_count += 1;
        summary.remain_qty = record.remain_qty; // Latest remain quantity
        summary.last_count_time = record.created_at;
      });

      // Calculate variances
      productSummaries.forEach(summary => {
        // Variance = Counted Qty - System Stock
        // Positive = we counted more than system shows (surplus)
        // Negative = we counted less than system shows (shortage)
        
        if (summary.system_stock !== undefined) {
          summary.variance = summary.counted_qty - summary.system_stock;
          summary.variance_percentage = summary.system_stock > 0 
            ? (summary.variance / summary.system_stock) * 100 
            : 0;
        } else {
          // If no system stock data, use initial stock for comparison
          summary.variance = summary.counted_qty - summary.initial_qty;
          summary.variance_percentage = summary.initial_qty > 0 
            ? (summary.variance / summary.initial_qty) * 100 
            : 0;
        }
      });

      const summaryArray = Array.from(productSummaries.values());
      setStockCounts(summaryArray);

      // Calculate daily summary
      const totalProducts = summaryArray.length;
      const countedProducts = summaryArray.filter(s => s.pallet_count > 0).length;
      
      // Total Variance = Total Counted - Total System Stock (for all counted products)
      const totalCounted = summaryArray.reduce((sum, s) => sum + s.counted_qty, 0);
      const totalSystemStock = summaryArray.reduce((sum, s) => sum + (s.system_stock || 0), 0);
      const totalVariance = totalCounted - totalSystemStock;
      
      const highVarianceCount = summaryArray.filter(s => Math.abs(s.variance_percentage) > 10).length;

      setDailySummary({
        total_products: totalProducts,
        counted_products: countedProducts,
        pending_products: totalProducts - countedProducts,
        completion_rate: totalProducts > 0 ? (countedProducts / totalProducts) * 100 : 0,
        total_variance: totalVariance,
        high_variance_count: highVarianceCount
      });

    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data');
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      // Add BOM for Excel to recognize UTF-8
      const BOM = '\uFEFF';
      const headers = ['Product Code', 'Description', 'Start Stock', 'Counted Qty', 'System Stock', 'Variance', 'Variance %', 'Pallet Count', 'Last Count Time'];
      
      const csvContent = BOM + [
        headers.join(','),
        ...stockCounts.map(item => [
          item.product_code,
          `"${item.product_desc}"`, // Quote description in case it contains commas
          item.initial_qty,
          item.counted_qty,
          item.system_stock || '-',
          item.variance,
          item.variance_percentage.toFixed(2) + '%',
          item.pallet_count,
          format(new Date(item.last_count_time), 'yyyy-MM-dd HH:mm:ss')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock-count-report-${selectedDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export report');
    }
  };

  const filteredCounts = filterVariance 
    ? stockCounts.filter(s => Math.abs(s.variance_percentage) > 10)
    : stockCounts;

  return (
    <MotionBackground>
      <div className="text-white min-h-screen">
        <StockTakeNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl"
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <DocumentChartBarIcon className="h-8 w-8 text-blue-400" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                  Stock Count Report
                </h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-slate-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>
                
                <button
                  onClick={() => setFilterVariance(!filterVariance)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    filterVariance 
                      ? 'bg-yellow-600 hover:bg-yellow-700' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  {filterVariance ? 'Show All' : 'High Variance Only'}
                </button>
                
                <button
                  onClick={exportToCSV}
                  disabled={stockCounts.length === 0}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            {dailySummary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4"
                >
                  <p className="text-slate-400 text-sm">Total Products</p>
                  <p className="text-2xl font-bold text-white">{dailySummary.total_products}</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4"
                >
                  <p className="text-slate-400 text-sm">Counted Products</p>
                  <p className="text-2xl font-bold text-green-400">{dailySummary.counted_products}</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4"
                >
                  <p className="text-slate-400 text-sm">Total Variance</p>
                  <p className={`text-2xl font-bold ${
                    dailySummary.total_variance > 0 ? 'text-green-400' : 
                    dailySummary.total_variance < 0 ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {dailySummary.total_variance > 0 ? '+' : ''}{dailySummary.total_variance}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4"
                >
                  <p className="text-slate-400 text-sm">High Variance Items</p>
                  <p className={`text-2xl font-bold ${dailySummary.high_variance_count > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {dailySummary.high_variance_count}
                  </p>
                </motion.div>
              </div>
            )}


            {/* Table */}
            <div className="bg-slate-800/50 border border-slate-600/50 rounded-xl overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-red-400">{error}</p>
                </div>
              ) : filteredCounts.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-slate-400">
                    {filterVariance ? 'No high variance items found' : 'No stock count data for selected date'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700/50 border-b border-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Product Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Start Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Counted</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">System Stock</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Variance</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Variance %</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Pallets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {filteredCounts.map((item, index) => (
                        <motion.tr
                          key={item.product_code}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`hover:bg-slate-700/20 transition-colors ${
                            Math.abs(item.variance_percentage) > 10 ? 'bg-red-900/10' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-white">{item.product_code}</td>
                          <td className="px-4 py-3 text-sm text-slate-300">{item.product_desc}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-300">{item.initial_qty}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-300">{item.counted_qty}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-300">{item.system_stock || '-'}</td>
                          <td className={`px-4 py-3 text-sm text-right font-medium ${
                            item.variance > 0 ? 'text-green-400' : item.variance < 0 ? 'text-red-400' : 'text-slate-300'
                          }`}>
                            {item.variance > 0 ? '+' : ''}{item.variance}
                          </td>
                          <td className={`px-4 py-3 text-sm text-right ${
                            Math.abs(item.variance_percentage) > 10 ? 'text-yellow-400 font-medium' : 'text-slate-300'
                          }`}>
                            {item.variance_percentage.toFixed(1)}%
                            {Math.abs(item.variance_percentage) > 10 && (
                              <ExclamationTriangleIcon className="h-4 w-4 inline-block ml-1" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-slate-300">{item.pallet_count}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <Toaster position="top-right" />
    </MotionBackground>
  );
}