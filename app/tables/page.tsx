'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';
import Link from 'next/link';

interface TableInfo {
  name: string;
  description: string;
  columns: Array<{
    name: string;
    type: string;
    sample: any;
  }>;
}

const TABLE_NAMES = [
  { name: 'data_code', description: '代碼參考表' },
  { name: 'data_id', description: '唯一標識符表' },
  { name: 'data_materiallsupplier', description: '材料供應商信息表' },
  { name: 'data_slateinfo', description: '石板信息表' },
  { name: 'record_grn', description: '收貨記錄表' },
  { name: 'record_history', description: '歷史記錄表' },
  { name: 'record_inventory', description: '庫存記錄表' },
  { name: 'record_palletinfo', description: '托盤信息表' },
  { name: 'record_transfer', description: '轉移記錄表' }
];

export default function TablesPage() {
  const supabase = createClient();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTables() {
      try {
        const tableInfoPromises = TABLE_NAMES.map(async (table) => {
          const { data, error: tableError } = await supabase
            .from(table.name)
            .select('*')
            .limit(1);

          if (tableError) {
            throw new Error(`Error fetching ${table.name}: ${tableError.message}`);
          }

          const sampleRow = data?.[0] || {};
          
          return {
            name: table.name,
            description: table.description,
            columns: Object.entries(sampleRow).map(([name, value]) => ({
              name,
              type: typeof value,
              sample: value
            }))
          };
        });

        const tableInfos = await Promise.all(tableInfoPromises);
        setTables(tableInfos);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch table information');
      } finally {
        setLoading(false);
      }
    }

    fetchTables();
  }, []);

  if (loading) {
    return <div className="p-8">Loading table structures...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Database Tables Structure</h1>
      
      {tables.map((table) => (
        <div key={table.name} className="mb-12 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{table.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{table.description}</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Column Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sample Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {table.columns.map((column) => (
                  <tr key={column.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {column.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {column.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 overflow-hidden text-ellipsis max-w-xs">
                      {JSON.stringify(column.sample)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </main>
  );
} 