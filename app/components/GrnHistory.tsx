'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface GrnRecord {
  id: string;
  grnNumber: string;
  productCode: string;
  quantity: number;
  timestamp: string;
  status: 'received' | 'pending' | 'rejected';
}

export default function GrnHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<GrnRecord[]>([]);

  useEffect(() => {
    const fetchGrnHistory = async () => {
      try {
        // 模擬 API 調用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData: GrnRecord[] = [
          {
            id: '1',
            grnNumber: 'GRN001',
            productCode: 'PROD-A',
            quantity: 100,
            timestamp: new Date().toISOString(),
            status: 'received'
          },
          {
            id: '2',
            grnNumber: 'GRN002',
            productCode: 'PROD-B',
            quantity: 50,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: 'pending'
          },
          {
            id: '3',
            grnNumber: 'GRN003',
            productCode: 'PROD-C',
            quantity: 75,
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            status: 'received'
          }
        ];

        setRecords(mockData);
      } catch (err) {
        console.error('Error fetching GRN history:', err);
        setError('Failed to load GRN history');
      } finally {
        setLoading(false);
      }
    };

    fetchGrnHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div
          key={record.id}
          className="flex items-center justify-between p-4 bg-[#1e2533] rounded-lg"
        >
          <div className="flex items-center space-x-4">
            <div
              className={`w-2 h-2 rounded-full ${
                record.status === 'received'
                  ? 'bg-green-500'
                  : record.status === 'rejected'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}
            />
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-white font-medium">{record.grnNumber}</p>
                <span className="text-gray-400">•</span>
                <p className="text-sm text-gray-400">{record.productCode}</p>
              </div>
              <p className="text-sm text-gray-400">Qty: {record.quantity}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">
              {format(new Date(record.timestamp), 'MMM d, HH:mm')}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 