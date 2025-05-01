'use client';

import React, { useEffect, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { getLatestPalletInfo, type PalletInfo } from '../services/palletInfo';
import PrintHistory from '../components/PrintHistory';
import GrnHistory from '../components/GrnHistory';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [palletData, setPalletData] = useState<PalletInfo[]>([]);
  const [palletLoading, setPalletLoading] = useState(true);
  const [palletError, setPalletError] = useState<string>();
  const [grnData, setGrnData] = useState([
    { grn: 'GRN#1001', code: 'CODE-A1', count: 5 },
    { grn: 'GRN#1002', code: 'CODE-B2', count: 3 },
    { grn: 'GRN#1003', code: 'CODE-C3', count: 7 },
    { grn: 'GRN#1004', code: 'CODE-D4', count: 4 },
    { grn: 'GRN#1005', code: 'CODE-E5', count: 6 },
    { grn: 'GRN#1006', code: 'CODE-F6', count: 2 },
    { grn: 'GRN#1007', code: 'CODE-G7', count: 8 },
    { grn: 'GRN#1008', code: 'CODE-H8', count: 3 },
    { grn: 'GRN#1009', code: 'CODE-I9', count: 5 },
    { grn: 'GRN#1010', code: 'CODE-J10', count: 4 }
  ]);
  const [grnLoading, setGrnLoading] = useState(false);
  const [grnError, setGrnError] = useState<string>();
  const [stats, setStats] = useState({
    totalItems: 0,
    recentActivities: 0,
    lowStockAlerts: 0,
  });

  // Chart data
  const chartData = {
    labels: ['Aug 2018', 'Sep 2018', 'Oct 2018', 'Nov 2018', 'Dec 2018', 'Jan 2019', 'Feb 2019', 'Mar 2019', 'Apr 2019', 'May 2019'],
    datasets: [
      {
        label: 'Revenue',
        data: [1800, 2200, 1900, 2400, 2100, 2300, 2500, 2300, 2400, 2100],
        borderColor: '#FF6B6B',
        tension: 0.4,
        fill: false
      },
      {
        label: 'Products',
        data: [2000, 1800, 2100, 2000, 2200, 2100, 2300, 2400, 2200, 2300],
        borderColor: '#4ECDC4',
        tension: 0.4,
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#fff'
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff'
        }
      }
    }
  };

  useEffect(() => {
    // 嘗試從多個存儲位置獲取用戶信息
    const checkAuth = () => {
      try {
        console.log('Dashboard page: attempting to retrieve user info');
        
        // 首先嘗試從 localStorage 獲取
        let userInfo = null;
        let userString = localStorage.getItem('user');
        
        if (userString) {
          console.log('Dashboard: found user data in localStorage');
          userInfo = JSON.parse(userString);
        } else {
          // 如果 localStorage 中沒有，嘗試從 sessionStorage 獲取
          userString = sessionStorage.getItem('user');
          if (userString) {
            console.log('Dashboard: found user data in sessionStorage');
            userInfo = JSON.parse(userString);
          } else {
            // 嘗試從 cookie 獲取
            const cookies = document.cookie.split('; ');
            const userCookie = cookies.find(cookie => cookie.startsWith('user='));
            if (userCookie) {
              userString = userCookie.split('=')[1];
              console.log('Dashboard: found user data in cookies');
              userInfo = JSON.parse(decodeURIComponent(userString));
            }
          }
        }
        
        if (userInfo) {
          setUser(userInfo);
          setLoading(false);
          console.log('Dashboard: successfully set user data', userInfo);
        } else {
          setErrorMessage('Unable to find user data, please log in');
          setLoading(false);
          console.log('Dashboard: user data not found');
        }
      } catch (e) {
        console.error('Dashboard: error parsing user data', e);
        setErrorMessage('Error parsing user data');
        setLoading(false);
      }
    };

    const getStats = () => {
      // 簡單統計數據，暫時使用假數據
      setStats({
        totalItems: 125,
        recentActivities: 8,
        lowStockAlerts: 3,
      });
    };

    const fetchPalletInfo = async () => {
      try {
        setPalletLoading(true);
        const data = await getLatestPalletInfo();
        setPalletData(data);
      } catch (error) {
        console.error('Error fetching pallet info:', error);
        setPalletError('Failed to load print history');
      } finally {
        setPalletLoading(false);
      }
    };

    // 立即執行這些函數
    checkAuth();
    getStats();
    fetchPalletInfo();
    
    // 為防止任何問題，設置一個標記表示頁面已加載
    sessionStorage.setItem('dashboardLoaded', 'true');
  }, []);

  // 顯示加載狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // 顯示錯誤信息
  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="w-16 h-16 bg-red-100 mx-auto rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-center text-gray-800">Unable to load dashboard</h2>
          <p className="mt-2 text-center text-gray-600">{errorMessage}</p>
          
          <div className="mt-6 grid grid-cols-2 gap-3">
            <a 
              href="/login" 
              className="text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Return to login
            </a>
            <a 
              href="/direct-dashboard" 
              className="text-center py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded"
            >
              Go to direct dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#1e2533]">
      {/* Sidebar */}
      <div className="w-64 bg-[#252d3d] p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg" />
          <span className="text-white text-xl font-semibold">Dashboard</span>
        </div>
        
        <nav className="space-y-2">
          <div className="flex items-center space-x-3 px-4 py-2 text-gray-300 bg-[#2a3446] rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Home</span>
          </div>
          {/* Add more menu items here */}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search here..."
              className="w-96 px-4 py-2 bg-[#252d3d] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute right-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-white font-medium">{user?.name || 'Guest'}</span>
              <button className="text-gray-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-[#252d3d] p-6 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-white text-2xl font-bold">$45,075</p>
              </div>
            </div>
          </div>

          <div className="bg-[#252d3d] p-6 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Products Sold</p>
                <p className="text-white text-2xl font-bold">98,756</p>
              </div>
            </div>
          </div>

          <div className="bg-[#252d3d] p-6 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <p className="text-white text-2xl font-bold">$20,575</p>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="bg-[#252d3d] p-6 rounded-lg mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-white text-lg font-semibold">Growth Chart</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>From: August 2018</span>
              <span>To: May 2019</span>
            </div>
          </div>
          <div className="h-80">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Transactions */}
        <div className="grid grid-cols-3 gap-6">
          {/* Balance Card */}
          <div className="bg-[#252d3d] p-6 rounded-lg">
            <h3 className="text-white text-lg font-semibold mb-4">Balance</h3>
            <div className="relative w-48 h-48 mx-auto mb-6">
              {/* Add donut chart here */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-white text-2xl font-bold">$93,145</p>
                  <p className="text-gray-400 text-sm">Current Balance</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src="/visa.png" alt="Visa" className="w-8 h-6" />
                  <span className="text-gray-400">**** 5008</span>
                </div>
                <span className="text-white">$ 454,540</span>
              </div>
              {/* Add more cards here */}
            </div>
          </div>

          {/* Transactions List */}
          <div className="col-span-2 bg-[#252d3d] p-6 rounded-lg">
            <h3 className="text-white text-lg font-semibold mb-4">Transactions</h3>
            <div className="space-y-4">
              {grnData.map((transaction) => (
                <div key={transaction.grn} className="flex items-center justify-between p-4 hover:bg-[#2a3446] rounded-lg transition-colors">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-white">{transaction.grn}</p>
                      <p className="text-gray-400 text-sm">Amount: ${transaction.count}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Completed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 