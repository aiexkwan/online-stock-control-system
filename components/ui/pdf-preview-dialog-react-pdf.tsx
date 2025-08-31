'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner';
import { cn } from '@/lib/utils';

// 注意：這個組件需要安裝 react-pdf
// npm install react-pdf

export interface PDFPreviewDialogReactPDFProps {
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

export interface PDFState {
  loading: boolean;
  error: string | null;
  zoom: number;
  rotation: number;
  isFullscreen: boolean;
  numPages: number | null;
  currentPage: number;
}

/**
 * PDF預覽Dialog組件 - react-pdf版本
 *
 * 優點：
 * - 更好的PDF渲染控制
 * - 客戶端PDF處理，無需iframe
 * - 頁面導航功能
 * - 更好的縮放和旋轉控制
 *
 * 缺點：
 * - 需要額外依賴
 * - 構建包更大
 * - 需要配置webpack
 *
 * 使用前需要：
 * 1. npm install react-pdf
 * 2. 在next.config.js中添加webpack配置
 * 3. 在app中添加worker配置
 */
export const PDFPreviewDialogReactPDF: React.FC<PDFPreviewDialogReactPDFProps> = ({
  url,
  fileName = 'Document',
  open,
  onOpenChange,
  className,
  maxWidth = '95vw',
  maxHeight = '95vh',
}) => {
  const [state, setState] = useState<PDFState>({
    loading: true,
    error: null,
    zoom: 1,
    rotation: 0,
    isFullscreen: false,
    numPages: null,
    currentPage: 1,
  });

  // 因為react-pdf需要動態導入，我們使用iframe作為fallback
  const [_useReactPDF, _setUseReactPDF] = useState<boolean>(false);

  // PDF載入處理
  const _handleDocumentLoad = useCallback(({ numPages }: { numPages: number }): void => {
    setState(prev => ({
      ...prev,
      loading: false,
      error: null,
      numPages,
      currentPage: 1,
    }));
  }, []);

  const _handleDocumentError = useCallback((error: Error): void => {
    console.error('[PDFPreviewDialog] PDF load error:', error);
    setState(prev => ({
      ...prev,
      loading: false,
      error: error.message,
    }));
  }, []);

  // 控制功能
  const handleZoomIn = useCallback((): void => {
    setState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.25, 3) }));
  }, []);

  const handleZoomOut = useCallback((): void => {
    setState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.25, 0.25) }));
  }, []);

  const handleRotate = useCallback((): void => {
    setState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  }, []);

  const handleFullscreen = useCallback((): void => {
    setState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }));
  }, []);

  const handlePageChange = useCallback((page: number): void => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.numPages || 1)),
    }));
  }, []);

  const handleDownload = useCallback(async (): Promise<void> => {
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

  // 重置狀態當Dialog打開時
  React.useEffect(() => {
    if (open) {
      setState({
        loading: true,
        error: null,
        zoom: 1,
        rotation: 0,
        isFullscreen: false,
        numPages: null,
        currentPage: 1,
      });
    }
  }, [open]);

  // 鍵盤快捷鍵
  React.useEffect(() => {
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
        case 'ArrowLeft':
          if (state.numPages && state.currentPage > 1) {
            handlePageChange(state.currentPage - 1);
          }
          break;
        case 'ArrowRight':
          if (state.numPages && state.currentPage < state.numPages) {
            handlePageChange(state.currentPage + 1);
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
  }, [
    open,
    onOpenChange,
    handleZoomIn,
    handleZoomOut,
    handleRotate,
    handleFullscreen,
    handlePageChange,
    state.numPages,
    state.currentPage,
  ]);

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
            {state.numPages && (
              <span className='ml-2 text-sm font-normal text-muted-foreground'>
                Page {state.currentPage} of {state.numPages}
              </span>
            )}
          </DialogTitle>

          <div className='flex flex-shrink-0 items-center gap-2'>
            {/* Page Navigation */}
            {state.numPages && state.numPages > 1 && (
              <div className='flex items-center gap-1 rounded-md bg-muted p-1'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handlePageChange(state.currentPage - 1)}
                  disabled={state.currentPage <= 1}
                  title='Previous Page (←)'
                  className='h-8 w-8 p-0'
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <span className='min-w-[4rem] text-center text-sm'>
                  {state.currentPage}/{state.numPages}
                </span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handlePageChange(state.currentPage + 1)}
                  disabled={state.currentPage >= state.numPages}
                  title='Next Page (→)'
                  className='h-8 w-8 p-0'
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            )}

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
                <FileText className='text-destructive h-8 w-8' />
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
            <div className='flex h-full w-full items-center justify-center overflow-auto'>
              {/* 這裡應該是react-pdf的Document和Page組件 */}
              {/* 由於沒有安裝react-pdf，我們使用iframe作為fallback */}
              <iframe
                src={`${url}#page=${state.currentPage}&zoom=${Math.round(state.zoom * 100)}&view=FitH&toolbar=0&navpanes=0&scrollbar=1`}
                className='h-full w-full border-0 bg-white shadow-lg'
                title={`PDF Preview: ${fileName}`}
                onLoad={(): void => setState(prev => ({ ...prev, loading: false, error: null }))}
                onError={(): void =>
                  setState(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Failed to load PDF document',
                  }))
                }
                sandbox='allow-scripts allow-same-origin'
                style={{
                  minHeight: '600px',
                  minWidth: '400px',
                  transform: `scale(${state.zoom}) rotate(${state.rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out',
                }}
              />
            </div>
          )}
        </div>

        {/* Invisible description for accessibility */}
        <div id='pdf-preview-description' className='sr-only'>
          PDF document viewer with zoom, rotation, page navigation and download controls. Use arrow
          keys to navigate pages, Ctrl+Plus/Minus to zoom, Ctrl+R to rotate, Ctrl+F for fullscreen,
          and Escape to close.
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreviewDialogReactPDF;
