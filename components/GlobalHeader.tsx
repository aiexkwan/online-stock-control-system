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
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#23263a] shadow-lg border-b border-gray-700">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24">
            {/* Left side - Menu button with hover dropdown */}
            <div className="flex items-center relative group">
              <button
                className="p-3 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                onMouseEnter={() => setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                <Bars3Icon className="h-7 w-7" />
              </button>

              {/* Hover Dropdown Menu */}
              <div 
                className={`absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[300px] transition-all duration-200 ${
                  isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onMouseEnter={() => setIsMenuOpen(true)}
                onMouseLeave={() => setIsMenuOpen(false)}
              >
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Navigation</h3>
                  <nav className="space-y-1">
                    {filteredMenuItems.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = pathname === item.path;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMenuClick(item.path)}
                          className={`w-full flex items-center p-3 rounded-lg transition-colors text-left hover:bg-gray-50 ${
                            isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <div className={`flex-shrink-0 mr-3 w-9 h-9 rounded-lg flex items-center justify-center ${
                            isActive ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <IconComponent className={`h-5 w-5 ${
                              isActive ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-base font-medium ${
                              isActive ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {item.title}
                            </p>
                            {item.description && (
                              <p className={`text-sm ${
                                isActive ? 'text-blue-600' : 'text-gray-500'
                              }`}>
                                {item.description}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>

            {/* Center - Title and greeting */}
            <div className="flex-1 text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {getGreeting()}
              </h1>
              <p className="text-base text-slate-400">
                Welcome back, {user?.displayName || user?.name || 'User'}
              </p>
            </div>

            {/* Right side - Logout button */}
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 border border-red-500 rounded-lg transition-colors text-white text-base"
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