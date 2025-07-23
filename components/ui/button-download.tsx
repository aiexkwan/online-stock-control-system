'use client';

import { Download, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DownloadButtonProps {
  downloadStatus: 'idle' | 'downloading' | 'downloaded' | 'complete';
  progress: number;
  onClick: () => void;
  className?: string;
}

export default function DownloadButton({
  downloadStatus,
  progress,
  onClick,
  className,
}: DownloadButtonProps) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        'relative w-40 select-none overflow-hidden rounded-xl',
        downloadStatus === 'downloading' && 'bg-primary/50 hover:bg-primary/50',
        downloadStatus !== 'idle' && 'pointer-events-none',
        className
      )}
    >
      {downloadStatus === 'idle' && (
        <>
          <Download className='h-4 w-4' />
          Download
        </>
      )}
      {downloadStatus === 'downloading' && (
        <div className='z-[5] flex items-center justify-center'>
          <div className='mr-2 h-1 w-4 bg-current rounded-full opacity-75' />
          {progress}%
        </div>
      )}
      {downloadStatus === 'downloaded' && (
        <>
          <CheckCircle className='h-4 w-4' />
          <span className='t'>Downloaded</span>
        </>
      )}
      {downloadStatus === 'complete' && <span className='text-primary'>Download</span>}
      {downloadStatus === 'downloading' && (
        <div
          className='absolute inset-0 bottom-0 left-0 z-[3] h-full bg-primary transition-all duration-200 ease-in-out'
          style={{ width: `${progress}%` }}
        />
      )}
    </Button>
  );
}
