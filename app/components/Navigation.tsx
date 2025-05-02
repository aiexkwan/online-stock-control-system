'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DocumentIcon,
  ArrowsRightLeftIcon,
  NoSymbolIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import * as Popover from '@radix-ui/react-popover';
import PrintLabelPopover from './print-label-menu/PrintLabelPopover';

const menuItems = [
  {
    name: 'Print Label',
    icon: DocumentIcon,
    href: '/print-label',
  },
  {
    name: 'Stock Transfer',
    icon: ArrowsRightLeftIcon,
    href: '/stock-transfer',
  },
  {
    name: 'Void Pallet',
    icon: NoSymbolIcon,
    href: '/void-pallet',
  },
  {
    name: 'View History',
    icon: ClockIcon,
    href: '/history',
  },
  {
    name: 'Ask Database',
    icon: ChatBubbleLeftRightIcon,
    href: '/ask-database',
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [printLabelOpen, setPrintLabelOpen] = useState(false);
  const hoverRef = useRef(false);
  const closeTimeout = useRef<NodeJS.Timeout | null>(null);

  const handlePopoverEnter = () => {
    hoverRef.current = true;
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setPrintLabelOpen(true);
  };

  const handlePopoverLeave = () => {
    hoverRef.current = false;
    closeTimeout.current = setTimeout(() => {
      if (!hoverRef.current) setPrintLabelOpen(false);
    }, 200);
  };

  return (
    <>
      {/* 頂部 Pennine 標誌，深色底 */}
      <div className="fixed top-0 left-0 right-0 bg-[#181c2f] shadow-sm z-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <span className="font-extrabold text-3xl text-orange-400 tracking-wide">Pennine</span>
          </div>
        </div>
      </div>
      {/* 左側功能選單（無任何中文標題） */}
      <div className="fixed left-0 top-16 bottom-0 w-1/4 min-w-[220px] max-w-sm bg-[#23263a] text-white z-10 flex flex-col justify-between">
        <nav className="mt-5 px-2">
          <Link
            key="Home"
            href="/dashboard"
            className={`flex items-center px-4 py-2 text-base font-medium rounded-md mb-4 text-gray-300 hover:bg-gray-700 hover:text-white`}
          >
            <HomeIcon className="mr-3 h-6 w-6" />
            Home
          </Link>
          {/* Print Label 懸停彈出小選單 */}
          <div
            onMouseEnter={handlePopoverEnter}
            onMouseLeave={handlePopoverLeave}
            className="relative"
          >
            <div
              className={`flex items-center px-4 py-2 text-base font-medium rounded-md mb-2 cursor-pointer ${
                pathname === '/print-label'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <DocumentIcon className="mr-3 h-6 w-6" />
              Print Label
            </div>
            {printLabelOpen && (
              <div
                onMouseEnter={handlePopoverEnter}
                onMouseLeave={handlePopoverLeave}
                className="absolute left-full top-0 z-50 shadow-xl"
              >
                <PrintLabelPopover />
              </div>
            )}
          </div>
          {/* 其他 menu item 保持不變 */}
          {menuItems.filter(item => item.name !== 'Print Label').map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2 text-base font-medium rounded-md mb-2 ${
                pathname === item.href
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="mr-3 h-6 w-6" />
              {item.name}
            </Link>
          ))}
        </nav>
        {/* 新增底部三個按鈕 */}
        <div className="px-2 pb-6 flex flex-col gap-2">
          <Link href="/products/update" className="flex items-center px-4 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
            <span className="mr-3">🛠️</span> Product Update
          </Link>
          <Link href="/access/update" className="flex items-center px-4 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
            <span className="mr-3">🔑</span> Access Update
          </Link>
          <button onClick={() => { localStorage.removeItem('user'); router.push('/login'); }} className="flex items-center px-4 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
            <span className="mr-3">🚪</span> LogOut
          </button>
        </div>
      </div>
    </>
  );
} 