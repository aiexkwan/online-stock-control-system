/**
 * Injection Dashboard Page
 * 注塑儀表板頁面
 */

'use client';

import React, { useState, useEffect } from 'react';
import { NewDashboardLayout } from '@/app/components/dashboard/NewDashboardLayout';
import { TimeFrameSelector, TimeFrame } from '@/app/components/dashboard/TimeFrameSelector';
import { createClient } from '@/app/utils/supabase/client';
import { 
  ArrowTrendingUpIcon as TrendingUpIcon, 
  ArrowTrendingDownIcon as TrendingDownIcon,
  CubeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

// 顏色配置
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4'
};

export default function InjectionDashboard() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>({
    label: 'Today',
    value: 'today',
    start: new Date(),
    end: new Date()
  });

  const [stats, setStats] = useState({
    totalProduction: 0,
    activeMachines: 0,
    efficiency: 0,
    defectRate: 0
  });

  const [loading, setLoading] = useState(true);

  // 載入數據
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        
        // 這裡根據實際數據庫結構載入數據
        // 暫時使用模擬數據
        setStats({
          totalProduction: 1234,
          activeMachines: 8,
          efficiency: 87.5,
          defectRate: 2.3
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeFrame]);

  // 模擬數據 - 實際應從數據庫獲取
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    production: Math.floor(Math.random() * 100) + 50,
    target: 80
  }));

  const machineStatus = [
    { name: 'Running', value: 8, color: COLORS.success },
    { name: 'Idle', value: 2, color: COLORS.warning },
    { name: 'Maintenance', value: 1, color: COLORS.info },
    { name: 'Error', value: 1, color: COLORS.danger }
  ];

  return (
    <NewDashboardLayout theme="injection">
      {/* Header 區域 - 時間選擇器 */}
      <div style={{ gridArea: 'header' }} className="bg-slate-800/50 backdrop-blur rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">Injection Production Dashboard</h2>
            <p className="text-sm text-gray-400">Real-time production monitoring and analysis</p>
          </div>
          <TimeFrameSelector 
            value={timeFrame.value}
            onChange={setTimeFrame}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ gridArea: 'stats1' }} className="bg-slate-800/50 backdrop-blur rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <CubeIcon className="w-8 h-8 text-blue-500" />
          <TrendingUpIcon className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.totalProduction.toLocaleString()}</div>
        <div className="text-sm text-gray-400">Total Production</div>
        <div className="text-xs text-green-500 mt-1">+12.5% vs yesterday</div>
      </div>

      <div style={{ gridArea: 'stats2' }} className="bg-slate-800/50 backdrop-blur rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <CheckCircleIcon className="w-8 h-8 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.activeMachines}/12</div>
        <div className="text-sm text-gray-400">Active Machines</div>
        <div className="text-xs text-gray-500 mt-1">Operating normally</div>
      </div>

      <div style={{ gridArea: 'stats3' }} className="bg-slate-800/50 backdrop-blur rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <ClockIcon className="w-8 h-8 text-cyan-500" />
          <TrendingUpIcon className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.efficiency}%</div>
        <div className="text-sm text-gray-400">Efficiency Rate</div>
        <div className="text-xs text-green-500 mt-1">Above target</div>
      </div>

      <div style={{ gridArea: 'stats4' }} className="bg-slate-800/50 backdrop-blur rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <XCircleIcon className="w-8 h-8 text-red-500" />
          <TrendingDownIcon className="w-5 h-5 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-white">{stats.defectRate}%</div>
        <div className="text-sm text-gray-400">Defect Rate</div>
        <div className="text-xs text-green-500 mt-1">-0.5% improvement</div>
      </div>

      {/* Production Chart - 大正方形區塊 */}
      <div style={{ gridArea: 'chart' }} className="bg-slate-800/50 backdrop-blur rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Hourly Production Trend</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} />
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
              dataKey="production" 
              stroke={COLORS.primary} 
              strokeWidth={2}
              dot={{ fill: COLORS.primary, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              stroke={COLORS.warning} 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Machine Status - 圓餅圖 */}
      <div style={{ gridArea: 'status' }} className="bg-slate-800/50 backdrop-blur rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Machine Status</h3>
        <ResponsiveContainer width="100%" height="85%">
          <PieChart>
            <Pie
              data={machineStatus}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {machineStatus.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
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
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {machineStatus.map((status) => (
            <div key={status.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: status.color }}
                />
                <span className="text-gray-300">{status.name}</span>
              </div>
              <span className="text-white font-medium">{status.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Production List - 長方形區塊 */}
      <div style={{ gridArea: 'list' }} className="bg-slate-800/50 backdrop-blur rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Production</h3>
        <div className="space-y-2">
          {/* 模擬生產記錄 */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <CubeIcon className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Product Code: PC00{i}</div>
                  <div className="text-xs text-gray-400">Machine: INJ-0{i}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">250 units</div>
                <div className="text-xs text-gray-400">10:3{i} AM</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Production Table */}
      <div style={{ gridArea: 'table' }} className="bg-slate-800/50 backdrop-blur rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Production Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase">Product</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase">Quantity</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase">Target</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-400 uppercase">Rate</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className="border-b border-slate-700/50">
                  <td className="py-2 px-3 text-sm text-white">PC00{i}</td>
                  <td className="py-2 px-3 text-sm text-white">{250 * i}</td>
                  <td className="py-2 px-3 text-sm text-gray-400">{300 * i}</td>
                  <td className="py-2 px-3">
                    <span className={cn(
                      "text-sm font-medium",
                      (250 * i) / (300 * i) > 0.8 ? "text-green-500" : "text-red-500"
                    )}>
                      {((250 * i) / (300 * i) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </NewDashboardLayout>
  );
}