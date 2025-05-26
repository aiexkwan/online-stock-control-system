'use client';

import React from 'react';
import Link from 'next/link';

export default function AccessPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-600 p-8">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Access Granted
            </h1>
            <p className="text-gray-400 text-lg">
              Welcome to Pennine Industries Stock Control System
            </p>
          </div>

          {/* Access Information */}
          <div className="bg-gray-700 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              System Access Confirmed
            </h2>
            <div className="text-left space-y-3">
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Email domain verified: @pennineindustries.com</span>
              </div>
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Authentication successful</span>
              </div>
              <div className="flex items-center text-gray-300">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Session established securely</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/dashboard/access"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/stock-transfer"
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Stock Transfer
              </Link>
            </div>
            
            <div className="pt-4 border-t border-gray-600">
              <Link
                href="/main-login"
                className="text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                ← Back to Login
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-xs">
          <p>© 2024 Pennine Industries. All rights reserved.</p>
          <p className="mt-1">Secure access portal for authorized personnel</p>
        </div>
      </div>
    </div>
  );
} 