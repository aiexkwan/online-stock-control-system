'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ClipboardDocumentListIcon, 
  ArrowPathIcon, 
  ChartBarIcon, 
  CubeIcon, 
  UserGroupIcon, 
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  TagIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  PrinterIcon,
  ArrowsRightLeftIcon,
  NoSymbolIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import PalletDonutChart from '../components/PalletDonutChart';
import PrintHistory from '../components/PrintHistory';
import GrnHistory from '../components/GrnHistory';
import AcoOrderStatus from '../components/AcoOrderStatus';
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';

const features = [
  {
    label: 'Print Label',
    icon: PrinterIcon,
    href: '/print-label',
    color: 'bg-blue-500',
  },
  {
    label: 'Stock Transfer',
    icon: ArrowsRightLeftIcon,
    href: '/stock-transfer',
    color: 'bg-green-500',
  },
  {
    label: 'Void Pallet',
    icon: NoSymbolIcon,
    href: '/void-pallet',
    color: 'bg-red-500',
  },
  {
    label: 'View History',
    icon: ClockIcon,
    href: '/history',
    color: 'bg-yellow-500',
  },
  {
    label: 'Ask Database',
    icon: ChatBubbleLeftRightIcon,
    href: '/ask-database',
    color: 'bg-purple-500',
  },
];

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      <p className="mt-2 text-gray-600">Loading session...</p>
    </div>
  </div>
);

export default function HomePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    recentTransactions: 0,
    pendingOrders: 0,
    dailyDonePallets: 0,
    dailyTransferredPallets: 0,
  });
  const isNavigating = useRef(false);

  useEffect(() => {
    console.log('首頁 useEffect: 開始監聽認證狀態變化...');

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('首頁 onAuthStateChange: event:', event, 'session user:', session?.user?.id);
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        console.log('首頁 onAuthStateChange: 用戶已登入:', currentUser.id);
        await fetchDashboardData(currentUser.id);
        setAuthChecked(true);
      } else {
        console.log('首頁 onAuthStateChange: 用戶未登入，準備重定向到 /login');
        if (router) {
            router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
        console.log('首頁 useEffect: 已取消認證狀態監聽');
      }
    };
  }, [supabase, router]);

  const fetchDashboardData = async (userId: string) => {
    try {
      console.log('首頁: 開始獲取儀表板數據...');
      
      const { data: productsData, error: productsError } = await supabase
        .from('data_code')
        .select('*', { count: 'exact', head: true });

      if (productsError) console.error('獲取產品數據錯誤:', productsError);
      else console.log('獲取產品數據成功, 數量:', productsData?.length || 0);

      const lowStockData = [];

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('record_history')
        .select('id', { count: 'exact' })
        .gte('time', sevenDaysAgo.toISOString());

      if (transactionsError) console.error('獲取交易數據錯誤:', transactionsError);
      else console.log('獲取交易數據成功, 數量:', transactionsData?.length || 0);

      const pendingOrdersData = [];

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

      const { count: dailyDoneCount, error: dailyDoneError } = await supabase
        .from('record_palletinfo')
        .select('*', { count: 'exact', head: true })
        .gte('generate_time', startOfDay.toISOString())
        .lte('generate_time', endOfDay.toISOString());

      if (dailyDoneError) console.error('獲取當天完成板數錯誤:', dailyDoneError);
      else console.log('獲取當天完成板數成功, 數量:', dailyDoneCount || 0);

      const { count: dailyTransferredCount, error: dailyTransferredError } = await supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .eq('f_loc', 'Production')
        .eq('t_loc', 'Fold Mill')
        .gte('tran_date', startOfDay.toISOString())
        .lte('tran_date', endOfDay.toISOString());

      if (dailyTransferredError) console.error('獲取當天轉移板數錯誤:', dailyTransferredError);
      else console.log('獲取當天轉移板數成功, 數量:', dailyTransferredCount || 0);

      setStats({
        totalProducts: productsData?.length || 0,
        lowStockItems: 0,
        recentTransactions: transactionsData?.length || 0,
        pendingOrders: pendingOrdersData?.length || 0,
        dailyDonePallets: dailyDoneCount || 0,
        dailyTransferredPallets: dailyTransferredCount || 0,
      });

      console.log('首頁: 儀表板數據獲取完成');
    } catch (error) {
      console.error('首頁: 獲取儀表板數據錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user && authChecked) {
    console.log('首頁: 用戶未登入，顯示登入提示');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-4">請先登入</div>
          <p className="text-gray-600 mb-6">您需要登入後才能訪問儀表板</p>
          <button 
            onClick={() => { window.location.href = '/login'; }} 
            className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            前往登入頁面
          </button>
        </div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex flex-row items-center justify-center gap-8 py-8">
        <div>
          <PalletDonutChart 
            palletsDone={stats.dailyDonePallets} 
            palletsTransferred={stats.dailyTransferredPallets} 
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 lg:col-span-2 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Print History</h2>
            <PrintHistory />
          </div>
          <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">GRN History</h2>
            <GrnHistory />
          </div>
        </div>

        <div className="mt-8 bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">ACO Order Status</h2>
          <AcoOrderStatus />
        </div>
      </div>
    </div>
  );
} 