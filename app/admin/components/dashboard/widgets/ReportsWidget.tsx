/**
 * Reports Widget - Report Center
 * 1x1: 不支援
 * 3x3: 顯示 4 個報表快速存取按鈕 (2x2 排列)
 * 5x5: 顯示所有 7 個報表快速存取按鈕 (2x5 排列)
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
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { Button } from "@/components/ui/button";
import { WidgetStyles } from '@/app/utils/widgetStyles';

interface ReportType {
  id: string;
  name: string;
  dialogKey: string;
  icon: React.ReactNode;
  color: string;
  show4x4: boolean; // 是否在 3x3 模式中顯示
}

const reportTypes: ReportType[] = [
  { 
    id: 'void-pallet',
    name: 'Void Pallet Report',
    dialogKey: 'voidPalletReport',
    icon: <NoSymbolIcon />,
    color: WidgetStyles.quickAccess.reports['Void Pallet Report'],
    show4x4: false
  },
  { 
    id: 'order-loading',
    name: 'Order Loading Report',
    dialogKey: 'orderLoadingReport',
    icon: <TruckIcon />,
    color: WidgetStyles.quickAccess.reports['Order Loading Report'],
    show4x4: true
  },
  { 
    id: 'stock-take',
    name: 'Stock Take Report',
    dialogKey: 'stockTakeReport',
    icon: <ClipboardDocumentCheckIcon />,
    color: WidgetStyles.quickAccess.reports['Stock Take Report'],
    show4x4: false
  },
  { 
    id: 'aco-order',
    name: 'ACO Order Report',
    dialogKey: 'acoOrderReport',
    icon: <ClipboardDocumentListIcon />,
    color: WidgetStyles.quickAccess.reports['ACO Order Report'],
    show4x4: true
  },
  { 
    id: 'transaction',
    name: 'Transaction Report',
    dialogKey: 'transactionReport',
    icon: <ArrowsRightLeftIcon />,
    color: WidgetStyles.quickAccess.reports['Transaction Report'],
    show4x4: true
  },
  { 
    id: 'grn',
    name: 'GRN Report',
    dialogKey: 'grnReport',
    icon: <DocumentArrowDownIcon />,
    color: WidgetStyles.quickAccess.reports['GRN Report'],
    show4x4: true
  },
  { 
    id: 'export-all',
    name: 'Export All Data',
    dialogKey: 'exportAllData',
    icon: <CircleStackIcon />,
    color: WidgetStyles.quickAccess.reports['Export All Data'],
    show4x4: false
  }
];

export const ReportsWidget = React.memo(function ReportsWidget({ widget, isEditMode }: WidgetComponentProps) {

  const handleReportClick = (report: ReportType) => {
    // 觸發對應的報表事件
    const eventName = `open${report.dialogKey.charAt(0).toUpperCase() + report.dialogKey.slice(1)}`;
    const event = new CustomEvent(eventName);
    window.dispatchEvent(event);
  };


  // 1x1 - 不支援

  // 3x3 - 顯示 4 個報表快速存取 (2x2 排列)

  // 5x5 - 顯示所有報表種類 (2x5 排列)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <WidgetCard widgetType="REPORTS" isEditMode={isEditMode}>
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
                variant="ghost"
                className={`${report.color} p-4 h-32 flex flex-col items-center justify-center gap-3 transition-all duration-300 text-white`}
                onClick={() => handleReportClick(report)}
                disabled={isEditMode}
              >
                <div className="w-10 h-10">
                  {React.cloneElement(report.icon as React.ReactElement, { className: "w-full h-full" })}
                </div>
                <span className="text-base font-medium text-center leading-tight">{report.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </WidgetCard>
    </motion.div>
  );
});