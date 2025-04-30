'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  HomeIcon, 
  CubeIcon, 
  ArrowPathIcon, 
  ChartBarIcon, 
  ClipboardDocumentListIcon, 
  UserGroupIcon, 
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

// 刪除 Cookie 函數
function deleteCookie(name: string) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // 防止重複執行
    if (initialized) return;
    
    // 在客戶端渲染時獲取用戶信息
    if (typeof window !== 'undefined') {
      try {
        const userStr = localStorage.getItem('user');
        const userCookie = document.cookie.split(';').find(c => c.trim().startsWith('user='));
        
        if (userStr && userCookie) {
          const userData = JSON.parse(userStr);
          if (userData?.id) {
            setUser(userData);
          } else {
            throw new Error('無效的用戶數據');
          }
        } else {
          // 如果沒有用戶數據或 cookie，重定向到登入頁面
          if (pathname !== '/login' && pathname !== '/change-password') {
            router.push('/login');
          }
        }
      } catch (e) {
        console.error('無法解析用戶數據', e);
        // 清除無效的數據
        localStorage.removeItem('user');
        deleteCookie('user');
        if (pathname !== '/login' && pathname !== '/change-password') {
          router.push('/login');
        }
      } finally {
        setInitialized(true);
      }
    }
  }, [initialized, pathname, router]);

  // 如果在登入或更改密碼頁面，不顯示導航
  if (pathname === '/login' || pathname === '/change-password') {
    return null;
  }

  // 如果還沒有初始化完成，顯示加載狀態
  if (!initialized) {
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

  // 使用 useCallback 記憶化 handleLogout 函數
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('firstLogin');
      deleteCookie('user');
      router.push('/login');
    } catch (error) {
      console.error('登出錯誤:', error);
    }
  }, [router]);

  const navLinks = [
    { name: '首頁', href: '/dashboard', icon: HomeIcon },
    { name: '產品管理', href: '/products', icon: CubeIcon },
    { name: '庫存操作', href: '/inventory', icon: ArrowPathIcon },
    { name: '報表', href: '/reports', icon: ChartBarIcon },
    { name: '數據表格', href: '/tables', icon: ClipboardDocumentListIcon },
  ];

  // 如果有管理員權限，添加用戶管理頁面
  const displayLinks = user?.permissions?.qc 
    ? [...navLinks, { name: '用戶管理', href: '/users', icon: UserGroupIcon }] 
    : navLinks;

  return (
    <>
      {/* 桌面導航 */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/dashboard" className="font-bold text-xl text-blue-600">Pennine</Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {displayLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                        isActive
                          ? 'border-b-2 border-blue-500 text-gray-900'
                          : 'border-b-2 border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      <link.icon className="h-5 w-5 mr-1" />
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="relative">
                <button
                  type="button"
                  className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <span className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                    <UserCircleIcon className="h-6 w-6 text-gray-400 mr-1" />
                    {user?.name || '用戶'}
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-xs text-gray-500">{user?.department}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                        登出
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span className="sr-only">開啟主菜單</span>
                {mobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 移動端菜單 */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <Link href="/dashboard" className="font-bold text-xl text-blue-600">Pennine</Link>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                onClick={() => setMobileMenuOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="px-2 pt-2 pb-3 space-y-1">
              {displayLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <link.icon className="h-5 w-5 mr-2" />
                    {link.name}
                  </Link>
                );
              })}
              <div className="border-t border-gray-200 pt-4 pb-3">
                <div className="px-2">
                  <div className="text-base font-medium text-gray-800">{user?.name}</div>
                  <div className="text-sm text-gray-500">{user?.department}</div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <div className="flex items-center">
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                      登出
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 