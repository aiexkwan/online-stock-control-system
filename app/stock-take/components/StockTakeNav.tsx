'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ClipboardDocumentCheckIcon, 
  DocumentChartBarIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// 子頁面導航項目
const stockTakeMenuItems = [
  {
    id: 'cycle-count',
    title: 'Cycle Count',
    path: '/stock-take/cycle-count',
    icon: ClipboardDocumentCheckIcon,
    description: 'Perform inventory cycle counting'
  },
  {
    id: 'report',
    title: 'Stock Count Report',
    path: '/stock-take/report',
    icon: DocumentChartBarIcon,
    description: 'View stock count reports'
  }
];

export default function StockTakeNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 處理點擊導航項目
  const handleMenuClick = (path: string) => {
    router.push(path);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl border-y border-slate-700/50 sticky top-0 z-30 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左側 - 頁面標題 */}
          <div className="flex items-center">
            <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-400 mr-2" />
            <span className="text-lg font-medium text-blue-200">Stock Take</span>
          </div>

          {/* 中間 - 導航菜單 */}
          <div className="hidden md:flex items-center space-x-6">
            {stockTakeMenuItems.map((item) => {
              const isActive = pathname === item.path;
              const IconComponent = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.path)}
                  className={`flex items-center px-4 py-2 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-900/40 text-blue-200 border border-blue-500/50' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <IconComponent className={`h-5 w-5 mr-2 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>

          {/* 右側 - 移動裝置菜單按鈕 */}
          <div className="md:hidden">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-300"
            >
              {isDropdownOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* 移動裝置導航菜單 */}
        {isDropdownOpen && (
          <div className="md:hidden border-t border-slate-700/50 py-3 space-y-2">
            {stockTakeMenuItems.map((item) => {
              const isActive = pathname === item.path;
              const IconComponent = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.path)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-blue-900/40 text-blue-200 border border-blue-500/50' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50 border border-transparent hover:border-slate-600/50'
                  }`}
                >
                  <IconComponent className={`h-5 w-5 mr-3 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 