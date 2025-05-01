'use client';

import React from 'react';
import { format } from 'date-fns';

interface PrintRecord {
  id: string;
  palletNum: string;
  productCode: string;
  quantity: number;
  timestamp: string;
}

export default function PrintHistory() {
  const printRecords: PrintRecord[] = [
    {
      id: 'PLT001',
      palletNum: 'P001',
      productCode: 'CODE-A',
      quantity: 100,
      timestamp: '2024-05-01T19:01:00Z'
    },
    {
      id: 'PLT002',
      palletNum: 'P002',
      productCode: 'CODE-B',
      quantity: 50,
      timestamp: '2024-05-01T18:01:00Z'
    },
    {
      id: 'PLT003',
      palletNum: 'P003',
      productCode: 'CODE-C',
      quantity: 75,
      timestamp: '2024-05-01T17:01:00Z'
    }
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Pallet Num
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Product Code
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Qty
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {printRecords.map((record) => (
            <tr key={record.id} className="hover:bg-gray-700">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                {format(new Date(record.timestamp), 'HH:mm:ss')}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                {record.palletNum}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                {record.productCode}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                {record.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 