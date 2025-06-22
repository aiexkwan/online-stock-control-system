/**
 * Warehouse Dashboard Implementation
 * 倉庫儀表板實現 - 展示庫存位置熱圖
 */

'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { cn } from '@/lib/utils';

interface LocationData {
  location: string;
  count: number;
  percentage: number;
  items: Array<{
    plt_num: string;
    product_code: string;
    quantity: number;
  }>;
}

export const WarehouseHeatmap: React.FC<{ gridArea: string }> = ({ gridArea }) => {
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // 位置映射
  const locations = [
    { key: 'injection', label: 'Production', row: 1, col: 1 },
    { key: 'pipeline', label: 'Pipeline', row: 1, col: 2 },
    { key: 'prebook', label: 'Pre-Book', row: 1, col: 3 },
    { key: 'await', label: 'Await', row: 2, col: 1 },
    { key: 'fold', label: 'Fold Mill', row: 2, col: 2 },
    { key: 'bulk', label: 'Bulk Room', row: 2, col: 3 },
    { key: 'backcarpark', label: 'Back Car Park', row: 3, col: 1 },
    { key: 'damage', label: 'Damage', row: 3, col: 3 }
  ];

  useEffect(() => {
    const loadWarehouseData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // 查詢庫存數據
        const { data: inventoryData, error } = await supabase
          .from('record_inventory')
          .select(`
            *,
            record_palletinfo!inner(product_code, product_qty)
          `);

        if (error) throw error;

        // 統計各位置的庫存
        const locationStats = new Map<string, LocationData>();
        let totalCount = 0;

        // 初始化所有位置
        locations.forEach(loc => {
          locationStats.set(loc.key, {
            location: loc.label,
            count: 0,
            percentage: 0,
            items: []
          });
        });

        // 統計數據
        inventoryData?.forEach(record => {
          locations.forEach(loc => {
            const count = record[loc.key] || 0;
            if (count > 0) {
              const stats = locationStats.get(loc.key)!;
              stats.count += count;
              stats.items.push({
                plt_num: record.plt_num,
                product_code: record.record_palletinfo.product_code,
                quantity: count
              });
              totalCount += count;
            }
          });
        });

        // 計算百分比
        const dataArray = Array.from(locationStats.entries()).map(([key, data]) => ({
          ...data,
          percentage: totalCount > 0 ? (data.count / totalCount) * 100 : 0
        }));

        setLocationData(dataArray);
      } catch (error) {
        console.error('Error loading warehouse data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWarehouseData();
  }, []);

  // 根據庫存量計算顏色深度
  const getHeatmapColor = (count: number, maxCount: number) => {
    if (count === 0) return 'bg-slate-800';
    const intensity = count / maxCount;
    if (intensity > 0.8) return 'bg-red-600';
    if (intensity > 0.6) return 'bg-orange-600';
    if (intensity > 0.4) return 'bg-yellow-600';
    if (intensity > 0.2) return 'bg-green-600';
    return 'bg-blue-600';
  };

  const maxCount = Math.max(...locationData.map(d => d.count));

  return (
    <div style={{ gridArea }} className="bg-slate-800/50 backdrop-blur rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Warehouse Location Heatmap</h3>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {locations.map((loc) => {
            const data = locationData.find(d => d.location === loc.label);
            const isEmpty = loc.key === 'damage' && loc.row === 3 && loc.col === 2;
            
            if (isEmpty) {
              return <div key={`${loc.row}-${loc.col}`} className="invisible"></div>;
            }

            return (
              <button
                key={loc.key}
                onClick={() => setSelectedLocation(loc.key)}
                className={cn(
                  "relative p-4 rounded-lg transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg",
                  getHeatmapColor(data?.count || 0, maxCount),
                  selectedLocation === loc.key && "ring-2 ring-white"
                )}
                style={{
                  gridRow: loc.row,
                  gridColumn: loc.col
                }}
              >
                <div className="text-white">
                  <div className="font-semibold text-sm">{loc.label}</div>
                  <div className="text-2xl font-bold mt-1">{data?.count || 0}</div>
                  <div className="text-xs opacity-75">
                    {data?.percentage.toFixed(1)}%
                  </div>
                </div>
                
                {/* 熱度指示條 */}
                <div className="absolute bottom-2 left-2 right-2 h-1 bg-black/20 rounded">
                  <div 
                    className="h-full bg-white/50 rounded"
                    style={{ 
                      width: `${(data?.count || 0) / maxCount * 100}%` 
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 選中位置的詳細信息 */}
      {selectedLocation && (
        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-2">
            {locations.find(l => l.key === selectedLocation)?.label} Details
          </h4>
          <div className="text-xs text-gray-400">
            <p>Total Items: {locationData.find(d => d.location === locations.find(l => l.key === selectedLocation)?.label)?.items.length || 0}</p>
            <p>Click to view detailed inventory list</p>
          </div>
        </div>
      )}

      {/* 圖例 */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
        <span>Capacity:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-600 rounded"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded"></div>
          <span>High</span>
        </div>
      </div>
    </div>
  );
};