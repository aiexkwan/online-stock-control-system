/**
 * Table Card Migration Test Page
 * 驗證從 Widget 遷移到 Card 的 4 個組件
 */

'use client';

import React from 'react';
import { 
  WarehouseTransferCard,
  OrderStateCard,
  UnifiedTableCard,
  StaffWorkloadCard
} from '@/app/(app)/admin/components/dashboard/cards';

export default function TestTableMigrationPage() {
  const testTimeFrame = {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    end: new Date(),
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">
          Table Card Migration Test
        </h1>
        <p className="mb-8 text-gray-600">
          測試從 Widget 遷移到 Card 架構的 4 個表格組件
        </p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* WarehouseTransferCard */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">WarehouseTransferCard</h2>
            <div className="h-96">
              <WarehouseTransferCard
                timeFrame={testTimeFrame}
                showFilters={true}
                showExport={true}
                pageSize={10}
              />
            </div>
          </div>

          {/* OrderStateCard */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">OrderStateCard</h2>
            <div className="h-96">
              <OrderStateCard
                timeFrame={testTimeFrame}
                showFilters={true}
                showExport={true}
                pageSize={10}
              />
            </div>
          </div>

          {/* UnifiedTableCard */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">UnifiedTableCard</h2>
            <div className="h-96">
              <UnifiedTableCard
                config={{
                  title: 'Unified Data Table',
                  dataSource: 'unified_table',
                  description: 'Generic table data display',
                }}
                timeFrame={testTimeFrame}
                showFilters={true}
                showExport={true}
                pageSize={10}
              />
            </div>
          </div>

          {/* StaffWorkloadCard */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">StaffWorkloadCard</h2>
            <div className="h-96">
              <StaffWorkloadCard
                timeFrame={testTimeFrame}
                department="Injection"
                showFilters={true}
                showExport={true}
                pageSize={10}
              />
            </div>
          </div>
        </div>

        {/* 編輯模式測試 */}
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-semibold text-gray-900">
            Edit Mode Test
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-lg font-medium">Edit Mode - WarehouseTransferCard</h3>
              <div className="h-64">
                <WarehouseTransferCard
                  isEditMode={true}
                  timeFrame={testTimeFrame}
                />
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h3 className="mb-4 text-lg font-medium">Edit Mode - StaffWorkloadCard</h3>
              <div className="h-64">
                <StaffWorkloadCard
                  isEditMode={true}
                  timeFrame={testTimeFrame}
                  department="Pipeline"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}