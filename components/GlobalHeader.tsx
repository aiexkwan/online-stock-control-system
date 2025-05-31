'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { clearLocalAuthData } from '@/app/utils/auth-sync';
import { useAuth } from '@/app/hooks/useAuth';

// Icons
import { 
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CogIcon,
  DocumentTextIcon,
  PrinterIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface UserData {
  id: string;
  name?: string;
  email: string;
  clockNumber?: string;
  displayName?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Home',
    path: '/home',
    icon: HomeIcon,
    description: 'Back to home page'
  },
  {
    id: 'print-label',
    title: 'Print Labels',
    path: '/print-label',
    icon: PrinterIcon,
    description: 'Print pallet labels'
  },
  {
    id: 'print-grn-label',
    title: 'Print GRN Labels',
    path: '/print-grnlabel',
    icon: PrinterIcon,
    description: 'Print GRN labels'
  },
  {
    id: 'stock-transfer',
    title: 'Stock Transfer',
    path: '/stock-transfer',
    icon: ChartBarIcon,
    description: 'Transfer stock between locations'
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    path: '/admin',
    icon: CogIcon,
    description: 'System administration and management'
  }
];

export default function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { isAuthenticated, userRole } = useAuth();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    if (!userRole || userRole.type === 'admin') {
      return menuItems; // Admin sees all menu items
    }
    
    // Filter menu items based on allowed paths
    return menuItems.filter(item => 
      userRole.allowedPaths.includes(item.path)
    );
  };

  const filteredMenuItems = getFilteredMenuItems();

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) return;

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          // Extract clock number from email
          const extractClockNumber = (email: string): string => {
            const match = email.match(/^(\d+)@/);
            return match ? match[1] : email.split('@')[0];
          };

          // Fetch display name from data_id table
          const { data: userData } = await supabase
            .from('data_id')
            .select('name')
            .eq('email', authUser.email)
            .single();

          const userMetadata = authUser.user_metadata || {};
          const clockNumber = userMetadata.clock_number || extractClockNumber(authUser.email || '');
          const displayName = userData?.name || authUser.email?.split('@')[0] || 'User';

          setUser({
            id: authUser.id,
            name: userMetadata.name || clockNumber,
            email: authUser.email || '',
            clockNumber: clockNumber,
            displayName: displayName
          });
        }
      } catch (error) {
        console.error('[Header] Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [isAuthenticated, supabase]);

  // Handle logout
  const handleLogout = async () => {
    try {
      // 直接使用客戶端 Supabase 登出，不調用 Server Action
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Header] Logout error:', error);
        toast.error('Logout failed. Please try again.');
        return;
      }
      
      // 清除本地認證數據
      clearLocalAuthData();
      
      // 顯示成功訊息
      toast.success('Successfully logged out');
      
      // 重定向到登入頁面
      router.push('/main-login');
    } catch (error: any) {
      console.error('[Header] Logout error:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  // Handle menu item click
  const handleMenuClick = (path: string) => {
    router.push(path);
    setIsMenuOpen(false);
  };

  // Don't render on login pages
  const isLoginPage = pathname?.startsWith('/main-login') || pathname === '/';
  if (isLoginPage || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 shadow-2xl border-b border-blue-500/20 backdrop-blur-xl">
        {/* 頂部光效 */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
        
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Left side - Menu button with hover dropdown */}
            <div className="flex items-center relative group">
              <button
                className="p-4 rounded-2xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300 border border-slate-600/30 hover:border-blue-500/50 backdrop-blur-sm group"
                onMouseEnter={() => setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                <Bars3Icon className="h-7 w-7 group-hover:scale-110 transition-transform duration-300" />
              </button>

              {/* Hover Dropdown Menu */}
              <div 
                className={`absolute top-full left-0 mt-3 bg-slate-800/90 backdrop-blur-xl border border-slate-600/50 rounded-2xl shadow-2xl z-[60] min-w-[320px] transition-all duration-300 ${
                  isMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                }`}
                onMouseEnter={() => setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                {/* 內部光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl"></div>
                
                <div className="relative z-10 p-6">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    Menu
                  </h3>
                  <nav className="space-y-2">
                    {filteredMenuItems.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = pathname === item.path;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMenuClick(item.path)}
                          className={`w-full flex items-center p-4 rounded-xl transition-all duration-300 text-left group/item ${
                            isActive 
                              ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 text-blue-300' 
                              : 'hover:bg-slate-700/50 border border-transparent hover:border-slate-600/30 text-slate-300 hover:text-white'
                          }`}
                        >
                          <div className={`flex-shrink-0 mr-4 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25' 
                              : 'bg-slate-700/50 group-hover/item:bg-slate-600/50 group-hover/item:scale-110'
                          }`}>
                            <IconComponent className={`h-6 w-6 ${
                              isActive ? 'text-white' : 'text-slate-400 group-hover/item:text-white'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-base font-semibold ${
                              isActive ? 'text-blue-200' : 'text-slate-200 group-hover/item:text-white'
                            }`}>
                              {item.title}
                            </p>
                            {item.description && (
                              <p className={`text-sm mt-1 ${
                                isActive ? 'text-blue-300/80' : 'text-slate-400 group-hover/item:text-slate-300'
                              }`}>
                                {item.description}
                              </p>
                            )}
                          </div>
                          {isActive && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>

            {/* Center - Title and greeting */}
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent mb-1">
                {getGreeting()}
              </h1>
              <p className="text-lg text-slate-300 flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                Welcome back, {user?.displayName || user?.name || 'User'}
              </p>
            </div>

            {/* Right side - Logout button */}
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 border border-red-500/50 hover:border-red-400/70 rounded-xl transition-all duration-300 text-white text-base font-medium shadow-lg hover:shadow-red-500/25 hover:scale-105 active:scale-95 backdrop-blur-sm"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-24"></div>
    </>
  );
} 