'use client';

import React from 'react';
import { WarningDialog } from '@/components/ui/notification-dialogs';
import { PalletInfo } from '../types';
import { AlertTriangle, Package, Hash, MapPin, Calendar } from 'lucide-react';

interface VoidConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  palletInfo: PalletInfo | null;
  voidReason: string;
  damageQuantity?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function VoidConfirmDialog({
  open,
  onOpenChange,
  palletInfo,
  voidReason,
  damageQuantity,
  onConfirm,
  onCancel,
}: VoidConfirmDialogProps) {
  if (!palletInfo) return null;

  const isDamage = voidReason === 'Damage';
  const isPartialDamage = isDamage && damageQuantity && damageQuantity < palletInfo.product_qty;

  // 構建詳細信息
  const details = (
    <div className="space-y-4">
      {/* 操作警告 */}
      <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4">
        <p className="text-red-300 font-medium">
          {isPartialDamage 
            ? `您正在作廢此棧板的部分數量 (${damageQuantity} 件)`
            : '您正在作廢整個棧板'
          }
        </p>
        <p className="text-red-400 text-sm mt-1">此操作無法撤銷！</p>
      </div>
      
      {/* 棧板信息 */}
      <div className="space-y-3 text-slate-300">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-400" />
          <span className="text-sm">產品代碼:</span>
          <span className="font-mono font-medium">{palletInfo.product_code}</span>
        </div>
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 text-slate-400" />
          <span className="text-sm">數量:</span>
          <span className="font-medium">{palletInfo.product_qty}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="text-sm">位置:</span>
          <span className="font-medium">{palletInfo.location || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm">創建日期:</span>
          <span className="font-medium">
            {new Date(palletInfo.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
      
      {/* 作廢原因 */}
      <div className="bg-slate-800/50 rounded-xl p-3">
        <p className="text-sm text-slate-400">作廢原因:</p>
        <p className="text-slate-200 font-medium">{voidReason}</p>
        {isPartialDamage && (
          <p className="text-yellow-400 text-sm mt-2">
            剩餘 {palletInfo.product_qty - damageQuantity!} 件將保留在系統中
          </p>
        )}
      </div>
    </div>
  );

  const message = isPartialDamage
    ? `您確定要作廢棧板 ${palletInfo.pallet_no} 的 ${damageQuantity} 件產品嗎？`
    : `您確定要作廢整個棧板 ${palletInfo.pallet_no} 嗎？`;

  return (
    <WarningDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      title="確認作廢操作"
      message={message}
      details={details}
      confirmText="確認作廢"
      cancelText="取消"
      onConfirm={onConfirm}
      onCancel={onCancel}
      destructive={true}
      icon={<AlertTriangle className="w-7 h-7" />}
    />
  );
}