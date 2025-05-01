'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from "../../components/ui/card";
import PrintHistory from '../components/PrintHistory';
import GrnHistory from '../components/GrnHistory';

interface DashboardData {
  palletsDone: number;
  palletsTransferred: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    palletsDone: 0,
    palletsTransferred: 0
  });

  useEffect(() => {
    const checkAuth = () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
    };

    const fetchDashboardData = async () => {
      try {
        // 這裡應該從 API 獲取實際數據
        const mockData = {
          palletsDone: 3256,
          palletsTransferred: 123
        };
        setData(mockData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
    fetchDashboardData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1e2533]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-3 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e2533] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-[#252d3d] p-6 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pallets Done</p>
                <p className="text-white text-2xl font-bold">{data.palletsDone}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-[#252d3d] p-6 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Pallets Transferred</p>
                <p className="text-white text-2xl font-bold">{data.palletsTransferred}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* History Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#252d3d] rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Print History</h2>
              <PrintHistory />
            </div>
          </Card>

          <Card className="bg-[#252d3d] rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">GRN History</h2>
              <GrnHistory />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 