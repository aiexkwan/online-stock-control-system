/**
 * Dialog 組件使用示例
 * 展示新 Dialog 系統嘅各種用法
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  NotificationDialog,
  SuccessDialog,
  ErrorDialog,
  WarningDialog,
  InfoDialog,
  ConfirmDialog,
  DeleteConfirmDialog,
  SaveConfirmDialog,
  dialogPresets,
} from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Settings, Trash2 } from 'lucide-react';

export function DialogExamples() {
  // Dialog 狀態
  const [basicDialog, setBasicDialog] = useState(false);
  const [formDialog, setFormDialog] = useState(false);
  const [notification, setNotification] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [warning, setWarning] = useState(false);
  const [info, setInfo] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saveConfirm, setSaveConfirm] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [animatedBorder, setAnimatedBorder] = useState(false);

  // 模擬異步操作
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAsyncAction = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setSuccess(true);
  };

  return (
    <div className='space-y-4 p-8'>
      <h2 className='mb-6 text-2xl font-bold'>Dialog 組件示例</h2>

      {/* 基礎 Dialog */}
      <section className='space-y-2'>
        <h3 className='text-lg font-semibold'>基礎 Dialog</h3>
        <Button onClick={() => setBasicDialog(true)}>打開基礎 Dialog</Button>

        <Dialog open={basicDialog} onOpenChange={setBasicDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>基礎 Dialog</DialogTitle>
              <DialogDescription>這是一個基礎嘅 Dialog 示例，展示標準佈局。</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <p>Dialog 內容可以放喺呢度。</p>
            </DialogBody>
            <DialogFooter>
              <Button variant='outline' onClick={() => setBasicDialog(false)}>
                關閉
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* 表單 Dialog */}
      <section className='space-y-2'>
        <h3 className='text-lg font-semibold'>表單 Dialog</h3>
        <Button onClick={() => setFormDialog(true)}>打開表單 Dialog</Button>

        <Dialog {...dialogPresets.form} open={formDialog} onOpenChange={setFormDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle icon={<Settings />}>用戶設置</DialogTitle>
              <DialogDescription>更新您嘅個人資料。</DialogDescription>
            </DialogHeader>
            <DialogBody className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>姓名</Label>
                <Input id='name' placeholder='輸入您的姓名' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>電郵</Label>
                <Input id='email' type='email' placeholder='輸入您的電郵' />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant='outline' onClick={() => setFormDialog(false)}>
                取消
              </Button>
              <Button
                onClick={() => {
                  handleAsyncAction();
                  setFormDialog(false);
                }}
              >
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* 通知類 Dialog */}
      <section className='space-y-2'>
        <h3 className='text-lg font-semibold'>通知類 Dialog</h3>
        <div className='flex flex-wrap gap-2'>
          <Button onClick={() => setNotification(true)}>通用通知</Button>
          <Button variant='outline' className='text-green-600' onClick={() => setSuccess(true)}>
            成功通知
          </Button>
          <Button variant='outline' className='text-red-600' onClick={() => setError(true)}>
            錯誤通知
          </Button>
          <Button variant='outline' className='text-yellow-600' onClick={() => setWarning(true)}>
            警告通知
          </Button>
          <Button variant='outline' className='text-blue-600' onClick={() => setInfo(true)}>
            信息通知
          </Button>
        </div>

        {/* 通用通知 */}
        <NotificationDialog
          open={notification}
          onOpenChange={setNotification}
          title='系統通知'
          message='這是一條普通嘅系統通知訊息。'
          autoClose
          autoCloseDelay={5000}
        />

        {/* 成功通知 */}
        <SuccessDialog
          open={success}
          onOpenChange={setSuccess}
          message='您的操作已成功完成！'
          autoClose
        />

        {/* 錯誤通知 */}
        <ErrorDialog open={error} onOpenChange={setError} message='操作失敗，請稍後再試。' />

        {/* 警告通知 */}
        <WarningDialog
          open={warning}
          onOpenChange={setWarning}
          message='請注意，此操作可能影響系統運行。'
        />

        {/* 信息通知 */}
        <InfoDialog open={info} onOpenChange={setInfo} message='系統將於今晚 10 點進行維護。' />
      </section>

      {/* 確認類 Dialog */}
      <section className='space-y-2'>
        <h3 className='text-lg font-semibold'>確認類 Dialog</h3>
        <div className='flex flex-wrap gap-2'>
          <Button onClick={() => setConfirm(true)}>通用確認</Button>
          <Button variant='destructive' onClick={() => setDeleteConfirm(true)}>
            刪除確認
          </Button>
          <Button onClick={() => setSaveConfirm(true)}>保存確認</Button>
        </div>

        {/* 通用確認 */}
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title='確認操作'
          message='您確定要執行此操作嗎？'
          onConfirm={() => console.log('Confirmed')}
          details={
            <div className='text-sm text-muted-foreground'>
              <p>• 此操作將影響 10 條記錄</p>
              <p>• 操作完成後無法撤銷</p>
            </div>
          }
        />

        {/* 刪除確認 */}
        <DeleteConfirmDialog
          open={deleteConfirm}
          onOpenChange={setDeleteConfirm}
          itemName='訂單 #12345'
          onConfirm={async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setSuccess(true);
          }}
        />

        {/* 保存確認 */}
        <SaveConfirmDialog
          open={saveConfirm}
          onOpenChange={setSaveConfirm}
          message='您有未保存的更改。是否要保存後再離開？'
          onConfirm={() => console.log('Save confirmed')}
        />
      </section>

      {/* 特殊效果 */}
      <section className='space-y-2'>
        <h3 className='text-lg font-semibold'>特殊效果</h3>
        <div className='flex flex-wrap gap-2'>
          <Button onClick={() => setFullscreen(true)}>全屏 Dialog</Button>
          <Button onClick={() => setAnimatedBorder(true)}>動畫邊框 Dialog</Button>
        </div>

        {/* 全屏 Dialog */}
        <Dialog {...dialogPresets.fullscreen} open={fullscreen} onOpenChange={setFullscreen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle icon={<FileText />}>全屏報表查看</DialogTitle>
              <DialogDescription>使用全屏模式查看詳細報表。</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <div className='flex h-96 items-center justify-center rounded-lg bg-muted/20'>
                <p className='text-muted-foreground'>報表內容區域</p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button onClick={() => setFullscreen(false)}>關閉全屏</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 動畫邊框 Dialog */}
        <Dialog open={animatedBorder} onOpenChange={setAnimatedBorder} size='sm'>
          <DialogContent showAnimatedBorder>
            <DialogHeader>
              <DialogTitle>動畫邊框效果</DialogTitle>
              <DialogDescription>這個 Dialog 有流光動畫邊框效果。</DialogDescription>
            </DialogHeader>
            <DialogBody>
              <p>適合用於特殊提示或重要通知。</p>
            </DialogBody>
            <DialogFooter>
              <Button onClick={() => setAnimatedBorder(false)}>好的</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* 異步操作示例 */}
      <section className='space-y-2'>
        <h3 className='text-lg font-semibold'>異步操作處理</h3>
        <Button onClick={() => setDeleteConfirm(true)} disabled={isProcessing}>
          {isProcessing ? '處理中...' : '模擬異步刪除'}
        </Button>
      </section>
    </div>
  );
}
