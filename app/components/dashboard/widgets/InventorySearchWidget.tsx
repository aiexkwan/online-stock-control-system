/**
 * Inventory Search 小部件
 * 支援三種尺寸：
 * - Small: 只顯示搜尋按鈕
 * - Medium: 添加搜尋輸入框
 * - Large: 完整功能包括搜尋結果顯示
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { createClient } from '@/app/utils/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface InventoryLocation {
  product_code: string;
  injection: number;
  pipeline: number;
  await: number;
  await_grn: number;
  fold: number;
  bulk: number;
  backcarpark: number;
  damage: number;
  total: number;
}

export function InventorySearchWidget({ widget, isEditMode }: WidgetComponentProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<InventoryLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const size = widget.config.size || WidgetSize.SMALL;

  const searchInventory = async (productCode: string) => {
    if (!productCode.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('record_inventory')
        .select('*')
        .eq('product_code', productCode.toUpperCase());

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setSearchResults({
          product_code: productCode.toUpperCase(),
          injection: 0,
          pipeline: 0,
          await: 0,
          await_grn: 0,
          fold: 0,
          bulk: 0,
          backcarpark: 0,
          damage: 0,
          total: 0
        });
      } else {
        const aggregated = data.reduce((sum, record) => ({
          injection: sum.injection + (record.injection || 0),
          pipeline: sum.pipeline + (record.pipeline || 0),
          await: sum.await + (record.await || 0),
          await_grn: sum.await_grn + (record.await_grn || 0),
          fold: sum.fold + (record.fold || 0),
          bulk: sum.bulk + (record.bulk || 0),
          backcarpark: sum.backcarpark + (record.backcarpark || 0),
          damage: sum.damage + (record.damage || 0)
        }), {
          injection: 0,
          pipeline: 0,
          await: 0,
          await_grn: 0,
          fold: 0,
          bulk: 0,
          backcarpark: 0,
          damage: 0
        });

        const total = aggregated.injection + aggregated.pipeline + aggregated.await + aggregated.await_grn +
                     aggregated.fold + aggregated.bulk + aggregated.backcarpark + aggregated.damage;
        
        setSearchResults({
          product_code: productCode.toUpperCase(),
          injection: aggregated.injection,
          pipeline: aggregated.pipeline,
          await: aggregated.await + aggregated.await_grn,  // 合併 await 和 await_grn
          await_grn: aggregated.await_grn,
          fold: aggregated.fold,
          bulk: aggregated.bulk,
          backcarpark: aggregated.backcarpark,
          damage: aggregated.damage,
          total: total
        });
      }
    } catch (err: any) {
      console.error('Error searching inventory:', err);
      setError(err.message);
      setSearchResults(null);
      toast.error(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchInventory(searchQuery);
  };

  // Small size - only search button
  if (size === WidgetSize.SMALL) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
        <CardContent className="p-4 h-full flex flex-col justify-center items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-2">
            <MagnifyingGlassIcon className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Inventory</h3>
          <button
            onClick={() => {
              if (!isEditMode) {
                toast.info('Please resize widget to Medium or Large to search');
              }
            }}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition-all duration-300 text-xs font-medium shadow-lg hover:shadow-blue-500/25"
            disabled={isEditMode}
          >
            Search
          </button>
        </CardContent>
      </Card>
    );
  }

  // Medium size - search input
  if (size === WidgetSize.MEDIUM) {
    return (
      <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <MagnifyingGlassIcon className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-200">Quick Search</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Product Code"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/70 focus:bg-slate-700/70 hover:border-blue-500/50 hover:bg-slate-700/60 transition-all duration-300 text-sm"
              disabled={isEditMode}
            />
            <button
              type="submit"
              disabled={loading || !searchQuery.trim() || isEditMode}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                'Search'
              )}
            </button>
          </form>
          
          {searchResults && (
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Total Stock:</span>
                <span className="text-xl font-bold text-blue-400">
                  {searchResults.total.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Large size - full search with results
  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-blue-500/30 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <MagnifyingGlassIcon className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg font-medium bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent">
            Inventory Search
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Product Code To Search"
              className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500/70 focus:bg-slate-700/70 hover:border-blue-500/50 hover:bg-slate-700/60 transition-all duration-300 text-sm"
              disabled={isEditMode}
            />
            <button
              type="submit"
              disabled={loading || !searchQuery.trim() || isEditMode}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <MagnifyingGlassIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {searchResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 space-y-3"
          >
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                { label: 'Production', value: searchResults.injection, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
                { label: 'Pipeline', value: searchResults.pipeline, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
                { label: 'Awaiting', value: searchResults.await, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
                { label: 'Fold Mill', value: searchResults.fold, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
                { label: 'Bulk Room', value: searchResults.bulk, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
                { label: 'Back Car Park', value: searchResults.backcarpark, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
                { label: 'Damage', value: searchResults.damage, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
              ].map((location) => (
                <div key={location.label} className={`flex justify-between items-center py-2 px-3 ${location.bg} border ${location.border} rounded-lg`}>
                  <span className="text-slate-300 text-xs">{location.label}:</span>
                  <span className={`font-bold ${location.color}`}>
                    {location.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center py-3 px-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg">
              <span className="text-sm font-bold text-slate-200">Total:</span>
              <span className="text-xl font-bold text-blue-400">
                {searchResults.total.toLocaleString()}
              </span>
            </div>
          </motion.div>
        )}

        {!searchResults && !loading && !error && (
          <div className="mt-6 text-center py-8">
            <MagnifyingGlassIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Enter a product code and click search</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}