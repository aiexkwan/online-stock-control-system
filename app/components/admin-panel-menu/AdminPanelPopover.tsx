'use client';
import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useRouter } from 'next/navigation';
import { 
  NoSymbolIcon, 
  ClockIcon, 
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
    <Tabs.Root defaultValue="void" className="flex min-h-[300px]">
      <Tabs.List className="flex flex-col bg-[#23263a] shadow-md rounded-md">
        <div className="relative">
          <Tabs.Trigger
            value="void"
            className="px-3 py-2 text-sm font-medium text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500 flex items-center hover:bg-gray-700 transition-colors rounded-t-md w-full"
            onMouseEnter={() => setHovered('void')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleTabClick('/void-pallet')}
          >
            <NoSymbolIcon className="mr-3 h-4 w-4" />
            <span className="whitespace-nowrap">Void Pallet</span>
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
            className="px-3 py-2 text-sm font-medium text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500 flex items-center hover:bg-gray-700 transition-colors w-full"
            onMouseEnter={() => setHovered('history')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleTabClick('/view-history')}
          >
            <ClockIcon className="mr-3 h-4 w-4" />
            <span className="whitespace-nowrap">View History</span>
          </Tabs.Trigger>
          {hovered === 'history' && (
            <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs rounded shadow-lg px-3 py-2 z-50 whitespace-nowrap">
              View transaction history records
            </div>
          )}
        </div>
        
        <div className="relative">
          <Tabs.Trigger
            value="product"
            className="px-3 py-2 text-sm font-medium text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500 flex items-center hover:bg-gray-700 transition-colors rounded-b-md w-full"
            onMouseEnter={() => setHovered('product')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleTabClick('/productUpdate')}
          >
            <CubeIcon className="mr-3 h-4 w-4" />
            <span className="whitespace-nowrap">Product Update</span>
          </Tabs.Trigger>
          {hovered === 'product' && (
            <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs rounded shadow-lg px-3 py-2 z-50 whitespace-nowrap">
              Manage and update product information
            </div>
          )}
        </div>
      </Tabs.List>
      {/* 內容區塊不顯示，僅保留 tab 說明與跳轉 */}
    </Tabs.Root>
  );
} 