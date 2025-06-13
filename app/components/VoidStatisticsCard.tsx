'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingDown, Package, Calendar, AlertTriangle,
  Download, RefreshCw, ChevronRight
} from 'lucide-react';
import { VoidStatistics, getVoidStatistics } from '@/app/void-pallet/services/statisticsService';
import { motion } from 'framer-motion';
import VoidPalletDialog from '@/app/components/admin-panel-menu/VoidPalletDialog';

export function VoidStatisticsCard() {
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<VoidStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVoidDialog, setShowVoidDialog] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Last month

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

  const handleViewDetails = () => {
    setShowVoidDialog(true);
  };

  if (loading) {
    return (
      <div className="relative group h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-2xl blur-xl"></div>
        <div className="relative bg-slate-800/40 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 shadow-2xl shadow-red-900/20">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-700 rounded"></div>
              <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="relative group h-full">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-2xl blur-xl"></div>
        <div className="relative bg-slate-800/40 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 shadow-2xl shadow-red-900/20">
          <div className="text-center text-red-400">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load void statistics</p>
            <Button 
              onClick={loadStatistics} 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-red-400 hover:text-red-300"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
      <div className="relative group h-full">
        {/* 卡片背景 */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-2xl blur-xl"></div>
        
        <div className="relative bg-slate-800/40 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 shadow-2xl shadow-red-900/20 hover:border-red-400/50 transition-all duration-300 h-full flex flex-col">
          {/* 卡片內部光效 */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
          
          {/* 頂部邊框光效 */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/50 to-transparent opacity-100 rounded-t-2xl"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
                  <TrendingDown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-red-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent">
                    Void Statistics
                  </h3>
                  <p className="text-xs text-gray-400">Last 30 days</p>
                </div>
              </div>
              <Button
                onClick={handleViewDetails}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Total Voids</p>
                <p className="text-2xl font-bold text-red-400">
                  {statistics.summary.totalVoids}
                </p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Total Qty</p>
                <p className="text-2xl font-bold text-orange-400">
                  {statistics.summary.totalQuantity.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Top Reasons */}
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-400 mb-2">Top Void Reasons</p>
              <div className="space-y-2">
                {statistics.byReason.slice(0, 3).map((reason, index) => (
                  <div key={reason.reason} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-red-400' : 
                        index === 1 ? 'bg-orange-400' : 
                        'bg-yellow-400'
                      }`} />
                      <span className="text-xs text-gray-300">{reason.reason}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs px-2 py-0">
                        {reason.count}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {reason.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Average */}
            <div className="pt-3 mt-3 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Daily Average</span>
                <span className="text-sm font-medium text-gray-300">
                  {statistics.summary.averagePerDay.toFixed(1)} voids/day
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </motion.div>

      {/* Void Pallet Dialog */}
      <VoidPalletDialog 
        isOpen={showVoidDialog} 
        onClose={() => setShowVoidDialog(false)} 
      />
    </>
  );
}