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
import { supabase } from '../lib/supabase';
import PalletDonutChart from './components/PalletDonutChart';
import PrintHistory from './components/PrintHistory';
import GrnHistory from './components/GrnHistory';
import AcoOrderStatus from './components/AcoOrderStatus';

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

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const isNavigating = useRef(false);

  useEffect(() => {
    // 已移除自動清除 localStorage 的邏輯
    const loadUserData = async () => {
      console.log('首頁: 開始載入用戶數據...');
      if (typeof window !== 'undefined') {
        try {
          const userStr = localStorage.getItem('user');
          console.log('首頁: 從localStorage獲取用戶信息: ', userStr ? '有數據' : '無數據');
          
          if (userStr) {
            const userData = JSON.parse(userStr);
            console.log('首頁: 解析用戶數據成功: ', userData.id);
            setUser(userData);
            setAuthChecked(true);
            await fetchDashboardData(userData.id);
          } else {
            console.log('首頁: 未發現用戶數據，準備重定向到登入頁');
            setAuthChecked(true);
            isNavigating.current = true;
            setTimeout(() => {
              window.open('/login', '_self');
            }, 500);
          }
        } catch (e) {
          console.error('首頁: 無法解析用戶數據', e);
          setAuthChecked(true);
          isNavigating.current = true;
          setTimeout(() => {
            window.open('/login', '_self');
          }, 500);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadUserData();
  }, []);

  // 獲取儀表板數據
  const fetchDashboardData = async (userId: string) => {
    try {
      console.log('首頁: 開始獲取儀表板數據...');
      
      // 獲取產品總數
      const { data: productsData, error: productsError } = await supabase
        .from('data_product')
        .select('id', { count: 'exact' });

      if (productsError) console.error('獲取產品數據錯誤:', productsError);
      else console.log('獲取產品數據成功, 數量:', productsData?.length || 0);

      // 獲取低庫存產品數量 (庫存數量小於 10)
      const { data: lowStockData, error: lowStockError } = await supabase
        .from('record_inventory')
        .select('id', { count: 'exact' })
        .lt('quantity', 10);

      if (lowStockError) console.error('獲取低庫存數據錯誤:', lowStockError);
      else console.log('獲取低庫存數據成功, 數量:', lowStockData?.length || 0);

      // 獲取最近交易數量 (過去 7 天)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('record_history')
        .select('id', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString());

      if (transactionsError) console.error('獲取交易數據錯誤:', transactionsError);
      else console.log('獲取交易數據成功, 數量:', transactionsData?.length || 0);

      // 獲取待處理訂單數量
      const { data: pendingOrdersData, error: pendingOrdersError } = await supabase
        .from('record_history')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      if (pendingOrdersError) console.error('獲取待處理訂單錯誤:', pendingOrdersError);
      else console.log('獲取待處理訂單成功, 數量:', pendingOrdersData?.length || 0);

      // 獲取當天完成的板數 (PalletDonutChart 'done' value)
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

      // 新增：獲取當天由 Production 轉移至 Fold Mill 的 pallets 數量
      const { count: dailyTransferredCount, error: dailyTransferredError } = await supabase
        .from('record_transfer')
        .select('*', { count: 'exact', head: true })
        .eq('f_loc', 'Production')
        .eq('t_loc', 'Fold Mill')
        .gte('tran_date', startOfDay.toISOString()) // Assuming tran_date is the relevant timestamp
        .lte('tran_date', endOfDay.toISOString());

      if (dailyTransferredError) console.error('獲取當天轉移板數錯誤:', dailyTransferredError);
      else console.log('獲取當天轉移板數成功, 數量:', dailyTransferredCount || 0);

      // 獲取最近活動
      const { data: recentActivityData, error: recentActivityError } = await supabase
        .from('record_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentActivityError) console.error('獲取最近活動錯誤:', recentActivityError);
      else console.log('獲取最近活動成功, 數量:', recentActivityData?.length || 0);

      // 更新統計數據
      setStats({
        totalProducts: productsData?.length || 0,
        lowStockItems: lowStockData?.length || 0,
        recentTransactions: transactionsData?.length || 0,
        pendingOrders: pendingOrdersData?.length || 0,
        dailyDonePallets: dailyDoneCount || 0,
        dailyTransferredPallets: dailyTransferredCount || 0,
      });

      // 更新最近活動
      if (recentActivityData) {
        setRecentActivity(recentActivityData);
      }

      console.log('首頁: 儀表板數據獲取完成');
    } catch (error) {
      console.error('首頁: 獲取儀表板數據錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  // 如果正在導航到其他頁面，顯示載入狀態
  if (isNavigating.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">正在載入系統...</p>
          
          {/* 測試連結，以防用戶被卡在此頁面 */}
          <div className="mt-10 flex space-x-4 justify-center">
            <a href="/login" className="text-blue-500 hover:underline">前往登入頁面</a>
            <a href="/test-page" className="text-green-500 hover:underline">頁面測試工具</a>
          </div>
        </div>
      </div>
    );
  }

  // 如果沒有用戶數據但認證檢查已完成，顯示登入提示
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

  // 如果正在加載中，顯示載入狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-3 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // 獲取當前時間和問候語
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Pallet 統計與甜甜圈圖左右排列 */}
      <div className="flex flex-row items-center justify-center gap-8 py-8">
        {/* 左側：原 PalletRatio 位置 - 現在移除或留空 */}
        {/* <div className="flex flex-col gap-4">
          <PalletRatio /> // This line will be removed 
        </div> */}
        
        {/* 右側（或現在是中間）：甜甜圈圖 - 更新 props */}
        <div>
          <PalletDonutChart 
            palletsDone={stats.dailyDonePallets} 
            palletsTransferred={stats.dailyTransferredPallets} 
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 頂部統計卡片區域 */}
        {/* 
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-2">
            <PalletRatio />
          </div>
        </div>
        */}

        {/* Added History Section */}
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

        {/* Recent Activity Section (example from provided snippet, might need adjustment) */}
        {recentActivity.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">GRN Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">TTL Pallet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {recentActivity.map((activity) => (
                    <tr key={activity.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{activity.grn_number}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{activity.code}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{activity.ttl_pallet}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACO Order Status Section -- 新增區塊 */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-4">ACO Order Status</h2>
          <AcoOrderStatus />
        </div>
      </div>
    </div>
  );
} 