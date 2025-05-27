'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Tag as TagIcon, 
  PackagePlus as PackagePlusIcon, 
  MoveHorizontal as MoveHorizontalIcon,
  LogIn as LogInIcon,
  Menu as MenuIcon, 
  X as XIcon 
} from 'lucide-react';

export default function OpenAccessNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navLinks = [
    {
      href: '/print-label',
      label: 'Print Label',
      icon: <TagIcon className="mr-2 h-5 w-5" />,
    },
    {
      href: '/print-grnlabel',
      label: 'Print GRN Label',
      icon: <PackagePlusIcon className="mr-2 h-5 w-5" />,
    },
    {
      href: '/stock-transfer',
      label: 'Stock Transfer',
      icon: <MoveHorizontalIcon className="mr-2 h-5 w-5" />,
    },
    {
      href: '/main-login',
      label: 'Admin Login',
      icon: <LogInIcon className="mr-2 h-5 w-5" />,
    },
  ];

  return (
    <>
      {/* 漢堡按鈕 */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {isOpen ? <XIcon /> : <MenuIcon />}
      </Button>

      {/* 側邊欄 */}
      <div
        className={`fixed top-0 left-0 h-full bg-background border-r z-40 transition-all duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '250px' }}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold">Pennine Stock Control</h1>
          </div>
          <div className="flex-1 p-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)} // 對於移動設備，點擊後關閉側邊欄
                  >
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                    >
                      {link.icon}
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Open Access Mode
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 