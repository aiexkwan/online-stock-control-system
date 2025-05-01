'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function InventoryHistoryPage() {
  const [loading, setLoading] = useState(false);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">庫存變動歷史</h1>
        <Link 
          href="/reports"
          className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          返回報表
        </Link>
      </div>
      
      {/* 通知區域 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ArrowPathIcon className="h-5 w-5 text-amber-500" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-amber-800">
              功能更新中
            </h3>
            <div className="mt-2 text-sm text-amber-700">
              <p>
                我們正在升級庫存歷史記錄功能，以提供更好的用戶體驗。請稍後再試，謝謝您的耐心等待。
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 篩選選項（靜態展示） */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">產品</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled
            >
              <option value="">全部產品</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">操作類型</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled
            >
              <option value="all">全部操作</option>
              <option value="in">入庫</option>
              <option value="out">出庫</option>
              <option value="transfer">轉移</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">開始日期</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">結束日期</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            disabled
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2 opacity-50 cursor-not-allowed"
          >
            應用篩選
          </button>
          
          <button
            disabled
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors opacity-50 cursor-not-allowed"
          >
            導出 CSV
          </button>
        </div>
      </div>
      
      {/* 空白數據表格（靜態展示） */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  產品
                    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  數量
                    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作類型
                    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      位置
                    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  時間
                    </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作人
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                  {loading ? (
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="mb-2">暫時無法載入庫存歷史記錄</p>
                      <p className="text-gray-400">功能更新中，請稍後再試</p>
                    </div>
                  )}
                      </td>
                    </tr>
                </tbody>
              </table>
            </div>
          </div>
    </div>
  );
} 