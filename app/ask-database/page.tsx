'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChatBubbleLeftRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/app/hooks/useAuth';

export default function AskDatabasePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // 載入狀態
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
        <p className="text-lg mt-4">Loading...</p>
      </div>
    );
  }

  // 未認證狀態
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-900 text-white">
        <h1 className="text-3xl font-bold mb-4 text-orange-500">Authentication Required</h1>
        <p className="text-lg mb-6">Please log in to access Ask Database.</p>
        <button 
          onClick={() => router.push('/main-login')}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-[#23263a] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-orange-500">Ask Database</h1>
                  <p className="text-gray-300 mt-1">Query database information</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#23263a] rounded-lg p-8 text-center">
          <ChatBubbleLeftRightIcon className="h-16 w-16 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Ask Database Feature</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            This feature is currently under development. It will allow you to query database information 
            using natural language or structured queries.
          </p>
          
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-orange-500 mb-3">Coming Soon:</h3>
            <ul className="text-left text-gray-300 space-y-2 max-w-md mx-auto">
              <li>• Natural language database queries</li>
              <li>• Real-time data exploration</li>
              <li>• Custom report generation</li>
              <li>• Data visualization tools</li>
              <li>• Export query results</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/admin')}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Back to Admin Panel
            </button>
            <button
              onClick={() => router.push('/export-report')}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Try Export Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 