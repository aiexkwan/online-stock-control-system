'use client';

import React from 'react';
import PrintHistory from '@/app/components/PrintHistory';
import GrnHistory from '@/app/components/GrnHistory';

export default function HistoryPage() {
  return (
    <div className="pl-64 pt-16">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6">歷史記錄</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">列印記錄</h2>
            <PrintHistory />
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">收貨記錄</h2>
            <GrnHistory />
          </div>
        </div>
      </div>
    </div>
  );
} 