'use client';

import React from 'react';
import { StatsCard } from '../components/dashboard/cards/StatsCard';
import { StatsType } from '@/types/generated/graphql';

export default function TestStatsCardPage() {
  return (
    <div className='container mx-auto space-y-8 p-6'>
      <div className='text-center'>
        <h1 className='mb-2 text-3xl font-bold text-gray-900'>StatsCard Test Page</h1>
        <p className='text-gray-600'>
          Testing the StatsCard component with different configurations
        </p>
      </div>

      {/* Test 1: Basic Stats (Single Column) */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-gray-800'>
          Test 1: Basic Statistics (Single Column)
        </h2>
        <div className='min-h-[300px] w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
          <StatsCard
            statTypes={[
              StatsType.InventoryLevel,
              StatsType.PalletCount,
              StatsType.ActiveUsers,
              StatsType.TransferCount,
            ]}
            columns={1}
            showTrend={true}
            showComparison={true}
            dateRange={{
              start: new Date(new Date().setDate(new Date().getDate() - 7)),
              end: new Date(),
            }}
          />
        </div>
      </div>

      {/* Test 2: Grid Layout (2 Columns) */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-gray-800'>Test 2: Grid Layout (2 Columns)</h2>
        <div className='min-h-[300px] w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
          <StatsCard
            statTypes={[
              StatsType.InventoryLevel,
              StatsType.PalletCount,
              StatsType.ActiveUsers,
              StatsType.TransferCount,
              StatsType.PendingTasks,
              StatsType.CompletionRate,
            ]}
            columns={2}
            showTrend={true}
            showComparison={false}
          />
        </div>
      </div>

      {/* Test 3: Compact Mode (4 Columns) */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-gray-800'>Test 3: Compact Mode (4 Columns)</h2>
        <div className='min-h-[300px] w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
          <StatsCard
            statTypes={[
              StatsType.InventoryLevel,
              StatsType.PalletCount,
              StatsType.ActiveUsers,
              StatsType.TransferCount,
            ]}
            columns={4}
            showTrend={false}
            showComparison={false}
          />
        </div>
      </div>

      {/* Test 4: Historical Data Source (30 days) */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-gray-800'>
          Test 4: Historical Data Source (30 days)
        </h2>
        <div className='min-h-[300px] w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
          <StatsCard
            statTypes={[
              StatsType.InventoryLevel,
              StatsType.PalletCount,
              StatsType.TransferCount,
              StatsType.CompletionRate,
            ]}
            columns={2}
            dateRange={{
              start: new Date(new Date().setDate(new Date().getDate() - 30)),
              end: new Date(),
            }}
            showTrend={true}
            showComparison={true}
          />
        </div>
      </div>

      {/* Test 5: Performance & Quality Metrics */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-gray-800'>
          Test 5: Performance & Quality Metrics
        </h2>
        <div className='min-h-[300px] w-full rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
          <StatsCard
            statTypes={[
              StatsType.QualityScore,
              StatsType.EfficiencyRate,
              StatsType.ErrorRate,
              StatsType.StaffWorkload,
            ]}
            columns={2}
            showTrend={true}
            showComparison={true}
          />
        </div>
      </div>

      {/* Debug Information */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-gray-800'>Debug Information</h2>
        <div className='rounded-lg border border-gray-200 bg-gray-50 p-6'>
          <div className='space-y-2 text-sm'>
            <div>
              <strong>Available Stat Types:</strong> {Object.values(StatsType).join(', ')}
            </div>
            <div>
              <strong>GraphQL Endpoint:</strong> /api/graphql
            </div>
            <div>
              <strong>Test Instructions:</strong>
              <ul className='mt-2 list-inside list-disc space-y-1'>
                <li>Check if stats load properly</li>
                <li>Verify trend indicators work</li>
                <li>Test different column layouts</li>
                <li>Confirm edit mode functionality</li>
                <li>Check browser console for errors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
