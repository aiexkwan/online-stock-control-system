'use client';

import React from 'react';
import { WarningDialog } from '@/components/ui/notification-dialogs';
import { BatchPalletItem } from '../types/batch';
import { AlertTriangle, Package, Hash } from 'lucide-react';

interface BatchVoidConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: BatchPalletItem[];
  voidReason: string;
  damageQuantity?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BatchVoidConfirmDialog({
  open,
  onOpenChange,
  items,
  voidReason,
  damageQuantity,
  onConfirm,
  onCancel,
}: BatchVoidConfirmDialogProps) {
  const selectedItems = items.filter(item => item.selected);
  const totalQuantity = selectedItems.reduce((sum, item) => sum + item.palletInfo.product_qty, 0);
  const hasACOPallets = selectedItems.some(item => 
    item.palletInfo.plt_remark?.includes('ACO')
  );
  const hasGRNPallets = selectedItems.some(item => 
    item.palletInfo.plt_remark?.includes('Material GRN')
  );

  // 構建詳細信息
  const details = (
    <div className="space-y-4">
      {/* 警告訊息 */}
      <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4">
        <p className="text-red-300 font-medium">
          此操作將作廢 {selectedItems.length} 個棧板，總數量為 {totalQuantity} 件。
          此操作無法撤銷。
        </p>
      </div>

      {/* 作廢原因 */}
      <div className="space-y-2">
        <h4 className="font-medium text-slate-200">作廢原因：</h4>
        <div className="bg-slate-800/50 rounded-xl px-4 py-3">
          <p className="font-medium text-red-400">
            {voidReason}
            {voidReason === 'Damage' && damageQuantity && ` (每個棧板 ${damageQuantity} 件)`}
          </p>
        </div>
      </div>

      {/* 選擇的棧板列表 */}
      <div className="space-y-2">
        <h4 className="font-medium text-slate-200">已選擇的棧板：</h4>
        <div className="max-h-48 overflow-y-auto bg-slate-800/50 rounded-xl p-4">
          <div className="space-y-2">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <Hash className="h-3 w-3 text-slate-500" />
                  <span className="font-medium text-slate-200">{item.palletInfo.plt_num}</span>
                  <span className="text-slate-500">|</span>
                  <Package className="h-3 w-3 text-slate-500" />
                  <span className="text-slate-300">{item.palletInfo.product_code}</span>
                  <span className="text-slate-400">({item.palletInfo.product_qty} 件)</span>
                </div>
                {item.palletInfo.plt_remark && (
                  <span className="text-xs text-slate-500">{item.palletInfo.plt_remark}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 特別警告 */}
      {hasACOPallets && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
          <p className="text-yellow-300 text-sm">
            <strong>偵測到 ACO 訂單棧板：</strong> ACO 訂單剩餘數量將會更新。
            注意：ACO 棧板不支援部分損壞。
          </p>
        </div>
      )}
      
      {hasGRNPallets && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
          <p className="text-blue-300 text-sm">
            <strong>偵測到 Material GRN 棧板：</strong> GRN 記錄將會被刪除。
          </p>
        </div>
      )}

      {/* 摘要 */}
      <div className="bg-slate-900/50 rounded-xl p-4">
        <h4 className="font-medium text-slate-200 mb-3">摘要：</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-slate-400">總棧板數：</div>
          <div className="font-medium text-slate-200">{selectedItems.length}</div>
          
          <div className="text-slate-400">總數量：</div>
          <div className="font-medium text-slate-200">{totalQuantity} 件</div>
          
          {voidReason === 'Damage' && damageQuantity && (
            <>
              <div className="text-slate-400">總損壞數：</div>
              <div className="font-medium text-red-400">
                {selectedItems.length * damageQuantity} 件
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <WarningDialog
      isOpen={open}
      onOpenChange={onOpenChange}
      title="確認批量作廢操作"
      message={`您確定要批量作廢 ${selectedItems.length} 個棧板嗎？`}
      details={details}
      confirmText="確認批量作廢"
      cancelText="取消"
      onConfirm={onConfirm}
      onCancel={onCancel}
      destructive={true}
      icon={<AlertTriangle className="w-7 h-7" />}
    />
  );
}