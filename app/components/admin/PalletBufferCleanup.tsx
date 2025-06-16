'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Trash2, RefreshCw, AlertCircle } from 'lucide-react';

interface CleanupResult {
  success: boolean;
  deleted_old_days?: number;
  deleted_used?: number;
  deleted_unused?: number;
  total_deleted?: number;
  entries_before?: number;
  entries_after?: number;
  cleaned_at?: string;
}

export function PalletBufferCleanup() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<CleanupResult | null>(null);
  
  const handleCleanup = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/cleanup-pallet-buffer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.result) {
        setLastCleanup(data.result);
        toast.success(`Cleanup completed! Deleted ${data.result.total_deleted} entries`);
      } else {
        toast.error('Cleanup failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.error('Failed to cleanup buffer: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleAutoSetup = useCallback(async () => {
    // 這裡可以設置自動清理
    toast.info('Auto cleanup can be configured using external cron services like Vercel Cron or GitHub Actions');
  }, []);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Pallet Buffer Cleanup
        </CardTitle>
        <CardDescription>
          Manage and clean up unused pallet number buffer entries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 清理規則說明 */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Automatic Cleanup Rules
          </h4>
          <ul className="text-sm space-y-1 ml-6">
            <li>• Removes entries from previous days</li>
            <li>• Deletes used entries older than 2 hours</li>
            <li>• Removes unused entries older than 30 minutes</li>
            <li>• Maintains maximum 100 unused entries</li>
          </ul>
        </div>
        
        {/* 上次清理結果 */}
        {lastCleanup && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-green-800 dark:text-green-200">
              Last Cleanup Results
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Old days removed:</div>
              <div className="font-mono">{lastCleanup.deleted_old_days || 0}</div>
              <div>Used entries removed:</div>
              <div className="font-mono">{lastCleanup.deleted_used || 0}</div>
              <div>Unused entries removed:</div>
              <div className="font-mono">{lastCleanup.deleted_unused || 0}</div>
              <div className="font-semibold">Total removed:</div>
              <div className="font-mono font-semibold">{lastCleanup.total_deleted || 0}</div>
              <div>Entries remaining:</div>
              <div className="font-mono">{lastCleanup.entries_after || 0}</div>
            </div>
          </div>
        )}
        
        {/* 操作按鈕 */}
        <div className="flex gap-2">
          <Button
            onClick={handleCleanup}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Cleaning...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Manual Cleanup
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleAutoSetup}
            className="flex-1"
          >
            Setup Auto Cleanup
          </Button>
        </div>
        
        {/* 自動清理說明 */}
        <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
          <p className="font-semibold mb-1">Automatic Cleanup Options:</p>
          <ul className="space-y-1 ml-4">
            <li>• Use Vercel Cron Jobs (Pro plan)</li>
            <li>• GitHub Actions scheduled workflow</li>
            <li>• External monitoring services (UptimeRobot, etc.)</li>
            <li>• Call <code className="text-xs bg-black/10 px-1 py-0.5 rounded">POST /api/cleanup-pallet-buffer</code></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}