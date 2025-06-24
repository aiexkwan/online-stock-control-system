'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarBody, SidebarLink, SidebarLogout } from '@/components/ui/sidebar';

// Icons
import { 
  PrinterIcon,
  HomeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export function PrintLabelSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Print label specific menu items
  const menuItems = [
    {
      label: 'Home',
      href: '/home',
      icon: <HomeIcon className="w-5 h-5" />
    },
    {
      label: 'Print QC Label',
      href: '/print-label',
      icon: <PrinterIcon className="w-5 h-5" />
    },
    {
      label: 'Print GRN Label',
      href: '/print-grnlabel',
      icon: <DocumentTextIcon className="w-5 h-5" />
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar animate={true}>
        <SidebarBody className="justify-between">
          <div className="flex flex-col gap-2">
            {/* Logo/Title */}
            <div className="mb-8 px-3">
              <h2 className="text-xl font-bold text-white">
                Print Labels
              </h2>
              <p className="text-xs text-white/60 mt-1">Label Generation System</p>
            </div>
            
            {/* Navigation Links */}
            {menuItems.map((item) => (
              <SidebarLink
                key={item.href}
                link={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>
          
          {/* Logout at bottom */}
          <div className="mt-auto">
            <SidebarLogout />
          </div>
        </SidebarBody>
      </Sidebar>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}