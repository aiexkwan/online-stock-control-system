'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';
import { getLoggedInClockNumber, storeClockNumberLocally, clearLocalClockNumber } from '../utils/authClientUtils';
import PrintHistory from '../components/PrintHistory';
import GrnHistory from '../components/GrnHistory';
import PalletDonutChart from '../components/PalletDonutChart';
import { signOut as signOutService } from '../services/supabaseAuth';

// Define icon types for extensibility
interface IconProps {
  className?: string;
}

// Inventory icon
function InventoryIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

// Products icon
function ProductsIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

// History icon
function HistoryIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// Reports icon
function ReportsIcon({ className = "w-6 h-6" }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

// 修復類型定義
type CountResponse = { count: number }[];
type InventoryItem = {
  product_code: string;
  loc_fold: number;
  loc_awaiting: number;
  loc_injection: number;
};

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [user, setUser] = useState<{id: string, name?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const [stats, setStats] = useState({
    dailyDonePallets: 0,
    dailyTransferredPallets: 0,
    lowStockItems: [] as InventoryItem[],
    pendingOrders: [] as any[],
  });
  
  // 獲取歡迎訊息根據時間
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };
  
  const greeting = getGreeting();
  const userName = user?.name || user?.id;

  // Helper function to extract clock number from email, moved outside useEffect for broader use if needed
  const emailToClockNumber = (email: string): string | null => {
    if (!email) return null;
    const match = email.match(/^(\d+)@/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    let isSubscribed = true;
    let watchdogId: NodeJS.Timeout | undefined;

    const fetchDashboardData = async () => {
      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        // Fetch new palletsDone count
        const { count: newPalletsDoneCount, error: newPalletsDoneError } = await supabase
          .from('record_palletinfo')
          .select('*', { count: 'exact', head: true })
          .gte('generate_time', startOfDay)
          .lte('generate_time', endOfDay)
          .in('plt_loc', ['Fold Mill', 'Await', 'Voided (Partial)']);
        if (newPalletsDoneError) {
          console.error('[Dashboard] Error fetching newPalletsDoneCount:', newPalletsDoneError);
          throw new Error(`Failed to fetch 'palletsDone' count: ${newPalletsDoneError.message}`);
        }

        // Fetch new palletsTransferred count
        const { count: newPalletsTransferredCount, error: newPalletsTransferredError } = await supabase
          .from('record_palletinfo')
          .select('*', { count: 'exact', head: true })
          .gte('generate_time', startOfDay)
          .lte('generate_time', endOfDay)
          .eq('plt_loc', 'Fold Mill');
        if (newPalletsTransferredError) {
          console.error('[Dashboard] Error fetching newPalletsTransferredCount:', newPalletsTransferredError);
          throw new Error(`Failed to fetch 'palletsTransferred' count: ${newPalletsTransferredError.message}`);
        }
        
        if (isSubscribed) {
          setStats({
            dailyDonePallets: newPalletsDoneCount || 0,
            dailyTransferredPallets: newPalletsTransferredCount || 0,
            lowStockItems: [],
            pendingOrders: [],
          });
        }
      } catch (error: any) {
        console.error('[Dashboard] Error fetching dashboard data:', error);
        if (isSubscribed) {
          toast.error(`Could not load some dashboard data: ${error.message}`);
        }
      }
    };

    const initAuth = async () => {
      if (!isSubscribed) return;
      
      try {
        setLoading(true);
        console.log('[Dashboard] Starting initialization');

        // 檢查本地存儲
        const storedClockNumber = getLoggedInClockNumber();
        // Check stored clock number for session validation

        // 檢查 session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error('[Dashboard] Session check error or no session:', sessionError);
          if (isSubscribed) {
            clearLocalClockNumber();
            router.push('/main-login?error=session_expired');
          }
          return;
        }

        // 檢查認證狀態
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('[Dashboard] User check error or no user:', userError);
          if (isSubscribed) {
            clearLocalClockNumber();
            router.push('/main-login?error=auth_failed');
          }
          return;
        }

        // 載入用戶資料
        const metadata = user.user_metadata || {};
        const clockNumber = metadata.clock_number || emailToClockNumber(user.email || '');
        
        if (!clockNumber) {
          console.error('[Dashboard] No clock number found');
          if (isSubscribed) {
            clearLocalClockNumber();
            router.push('/main-login?error=no_clock_number');
          }
          return;
        }

        if (isSubscribed) {
          setUser({
            id: clockNumber,
            name: metadata.name || clockNumber
          });
        }

        // 載入儀表板資料
        await fetchDashboardData();

        if (isSubscribed) {
          setInitializationComplete(true);
          setLoading(false);
        }

      } catch (error: any) {
        console.error('[Dashboard] Error during initialization:', error);
        if (isSubscribed) {
          setErrorMessage('Failed to initialize dashboard');
          setLoading(false);
        }
      }
    };

    // 設置 watchdog timer
    watchdogId = setTimeout(() => {
      if (isSubscribed && !initializationComplete) {
        console.warn('[Dashboard] Initialization timeout');
        setLoading(false);
        setErrorMessage('Dashboard initialization timed out');
      }
    }, 10000);

    // 執行初始化
    initAuth();

    // 監聽 auth 狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Dashboard] Auth state changed:', event);
      if (!isSubscribed) return;

      if (event === 'SIGNED_OUT') {
        clearLocalClockNumber();
        router.push('/main-login');
      } else if (event === 'SIGNED_IN' && session) {
        initAuth();
      }
    });

    // 清理函數
    return () => {
      isSubscribed = false;
      if (watchdogId) {
        clearTimeout(watchdogId);
      }
      subscription.unsubscribe();
    };

  }, [router, supabase, pathname]);

  const handleLogout = async () => {
    try {
      await signOutService(supabase); 
      clearLocalClockNumber(); 
      localStorage.removeItem('user'); 
      localStorage.removeItem('isTemporaryLogin');
      // 'firstLogin' is also cleared by clearLocalClockNumber if it was set
      
      toast.success('Logged out successfully');
      router.push('/main-login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(`Logout error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181c2f]">
        <div className="text-center p-4">
          <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !loading) { 
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#181c2f]">
        <div className="text-center p-4 max-w-md">
          <div className="bg-red-600 text-white p-4 rounded-lg">
            <p className="font-medium text-lg">{errorMessage || 'Session invalid, expired, or user data could not be loaded. Please login.'}</p>
            <button
              onClick={() => router.push('/main-login')}
              className="mt-4 px-4 py-2 bg-white text-red-600 rounded-md font-medium hover:bg-gray-100 transition"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181c2f] text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white"></h1>
          {userName && <span className="text-lg">{greeting}, {userName}</span>}
        </header>
        
        {/* PalletDonutChart - Centered */}
        <div className="flex flex-row items-center justify-center gap-8 py-4 mb-6">
          <div>
            <PalletDonutChart 
              palletsDone={stats.dailyDonePallets} // Represents Pallets Generated
              palletsTransferred={stats.dailyTransferredPallets} 
            />
          </div>
        </div>

        {/* Stats Cards Removed as per user request */}
        {/* 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#252d3d] p-6 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pallets Generated</p>
                <p className="text-white text-2xl font-bold">{stats.dailyDonePallets}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#252d3d] p-6 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pallets Transferred</p>
                <p className="text-white text-2xl font-bold">{stats.dailyTransferredPallets}</p>
              </div>
            </div>
          </div>
        </div>
        */}

        {/* History Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Print History */}
          <div className="bg-[#252d3d] p-6 rounded-lg">
            <h3 className="text-white text-lg font-semibold mb-4">Print History</h3>
            {/* @ts-ignore - PrintHistory組件接受limit屬性 */}
            <PrintHistory limit={5} />
          </div>

          {/* GRN History */}
          <div className="bg-[#252d3d] p-6 rounded-lg">
            <h3 className="text-white text-lg font-semibold mb-4">GRN History</h3>
            {/* @ts-ignore - GrnHistory組件接受limit屬性 */}
            <GrnHistory limit={5} />
          </div>
        </div>
      </div>
    </div>
  );
} 