'use client';

import React from 'react';
import { format } from 'date-fns';

interface GrnRecord {
  id: string;
  grnNumber: string;
  productCode: string;
  totalPallets: number;
  timestamp: string;
}

export default function GrnHistory() {
  const grnRecords: GrnRecord[] = [
    {
      id: 'GRN001',
      grnNumber: 'GRN/2024/001',
      productCode: 'PROD-A',
      totalPallets: 10,
      timestamp: '2024-05-01T19:01:00Z'
    },
    {
      id: 'GRN002',
      grnNumber: 'GRN/2024/002',
      productCode: 'PROD-B',
      totalPallets: 5,
      timestamp: '2024-05-01T18:01:00Z'
    },
    {
      id: 'GRN003',
      grnNumber: 'GRN/2024/003',
      productCode: 'PROD-C',
      totalPallets: 7,
      timestamp: '2024-05-01T17:01:00Z'
    }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              GRN Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              TTL Pallet
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {grnRecords.map((record) => (
            <tr key={record.id} className="hover:bg-gray-700">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                {record.grnNumber}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                {record.productCode}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                {record.totalPallets}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 