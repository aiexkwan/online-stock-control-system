import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Package, Calendar, Hash, FileText } from 'lucide-react';

// 從 actions 文件導入類型
interface DataCodeProductDetails {
  code?: string;
  description?: string;
  colour?: string;
  standard_qty?: number;
  type?: string;
  [key: string]: any; 
}

interface PalletInfo {
  palletNum?: string;
  productCode?: string;
  series?: string;
  generate_time?: string;
  product_qty?: number;
  plt_remark?: string;
  productDetails?: DataCodeProductDetails | null;
  [key: string]: any;
}

interface PalletInfoCardProps {
  palletInfo: PalletInfo | null;
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

export default function PalletInfoCard({ palletInfo }: PalletInfoCardProps) {
  if (!palletInfo) return null;

  return (
    <Card className="border-blue-400 bg-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Pallet Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div className="space-y-3">
          <InfoRow 
            icon={<Hash className="w-4 h-4" />}
            label="Pallet Number" 
            value={palletInfo.palletNum || palletInfo.plt_num} 
          />
          <InfoRow 
            icon={<Package className="w-4 h-4" />}
            label="Product Code" 
            value={palletInfo.productCode || palletInfo.product_code} 
          />
          <InfoRow 
            icon={<FileText className="w-4 h-4" />}
            label="Quantity" 
            value={palletInfo.product_qty} 
          />
          <InfoRow 
            icon={<Calendar className="w-4 h-4" />}
            label="Generated Time" 
            value={formatDate(palletInfo.generate_time)} 
          />
          {palletInfo.plt_remark && (
            <InfoRow 
              icon={<FileText className="w-4 h-4" />}
              label="Remarks" 
              value={palletInfo.plt_remark} 
            />
          )}
        </div>

        {/* 產品詳細信息 */}
        {palletInfo.productDetails && (
          <div className="pt-4 border-t border-gray-600">
            <h4 className="text-sm font-medium text-blue-300 mb-3">Product Details</h4>
            <div className="space-y-2">
              <InfoRow 
                label="Description" 
                value={palletInfo.productDetails.description} 
                compact
              />
              <InfoRow 
                label="Colour" 
                value={palletInfo.productDetails.colour} 
                compact
              />
              <InfoRow 
                label="Standard Qty" 
                value={palletInfo.productDetails.standard_qty} 
                compact
              />
              <InfoRow 
                label="Type" 
                value={palletInfo.productDetails.type} 
                compact
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface InfoRowProps {
  icon?: React.ReactNode;
  label: string;
  value: any;
  compact?: boolean;
}

function InfoRow({ icon, label, value, compact = false }: InfoRowProps) {
  return (
    <div className={`flex ${compact ? 'justify-between items-center' : 'items-start space-x-3'}`}>
      {icon && !compact && (
        <div className="flex-shrink-0 text-gray-400 mt-0.5">
          {icon}
        </div>
      )}
      <div className={`${compact ? 'flex justify-between w-full' : 'flex-1'}`}>
        <span className={`font-medium text-gray-300 ${compact ? '' : 'block'}`}>
          {label}:
        </span>
        <span className={`text-white ${compact ? 'text-right' : 'block mt-1'}`}>
          {value || 'N/A'}
        </span>
      </div>
    </div>
  );
} 