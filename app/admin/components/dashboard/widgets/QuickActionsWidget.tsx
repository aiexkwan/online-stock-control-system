/**
 * 快速操作小部件
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Zap, 
  QrCode, 
  Package, 
  TruckIcon, 
  FileText, 
  BarChart3,
  ClipboardList,
  Users
} from 'lucide-react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { iconColors } from '@/app/utils/dialogStyles';
import { useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  color?: string;
}

export function QuickActionsWidget({ widget, isEditMode }: WidgetComponentProps) {
  const router = useRouter();

  const actions: QuickAction[] = [
    {
      id: 'print-qc',
      label: 'Print QC Label',
      icon: <QrCode className="h-5 w-5" />,
      href: '/print-label',
      color: iconColors.blue
    },
    {
      id: 'print-grn',
      label: 'Print GRN Label',
      icon: <Package className="h-5 w-5" />,
      href: '/print-grnlabel',
      color: iconColors.green
    },
    {
      id: 'stock-transfer',
      label: 'Stock Transfer',
      icon: <TruckIcon className="h-5 w-5" />,
      href: '/stock-transfer',
      color: iconColors.cyan
    },
    {
      id: 'order-loading',
      label: 'Order Loading',
      icon: <FileText className="h-5 w-5" />,
      href: '/order-loading',
      color: iconColors.yellow
    },
    {
      id: 'stock-take',
      label: 'Stock Take',
      icon: <ClipboardList className="h-5 w-5" />,
      href: '/stock-take/cycle-count',
      color: iconColors.purple
    },
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: <Users className="h-5 w-5" />,
      href: '/admin',
      color: iconColors.red
    }
  ];

  // 根據配置過濾顯示的操作
  const visibleActions = widget.config.selectedActions 
    ? actions.filter(a => widget.config.selectedActions.includes(a.id))
    : actions.slice(0, widget.config.maxActions || 4);

  const handleAction = (href: string) => {
    if (!isEditMode) {
      router.push(href);
    }
  };

  return (
    <Card className={`h-full bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl ${isEditMode ? 'border-dashed border-2 border-blue-500/50' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent flex items-center gap-2">
          <Zap className={`h-4 w-4 ${iconColors.yellow}`} />
          {'title' in widget ? widget.title : 'Quick Actions'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {visibleActions.map((action) => (
            <Button
              key={action.id}
              onClick={() => handleAction(action.href)}
              variant="outline"
              className="h-auto py-3 px-3 flex flex-col items-center gap-2 bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600 transition-all group"
              disabled={isEditMode}
            >
              <div className={`${action.color} group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <span className="text-xs text-slate-300 text-center">
                {action.label}
              </span>
            </Button>
          ))}
        </div>
        {isEditMode && (
          <p className="text-xs text-slate-500 text-center mt-3">
            Navigation disabled in edit mode
          </p>
        )}
      </CardContent>
    </Card>
  );
}