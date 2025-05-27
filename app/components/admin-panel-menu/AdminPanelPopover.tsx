'use client';
import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useRouter } from 'next/navigation';
import { 
  NoSymbolIcon, 
  ClockIcon, 
  DocumentArrowDownIcon, 
  ChatBubbleLeftRightIcon,
  CubeIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

export default function AdminPanelPopover({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  // 點擊選項時關閉 popout 並跳轉
  const handleTabClick = (path: string) => {
    if (onClose) onClose();
    router.push(path);
  };

  return (
    <Tabs.Root defaultValue="void" className="flex w-[340px] min-h-[280px]">
      <Tabs.List className="flex flex-col w-32 border-r border-gray-700 bg-[#23263a] shadow-md">
        <div className="relative">
          <Tabs.Trigger
            value="void"
            className="px-3 py-2 text-sm font-medium text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500 flex items-center"
            onMouseEnter={() => setHovered('void')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleTabClick('/void-pallet')}
          >
            <NoSymbolIcon className="mr-2 h-4 w-4" />
            Void Pallet
          </Tabs.Trigger>
          {hovered === 'void' && (
            <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs rounded shadow-lg px-3 py-2 z-50 whitespace-nowrap">
              Void or cancel pallet records
            </div>
          )}
        </div>
        
        <div className="relative">
          <Tabs.Trigger
            value="history"
            className="px-3 py-2 text-sm font-medium text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500 flex items-center"
            onMouseEnter={() => setHovered('history')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleTabClick('/view-history')}
          >
            <ClockIcon className="mr-2 h-4 w-4" />
            View History
          </Tabs.Trigger>
          {hovered === 'history' && (
            <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs rounded shadow-lg px-3 py-2 z-50 whitespace-nowrap">
              View transaction history records
            </div>
          )}
        </div>
        
        <div className="relative">
          <Tabs.Trigger
            value="export"
            className="px-3 py-2 text-sm font-medium text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500 flex items-center"
            onMouseEnter={() => setHovered('export')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleTabClick('/export-report')}
          >
            <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
            Export Report
          </Tabs.Trigger>
          {hovered === 'export' && (
            <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs rounded shadow-lg px-3 py-2 z-50 whitespace-nowrap">
              Export data to reports
            </div>
          )}
        </div>
        
        <div className="relative">
          <Tabs.Trigger
            value="ask"
            className="px-3 py-2 text-sm font-medium text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500 flex items-center"
            onMouseEnter={() => setHovered('ask')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleTabClick('/ask-database')}
          >
            <ChatBubbleLeftRightIcon className="mr-2 h-4 w-4" />
            Ask Database
          </Tabs.Trigger>
          {hovered === 'ask' && (
            <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs rounded shadow-lg px-3 py-2 z-50 whitespace-nowrap">
              Query database information
            </div>
          )}
        </div>
        
        <div className="relative">
          <Tabs.Trigger
            value="product"
            className="px-3 py-2 text-sm font-medium text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500 flex items-center"
            onMouseEnter={() => setHovered('product')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleTabClick('/productUpdate')}
          >
            <CubeIcon className="mr-2 h-4 w-4" />
            Product Update
          </Tabs.Trigger>
          {hovered === 'product' && (
            <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs rounded shadow-lg px-3 py-2 z-50 whitespace-nowrap">
              Manage and update product information
            </div>
          )}
        </div>
        
        <div className="relative">
          <Tabs.Trigger
            value="access"
            className="px-3 py-2 text-sm font-medium text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500 flex items-center"
            onMouseEnter={() => setHovered('access')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleTabClick('/users')}
          >
            <KeyIcon className="mr-2 h-4 w-4" />
            Access Update
          </Tabs.Trigger>
          {hovered === 'access' && (
            <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs rounded shadow-lg px-3 py-2 z-50 whitespace-nowrap">
              Manage user access and permissions
            </div>
          )}
        </div>
      </Tabs.List>
      {/* 內容區塊不顯示，僅保留 tab 說明與跳轉 */}
    </Tabs.Root>
  );
} 