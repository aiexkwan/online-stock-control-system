'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Package, Edit, Hash, FileText, Palette, Calculator, Tag } from 'lucide-react';
import { ProductData } from '../../actions/productActions';

interface ProductInfoCardProps {
  productData: ProductData;
  onEdit: () => void;
  isLoading?: boolean;
}

export default function ProductInfoCard({ 
  productData, 
  onEdit, 
  isLoading = false 
}: ProductInfoCardProps) {
  return (
    <Card className="border-blue-400 bg-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-blue-400 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Product Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 產品基本信息 */}
        <div className="space-y-3">
          <InfoRow 
            icon={<Hash className="w-4 h-4" />}
            label="Product Code" 
            value={productData.code} 
          />
          <InfoRow 
            icon={<FileText className="w-4 h-4" />}
            label="Description" 
            value={productData.description} 
          />
          <InfoRow 
            icon={<Palette className="w-4 h-4" />}
            label="Colour" 
            value={productData.colour || 'Not specified'} 
          />
          <InfoRow 
            icon={<Calculator className="w-4 h-4" />}
            label="Standard Qty" 
            value={productData.standard_qty || 'Not specified'} 
          />
          <InfoRow 
            icon={<Tag className="w-4 h-4" />}
            label="Type" 
            value={productData.type || 'Not specified'} 
          />
        </div>

        {/* 編輯按鈕 */}
        <div className="pt-4 border-t border-gray-600">
          <Button 
            onClick={onEdit}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Product
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: any;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 text-gray-400 mt-0.5">
        {icon}
      </div>
      <div className="flex-1">
        <span className="font-medium text-gray-300 block">
          {label}:
        </span>
        <span className="text-white block mt-1">
          {value}
        </span>
      </div>
    </div>
  );
} 