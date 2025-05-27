import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Package, TrendingUp, Calendar } from 'lucide-react';

// 從 actions 文件導入類型
interface StockDetails {
  uuid?: string;
  product_code?: string;
  injection?: number | null;
  pipeline?: number | null;
  prebook?: number | null;
  await?: number | null;
  fold?: number | null;
  bulk?: number | null;
  backcarpark?: number | null;
  latest_update?: string | null;
  [key: string]: any;
}

interface StockInfoCardProps {
  stockInfo: StockDetails | null;
}

// 格式化日期函數
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString();
  } catch (e) {
    return dateString;
  }
};

export default function StockInfoCard({ stockInfo }: StockInfoCardProps) {
  if (!stockInfo) {
    return (
      <Card className="border-gray-600 bg-gray-800 text-white">
        <CardHeader>
          <CardTitle className="text-blue-400 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Stock Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-400">No stock information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stockLocations = [
    { label: 'Injection', value: stockInfo.injection, key: 'injection' },
    { label: 'Pipeline', value: stockInfo.pipeline, key: 'pipeline' },
    { label: 'Pre-Booking', value: stockInfo.prebook, key: 'prebook' },
    { label: 'Awaiting', value: stockInfo.await, key: 'await' },
    { label: 'Fold Mill', value: stockInfo.fold, key: 'fold' },
    { label: 'Bulk Room', value: stockInfo.bulk, key: 'bulk' },
    { label: 'Back Car Park', value: stockInfo.backcarpark, key: 'backcarpark' },
  ];

  const totalStock = stockLocations.reduce((sum, location) => sum + (location.value || 0), 0);

  return (
    <Card className="border-blue-400 bg-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Stock Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Stock */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-300 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Total Stock:
            </span>
            <span className="text-xl font-bold text-blue-400">{totalStock}</span>
          </div>
        </div>

        {/* Stock by Location */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-300 mb-3">Stock Distribution</h4>
          {stockLocations.map((location) => (
            <div key={location.key} className="flex justify-between items-center py-2 px-3 bg-gray-700 rounded">
              <span className="text-gray-300">{location.label}:</span>
              <span className={`font-medium ${
                (location.value || 0) > 0 ? 'text-green-400' : 'text-gray-500'
              }`}>
                {location.value || '--'}
              </span>
            </div>
          ))}
        </div>

        {/* Last Update */}
        {stockInfo.latest_update && (
          <div className="pt-3 border-t border-gray-600">
            <div className="flex items-center text-xs text-gray-400">
              <Calendar className="w-3 h-3 mr-2" />
              <span>Last updated: {formatDate(stockInfo.latest_update)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 