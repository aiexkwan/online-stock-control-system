'use client';

import React from 'react';
import { ChartCard } from '../components/dashboard/cards/ChartCard';
import { ChartType } from '@/types/generated/graphql';

export default function TestChartCardPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ChartCard Test Page
        </h1>
        <p className="text-gray-600">
          Testing the ChartCard component with different chart types
        </p>
      </div>

      {/* Test 1: Line Chart */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 1: Line Chart - Stock Level Trends
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <ChartCard
            chartTypes={[ChartType.Line]}
            dataSources={['stock-levels']}
            dateRange={{
              start: new Date(new Date().setDate(new Date().getDate() - 30)),
              end: new Date()
            }}
            title="Stock Level Trends"
            subtitle="Last 30 days"
            height={400}
            showLegend={true}
            showTooltip={true}
            animationEnabled={true}
            isEditMode={false}
          />
        </div>
      </div>

      {/* Test 2: Bar Chart */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 2: Bar Chart - Top Products by Quantity
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <ChartCard
            chartTypes={[ChartType.Bar]}
            dataSources={['top-products']}
            title="Top Products by Quantity"
            height={400}
            showLegend={false}
            showTooltip={true}
            animationEnabled={true}
            isEditMode={false}
          />
        </div>
      </div>

      {/* Test 3: Pie Chart */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 3: Pie Chart - Stock Distribution
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <ChartCard
            chartTypes={[ChartType.Pie]}
            dataSources={['stock-distribution']}
            title="Stock Distribution by Category"
            height={400}
            showLegend={true}
            showTooltip={true}
            animationEnabled={true}
            isEditMode={false}
          />
        </div>
      </div>

      {/* Test 4: Area Chart */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 4: Area Chart - Cumulative Inventory
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <ChartCard
            chartTypes={[ChartType.Area]}
            dataSources={['inventory-cumulative']}
            dateRange={{
              start: new Date(new Date().setDate(new Date().getDate() - 90)),
              end: new Date()
            }}
            title="Cumulative Inventory Growth"
            subtitle="Last 90 days"
            height={400}
            showLegend={true}
            showTooltip={true}
            animationEnabled={true}
            isEditMode={false}
          />
        </div>
      </div>

      {/* Test 5: Mixed Chart Types */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 5: Mixed Chart - Line + Bar Combo
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <ChartCard
            chartTypes={[ChartType.Line, ChartType.Bar]}
            dataSources={['orders-trend', 'orders-volume']}
            dateRange={{
              start: new Date(new Date().setDate(new Date().getDate() - 14)),
              end: new Date()
            }}
            title="Orders Analysis"
            subtitle="Trend and Volume"
            height={400}
            showLegend={true}
            showTooltip={true}
            animationEnabled={true}
            isEditMode={false}
          />
        </div>
      </div>

      {/* Test 6: Edit Mode */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 6: Edit Mode
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <ChartCard
            chartTypes={[ChartType.Line]}
            dataSources={['stock-levels']}
            title="Editable Chart"
            height={300}
            showLegend={true}
            showTooltip={true}
            animationEnabled={false}
            isEditMode={true}
          />
        </div>
      </div>

      {/* Debug Information */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Debug Information
        </h2>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div className="space-y-2 text-sm">
            <div>
              <strong>Available Chart Types:</strong> {Object.values(ChartType).join(', ')}
            </div>
            <div>
              <strong>Common Data Sources:</strong> stock-levels, top-products, stock-distribution, inventory-cumulative, orders-trend
            </div>
            <div>
              <strong>Test Instructions:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Verify each chart type renders correctly</li>
                <li>Check if data loads properly</li>
                <li>Test interactive features (tooltips, legends)</li>
                <li>Confirm animations work when enabled</li>
                <li>Test edit mode functionality</li>
                <li>Check responsive behavior</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}