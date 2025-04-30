'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ClipboardDocumentListIcon, 
  ArrowPathIcon, 
  ChartBarIcon, 
  CubeIcon, 
  UserGroupIcon, 
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 在客戶端渲染時獲取用戶信息
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (e) {
          console.error('無法解析用戶數據', e);
        }
      }
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">你好，{user?.name || '歡迎回來'}</h1>
          <p className="text-gray-600">歡迎使用 Pennine 庫存控制系統</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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

          <Link href="/history" 
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