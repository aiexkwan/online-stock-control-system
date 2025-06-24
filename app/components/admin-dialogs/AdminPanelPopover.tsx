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
import VoidPalletDialog from './VoidPalletDialog';
import ViewHistoryDialog from './ViewHistoryDialog';
import ProductUpdateDialog from './ProductUpdateDialog';

export default function AdminPanelPopover({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);

  // 點擊選項時關閉 popout 並跳轉或觸發對話框
  const handleTabClick = (action: string, path?: string) => {
    if (onClose) onClose();
    
    if (action === 'open-void-dialog') {
      setShowVoidDialog(true);
    } else if (action === 'open-history-dialog') {
      setShowHistoryDialog(true);
    } else if (action === 'open-product-dialog') {
      setShowProductDialog(true);
    } else if (path) {
      router.push(path);
    }
  };

  return (
    <>
      <Tabs.Root defaultValue="void" className="flex min-h-[300px]">
        <Tabs.List className="flex flex-col bg-[#23263a] shadow-md rounded-md">
          <div className="relative">
            <Tabs.Trigger
              value="void"
              className="px-3 py-2 text-sm font-medium text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500 flex items-center hover:bg-gray-700 transition-colors rounded-t-md w-full"
              onMouseEnter={() => setHovered('void')}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleTabClick('open-void-dialog')}
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
              onClick={() => handleTabClick('open-history-dialog')}
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
              onClick={() => handleTabClick('open-product-dialog')}
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

      {/* Void Pallet Dialog */}
      <VoidPalletDialog
        isOpen={showVoidDialog}
        onClose={() => setShowVoidDialog(false)}
      />

      {/* View History Dialog */}
      <ViewHistoryDialog
        isOpen={showHistoryDialog}
        onClose={() => setShowHistoryDialog(false)}
      />

      {/* Product Update Dialog */}
      <ProductUpdateDialog
        isOpen={showProductDialog}
        onClose={() => setShowProductDialog(false)}
      />
    </>
  );
} 