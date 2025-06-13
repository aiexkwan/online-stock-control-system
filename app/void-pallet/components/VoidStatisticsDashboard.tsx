'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingDown, Package, Calendar, AlertTriangle,
  Download, RefreshCw, X
} from 'lucide-react';
import { VoidStatistics, getVoidStatistics } from '../services/statisticsService';
import { motion } from 'framer-motion';

interface VoidStatisticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#f97316', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export function VoidStatisticsDashboard({ isOpen, onClose }: VoidStatisticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<VoidStatistics | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStatistics();
    }
  }, [isOpen, dateRange]);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
      }

      const result = await getVoidStatistics(startDate, endDate);
      
      if (result.success && result.data) {
        setStatistics(result.data);
      } else {
        setError(result.error || 'Failed to load statistics');
      }
    } catch (error) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!statistics) return;

    const csvData = [
      ['Void Statistics Report'],
      [`Date Range: ${dateRange}`],
      [`Generated: ${new Date().toLocaleString()}`],
      [''],
      ['Summary'],
      ['Total Voids', statistics.summary.totalVoids],
      ['Total Quantity', statistics.summary.totalQuantity],
      ['Unique Products', statistics.summary.uniqueProducts],
      ['Average Per Day', statistics.summary.averagePerDay],
      [''],
      ['By Reason'],
      ['Reason', 'Count', 'Quantity', 'Percentage'],
      ...statistics.byReason.map(r => [r.reason, r.count, r.quantity, `${r.percentage}%`]),
      [''],
      ['By Product'],
      ['Product Code', 'Count', 'Quantity', 'Percentage'],
      ...statistics.byProduct.map(p => [p.productCode, p.count, p.quantity, `${p.percentage}%`]),
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `void-statistics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-4 md:inset-8 bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-800/50 border-b border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Void Statistics</h2>
              <p className="text-gray-400 mt-1">Analytics and insights for void operations</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Date Range Selector */}
              <div className="flex items-center bg-slate-700/50 rounded-lg p-1">
                <Button
                  variant={dateRange === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDateRange('week')}
                  className="text-xs"
                >
                  Week
                </Button>
                <Button
                  variant={dateRange === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDateRange('month')}
                  className="text-xs"
                >
                  Month
                </Button>
                <Button
                  variant={dateRange === 'quarter' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDateRange('quarter')}
                  className="text-xs"
                >
                  Quarter
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={loadStatistics}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={exportData}
                disabled={loading || !statistics}
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading statistics...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-red-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStatistics}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : statistics && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Voids</p>
                        <p className="text-2xl font-bold text-white">
                          {statistics.summary.totalVoids}
                        </p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-red-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Quantity</p>
                        <p className="text-2xl font-bold text-white">
                          {statistics.summary.totalQuantity.toLocaleString()}
                        </p>
                      </div>
                      <Package className="h-8 w-8 text-orange-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Unique Products</p>
                        <p className="text-2xl font-bold text-white">
                          {statistics.summary.uniqueProducts}
                        </p>
                      </div>
                      <Package className="h-8 w-8 text-blue-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Average/Day</p>
                        <p className="text-2xl font-bold text-white">
                          {statistics.summary.averagePerDay}
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-green-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* By Reason Pie Chart */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white">Void by Reason</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statistics.byReason}
                          dataKey="count"
                          nameKey="reason"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={(entry) => `${entry.reason} (${entry.percentage}%)`}
                        >
                          {statistics.byReason.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* By Date Line Chart */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-white">Trend Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={statistics.byDate}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#9CA3AF"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#f97316" 
                          strokeWidth={2}
                          dot={{ fill: '#f97316' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Products Bar Chart */}
                <Card className="bg-slate-800/50 border-slate-700/50 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-white">Top Products by Void Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statistics.byProduct.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="productCode" 
                          stroke="#9CA3AF"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        />
                        <Bar dataKey="count" fill="#f97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Voids Table */}
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Recent Void Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 text-gray-400">Pallet</th>
                          <th className="text-left py-2 text-gray-400">Product</th>
                          <th className="text-left py-2 text-gray-400">Quantity</th>
                          <th className="text-left py-2 text-gray-400">Reason</th>
                          <th className="text-left py-2 text-gray-400">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statistics.recentVoids.map((void_, index) => (
                          <tr key={index} className="border-b border-slate-700/50">
                            <td className="py-2 text-white">{void_.plt_num}</td>
                            <td className="py-2 text-gray-300">{void_.product_code}</td>
                            <td className="py-2 text-gray-300">{void_.product_qty}</td>
                            <td className="py-2">
                              <Badge variant="outline" className="text-xs">
                                {void_.reason}
                              </Badge>
                            </td>
                            <td className="py-2 text-gray-400">
                              {new Date(void_.voided_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}