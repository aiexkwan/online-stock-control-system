'use client';

import React, { useState, useRef } from 'react';
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
import PrintLabelPopover from './print-label-menu/PrintLabelPopover';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { name: 'Print Label', icon: DocumentIcon, href: '/print-label' },
  { name: 'Stock Transfer', icon: ArrowsRightLeftIcon, href: '/stock-transfer' },
  { name: 'Void Pallet', icon: NoSymbolIcon, href: '/void-pallet' },
  { name: 'View History', icon: ClockIcon, href: '/view-history' },
  { name: 'Ask Database', icon: ChatBubbleLeftRightIcon, href: '/ask-database' },
];

const slideInVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

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
    <div className="w-full h-full bg-[#23263a] text-white flex flex-col justify-between">
      {/* 上方標誌 */}
      <div className="px-4 py-4">
        <span className="font-extrabold text-2xl text-orange-400 tracking-wide">Pennine</span>
              </div>

      {/* Menu 選項 */}
      <nav className="flex-1 mt-2 px-2">
        {/* Home */}
                    <Link
          key="Home"
          href="/"
          className="flex items-center px-4 py-2 text-base font-medium rounded-md mb-4 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
          <HomeIcon className="mr-3 h-6 w-6" />
          Home
                    </Link>

        {/* Print Label 有 popover 功能 */}
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
            <AnimatePresence>
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={slideInVariants}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onMouseEnter={handlePopoverEnter}
                onMouseLeave={handlePopoverLeave}
                className="absolute left-full top-0 z-50 shadow-md w-32"
              >
                <PrintLabelPopover />
              </motion.div>
            </AnimatePresence>
          )}
      </div>

        {/* 其他選單 */}
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

      {/* 底部功能 */}
      <div className="px-2 pb-6 flex flex-col gap-2">
        <Link href="/products/update" className="flex items-center px-4 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
          <span className="mr-3">🛠️</span> Product Update
        </Link>
        <Link href="/access/update" className="flex items-center px-4 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
          <span className="mr-3">🔑</span> Access Update
                  </Link>
                <button
          onClick={() => {
            localStorage.removeItem('user');
            router.push('/login');
          }}
          className="flex items-center px-4 py-2 text-base font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
                >
          <span className="mr-3">🚪</span> LogOut
                </button>
              </div>
            </div>
  );
} 