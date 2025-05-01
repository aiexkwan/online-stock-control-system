'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DocumentIcon,
  ArrowsRightLeftIcon,
  NoSymbolIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

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

  return (
    <>
      {/* 頂部 Pennine 標誌 */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            <span className="font-bold text-xl text-blue-600">Pennine</span>
          </div>
        </div>
      </div>
      {/* 左側功能選單（無任何中文標題） */}
      <div className="fixed left-0 top-16 bottom-0 w-64 bg-gray-900 text-white z-10">
        <nav className="mt-5 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md mb-2 ${
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
      </div>
    </>
  );
} 