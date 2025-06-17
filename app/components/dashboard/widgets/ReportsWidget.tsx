/**
 * Reports Widget - Report Center
 * 2x2: 不支援
 * 4x4: 顯示 4 個報表快速存取按鈕 (2x2 排列)
 * 6x6: 顯示所有 7 個報表快速存取按鈕 (2x5 排列)
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentChartBarIcon, 
  NoSymbolIcon,
  TruckIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  ArrowsRightLeftIcon,
  DocumentArrowDownIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline';
import { WidgetComponentProps, WidgetSize } from '@/app/types/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ReportType {
  id: string;
  name: string;
  dialogKey: string;
  icon: React.ReactNode;
  color: string;
  show4x4: boolean; // 是否在 4x4 模式中顯示
}

const reportTypes: ReportType[] = [
  { 
    id: 'void-pallet',
    name: 'Void Pallet Report',
    dialogKey: 'voidPalletReport',
    icon: <NoSymbolIcon className="w-6 h-6" />,
    color: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
    show4x4: false
  },
  { 
    id: 'order-loading',
    name: 'Order Loading Report',
    dialogKey: 'orderLoadingReport',
    icon: <TruckIcon className="w-6 h-6" />,
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
    show4x4: true
  },
  { 
    id: 'stock-take',
    name: 'Stock Take Report',
    dialogKey: 'stockTakeReport',
    icon: <ClipboardDocumentCheckIcon className="w-6 h-6" />,
    color: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
    show4x4: false
  },
  { 
    id: 'aco-order',
    name: 'ACO Order Report',
    dialogKey: 'acoOrderReport',
    icon: <ClipboardDocumentListIcon className="w-6 h-6" />,
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30',
    show4x4: true
  },
  { 
    id: 'transaction',
    name: 'Transaction Report',
    dialogKey: 'transactionReport',
    icon: <ArrowsRightLeftIcon className="w-6 h-6" />,
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
    show4x4: true
  },
  { 
    id: 'grn',
    name: 'GRN Report',
    dialogKey: 'grnReport',
    icon: <DocumentArrowDownIcon className="w-6 h-6" />,
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30',
    show4x4: true
  },
  { 
    id: 'export-all',
    name: 'Export All Data',
    dialogKey: 'exportAllData',
    icon: <CircleStackIcon className="w-6 h-6" />,
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/30',
    show4x4: false
  }
];

export function ReportsWidget({ widget, isEditMode }: WidgetComponentProps) {
  const size = widget.config.size || WidgetSize.MEDIUM;

  const handleReportClick = (report: ReportType) => {
    // 觸發對應的報表事件
    const eventName = `open${report.dialogKey.charAt(0).toUpperCase() + report.dialogKey.slice(1)}`;
    const event = new CustomEvent(eventName);
    window.dispatchEvent(event);
  };


  // 2x2 - 不支援
  if (size === WidgetSize.SMALL) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full"
      >
        <Card className="h-full bg-slate-800/40 backdrop-blur-xl border-slate-500/30 transition-all duration-300">
          <CardContent className="p-4 h-full flex flex-col items-center justify-center">
            <DocumentChartBarIcon className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-xs text-slate-400 text-center">Reports not supported in 2x2 mode</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // 4x4 - 顯示 4 個報表快速存取 (2x2 排列)
  if (size === WidgetSize.MEDIUM) {
    const mediumReports = reportTypes.filter(r => r.show4x4);
    
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
              {mediumReports.map((report) => (
                <Button
                  key={report.id}
                  variant="outline"
                  className={`${report.color} hover:opacity-80 p-3 h-auto flex flex-col items-center justify-center gap-2 transition-all duration-300`}
                  onClick={() => handleReportClick(report)}
                  disabled={isEditMode}
                >
                  {report.icon}
                  <span className="text-xs font-medium text-center">{report.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // 6x6 - 顯示所有報表種類 (2x5 排列)
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
        <CardContent className="h-[calc(100%-4rem)] overflow-auto">
          <div className="grid grid-cols-2 gap-3">
            {reportTypes.map((report) => (
              <Button
                key={report.id}
                variant="outline"
                className={`${report.color} hover:opacity-80 p-4 h-24 flex flex-col items-center justify-center gap-2 transition-all duration-300`}
                onClick={() => handleReportClick(report)}
                disabled={isEditMode}
              >
                {report.icon}
                <span className="text-sm font-medium text-center">{report.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}