/**
 * Department Selector Widget
 * 統一的部門選擇器組件 - 支援 production-monitoring 主題
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, ChevronDown } from 'lucide-react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UniversalWidgetCard as WidgetCard } from '../UniversalWidgetCard';
import { cn } from '@/lib/utils';

// 部門選項配置
const DEPARTMENTS = [
  { value: 'injection', label: 'Injection', color: 'bg-blue-500' },
  { value: 'pipeline', label: 'Pipeline', color: 'bg-green-500' },
  { value: 'all', label: 'All Departments', color: 'bg-purple-500' }
] as const;

type DepartmentValue = typeof DEPARTMENTS[number]['value'];

export const DepartmentSelectorWidget = React.memo(function DepartmentSelectorWidget({
  widget,
  isEditMode,
}: WidgetComponentProps) {
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentValue>('all');
  const [isOpen, setIsOpen] = useState(false);

  // 從 localStorage 讀取用戶選擇的部門
  useEffect(() => {
    const saved = localStorage.getItem('production-monitoring-department');
    if (saved && DEPARTMENTS.some(dept => dept.value === saved)) {
      setSelectedDepartment(saved as DepartmentValue);
    }
  }, []);

  // 處理部門切換
  const handleDepartmentChange = (department: DepartmentValue) => {
    setSelectedDepartment(department);
    setIsOpen(false);
    
    // 保存到 localStorage
    localStorage.setItem('production-monitoring-department', department);
    
    // 觸發全局事件通知其他組件更新
    window.dispatchEvent(new CustomEvent('departmentChanged', { 
      detail: { department } 
    }));
  };

  const selectedDept = DEPARTMENTS.find(dept => dept.value === selectedDepartment);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="h-full"
    >
      <WidgetCard widgetType="DEPARTMENT_SELECTOR" isEditMode={isEditMode}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4" />
            Department
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative">
            <button
              onClick={() => !isEditMode && setIsOpen(!isOpen)}
              disabled={isEditMode}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-lg border",
                "bg-background hover:bg-accent/50 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isOpen && "border-primary"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn("w-3 h-3 rounded-full", selectedDept?.color)} />
                <span className="font-medium">{selectedDept?.label}</span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </button>

            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-background border rounded-lg shadow-lg"
              >
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.value}
                    onClick={() => handleDepartmentChange(dept.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors",
                      "first:rounded-t-lg last:rounded-b-lg",
                      selectedDepartment === dept.value && "bg-accent"
                    )}
                  >
                    <div className={cn("w-3 h-3 rounded-full", dept.color)} />
                    <span className="font-medium">{dept.label}</span>
                    {selectedDepartment === dept.value && (
                      <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* 狀態指示器 */}
          <div className="mt-4 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Active Department:</span>
              <span className="font-medium">{selectedDept?.label}</span>
            </div>
          </div>
        </CardContent>
      </WidgetCard>
      
      {/* 點擊外部關閉下拉菜單 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </motion.div>
  );
});

export default DepartmentSelectorWidget;