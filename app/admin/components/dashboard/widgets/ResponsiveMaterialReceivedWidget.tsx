/**
 * Responsive Material Received Widget
 * 根據大小顯示不同內容的 GRN 收貨 Widget
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { ResponsiveWidgetWrapper } from '../ResponsiveWidgetWrapper';
import { ContentLevel } from '@/app/admin/types/widgetContentLevel';
import { DocumentArrowDownIcon, ChevronDownIcon, ClockIcon, TruckIcon } from '@heroicons/react/24/outline';
import { createClient } from '@/app/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getTodayRange, getYesterdayRange, getDateRange } from '@/app/utils/timezone';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MaterialSummary {
  material_code: string;
  total_qty: number;
  total_pallets: number;
}

interface ChartData {
  name: string;
  qty: number;
  pallets: number;
}

type TimeRange = 'Today' | 'Yesterday' | 'Past 3 days' | 'Past 7 days';
const TIME_RANGE_OPTIONS: TimeRange[] = ['Today', 'Yesterday', 'Past 3 days', 'Past 7 days'];

const ResponsiveMaterialReceivedWidget = React.memo<WidgetComponentProps>(({ widget, isEditMode }) => {
  const [materials, setMaterials] = useState<MaterialSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('Today');
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [totalPallets, setTotalPallets] = useState(0);
  const [totalWeight, setTotalWeight] = useState(0);

  // Get date range based on selected time range
  const getDateRangeForTimeRange = useCallback((timeRange: TimeRange) => {
    switch (timeRange) {
      case 'Today':
        return getTodayRange();
      case 'Yesterday':
        return getYesterdayRange();
      case 'Past 3 days':
        return getDateRange(3);
      case 'Past 7 days':
        return getDateRange(7);
      default:
        return getTodayRange();
    }
  }, []);

  // Fetch material summary
  const fetchMaterialSummary = useCallback(async (timeRange: TimeRange) => {
    try {
      setLoading(true);
      setError(null);
      
      const supabase = createClient();
      const { start, end } = getDateRangeForTimeRange(timeRange);
      
      const { data, error: fetchError } = await supabase
        .from('record_grn')
        .select('material_code, net_weight, plt_num')
        .gte('creat_time', start)
        .lte('creat_time', end)
        .order('material_code', { ascending: true });
      
      if (fetchError) throw new Error(fetchError.message);
      
      if (data) {
        // Group by material_code
        const materialMap = new Map<string, MaterialSummary>();
        let palletCount = 0;
        let weightTotal = 0;
        
        for (const record of data) {
          const { material_code, net_weight } = record;
          
          if (!materialMap.has(material_code)) {
            materialMap.set(material_code, {
              material_code,
              total_qty: 0,
              total_pallets: 0
            });
          }
          
          const materialSummary = materialMap.get(material_code)!;
          materialSummary.total_qty += net_weight || 0;
          materialSummary.total_pallets += 1;
          
          palletCount += 1;
          weightTotal += net_weight || 0;
        }
        
        const materialSummaries = Array.from(materialMap.values())
          .sort((a, b) => b.total_qty - a.total_qty);
        
        setMaterials(materialSummaries);
        setTotalPallets(palletCount);
        setTotalWeight(weightTotal);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (!isEditMode) {
      fetchMaterialSummary(selectedTimeRange);
    }
  }, [selectedTimeRange, isEditMode, fetchMaterialSummary]);

  // Handle click outside dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <ResponsiveWidgetWrapper widget={widget} isEditMode={isEditMode}>
      {(level) => {
        // MINIMAL (1格) - 只顯示 GRN 數量
        if (level === ContentLevel.MINIMAL) {
          return (
            <div className="flex flex-col items-center justify-center h-full">
              <DocumentArrowDownIcon className="w-6 h-6 text-green-500 mb-1" />
              {loading ? (
                <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
              ) : error ? (
                <span className="text-red-400 text-xs">Error</span>
              ) : (
                <>
                  <div className="text-3xl font-bold text-white">{totalPallets}</div>
                  <span className="text-xs text-gray-400">GRN</span>
                </>
              )}
            </div>
          );
        }

        // COMPACT (3格) - 顯示前 3 個物料
        if (level === ContentLevel.COMPACT) {
          return (
            <div className="flex flex-col h-full p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DocumentArrowDownIcon className="w-5 h-5 text-green-500" />
                  <h3 className="text-sm font-medium text-white">GRN Received</h3>
                </div>
                <span className="text-xs text-green-400 font-medium">{selectedTimeRange}</span>
              </div>
              
              {loading ? (
                <div className="space-y-2 flex-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-white/10 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-red-400 text-xs">{error}</div>
              ) : materials.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No GRN today</span>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-hidden">
                  {materials.slice(0, 3).map((material) => (
                    <div key={material.material_code} className="flex justify-between items-center bg-slate-800 rounded p-2">
                      <div>
                        <span className="text-xs text-white font-medium block truncate">{material.material_code}</span>
                        <span className="text-xs text-gray-400">{material.total_qty.toLocaleString()} kg</span>
                      </div>
                      <span className="text-sm text-green-400 font-bold">{material.total_pallets}</span>
                    </div>
                  ))}
                  {totalPallets > 0 && (
                    <div className="text-xs text-gray-500 text-center pt-1">
                      Total: {totalPallets} pallets
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        // STANDARD (5格) - 顯示前 5 個物料 + 統計信息
        if (level === ContentLevel.STANDARD) {
          return (
            <div className="flex flex-col h-full p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <DocumentArrowDownIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Material Received</h3>
                    <p className="text-xs text-gray-400">{totalWeight.toLocaleString()} kg total</p>
                  </div>
                </div>

                {/* Time Range Selector */}
                <div className="relative" ref={dropdownRef} style={{ zIndex: 100 }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDropdownOpen(!isDropdownOpen);
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors",
                      "relative z-10",
                      loading || isEditMode ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                    )}
                    disabled={loading || isEditMode}
                    type="button"
                  >
                    <ClockIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-white">{selectedTimeRange}</span>
                    <ChevronDownIcon className={cn(
                      "w-3 h-3 text-gray-400 transition-transform",
                      isDropdownOpen && "rotate-180"
                    )} />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded shadow-xl"
                        style={{ 
                          zIndex: 9999,
                          minWidth: '120px'
                        }}
                      >
                        {TIME_RANGE_OPTIONS.map((range) => (
                          <button
                            key={range}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedTimeRange(range);
                              setIsDropdownOpen(false);
                            }}
                            className={cn(
                              "block",
                              "w-full px-3 py-1.5 text-left text-xs hover:bg-slate-800 transition-colors",
                              selectedTimeRange === range && "bg-slate-800 text-green-400"
                            )}
                            type="button"
                          >
                            {range}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-800 rounded p-2 text-center">
                  <div className="text-sm font-bold text-green-400">{totalPallets}</div>
                  <div className="text-xs text-gray-500">Pallets</div>
                </div>
                <div className="bg-slate-800 rounded p-2 text-center">
                  <div className="text-sm font-bold text-green-400">{materials.length}</div>
                  <div className="text-xs text-gray-500">Materials</div>
                </div>
              </div>

              {loading ? (
                <div className="space-y-2 flex-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-white/10 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-red-400 text-sm">{error}</div>
              ) : materials.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <TruckIcon className="w-12 h-12 text-gray-600 mb-2" />
                  <span className="text-gray-400">No materials received</span>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {materials.slice(0, 5).map((material, index) => (
                    <div key={material.material_code} className="bg-slate-800 rounded-lg p-3 hover:bg-slate-700 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <span className="text-sm text-white font-medium">{material.material_code}</span>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-gray-400">Weight: {material.total_qty.toLocaleString()} kg</span>
                            <span className="text-xs text-gray-400">Avg: {Math.round(material.total_qty / material.total_pallets)} kg/plt</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">{material.total_pallets}</div>
                          <div className="text-xs text-gray-500">pallets</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {materials.length > 5 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      +{materials.length - 5} more materials
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        // DETAILED & FULL (7格+) - 顯示物料列表 + 圖表
        return (
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <DocumentArrowDownIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Material Received (GRN)</h3>
                  <p className="text-sm text-gray-400">{totalPallets} pallets • {totalWeight.toLocaleString()} kg</p>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
                  disabled={loading || isEditMode}
                >
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-white">{selectedTimeRange}</span>
                  <ChevronDownIcon className={cn(
                    "w-4 h-4 text-gray-400 transition-transform",
                    isDropdownOpen && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[150px]"
                    >
                      {TIME_RANGE_OPTIONS.map((range) => (
                        <button
                          key={range}
                          onClick={() => {
                            setSelectedTimeRange(range);
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm hover:bg-slate-800 transition-colors",
                            selectedTimeRange === range && "bg-slate-800 text-green-400"
                          )}
                        >
                          {range}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 flex-1">
                <div className="h-32 bg-white/10 rounded animate-pulse"></div>
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-white/10 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : materials.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <TruckIcon className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-center">No materials received in this period</p>
              </div>
            ) : (
              <div className="flex-1 grid grid-rows-2 gap-4">
                {/* Chart */}
                <div className="bg-slate-800 rounded-lg p-4">
                  <h4 className="text-sm text-gray-400 mb-3">Top 5 Materials by Weight</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={materials.slice(0, 5).map(m => ({
                        name: m.material_code.length > 10 ? m.material_code.substring(0, 10) + '...' : m.material_code,
                        qty: m.total_qty,
                        pallets: m.total_pallets
                      }))}
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#64748b" 
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={50}
                      />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: '1px solid #334155',
                          borderRadius: '4px'
                        }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Bar dataKey="qty" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Material List */}
                <div className="overflow-y-auto">
                  <h4 className="text-sm text-gray-400 mb-2">All Materials</h4>
                  <div className="space-y-2">
                    {materials.slice(0, 10).map((material, index) => (
                      <div key={material.material_code} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between hover:bg-slate-700 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500/20 rounded flex items-center justify-center text-xs font-bold text-green-400">
                            {index + 1}
                          </div>
                          <div>
                            <span className="text-sm text-white font-medium">{material.material_code}</span>
                            <div className="text-xs text-gray-400">
                              {material.total_qty.toLocaleString()} kg • {Math.round(material.total_qty / material.total_pallets)} kg/plt
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-400">{material.total_pallets}</div>
                          <div className="text-xs text-gray-500">pallets</div>
                        </div>
                      </div>
                    ))}
                    {materials.length > 10 && (
                      <div className="text-xs text-gray-500 text-center pt-2">
                        Showing top 10 of {materials.length} materials
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }}
    </ResponsiveWidgetWrapper>
  );
});

ResponsiveMaterialReceivedWidget.displayName = 'ResponsiveMaterialReceivedWidget';

export default ResponsiveMaterialReceivedWidget;