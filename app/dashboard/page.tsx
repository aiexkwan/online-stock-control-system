'use client';

import React from 'react';
import { DocumentIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import PrintHistory from '../components/PrintHistory';
import GrnHistory from '../components/GrnHistory';

export default function DashboardPage() {
  return (
    <div>
      <div className="pt-6 pr-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="bg-blue-500 bg-opacity-20 rounded-full p-3">
                <DocumentIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-400">Pallets Done</h2>
                <p className="text-2xl font-semibold text-white">3256</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="bg-purple-500 bg-opacity-20 rounded-full p-3">
                <ArrowsRightLeftIcon className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-400">Pallets Transferred</h2>
                <p className="text-2xl font-semibold text-white">123</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-lg p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4">Print History</h2>
            <PrintHistory />
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">GRN History</h2>
            <GrnHistory />
          </div>
        </div>
      </div>
    </div>
  );
} 