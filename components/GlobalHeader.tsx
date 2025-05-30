'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { clearLocalAuthData } from '@/app/utils/auth-sync';
import { signOut as signOutService } from '@/app/services/supabaseAuth';
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
    title: 'Dashboard',
    path: '/dashboard/access',
    icon: HomeIcon,
    description: 'Main dashboard and overview'
  },
  {
    id: 'admin',
    title: 'Admin Panel',
    path: '/admin',
    icon: CogIcon,
    description: 'System administration and management'
  },
  {
    id: 'print-label',
    title: 'Print Labels',
    path: '/print-label',
    icon: PrinterIcon,
    description: 'Print pallet and product labels'
  },
  {
    id: 'export-report',
    title: 'Export Reports',
    path: '/export-report',
    icon: DocumentTextIcon,
    description: 'Generate and export various reports'
  },
  {
    id: 'history',
    title: 'View History',
    path: '/view-history',
    icon: ClockIcon,
    description: 'View transaction and operation history'
  },
  {
    id: 'inventory',
    title: 'Inventory',
    path: '/inventory',
    icon: ChartBarIcon,
    description: 'Inventory management and tracking'
  }
];

export default function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { isAuthenticated } = useAuth();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

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
      await signOutService(supabase);
      clearLocalAuthData();
      toast.success('Successfully logged out');
      router.push('/main-login');
    } catch (error: any) {
      console.error('[Header] Logout error:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  // Handle menu item click
  const handleMenuClick = (path: string) => {
    router.push(path);
    setIsSidebarOpen(false);
  };

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('global-sidebar');
      const menuButton = document.getElementById('menu-button');
      
      if (sidebar && !sidebar.contains(event.target as Node) && 
          menuButton && !menuButton.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarOpen]);

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
          <div className="flex items-center justify-between h-16">
            {/* Left side - Menu button */}
            <div className="flex items-center">
              <button
                id="menu-button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>

            {/* Center - Title and greeting */}
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {getGreeting()}
              </h1>
              <p className="text-sm text-slate-400">
                Welcome back, {user?.displayName || user?.name || 'User'}
              </p>
            </div>

            {/* Right side - Logout button */}
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 border border-red-500 rounded-lg transition-colors text-white text-sm"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            id="global-sidebar"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 z-50 w-80 h-full bg-white shadow-2xl"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Navigation</h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-6">
              <nav className="space-y-2">
                {menuItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = pathname === item.path;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.path)}
                      className={`w-full flex items-start p-4 rounded-xl transition-all duration-200 text-left hover:bg-gray-50 border border-transparent hover:border-gray-200 hover:shadow-sm transform hover:-translate-y-0.5 ${
                        isActive ? 'bg-blue-50 border-blue-200 shadow-sm' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 mr-4 mt-1 w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isActive ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'
                      }`}>
                        <IconComponent className={`h-5 w-5 ${
                          isActive ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-lg font-semibold mb-1 ${
                          isActive ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {item.title}
                        </p>
                        {item.description && (
                          <p className={`text-sm leading-relaxed ${
                            isActive ? 'text-blue-700' : 'text-gray-600'
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

            {/* Sidebar Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-center">
                <p className="text-sm text-gray-600">Pennine Industries</p>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>
    </>
  );
} 