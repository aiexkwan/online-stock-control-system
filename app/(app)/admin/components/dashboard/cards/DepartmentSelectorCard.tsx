/**
 * DepartmentSelectorCard Component
 * 部門選擇器卡片 - Operations頁面頂部區域組件
 * 16位專家協作設計 - 精確定位在14×10網格的列2-5, 行1-2
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  BeakerIcon,
  CheckBadgeIcon,
  BuildingStorefrontIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// 部門類型定義
export type Department = 'All' | 'Injection' | 'Pipeline' | 'Quality' | 'Warehouse';

// 部門配置
const DEPARTMENT_CONFIG: Record<Department, {
  id: Department;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  description: string;
}> = {
  'All': {
    id: 'All',
    label: 'All Departments',
    icon: Squares2X2Icon,
    color: 'blue',
    description: 'View all operations across departments'
  },
  'Injection': {
    id: 'Injection',
    label: 'Injection',
    icon: WrenchScrewdriverIcon,
    color: 'green',
    description: 'Injection molding operations'
  },
  'Pipeline': {
    id: 'Pipeline',
    label: 'Pipeline',
    icon: BuildingOfficeIcon,
    color: 'purple',
    description: 'Production pipeline management'
  },
  'Quality': {
    id: 'Quality',
    label: 'Quality',
    icon: CheckBadgeIcon,
    color: 'orange',
    description: 'Quality control and assurance'
  },
  'Warehouse': {
    id: 'Warehouse',
    label: 'Warehouse',
    icon: BuildingStorefrontIcon,
    color: 'indigo',
    description: 'Warehouse and inventory operations'
  }
};

// 組件Props
interface DepartmentSelectorCardProps {
  config?: {
    departments?: Department[];
    defaultDepartment?: Department;
    showIcons?: boolean;
    style?: 'compact' | 'full';
  };
  
  // 回調函數
  onDepartmentChange?: (department: Department) => void;
  
  // 樣式
  className?: string;
  
  // 編輯模式
  isEditMode?: boolean;
}

// 本地存儲key
const STORAGE_KEY = 'operations-selected-department';

export const DepartmentSelectorCard: React.FC<DepartmentSelectorCardProps> = ({
  config = {},
  onDepartmentChange,
  className,
  isEditMode = false,
}) => {
  const {
    departments = ['All', 'Injection', 'Pipeline', 'Quality', 'Warehouse'],
    defaultDepartment = 'All',
    showIcons = true,
    style = 'compact'
  } = config;

  // 狀態管理
  const [selectedDepartment, setSelectedDepartment] = useState<Department>(defaultDepartment);
  const [isLoading, setIsLoading] = useState(false);

  // 從本地存儲恢復選擇
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && departments.includes(stored as Department)) {
        setSelectedDepartment(stored as Department);
      }
    } catch (error) {
      console.warn('[DepartmentSelector] Failed to load from localStorage:', error);
    }
  }, [departments]);

  // 處理部門選擇
  const handleDepartmentSelect = async (department: Department) => {
    if (department === selectedDepartment) return;

    setIsLoading(true);
    
    try {
      // 保存到本地存儲
      localStorage.setItem(STORAGE_KEY, department);
      
      // 更新狀態
      setSelectedDepartment(department);
      
      // 通知父組件
      onDepartmentChange?.(department);
      
      // 發送全局事件 (用於其他組件監聽)
      window.dispatchEvent(new CustomEvent('department-changed', {
        detail: { department, previous: selectedDepartment }
      }));
      
    } catch (error) {
      console.error('[DepartmentSelector] Failed to select department:', error);
    } finally {
      setTimeout(() => setIsLoading(false), 200); // 短暫延遲提供視覺反饋
    }
  };

  // 渲染部門按鈕
  const renderDepartmentButton = (dept: Department) => {
    const config = DEPARTMENT_CONFIG[dept];
    const isSelected = selectedDepartment === dept;
    const Icon = config.icon;

    return (
      <motion.button
        key={dept}
        onClick={() => handleDepartmentSelect(dept)}
        disabled={isLoading}
        className={cn(
          // 基礎樣式
          'flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm',
          'transition-all duration-200 border',
          
          // 選中狀態
          isSelected ? [
            'bg-blue-500 text-white border-blue-600 shadow-md',
            'ring-2 ring-blue-500/20'
          ] : [
            'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300',
            'border-gray-200 dark:border-gray-700',
            'hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300'
          ],
          
          // 禁用狀態
          isLoading && 'opacity-50 cursor-not-allowed',
          
          // 緊湊模式調整
          style === 'compact' && 'px-2 py-1.5 text-xs'
        )}
        whileHover={!isLoading ? { scale: 1.02 } : {}}
        whileTap={!isLoading ? { scale: 0.98 } : {}}
      >
        {showIcons && (
          <Icon className={cn(
            'shrink-0',
            style === 'compact' ? 'w-4 h-4' : 'w-5 h-5'
          )} />
        )}
        <span className="truncate">
          {style === 'compact' ? config.label.split(' ')[0] : config.label}
        </span>
        
        {/* 選中指示器 */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 bg-white rounded-full"
          />
        )}
      </motion.button>
    );
  };

  return (
    <div className={cn(
      "h-full w-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700",
      "shadow-sm hover:shadow-md transition-shadow duration-200",
      className
    )}>
      {/* 標題區域 */}
      <div className="flex items-center justify-between p-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <h3 className={cn(
          "font-semibold text-gray-900 dark:text-gray-100",
          style === 'compact' ? 'text-sm' : 'text-base'
        )}>
          Department Selector
        </h3>
        
        {/* 當前選擇狀態 */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isLoading ? "bg-yellow-400 animate-pulse" : "bg-green-400"
          )} />
          <span>
            {isLoading ? 'Switching...' : `Active: ${selectedDepartment}`}
          </span>
        </div>
      </div>

      {/* 部門選擇區域 */}
      <div className="p-4">
        <div className={cn(
          "grid gap-2",
          style === 'compact' ? 
            "grid-cols-5 sm:grid-cols-3 md:grid-cols-5" : 
            "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
        )}>
          {departments.map(dept => renderDepartmentButton(dept))}
        </div>
        
        {/* 選中部門描述 */}
        {style !== 'compact' && (
          <motion.div
            key={selectedDepartment}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400"
          >
            {DEPARTMENT_CONFIG[selectedDepartment].description}
          </motion.div>
        )}
      </div>

      {/* 編輯模式工具 */}
      {isEditMode && (
        <div className="p-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex justify-end gap-2">
            <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Configure
            </button>
            <button className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 導出類型供其他組件使用
export type { Department };
export { DEPARTMENT_CONFIG };