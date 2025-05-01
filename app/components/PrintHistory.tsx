'use client';

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface PrintRecord {
  id: string;
  palletId: string;
  timestamp: string;
  operator: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function PrintHistory() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<PrintRecord[]>([]);

  useEffect(() => {
    const fetchPrintHistory = async () => {
      try {
        // 模擬 API 調用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockData: PrintRecord[] = [
          {
            id: '1',
            palletId: 'PLT001',
            timestamp: new Date().toISOString(),
            operator: 'John Doe',
            status: 'completed'
          },
          {
            id: '2',
            palletId: 'PLT002',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            operator: 'Jane Smith',
            status: 'completed'
          },
          {
            id: '3',
            palletId: 'PLT003',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            operator: 'Mike Johnson',
            status: 'failed'
          }
        ];

        setRecords(mockData);
      } catch (err) {
        console.error('Error fetching print history:', err);
        setError('Failed to load print history');
      } finally {
        setLoading(false);
      }
    };

    fetchPrintHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
                record.status === 'completed'
                  ? 'bg-green-500'
                  : record.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}
            />
            <div>
              <p className="text-white font-medium">{record.palletId}</p>
              <p className="text-sm text-gray-400">{record.operator}</p>
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