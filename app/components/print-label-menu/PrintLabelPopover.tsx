'use client';
import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import QcLabelForm from './QcLabelForm';
import { useRouter } from 'next/navigation';

export default function PrintLabelPopover({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);

  // 點擊標籤時自動關閉 popout 並跳轉
  const handleTabClick = (tab: 'qc' | 'grn') => {
    if (onClose) onClose();
    if (tab === 'qc') router.push('/print-label');
    if (tab === 'grn') router.push('/print-grnlabel');
  };

  return (
    <Tabs.Root defaultValue="qc" className="flex w-[340px] min-h-[120px]">
      <Tabs.List className="flex flex-col w-32 border-r border-gray-700 bg-[#23263a] shadow-md">
        <div className="relative">
          <Tabs.Trigger
            value="qc"
            className="px-4 py-3 text-base font-semibold text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500"
            onMouseEnter={() => setHovered('qc')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleTabClick('qc')}
          >
            Q.C. Label
          </Tabs.Trigger>
          {hovered === 'qc' && (
            <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs rounded shadow-lg px-3 py-2 z-50 whitespace-nowrap">
              Print Label For Q.C.
            </div>
          )}
        </div>
        <div className="relative">
          <Tabs.Trigger
            value="grn"
            className="px-4 py-3 text-base font-semibold text-white text-left data-[state=active]:bg-gray-800 data-[state=active]:border-l-4 data-[state=active]:border-blue-500"
            onMouseEnter={() => setHovered('grn')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => handleTabClick('grn')}
          >
            GRN Label
          </Tabs.Trigger>
          {hovered === 'grn' && (
            <div className="absolute left-full top-0 ml-2 bg-gray-900 text-white text-xs rounded shadow-lg px-3 py-2 z-50 whitespace-nowrap">
              Print Label For GRN Order
            </div>
          )}
        </div>
      </Tabs.List>
      {/* 內容區塊不再顯示表單，僅保留 tab pop 說明與跳轉 */}
    </Tabs.Root>
  );
} 