/**
 * Dashboard Widget Renderer
 * 根據配置渲染不同類型的 Widget
 */

'use client';

import React, { useState, useEffect } from 'react';
import { WidgetConfig } from './dashboardConfigs';
import { createClient } from '@/lib/supabase';
import { 
  ArrowArrowTrendingUpIcon, 
  ArrowArrowTrendingDownIcon,
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { cn } from '@/lib/utils';

interface DashboardWidgetRendererProps {
  config: WidgetConfig;
  theme: string;
}

// 顏色配置
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#64748b'  // gray
];

export const DashboardWidgetRenderer: React.FC<DashboardWidgetRendererProps> = ({ 
  config, 
  theme 
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 根據數據源載入數據
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 暫時使用模擬數據，實際應根據 config.dataSource 查詢數據庫
        const mockData = getMockData(config);
        setData(mockData);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [config]);

  // 渲染統計卡片
  const renderStatsCard = () => {
    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-slate-700 rounded mb-2"></div>
          <div className="h-8 w-24 bg-slate-700 rounded mb-1"></div>
          <div className="h-4 w-32 bg-slate-700 rounded"></div>
        </div>
      );
    }

    const { value, trend, label, icon } = data || {};

    return (
      <>
        <div className="flex items-center justify-between mb-2">
          {icon && <div className="w-8 h-8 text-blue-500">{icon}</div>}
          {trend !== undefined && (
            trend > 0 ? 
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" /> :
              <ArrowTrendingDownIcon className="w-5 h-5 text-red-500" />
          )}
        </div>
        <div className="text-2xl font-bold text-white">{value || '0'}</div>
        <div className="text-sm text-gray-400">{label || config.title}</div>
        {trend !== undefined && (
          <div className={cn(
            "text-xs mt-1",
            trend > 0 ? "text-green-500" : "text-red-500"
          )}>
            {trend > 0 ? '+' : ''}{trend}% vs yesterday
          </div>
        )}
      </>
    );
  };

  // 渲染圖表
  const renderChart = () => {
    if (loading) {
      return (
        <div className="animate-pulse h-full bg-slate-700 rounded"></div>
      );
    }

    const chartData = data?.chartData || [];
    
    return (
      <>
        <h3 className="text-lg font-semibold text-white mb-4">{config.title}</h3>
        <ResponsiveContainer width="100%" height="90%">
          {config.chartType === 'line' && (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
              />
            </LineChart>
          )}
          
          {config.chartType === 'bar' && (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
          
          {(config.chartType === 'pie' || config.chartType === 'donut') && (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={config.chartType === 'donut' ? 60 : 0}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          )}
          
          {config.chartType === 'area' && (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </>
    );
  };

  // 渲染列表
  const renderList = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      );
    }

    const items = data?.items || [];

    return (
      <>
        <h3 className="text-lg font-semibold text-white mb-4">{config.title}</h3>
        <div className="space-y-2 overflow-y-auto">
          {items.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  {item.icon || <CubeIcon className="w-6 h-6 text-blue-500" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="text-xs text-gray-400">{item.subtitle}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">{item.value}</div>
                <div className="text-xs text-gray-400">{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // 渲染表格
  const renderTable = () => {
    if (loading) {
      return (
        <div className="animate-pulse">
          <div className="h-10 bg-slate-700 rounded mb-2"></div>
          <div className="space-y-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      );
    }

    const { headers, rows } = data || { headers: [], rows: [] };

    return (
      <>
        <h3 className="text-lg font-semibold text-white mb-4">{config.title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {headers.map((header: string, index: number) => (
                  <th key={index} className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any[], rowIndex: number) => (
                <tr key={rowIndex} className="border-b border-slate-700/50">
                  {row.map((cell: any, cellIndex: number) => (
                    <td key={cellIndex} className="py-2 px-3 text-sm text-white">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // 根據 widget 類型渲染內容
  const renderContent = () => {
    switch (config.type) {
      case 'stats':
        return renderStatsCard();
      case 'chart':
        return renderChart();
      case 'list':
        return renderList();
      case 'table':
        return renderTable();
      default:
        return (
          <div className="text-center text-gray-400">
            <p>Widget type "{config.type}" not implemented</p>
          </div>
        );
    }
  };

  return (
    <div 
      style={{ gridArea: config.gridArea }} 
      className="bg-slate-800/50 backdrop-blur rounded-lg p-4"
    >
      {error ? (
        <div className="text-red-400 text-sm">Error: {error}</div>
      ) : (
        renderContent()
      )}
    </div>
  );
};

// 模擬數據生成函數
function getMockData(config: WidgetConfig): any {
  switch (config.type) {
    case 'stats':
      return {
        value: Math.floor(Math.random() * 1000) + 100,
        trend: (Math.random() - 0.5) * 20,
        label: config.title,
        icon: <CubeIcon className="w-8 h-8" />
      };

    case 'chart':
      return {
        chartData: Array.from({ length: 12 }, (_, i) => ({
          name: `${i + 1}:00`,
          value: Math.floor(Math.random() * 100) + 50
        }))
      };

    case 'list':
      return {
        items: Array.from({ length: 5 }, (_, i) => ({
          title: `Item ${i + 1}`,
          subtitle: `Details for item ${i + 1}`,
          value: Math.floor(Math.random() * 100),
          time: `${10 + i}:30 AM`
        }))
      };

    case 'table':
      return {
        headers: ['Product', 'Quantity', 'Status', 'Time'],
        rows: Array.from({ length: 5 }, (_, i) => [
          `PC00${i + 1}`,
          Math.floor(Math.random() * 1000),
          'Active',
          `${10 + i}:00 AM`
        ])
      };

    default:
      return null;
  }
}