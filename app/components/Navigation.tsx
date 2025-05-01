'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  DocumentIcon,
  ArrowsRightLeftIcon,
  NoSymbolIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface UserData {
  id: string;
  name: string;
  department: string;
  permissions: {
    qc: boolean;
    receive: boolean;
    void: boolean;
    view: boolean;
    resume: boolean;
    report: boolean;
  };
}

const menuItems = [
  {
    name: '列印標籤',
    icon: DocumentIcon,
    href: '/print-label',
    permission: 'qc'
  },
  {
    name: '庫存轉移',
    icon: ArrowsRightLeftIcon,
    href: '/stock-transfer',
    permission: 'receive'
  },
  {
    name: '作廢托盤',
    icon: NoSymbolIcon,
    href: '/void-pallet',
    permission: 'void'
  },
  {
    name: '查看歷史',
    icon: ClockIcon,
    href: '/history',
    permission: 'view'
  },
  {
    name: '生成報告',
    icon: ChartBarIcon,
    href: '/reports',
    permission: 'report'
  }
];

// Delete cookie function with error handling
function deleteCookie(name: string) {
  try {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  } catch (error) {
    console.error('Error deleting cookie:', error);
  }
}

// Safe localStorage operations
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkUser = () => {
      try {
        const userStr = safeStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } else if (pathname !== '/login' && pathname !== '/change-password') {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        if (pathname !== '/login' && pathname !== '/change-password') {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [pathname, router, mounted]);

  const handleLogout = useCallback(() => {
    try {
      safeStorage.removeItem('user');
      safeStorage.removeItem('firstLogin');
      deleteCookie('user');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [router]);

  // 如果未掛載或在登入/更改密碼頁面，不顯示導航
  if (!mounted || pathname === '/login' || pathname === '/change-password') {
    return null;
  }

  // 如果正在加載，顯示占位導航
  if (isLoading) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex-shrink-0">
              <span className="font-bold text-xl text-blue-600">Pennine</span>
            </div>
            <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 頂部導航欄 */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-20">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="font-bold text-xl text-blue-600">Pennine</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center text-gray-700 hover:text-gray-900"
                >
                  <UserCircleIcon className="h-8 w-8" />
                  <span className="ml-2">{user?.name}</span>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                      登出
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 左側菜單 */}
      <div className="fixed left-0 top-16 bottom-0 w-64 bg-gray-900 text-white z-10">
        <nav className="mt-5 px-2">
          <Link 
            href="/dashboard" 
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              pathname === '/dashboard' 
                ? 'bg-gray-800 text-white' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <HomeIcon className="mr-3 h-6 w-6" />
            儀表板
          </Link>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              功能選單
            </h3>
            <div className="mt-4 space-y-1">
              {menuItems.map((item) => {
                if (!user || !user.permissions) return null;
                if (!user.permissions[item.permission as keyof typeof user.permissions]) return null;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                      pathname === item.href
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="mr-3 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* 主要內容區域的間距 */}
      <div className="pl-64 pt-16">
        <main className="p-6">
          {/* 這裡會渲染頁面內容 */}
        </main>
      </div>
    </>
  );
} 