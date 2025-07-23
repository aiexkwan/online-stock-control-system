/**
 * StatsCard Test Page
 * 測試 GraphQL 整合的 StatsCard 組件
 */

'use client';

import React from 'react';
import { StatsCard } from '@/app/(app)/admin/components/dashboard/cards/StatsCard';
import { StatsType } from '@/types/generated/graphql';
import { ApolloProvider } from '@/lib/graphql/apollo-provider';

export default function TestStatsCardPage() {
  const allStatTypes = [
    StatsType.YesterdayTransferCount,
    StatsType.AwaitLocationQty,
    StatsType.StillInAwait,
    StatsType.StillInAwaitPercentage,
    StatsType.ProductionStats,
    StatsType.InjectionProductionStats,
    StatsType.StaffWorkload,
    StatsType.WarehouseWorkLevel,
    StatsType.TransferTimeDistribution,
    StatsType.StockLevelHistory,
  ];

  const dashboardStats = [
    StatsType.YesterdayTransferCount,
    StatsType.AwaitLocationQty,
    StatsType.StillInAwaitPercentage,
  ];

  const warehouseStats = [
    StatsType.AwaitLocationQty,
    StatsType.StillInAwait,
    StatsType.WarehouseWorkLevel,
    StatsType.TransferTimeDistribution,
  ];

  const productionStats = [
    StatsType.ProductionStats,
    StatsType.InjectionProductionStats,
    StatsType.StaffWorkload,
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">StatsCard GraphQL Test Page</h1>
      
      {/* All Stats - Single Column */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">All Stats (Single Column)</h2>
        <StatsCard
          statTypes={allStatTypes}
          columns={1}
          showTrend={true}
          showComparison={true}
          showPerformance={true}
          className="max-w-md"
        />
      </section>

      {/* Dashboard Stats - 3 Columns */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Dashboard Overview (3 Columns)</h2>
        <StatsCard
          statTypes={dashboardStats}
          columns={3}
          showTrend={true}
          showComparison={true}
          showPerformance={false}
        />
      </section>

      {/* Warehouse Stats - 4 Columns */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Warehouse Operations (4 Columns)</h2>
        <StatsCard
          statTypes={warehouseStats}
          columns={4}
          showTrend={true}
          showComparison={false}
          showPerformance={true}
        />
      </section>

      {/* Production Stats - 3 Columns */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Production Monitoring (3 Columns)</h2>
        <StatsCard
          statTypes={productionStats}
          columns={3}
          showTrend={true}
          showComparison={true}
          showPerformance={false}
        />
      </section>

      {/* Interactive Test */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Interactive Test (Edit Mode)</h2>
        <StatsCard
          statTypes={dashboardStats}
          columns={2}
          showTrend={true}
          showComparison={true}
          showPerformance={true}
          isEditMode={true}
          onStatClick={(type) => {
            console.log(`Clicked on stat: ${type}`);
            alert(`You clicked on: ${type}`);
          }}
          onRefresh={() => {
            console.log('Refresh requested');
          }}
        />
      </section>

      {/* Date Range Test */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Date Range Test</h2>
        <StatsCard
          statTypes={[StatsType.YesterdayTransferCount, StatsType.StockLevelHistory]}
          columns={2}
          dateRange={{
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            end: new Date(),
          }}
          showTrend={true}
          showComparison={true}
          showPerformance={true}
        />
      </section>
    </div>
  );
}