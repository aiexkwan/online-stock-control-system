'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import MotionBackground from '@/app/components/MotionBackground';
import { 
  ClipboardDocumentCheckIcon, 
  DocumentChartBarIcon,
  ChevronDownIcon,
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

export default function StockTakePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 處理點擊導航項目
  const handleMenuClick = (path: string) => {
    router.push(path);
    setIsDropdownOpen(false);
  };

  return (
    <MotionBackground>
      <div className="text-white">
        {/* 子導航欄 */}
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

        {/* 主要內容區域 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-xl"
          >
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ClipboardDocumentCheckIcon className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent mb-4">
                  Inventory Stock Take
                </h1>
                <p className="text-slate-300 max-w-2xl mx-auto mb-6">
                  Select an option from the navigation menu above to begin working with inventory counts.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {stockTakeMenuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.path)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600/80 to-blue-500/80 hover:from-blue-500 hover:to-blue-400 border border-blue-500/50 hover:border-blue-400/70 rounded-xl transition-all duration-300 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95 backdrop-blur-sm"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MotionBackground>
  );
} 