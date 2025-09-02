'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/molecules/loading/LoadingSpinner';
import { cn } from '@/lib/utils';

export interface PDFPreviewDialogProps {
  /** PDF文檔的URL */
  url?: string;
  /** 文檔名稱 */
  fileName?: string;
  /** Dialog是否打開 */
  open: boolean;
  /** 關閉Dialog的回調 */
  onOpenChange: (open: boolean) => void;
  /** 自定義樣式類名 */
  className?: string;
  /** 最大寬度 */
  maxWidth?: string;
  /** 最大高度 */
  maxHeight?: string;
}

export interface PDFPreviewState {
  loading: boolean;
  error: string | null;
  zoom: number;
  rotation: number;
  isFullscreen: boolean;
}

export const PDFPreviewDialog: React.FC<PDFPreviewDialogProps> = ({
  url,
  fileName = 'Document',
  open,
  onOpenChange,
  className,
  maxWidth = '95vw',
  maxHeight = '95vh',
}) => {
  const [state, setState] = useState<PDFPreviewState>({
    loading: true,
    error: null,
    zoom: 1,
    rotation: 0,
    isFullscreen: false,
  });

  // 重置狀態當Dialog打開時
  useEffect(() => {
    if (open) {
      setState({
        loading: true,
        error: null,
        zoom: 1,
        rotation: 0,
        isFullscreen: false,
      });
    }
  }, [open]);

  // PDF載入處理
  const handlePDFLoad = useCallback((event: React.SyntheticEvent<HTMLIFrameElement>) => {
    console.log('[PDFPreviewDialog] PDF loaded successfully');
    setState(prev => ({ ...prev, loading: false, error: null }));
  }, []);

  const handlePDFError = useCallback((event: React.SyntheticEvent<HTMLIFrameElement>) => {
    console.error('[PDFPreviewDialog] PDF load error:', event);
    setState(prev => ({ ...prev, loading: false, error: 'Failed to load PDF document' }));
  }, []);

  // 控制功能
  const handleZoomIn = useCallback(() => {
    setState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.25, 3) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.25, 0.25) }));
  }, []);

  const handleRotate = useCallback(() => {
    setState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  }, []);

  const handleFullscreen = useCallback(() => {
    setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);

  const handleDownload = useCallback(async () => {
    if (!url) return;

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('[PDFPreviewDialog] Download error:', error);
    }
  }, [url, fileName]);

  // 鍵盤快捷鍵
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onOpenChange(false);
          break;
        case '+':
        case '=':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleZoomOut();
          }
          break;
        case 'r':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleRotate();
          }
          break;
        case 'f':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange, handleZoomIn, handleZoomOut, handleRotate, handleFullscreen]);

  const dialogClass = cn(
    'p-0 max-w-none w-full h-full',
    state.isFullscreen && 'fixed inset-0 z-[100]',
    className
  );

  const contentStyle: React.CSSProperties = state.isFullscreen
    ? { width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none' }
    : { maxWidth, maxHeight, width: '90vw', height: '90vh' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={dialogClass}
        style={contentStyle}
        aria-describedby='pdf-preview-description'
      >
        {/* Header with Controls */}
        <DialogHeader className='flex-row items-center justify-between border-b bg-background/95 p-4 backdrop-blur'>
          <DialogTitle className='mr-4 flex-1 truncate text-lg font-semibold'>
            {fileName}
          </DialogTitle>

          <div className='flex flex-shrink-0 items-center gap-2'>
            {/* Zoom Controls */}
            <div className='flex items-center gap-1 rounded-md bg-muted p-1'>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleZoomOut}
                disabled={state.zoom <= 0.25}
                title='Zoom Out (Ctrl + -)'
                className='h-8 w-8 p-0'
              >
                <ZoomOut className='h-4 w-4' />
              </Button>
              <span className='min-w-[3rem] text-center text-sm'>
                {Math.round(state.zoom * 100)}%
              </span>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleZoomIn}
                disabled={state.zoom >= 3}
                title='Zoom In (Ctrl + +)'
                className='h-8 w-8 p-0'
              >
                <ZoomIn className='h-4 w-4' />
              </Button>
            </div>

            {/* Additional Controls */}
            <Button
              variant='ghost'
              size='sm'
              onClick={handleRotate}
              title='Rotate (Ctrl + R)'
              className='h-8 w-8 p-0'
            >
              <RotateCw className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={handleFullscreen}
              title='Fullscreen (Ctrl + F)'
              className='h-8 w-8 p-0'
            >
              <Maximize2 className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={handleDownload}
              title='Download'
              className='h-8 w-8 p-0'
            >
              <Download className='h-4 w-4' />
            </Button>

            <Button
              variant='ghost'
              size='sm'
              onClick={() => onOpenChange(false)}
              title='Close (Escape)'
              className='h-8 w-8 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className='flex flex-1 items-center justify-center bg-muted/20 p-4'>
          {state.loading && (
            <div className='flex flex-col items-center gap-4'>
              <LoadingSpinner size='lg' />
              <p className='text-sm text-muted-foreground'>Loading PDF...</p>
            </div>
          )}

          {state.error && (
            <div className='flex max-w-md flex-col items-center gap-4 text-center'>
              <div className='bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full'>
                <X className='text-destructive h-8 w-8' />
              </div>
              <div>
                <h3 className='mb-2 text-lg font-semibold'>Failed to Load PDF</h3>
                <p className='mb-4 text-sm text-muted-foreground'>{state.error}</p>
                <Button
                  variant='outline'
                  onClick={() => setState(prev => ({ ...prev, loading: true, error: null }))}
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!state.loading && !state.error && url && (
            <div
              className='flex h-full w-full items-center justify-center overflow-auto'
              style={{
                transform: `scale(${state.zoom}) rotate(${state.rotation}deg)`,
                transition: 'transform 0.2s ease-in-out',
              }}
            >
              <iframe
                src={`${url}#view=FitH&toolbar=0&navpanes=0&scrollbar=1`}
                className='h-full w-full border-0 bg-white shadow-lg'
                title={`PDF Preview: ${fileName}`}
                onLoad={handlePDFLoad}
                onError={handlePDFError}
                sandbox='allow-scripts allow-same-origin'
                style={{
                  minHeight: '600px',
                  minWidth: '400px',
                }}
              />
            </div>
          )}
        </div>

        {/* Invisible description for accessibility */}
        <div id='pdf-preview-description' className='sr-only'>
          PDF document viewer with zoom, rotation, and download controls. Use Ctrl+Plus to zoom in,
          Ctrl+Minus to zoom out, Ctrl+R to rotate, Ctrl+F for fullscreen, and Escape to close.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewDialog;
