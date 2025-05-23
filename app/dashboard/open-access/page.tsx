import React from 'react';
import PalletDonutChart from '@/app/components/PalletDonutChart';
import AcoOrderStatus from '@/app/components/AcoOrderStatus';
import GrnHistory from '@/app/components/GrnHistory';
import OpenAccessLayout from './layout';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

async function getData() {
  try {
    // 模擬從 dashboard/page.tsx 獲取的數據
    return {
      palletsDone: 50,
      palletsTransferred: 30
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      palletsDone: 0,
      palletsTransferred: 0
    };
  }
}

export default async function OpenAccessDashboard() {
  const data = await getData();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-8">Pennine Stock Control</h1>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-64 h-64">
                <PalletDonutChart 
                  palletsDone={data.palletsDone} 
                  palletsTransferred={data.palletsTransferred} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<div>Loading active orders...</div>}>
          <Card>
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <AcoOrderStatus />
            </CardContent>
          </Card>
        </Suspense>

        <Suspense fallback={<div>Loading recent GRN...</div>}>
          <Card>
            <CardHeader>
              <CardTitle>Recent GRN</CardTitle>
            </CardHeader>
            <CardContent>
              <GrnHistory />
            </CardContent>
          </Card>
        </Suspense>
      </div>
    </div>
  );
} 