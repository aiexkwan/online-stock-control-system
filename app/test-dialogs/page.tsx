/**
 * Dialog 測試頁面
 * 展示統一的 dialog 動畫和樣式
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  NotificationDialog,
  SuccessDialog,
  ErrorDialog,
  WarningDialog,
  DeleteConfirmDialog,
  InfoDialog
} from '@/components/ui/notification-dialogs-animated';
// 同時導入原版進行對比測試
import {
  NotificationDialog as OriginalNotificationDialog
} from '@/components/ui/notification-dialogs';

export default function TestDialogsPage() {
  const [dialogs, setDialogs] = useState({
    notification: false,
    success: false,
    error: false,
    warning: false,
    delete: false,
    info: false,
    original: false,  // 測試原版
    simple: false     // 簡單測試
  });

  const openDialog = (type: keyof typeof dialogs) => {
    console.log('Opening dialog:', type);
    setDialogs(prev => ({ ...prev, [type]: true }));
  };

  const closeDialog = (type: keyof typeof dialogs) => {
    console.log('Closing dialog:', type);
    setDialogs(prev => ({ ...prev, [type]: false }));
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">
          Dialog 測試頁面
        </h1>
        <p className="text-slate-400 mb-4">
          所有 Dialog 現已加入光線流動邊框效果
        </p>
        <p className="text-yellow-400 mb-8">
          請打開瀏覽器控制台查看調試信息
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Button
            onClick={() => openDialog('notification')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
          >
            通知 Dialog
          </Button>
          
          <Button
            onClick={() => openDialog('success')}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
          >
            成功 Dialog
          </Button>
          
          <Button
            onClick={() => openDialog('error')}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500"
          >
            錯誤 Dialog
          </Button>
          
          <Button
            onClick={() => openDialog('warning')}
            className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500"
          >
            警告 Dialog
          </Button>
          
          <Button
            onClick={() => openDialog('delete')}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500"
          >
            刪除確認 Dialog
          </Button>
          
          <Button
            onClick={() => openDialog('info')}
            className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500"
          >
            信息 Dialog
          </Button>
        </div>
        
        {/* 測試區域 */}
        <div className="border-t border-slate-700 pt-4">
          <h2 className="text-xl font-bold text-white mb-4">調試測試</h2>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => openDialog('original')}
              variant="outline"
              className="border-blue-500 text-blue-400 hover:bg-blue-500/20"
            >
              測試原版 Dialog
            </Button>
            <Button
              onClick={() => {
                console.log('Current dialog states:', dialogs);
                alert('Dialog 狀態：' + JSON.stringify(dialogs, null, 2));
              }}
              variant="outline"
              className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
            >
              檢查 Dialog 狀態
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <NotificationDialog
        isOpen={dialogs.notification}
        onOpenChange={(open) => !open && closeDialog('notification')}
        title="系統通知"
        message="您有新的訂單需要處理，請及時查看。"
        onConfirm={() => console.log('Notification confirmed')}
      />

      <SuccessDialog
        isOpen={dialogs.success}
        onOpenChange={(open) => !open && closeDialog('success')}
        title="保存成功"
        message="您的更改已成功保存到系統。"
        onConfirm={() => console.log('Success confirmed')}
      />

      <ErrorDialog
        isOpen={dialogs.error}
        onOpenChange={(open) => !open && closeDialog('error')}
        title="處理失敗"
        message="無法連接到伺服器，請檢查網絡連接後重試。"
        errorCode="ERR_NETWORK_500"
        onRetry={() => console.log('Retry clicked')}
        onDismiss={() => console.log('Dismiss clicked')}
      />

      <WarningDialog
        isOpen={dialogs.warning}
        onOpenChange={(open) => !open && closeDialog('warning')}
        title="確認操作"
        message="您確定要執行此操作嗎？此操作可能會影響系統數據。"
        confirmText="繼續"
        cancelText="取消"
        onConfirm={() => console.log('Warning confirmed')}
        onCancel={() => console.log('Warning cancelled')}
      />

      <DeleteConfirmDialog
        isOpen={dialogs.delete}
        onOpenChange={(open) => !open && closeDialog('delete')}
        itemName="訂單 #12345"
        onConfirm={() => console.log('Delete confirmed')}
        onCancel={() => console.log('Delete cancelled')}
      />

      <InfoDialog
        isOpen={dialogs.info}
        onOpenChange={(open) => !open && closeDialog('info')}
        title="系統信息"
        message="當前系統版本：2.0.1"
        details={
          <div className="space-y-2 text-sm text-cyan-300">
            <p>• 最後更新：2025-06-25</p>
            <p>• 資料庫狀態：正常</p>
            <p>• 用戶數量：156</p>
          </div>
        }
        onConfirm={() => console.log('Info confirmed')}
      />
      
      {/* 原版 Dialog 測試 */}
      <OriginalNotificationDialog
        isOpen={dialogs.original}
        onOpenChange={(open) => !open && closeDialog('original')}
        title="原版通知測試"
        message="這是使用原版組件的測試"
        onConfirm={() => console.log('Original confirmed')}
      />
    </div>
  );
}