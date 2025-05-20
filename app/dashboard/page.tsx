'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { synchronizeAuthState, getLoggedInClockNumber } from '../utils/authClientUtils';

// 定義圖標類型，使其可擴展
interface IconProps {
  className?: string;
}

// 庫存圖標
function InventoryIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

// 生產圖標
function ProductsIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

// 歷史圖標
function HistoryIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// 報表圖標
function ReportsIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

interface CustomUser {
  id: string;
  name?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      try {
        // 同步 Auth 狀態
        await synchronizeAuthState();
        
        // 檢查 Supabase 會話
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          // 用戶已登入
          const clockNumber = getLoggedInClockNumber();
          if (clockNumber) {
            const userData = {
              id: clockNumber,
              name: data.session.user.user_metadata.name || clockNumber
            };
            setUser(userData);
          } else {
            // 無法獲取時鐘號碼
            toast.error('Could not retrieve user information');
            router.push('/login');
          }
        } else {
          // 沒有會話，重定向到登入頁面
          toast.info('Session expired. Please login again.');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        toast.error('Authentication error occurred');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('loggedInUserClockNumber');
        localStorage.removeItem('user');
        localStorage.removeItem('isTemporaryLogin');
        localStorage.removeItem('firstLogin');
      }
      
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  // 顯示載入狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-4">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // 如果未登入，顯示錯誤
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-4">
          <p className="text-red-600 font-medium">Authentication error. Please log in again.</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto p-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <p className="text-gray-600">
              User: <span className="font-medium">{user.name || user.id}</span>
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="text-red-600 hover:bg-red-50 border-red-300"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Inventory Management Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <Link href="/inventory/receive" className="block">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Inventory</h2>
                    <p className="text-gray-600 mt-1">Manage stock and pallets</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <InventoryIcon className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <span className="text-blue-600 font-medium inline-flex items-center">
                    Access
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Products Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <Link href="/products" className="block">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Products</h2>
                    <p className="text-gray-600 mt-1">Manage products database</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <ProductsIcon className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <span className="text-green-600 font-medium inline-flex items-center">
                    Access
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* History Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <Link href="/history" className="block">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">History</h2>
                    <p className="text-gray-600 mt-1">View movement history</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <HistoryIcon className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <span className="text-purple-600 font-medium inline-flex items-center">
                    Access
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Reports Card */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardContent className="p-6">
              <Link href="/reports" className="block">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
                    <p className="text-gray-600 mt-1">Generate system reports</p>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-full">
                    <ReportsIcon className="w-8 h-8 text-amber-600" />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <span className="text-amber-600 font-medium inline-flex items-center">
                    Access
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 