'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLatestPalletInfo, type PalletInfo } from '../services/palletInfo';
import PrintHistory from '../components/PrintHistory';
import GrnHistory from '../components/GrnHistory';

export default function DashboardPage() {
  const router = useRouter();
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
    { grn: 'GRN#1005', code: 'CODE-E5', count: 6 }
  ]);
  const [grnLoading, setGrnLoading] = useState(false);
  const [grnError, setGrnError] = useState<string>();

  useEffect(() => {
    const checkAuth = () => {
      try {
        let userInfo = null;
        const userString = localStorage.getItem('user');
        
        if (userString) {
          userInfo = JSON.parse(userString);
          setUser(userInfo);
          setLoading(false);
        } else {
          router.push('/login');
        }
      } catch (e) {
        console.error('Dashboard: error parsing user data', e);
        setErrorMessage('Error parsing user data');
        setLoading(false);
      }
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

    checkAuth();
    fetchPalletInfo();
  }, [router]);

  // 顯示加載狀態
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e2533]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // 顯示錯誤信息
  if (errorMessage || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e2533]">
        <div className="max-w-md w-full bg-[#252d3d] rounded-lg shadow-xl p-8">
          <div className="w-16 h-16 bg-red-500/20 mx-auto rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-bold text-center text-white">Unable to load dashboard</h2>
          <p className="mt-2 text-center text-gray-400">{errorMessage || 'Please log in to continue'}</p>
          
          <div className="mt-6">
            <button 
              onClick={() => router.push('/login')}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
            >
              Return to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#1e2533]">
      {/* Sidebar */}
      <div className="w-64 bg-[#252d3d] p-6">
        <nav className="space-y-2">
          {[
            { name: 'Label Printing', icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z' },
            { name: 'Stock Transfer', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
            { name: 'Void Pallet', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
            { name: 'View History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { name: 'User Manual', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            { name: 'Ask LLM', icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            { name: 'Access Right Update', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
            { name: 'Product Update', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
            { name: 'Report Generator', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { name: 'Logout', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' }
          ].map((item) => (
            <div 
              key={item.name}
              onClick={() => {
                if (item.name === 'Logout') {
                  localStorage.removeItem('user');
                  router.push('/login');
                }
              }}
              className={`flex items-center space-x-3 px-4 py-2.5 text-gray-300 hover:bg-[#2a3446] rounded-lg cursor-pointer transition-colors duration-200`}
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={item.icon}
                />
              </svg>
              <span className="font-medium">{item.name}</span>
            </div>
          ))}
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
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-[#252d3d] p-6 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pallet Done</p>
                <p className="text-white text-2xl font-bold">3,256</p>
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
                <p className="text-gray-400 text-sm">Pallet Transfered</p>
                <p className="text-white text-2xl font-bold">123</p>
              </div>
            </div>
          </div>
        </div>

        {/* History Sections */}
        <div className="grid grid-cols-2 gap-6">
          {/* Print History */}
          <div className="bg-[#252d3d] p-6 rounded-lg">
            <h3 className="text-white text-lg font-semibold mb-4">Print History</h3>
            <PrintHistory
              data={palletData}
              isLoading={palletLoading}
              error={palletError}
            />
          </div>

          {/* GRN History */}
          <div className="bg-[#252d3d] p-6 rounded-lg">
            <h3 className="text-white text-lg font-semibold mb-4">GRN History</h3>
            <GrnHistory
              data={grnData}
              isLoading={grnLoading}
              error={grnError}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 