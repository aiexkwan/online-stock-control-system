'use client';

import React, { useEffect, useState } from 'react';
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
  ArrowDownCircleIcon
} from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    recentTransactions: 0,
    pendingOrders: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const loadUserData = () => {
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            setUser(userData);
            fetchDashboardData(userData.id);
          } catch (e) {
            console.error('無法解析用戶數據', e);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      }
    };
    
    loadUserData();
  }, []);

  // 獲取儀表板數據
  const fetchDashboardData = async (userId: string) => {
    try {
      // 獲取產品總數
      const { data: productsData, error: productsError } = await supabase
        .from('data_product')
        .select('id', { count: 'exact' });

      // 獲取低庫存產品數量 (庫存數量小於 10)
      const { data: lowStockData, error: lowStockError } = await supabase
        .from('record_inventory')
        .select('id', { count: 'exact' })
        .lt('quantity', 10);

      // 獲取最近交易數量 (過去 7 天)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('record_history')
        .select('id', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString());

      // 獲取待處理訂單數量
      const { data: pendingOrdersData, error: pendingOrdersError } = await supabase
        .from('record_history')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      // 獲取最近活動
      const { data: recentActivityData, error: recentActivityError } = await supabase
        .from('record_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!productsError && !lowStockError && !transactionsError && !pendingOrdersError) {
        setStats({
          totalProducts: productsData?.length || 0,
          lowStockItems: lowStockData?.length || 0,
          recentTransactions: transactionsData?.length || 0,
          pendingOrders: pendingOrdersData?.length || 0
        });
      }

      if (!recentActivityError && recentActivityData) {
        setRecentActivity(recentActivityData);
      }

    } catch (error) {
      console.error('獲取儀表板數據錯誤:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 獲取當前時間和問候語
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 頂部歡迎區 */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{getGreeting()}，{user?.name || '歡迎回來'}</h1>
          <p className="text-gray-600">歡迎使用 Pennine 庫存控制系統</p>
        </div>

        {/* 統計卡片區域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">產品總數</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
              </div>
              <div className="rounded-full bg-blue-50 p-3">
                <TagIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link href="/products" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                查看產品 →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">庫存不足產品</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.lowStockItems}</p>
              </div>
              <div className="rounded-full bg-red-50 p-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link href="/inventory" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                查看庫存 →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">近7天交易</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.recentTransactions}</p>
              </div>
              <div className="rounded-full bg-green-50 p-3">
                <ClockIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link href="/reports" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                查看報表 →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">待處理訂單</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.pendingOrders}</p>
              </div>
              <div className="rounded-full bg-yellow-50 p-3">
                <ArrowPathIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <Link href="/inventory" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                處理訂單 →
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* 最近活動區域 */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">最近活動</h2>
            
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                    <div className={`flex-shrink-0 rounded-full p-2 ${
                      activity.type === 'receive' ? 'bg-green-50' : 
                      activity.type === 'issue' ? 'bg-red-50' : 'bg-blue-50'
                    }`}>
                      {activity.type === 'receive' ? (
                        <ArrowUpCircleIcon className="h-5 w-5 text-green-600" />
                      ) : activity.type === 'issue' ? (
                        <ArrowDownCircleIcon className="h-5 w-5 text-red-600" />
                      ) : (
                        <ArrowPathIcon className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.type === 'receive' ? '入庫' : 
                         activity.type === 'issue' ? '出庫' : '庫存調整'}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {activity.product_id && `產品: ${activity.product_id}`} 
                        {activity.quantity && ` | 數量: ${activity.quantity}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暫無活動記錄
              </div>
            )}
            
            <div className="mt-4 text-right">
              <Link href="/reports/inventory-history" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                查看所有記錄 →
              </Link>
            </div>
          </div>

          {/* 快速操作面板 */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">快速操作</h2>
            <div className="space-y-3">
              <Link href="/inventory/receive" 
                className="block w-full py-3 px-4 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors flex items-center">
                <ArrowUpCircleIcon className="h-5 w-5 mr-2" />
                庫存入庫
              </Link>
              <Link href="/inventory/issue" 
                className="block w-full py-3 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-colors flex items-center">
                <ArrowDownCircleIcon className="h-5 w-5 mr-2" />
                庫存出庫
              </Link>
              <Link href="/products/new" 
                className="block w-full py-3 px-4 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium transition-colors flex items-center">
                <CubeIcon className="h-5 w-5 mr-2" />
                新增產品
              </Link>
              <Link href="/reports" 
                className="block w-full py-3 px-4 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-colors flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                產生報表
              </Link>
            </div>
          </div>
        </div>

        {/* 系統功能入口區 */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">系統功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          <Link href="/products" 
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex items-start space-x-4 border border-gray-100">
            <div className="rounded-full bg-blue-50 p-3">
              <CubeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">產品管理</h2>
              <p className="text-gray-600 text-sm">查看和管理所有產品及庫存</p>
            </div>
          </Link>

          <Link href="/inventory" 
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex items-start space-x-4 border border-gray-100">
            <div className="rounded-full bg-green-50 p-3">
              <ArrowPathIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">庫存操作</h2>
              <p className="text-gray-600 text-sm">入庫、出庫和轉移庫存</p>
            </div>
          </Link>

          <Link href="/reports" 
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex items-start space-x-4 border border-gray-100">
            <div className="rounded-full bg-purple-50 p-3">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">報表</h2>
              <p className="text-gray-600 text-sm">查看庫存統計和趨勢報告</p>
            </div>
          </Link>

          <Link href="/tables" 
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex items-start space-x-4 border border-gray-100">
            <div className="rounded-full bg-yellow-50 p-3">
              <ClipboardDocumentListIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">數據表格</h2>
              <p className="text-gray-600 text-sm">管理系統中的所有數據表</p>
            </div>
          </Link>

          <Link href="/reports/inventory-history" 
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex items-start space-x-4 border border-gray-100">
            <div className="rounded-full bg-red-50 p-3">
              <ArrowTrendingUpIcon className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">操作歷史</h2>
              <p className="text-gray-600 text-sm">查看所有庫存操作歷史記錄</p>
            </div>
          </Link>

          {user?.permissions?.qc && (
            <Link href="/users" 
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex items-start space-x-4 border border-gray-100">
              <div className="rounded-full bg-indigo-50 p-3">
                <UserGroupIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-1">用戶管理</h2>
                <p className="text-gray-600 text-sm">管理系統用戶和權限</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 