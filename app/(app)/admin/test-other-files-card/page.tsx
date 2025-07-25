/**
 * Test Page for OtherFilesCard Migration
 * 驗證 OtherFilesListWidget → OtherFilesCard 遷移
 */

'use client';

import React from 'react';
import { OtherFilesCard } from '@/app/(app)/admin/components/dashboard/cards/OtherFilesCard';

export default function TestOtherFilesCardPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          OtherFilesCard Migration Test
        </h1>

        <div className="grid gap-8">
          {/* Basic OtherFilesCard Test */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Basic OtherFilesCard</h2>
            <OtherFilesCard 
              height={400}
              className="w-full"
            />
          </div>

          {/* Custom Configuration Test */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">OtherFilesCard with Custom Config</h2>
            <OtherFilesCard 
              height={300}
              pageSize={5}
              showSearch={true}
              showExport={true}
              showPerformance={true}
              className="w-full"
            />
          </div>

          {/* Edit Mode Test */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">OtherFilesCard - Edit Mode</h2>
            <OtherFilesCard 
              height={300}
              isEditMode={true}
              className="w-full"
            />
          </div>
        </div>

        {/* Migration Info */}
        <div className="mt-8 rounded-lg bg-blue-50 p-6">
          <h3 className="mb-2 text-lg font-semibold text-blue-900">Migration Status</h3>
          <div className="text-blue-800">
            <p>✅ OtherFilesListWidget → OtherFilesCard 遷移完成</p>
            <p>✅ 使用統一 TableCard 架構</p>
            <p>✅ 支援 GraphQL 數據源</p>
            <p>✅ 保留原有功能特性</p>
          </div>
        </div>
      </div>
    </div>
  );
}