/**
 * Reports Widget
 * 2x2: 顯示報表圖標和標題
 * 4x4: 顯示報表快速存取按鈕
 * 6x6: 顯示所有報表種類和快速操作
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DocumentChartBarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReportType {
  id: string;
  name: string;
  type: 'inventory' | 'production' | 'transfer' | 'quality' | 'financial' | 'daily' | 'weekly' | 'monthly';
  description: string;
  icon: string;
  color: string;
}

const reportTypes: ReportType[] = [
  { id: '1', name: 'Daily Production', type: 'daily', description: 'Daily production summary', icon: '📅', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: '2', name: 'Stock Level', type: 'inventory', description: 'Current inventory levels', icon: '📦', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { id: '3', name: 'Transfer Report', type: 'transfer', description: 'Transfer history and status', icon: '🚚', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { id: '4', name: 'Quality Report', type: 'quality', description: 'Quality inspection results', icon: '✅', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: '5', name: 'Weekly Summary', type: 'weekly', description: 'Weekly operation summary', icon: '📈', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: '6', name: 'Financial Report', type: 'financial', description: 'Financial overview', icon: '💰', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { id: '7', name: 'ACO Report', type: 'production', description: 'ACO order status', icon: '🏭', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { id: '8', name: 'Monthly Report', type: 'monthly', description: 'Monthly performance', icon: '📆', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' }
];

export function ReportsWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.MEDIUM;


  const handleOpenReports = () => {
    // 觸發報表對話框
    const event = new CustomEvent('openReportsDialog');
    window.dispatchEvent(event);
  };


  // 2x2 - 只顯示數值
  if (size === WidgetSize.SMALL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 cursor-pointer" onClick={handleOpenReports}>
          <CardContent className="p-4 h-full flex flex-col items-center justify-center">
            <DocumentChartBarIcon className="w-12 h-12 text-emerald-400 mb-2" />
            <p className="text-sm text-emerald-300">Reports</p>
            <p className="text-xs text-slate-400 mt-1">Quick Access</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // 4x4 - 顯示報表快速存取
  if (size === WidgetSize.MEDIUM) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <DocumentChartBarIcon className="w-5 h-5 text-emerald-400" />
              <span className="text-lg">Quick Reports</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {reportTypes.slice(0, 4).map((report) => (
                <Button
                  key={report.id}
                  variant="outline"
                  className={`${report.color} hover:opacity-80 p-3 h-auto flex flex-col items-center justify-center gap-2 transition-all duration-300`}
                  onClick={handleOpenReports}
                >
                  <span className="text-2xl">{report.icon}</span>
                  <span className="text-xs font-medium">{report.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // 6x6 - 顯示所有報表種類
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <DocumentChartBarIcon className="w-6 h-6 text-emerald-400" />
            <span className="text-xl">Report Center</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {reportTypes.map((report) => (
              <Button
                key={report.id}
                variant="outline"
                className={`${report.color} hover:opacity-80 p-4 h-auto flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-105`}
                onClick={handleOpenReports}
              >
                <span className="text-3xl">{report.icon}</span>
                <div className="text-center">
                  <div className="text-sm font-medium">{report.name}</div>
                  <div className="text-xs opacity-80 mt-1">{report.description}</div>
                </div>
              </Button>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Generate custom reports with various export formats</p>
              <Button
                onClick={handleOpenReports}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}