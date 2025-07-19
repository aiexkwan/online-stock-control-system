'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Printer, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { PrintJobStatus, getPrintStatusMonitor } from '../services/print-status-monitor';
import { usePrinting } from '../hooks/usePrinting';
import { cn } from '@/lib/utils';

export interface PrintQueueMonitorProps {
  className?: string;
  compact?: boolean;
}

export function PrintQueueMonitor({ className, compact = false }: PrintQueueMonitorProps) {
  const { queueStatus, cancelJob } = usePrinting();
  const [activeJobs, setActiveJobs] = useState<PrintJobStatus[]>([]);
  const [completedJobs, setCompletedJobs] = useState<PrintJobStatus[]>([]);
  const [statistics, setStatistics] = useState<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageProcessingTime: number;
  } | null>(null);

  useEffect(() => {
    let monitor: {
      getActiveJobs: () => Promise<PrintJobStatus[]>;
      getCompletedJobs: () => Promise<PrintJobStatus[]>;
      getStatistics: () => Promise<{
        totalJobs: number;
        completedJobs: number;
        failedJobs: number;
        averageProcessingTime: number;
      }>;
    };
    let interval: NodeJS.Timeout;
    let updateJobsHandler: (() => Promise<void>);

    const initializeMonitor = async () => {
      try {
        monitor = getPrintStatusMonitor();

        // Update jobs periodically
        updateJobsHandler = async () => {
          try {
            setActiveJobs(await monitor.getActiveJobs());
            setCompletedJobs(await monitor.getCompletedJobs());
            const stats = await monitor.getStatistics();
            setStatistics(stats);
          } catch (err) {
            console.warn('[PrintQueueMonitor] Failed to update jobs:', err);
          }
        };

        updateJobsHandler();
        interval = setInterval(updateJobsHandler, 1000);

        // Subscribe to status changes if monitor supports events
        if ('on' in monitor && typeof monitor.on === 'function') {
          monitor.on('statusUpdate', updateJobsHandler);
        }
      } catch (err) {
        console.warn('[PrintQueueMonitor] Failed to initialize monitor:', err);
        // Retry after a delay
        setTimeout(initializeMonitor, 1000);
      }
    };

    initializeMonitor();

    return () => {
      if (interval) clearInterval(interval);
      if (monitor && updateJobsHandler && 'off' in monitor && typeof monitor.off === 'function') {
        // Use the same function reference for removal
        monitor.off('statusUpdate', updateJobsHandler);
      }
    };
  }, []);

  const getStatusIcon = (status: PrintJobStatus['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className='h-4 w-4' />;
      case 'processing':
        return <RefreshCw className='h-4 w-4 animate-spin' />;
      case 'completed':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'failed':
        return <XCircle className='h-4 w-4 text-red-600' />;
      case 'cancelled':
        return <AlertCircle className='h-4 w-4 text-gray-600' />;
    }
  };

  const getStatusBadge = (status: PrintJobStatus['status']) => {
    const variants: Record<typeof status, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      queued: 'secondary',
      processing: 'default',
      completed: 'outline',
      failed: 'destructive',
      cancelled: 'secondary',
    };

    return (
      <Badge variant={variants[status]} className='capitalize'>
        {status}
      </Badge>
    );
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const handleCancel = async (jobId: string) => {
    await cancelJob(jobId);
  };

  if (compact) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-medium'>Print Queue</CardTitle>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <Printer className='h-3 w-3' />
              {queueStatus ? `${queueStatus.pending + queueStatus.processing} active` : '0 active'}
            </div>
          </div>
        </CardHeader>
        <CardContent className='pb-3'>
          {activeJobs.length === 0 ? (
            <p className='text-xs text-muted-foreground'>No active print jobs</p>
          ) : (
            <div className='space-y-2'>
              {activeJobs.slice(0, 3).map(job => (
                <div key={job.jobId} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(job.status)}
                    <span className='max-w-[150px] truncate text-xs'>
                      {job.jobId.split('-').pop()}
                    </span>
                  </div>
                  {job.progress !== undefined && (
                    <span className='text-xs text-muted-foreground'>{job.progress}%</span>
                  )}
                </div>
              ))}
              {activeJobs.length > 3 && (
                <p className='text-xs text-muted-foreground'>+{activeJobs.length - 3} more</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Printer className='h-5 w-5' />
            Print Queue Monitor
          </CardTitle>
          {statistics && (
            <div className='flex items-center gap-4 text-sm text-muted-foreground'>
              <span>Total: {statistics.totalJobs}</span>
              <span className='text-green-600'>✓ {statistics.completedJobs}</span>
              <span className='text-red-600'>✗ {statistics.failedJobs}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Queue Summary */}
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center'>
              <p className='text-2xl font-bold'>{queueStatus?.pending || 0}</p>
              <p className='text-sm text-muted-foreground'>Pending</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold'>{queueStatus?.processing || 0}</p>
              <p className='text-sm text-muted-foreground'>Processing</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold'>{statistics?.completedJobs || 0}</p>
              <p className='text-sm text-muted-foreground'>Completed</p>
            </div>
          </div>

          {/* Active Jobs */}
          <div>
            <h4 className='mb-2 text-sm font-medium'>Active Jobs</h4>
            <div className='h-[200px] overflow-y-auto rounded-md border'>
              {activeJobs.length === 0 ? (
                <div className='p-4 text-center text-muted-foreground'>No active print jobs</div>
              ) : (
                <div className='space-y-2 p-2'>
                  {activeJobs.map(job => (
                    <div
                      key={job.jobId}
                      className='flex items-center justify-between rounded-md p-2 hover:bg-gray-50'
                    >
                      <div className='flex items-center gap-3'>
                        {getStatusIcon(job.status)}
                        <div>
                          <p className='text-sm font-medium'>
                            {job.jobId.split('-').slice(-2).join('-')}
                          </p>
                          {job.message && (
                            <p className='text-xs text-muted-foreground'>{job.message}</p>
                          )}
                        </div>
                      </div>
                      <div className='flex items-center gap-2'>
                        {job.progress !== undefined && job.status === 'processing' && (
                          <div className='w-20'>
                            <Progress value={job.progress} className='h-2' />
                          </div>
                        )}
                        {getStatusBadge(job.status)}
                        {job.status === 'queued' && (
                          <Button size='sm' variant='ghost' onClick={() => handleCancel(job.jobId)}>
                            <XCircle className='h-4 w-4' />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Completed */}
          <div>
            <h4 className='mb-2 text-sm font-medium'>Recently Completed</h4>
            <div className='space-y-1'>
              {completedJobs.map(job => (
                <div key={job.jobId} className='flex items-center justify-between text-sm'>
                  <div className='flex items-center gap-2'>
                    {getStatusIcon(job.status)}
                    <span className='text-muted-foreground'>
                      {job.jobId.split('-').slice(-2).join('-')}
                    </span>
                  </div>
                  <span className='text-xs text-muted-foreground'>
                    {formatTime(job.completedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
