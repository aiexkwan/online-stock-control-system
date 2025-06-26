'use client';

import React from 'react';
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';
import AuthChecker from './AuthChecker';
import GlobalHeader from '@/components/GlobalHeader';
import { UniversalBackground } from './UniversalBackground';
import { GlobalReportDialogs } from '@/app/components/reports/GlobalReportDialogs';
import { GlobalAnalyticsDialogs } from '@/app/components/analytics/GlobalAnalyticsDialogs';
import { Sidebar, SidebarBody, SidebarLink, SidebarLogout, SidebarHeader } from '@/components/ui/sidebar';
import { useAuth } from '@/app/hooks/useAuth';
import { DynamicActionBar } from '@/components/ui/dynamic-action-bar';
import { AskDatabaseModal } from '@/components/ui/ask-database-modal';
import { UniversalProvider } from '@/components/layout/universal';

// Icons
import { 
  PrinterIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, userRole } = useAuth();
  
  // Don't show sidebar on login pages and access page only
  const isLoginPage = pathname?.startsWith('/main-login') || pathname === '/';
  const isAccessPage = pathname === '/access';
  // Disable sidebar for now - using dynamic navigation instead
  const showSidebar = false; // was: isAuthenticated && !isLoginPage && !isAccessPage;

  // 根據路徑動態決定主題
  const getThemeFromPath = (path: string): string => {
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/stock-transfer')) return 'warehouse';
    if (path.startsWith('/order-loading')) return 'production';
    if (path.startsWith('/print-label') || path.startsWith('/print-grnlabel')) return 'qc';
    if (path.startsWith('/void-pallet')) return 'production';
    return 'neutral';
  };

  const currentTheme = getThemeFromPath(pathname || '');

  // Menu items
  const menuItems = [
    {
      label: 'Print Labels',
      href: '/print-label',
      icon: <PrinterIcon className="w-5 h-5" />
    },
    {
      label: 'Stock Transfer',
      href: '/stock-transfer',
      icon: <ChartBarIcon className="w-5 h-5" />
    },
    {
      label: 'Order Loading',
      href: '/order-loading',
      icon: <ChartBarIcon className="w-5 h-5" />
    },
    {
      label: 'Stock Take',
      href: '/admin/stock-count',
      icon: <ClipboardDocumentCheckIcon className="w-5 h-5" />
    },
    {
      label: 'Admin Dashboard',
      href: '/admin',
      icon: <CogIcon className="w-5 h-5" />
    }
  ];

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    if (!userRole) {
      return []; // No menu items if not authenticated
    }
    
    // User 角色：導航被限制，動態操作欄只顯示基本資訊
    if (userRole.navigationRestricted) {
      return []; // User 角色不顯示導航菜單項
    }
    
    // Admin 角色：顯示所有菜單項
    return menuItems;
  };

  const filteredMenuItems = getFilteredMenuItems();

  return (
    <UniversalProvider 
      defaultTheme={currentTheme}
      animationsEnabled={true}
      debugMode={process.env.NODE_ENV === 'development'}
    >
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            background: 'rgb(30, 41, 59)',
            border: '1px solid rgb(51, 65, 85)',
            color: 'rgb(248, 250, 252)',
          },
        }}
      />
      
      {/* Authentication checker */}
      <AuthChecker>
        {/* Global header - now empty */}
        <GlobalHeader />
        
        {/* Main layout */}
        {showSidebar ? (
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar animate={true}>
              <SidebarBody className="justify-between">
                <div className="flex flex-col gap-2">
                  {/* Logo/Title - Only show when expanded */}
                  <SidebarHeader />
                  
                  {/* Navigation Links */}
                  {filteredMenuItems.map((item) => (
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
              <UniversalBackground className="text-white min-h-full">
                {children}
              </UniversalBackground>
            </div>
          </div>
        ) : (
          /* For pages without sidebar, render content normally */
          <UniversalBackground className="text-white">
            {children}
          </UniversalBackground>
        )}
        
        {/* Global report dialogs */}
        <GlobalReportDialogs />
        
        {/* Global analytics dialogs */}
        <GlobalAnalyticsDialogs />
        
        {/* Dynamic Navigation Bar - Show only when authenticated and not on login/access pages */}
        {isAuthenticated && !isLoginPage && !isAccessPage && (
          <DynamicActionBar />
        )}
        
        {/* Ask Database Modal */}
        <AskDatabaseModal />
      </AuthChecker>
    </UniversalProvider>
  );
} 
