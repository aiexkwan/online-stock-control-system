'use client';

import React from 'react';
import { TableCard } from '../components/dashboard/cards/TableCard';

export default function TestTableCardPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          TableCard Test Page
        </h1>
        <p className="text-gray-600">
          Testing the TableCard component with different data sources
        </p>
      </div>

      {/* Test 1: Products Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 1: Products Table
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <TableCard
            dataSource="products"
            columns={['sku', 'name', 'quantity', 'status', 'updated_at']}
            sortable={true}
            filterable={true}
            pageSize={10}
            showPagination={true}
            showExport={true}
            showSearch={true}
            isEditMode={false}
          />
        </div>
      </div>

      {/* Test 2: Orders Table with Date Range */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 2: Orders Table (Last 7 Days)
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <TableCard
            dataSource="orders"
            columns={['order_id', 'customer', 'total', 'status', 'created_at']}
            sortable={true}
            filterable={true}
            pageSize={20}
            showPagination={true}
            showExport={true}
            showSearch={true}
            dateRange={{
              start: new Date(new Date().setDate(new Date().getDate() - 7)),
              end: new Date()
            }}
            isEditMode={false}
          />
        </div>
      </div>

      {/* Test 3: Inventory Table */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 3: Inventory Table
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <TableCard
            dataSource="inventory"
            columns={['item_code', 'description', 'quantity', 'location', 'last_updated']}
            sortable={true}
            filterable={false}
            pageSize={15}
            showPagination={true}
            showExport={true}
            showSearch={false}
            isEditMode={false}
          />
        </div>
      </div>

      {/* Test 4: Suppliers Table (Compact) */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 4: Suppliers Table (Compact View)
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <TableCard
            dataSource="suppliers"
            columns={['name', 'contact', 'status']}
            sortable={false}
            filterable={false}
            pageSize={5}
            showPagination={false}
            showExport={false}
            showSearch={false}
            isEditMode={false}
          />
        </div>
      </div>

      {/* Test 5: Edit Mode */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 5: Edit Mode
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <TableCard
            dataSource="products"
            columns={['sku', 'name', 'quantity']}
            sortable={true}
            filterable={true}
            pageSize={5}
            showPagination={true}
            showExport={true}
            showSearch={true}
            isEditMode={true}
          />
        </div>
      </div>

      {/* Test 6: Empty State */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Test 6: Empty State Handling
        </h2>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <TableCard
            dataSource="empty-data-source"
            columns={['id', 'name', 'value']}
            sortable={true}
            filterable={true}
            pageSize={10}
            showPagination={true}
            showExport={false}
            showSearch={true}
            isEditMode={false}
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
              <strong>Common Data Sources:</strong> products, orders, inventory, suppliers, users, transfers
            </div>
            <div>
              <strong>Features to Test:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Sorting functionality on sortable columns</li>
                <li>Filtering when enabled</li>
                <li>Pagination controls</li>
                <li>Search functionality</li>
                <li>Export button (CSV/Excel)</li>
                <li>Edit mode features</li>
                <li>Responsive table behavior</li>
                <li>Loading states</li>
                <li>Error handling</li>
              </ul>
            </div>
            <div>
              <strong>GraphQL Endpoint:</strong> /api/graphql
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}