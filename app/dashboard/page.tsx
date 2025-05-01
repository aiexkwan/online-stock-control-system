'use client';

import React, { useEffect, useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { getLatestPalletInfo, type PalletInfo } from '../services/palletInfo';
import PrintHistory from '../components/PrintHistory';
import GrnHistory from '../components/GrnHistory';

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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-64 bg-white p-6 shadow-md"
      >
        <nav className="space-y-4">
          {[
            'Label Printing',
            'Stock Transfer',
            'Void Pallet',
            'View History',
            'User Manual',
            'Ask LLM',
            'Access Right Update',
            'Product Update',
            'Report Generator',
            'Logout'
          ].map((item, index) => (
            <motion.a
              key={item}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              href="#"
              className="block text-gray-700 hover:text-purple-600 transition-colors"
            >
              {item}
            </motion.a>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Top Bar */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="relative w-1/3">
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-gray-700"
            >
              {user?.name}
            </motion.span>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
        >
          <motion.div 
            variants={fadeInUp}
            className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <p className="text-sm text-gray-500">Pallet Done</p>
            <h2 className="text-2xl font-bold">3,256</h2>
          </motion.div>
          <motion.div 
            variants={fadeInUp}
            className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <p className="text-sm text-gray-500">Pallet Been Transfer</p>
            <h2 className="text-2xl font-bold">123</h2>
          </motion.div>
        </motion.div>

        {/* Main Content Section */}
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-6"
        >
          {/* Print History Section */}
          <motion.div 
            variants={fadeInUp}
            className="col-span-1"
          >
            <PrintHistory
              data={palletData}
              isLoading={palletLoading}
              error={palletError}
            />
          </motion.div>

          {/* GRN History */}
          <motion.div 
            variants={fadeInUp}
            className="col-span-1"
          >
            <GrnHistory
              data={grnData}
              isLoading={grnLoading}
              error={grnError}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 