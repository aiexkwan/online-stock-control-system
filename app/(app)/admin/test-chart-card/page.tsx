/**
 * ChartCard Test Page
 * 測試 GraphQL 整合的 ChartCard 組件
 */

'use client';

import React from 'react';
import { ChartCard } from '@/app/(app)/admin/components/dashboard/cards/ChartCard';
import { ChartType } from '@/types/generated/graphql';

export default function TestChartCardPage() {
  const currentDate = new Date();
  const lastWeek = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">ChartCard GraphQL Test Page</h1>

      {/* Stock Distribution Treemap */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Stock Distribution (Treemap)</h2>
        <ChartCard
          chartTypes={[ChartType.Treemap]}
          height={400}
          showPerformance={true}
          limit={20}
        />
      </section>

      {/* Warehouse Work Level Area Chart */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Warehouse Work Level (Area Chart)</h2>
        <ChartCard
          chartTypes={[ChartType.Area]}
          dateRange={{
            start: lastWeek,
            end: currentDate,
          }}
          timeGranularity="DAY"
          height={350}
          showPerformance={true}
        />
      </section>

      {/* Transfer Time Distribution Bar Chart */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Transfer Time Distribution (Bar Chart)</h2>
        <ChartCard
          chartTypes={[ChartType.Bar]}
          height={350}
          showPerformance={true}
        />
      </section>

      {/* Stock Level History Line Chart */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Stock Level History (Line Chart)</h2>
        <ChartCard
          chartTypes={[ChartType.Line]}
          dateRange={{
            start: lastMonth,
            end: currentDate,
          }}
          timeGranularity="DAY"
          height={350}
          showPerformance={true}
        />
      </section>

      {/* Multiple Charts Test */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Multiple Chart Types Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard
            chartTypes={[ChartType.Pie]}
            height={300}
            showPerformance={false}
            limit={10}
          />
          <ChartCard
            chartTypes={[ChartType.Donut]}
            height={300}
            showPerformance={false}
            limit={10}
          />
        </div>
      </section>

      {/* Interactive Test with Different Time Granularities */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Time Granularity Test</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Hourly Data</h3>
            <ChartCard
              chartTypes={[ChartType.Line]}
              dateRange={{
                start: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000),
                end: currentDate,
              }}
              timeGranularity="HOUR"
              height={300}
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Weekly Data</h3>
            <ChartCard
              chartTypes={[ChartType.Bar]}
              dateRange={{
                start: new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000),
                end: currentDate,
              }}
              timeGranularity="WEEK"
              height={300}
            />
          </div>
        </div>
      </section>

      {/* Edit Mode Test */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Edit Mode Test</h2>
        <ChartCard
          chartTypes={[ChartType.Area]}
          dateRange={{
            start: lastWeek,
            end: currentDate,
          }}
          height={350}
          isEditMode={true}
          onChartClick={(chartType, data) => {
            console.log(`Clicked on ${chartType} chart:`, data);
            alert(`You clicked on ${chartType} chart`);
          }}
          onRefresh={() => {
            console.log('Chart refresh requested');
          }}
        />
      </section>
    </div>
  );
}