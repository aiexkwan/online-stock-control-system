/**
 * PDF Preview Overlay Component
 * Full-screen overlay for PDF preview with glassmorphic design
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface PDFPreviewOverlayProps {
  isOpen: boolean;
  pdfUrl: string;
  fileName: string;
  onClose: () => void;
}

export const PDFPreviewOverlay: React.FC<PDFPreviewOverlayProps> = ({
  isOpen,
  pdfUrl,
  fileName,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleResetZoom();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          handleRotate();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      console.log('PDF Preview opening with URL:', pdfUrl);
      setLoading(true);
      setError(null);
      setScale(100);
      setRotation(0);
      document.body.style.overflow = 'hidden';

      // Set a shorter timeout to handle cases where onLoad never fires
      const timeout = setTimeout(() => {
        console.log('PDF load timeout reached, stopping loading state');
        setLoading(false);
      }, 3000); // 3 second timeout

      return () => {
        clearTimeout(timeout);
      };
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, pdfUrl]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 25, 25));
  };

  const handleResetZoom = () => {
    setScale(100);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFullscreen = async () => {
    const container = document.getElementById('pdf-preview-container');
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const handleIframeLoad = useCallback(() => {
    console.log('PDF iframe loaded successfully');
    setLoading(false);
    setError(null);
  }, []);

  const handleIframeError = useCallback(() => {
    console.error('PDF iframe failed to load:', pdfUrl);
    setError('Failed to load PDF. The file may be corrupted or unavailable.');
    setLoading(false);
  }, [pdfUrl]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col',
        'bg-black/85 backdrop-blur-xl',
        'animate-in fade-in-0 duration-200'
      )}
      id='pdf-preview-container'
      role='dialog'
      aria-labelledby='pdf-title'
      aria-modal='true'
    >
      {/* Top toolbar */}
      <div
        className={cn(
          'flex items-center justify-between px-4 py-3',
          'bg-gray-900/80 backdrop-blur-md',
          'border-b border-green-500/20'
        )}
      >
        {/* Left section */}
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onClose}
            className='text-gray-300 hover:bg-white/10 hover:text-white'
          >
            <ChevronLeftIcon className='mr-2 h-4 w-4' />
            Back
          </Button>
          <div className='flex items-center gap-2'>
            <DocumentTextIcon className='h-5 w-5 text-green-400' />
            <h1
              id='pdf-title'
              className='max-w-[300px] truncate text-sm font-medium text-white md:max-w-[500px]'
              title={fileName}
            >
              {fileName}
            </h1>
          </div>
        </div>

        {/* Right section */}
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            onClick={onClose}
            className='text-gray-300 hover:bg-white/10 hover:text-white'
            aria-label='Close PDF preview'
          >
            <XMarkIcon className='h-5 w-5' />
          </Button>
        </div>
      </div>

      {/* PDF content area */}
      <div className='relative flex-1 overflow-hidden bg-gray-950/50'>
        {loading && (
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-4'>
            <Skeleton className='h-[800px] max-h-[80%] w-[600px] max-w-[90%]' />
            <p className='text-sm text-gray-400'>Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-4'>
            <div className='max-w-md p-8 text-center'>
              <DocumentTextIcon className='mx-auto mb-4 h-16 w-16 text-gray-500' />
              <h2 className='mb-2 text-xl font-semibold text-white'>Unable to load PDF</h2>
              <p className='mb-6 text-sm text-gray-400'>{error}</p>
              <div className='flex justify-center gap-3'>
                <Button
                  variant='outline'
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className='border-gray-600 text-gray-300 hover:bg-white/10'
                >
                  Open in new tab
                </Button>
              </div>
            </div>
          </div>
        )}

        {!error && (
          <iframe
            key={pdfUrl} // Force re-render when URL changes
            src={pdfUrl}
            className={cn('h-full w-full border-0', loading && 'invisible')}
            style={{
              transform: `scale(${scale / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
            title={`PDF Preview: ${fileName}`}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            ref={iframe => {
              // Additional load detection
              if (iframe && pdfUrl) {
                iframe.addEventListener('load', () => {
                  console.log('Iframe load event triggered');
                  setLoading(false);
                });
              }
            }}
          />
        )}
      </div>

      {/* Bottom control bar */}
      <div
        className={cn(
          'flex items-center justify-center gap-4 px-4 py-3',
          'bg-gray-900/80 backdrop-blur-md',
          'border-t border-green-500/20'
        )}
      >
        {/* Zoom controls */}
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='icon'
            onClick={handleZoomOut}
            disabled={scale <= 25}
            className='text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-50'
            aria-label='Zoom out'
          >
            <MagnifyingGlassMinusIcon className='h-4 w-4' />
          </Button>
          <span className='min-w-[60px] text-center text-sm text-gray-300'>{scale}%</span>
          <Button
            variant='ghost'
            size='icon'
            onClick={handleZoomIn}
            disabled={scale >= 300}
            className='text-gray-300 hover:bg-white/10 hover:text-white disabled:opacity-50'
            aria-label='Zoom in'
          >
            <MagnifyingGlassPlusIcon className='h-4 w-4' />
          </Button>
        </div>

        <div className='h-6 w-px bg-gray-700' />

        {/* Other controls */}
        <Button
          variant='ghost'
          size='sm'
          onClick={handleResetZoom}
          className='text-gray-300 hover:bg-white/10 hover:text-white'
        >
          Reset Zoom
        </Button>
        <Button
          variant='ghost'
          size='icon'
          onClick={handleRotate}
          className='text-gray-300 hover:bg-white/10 hover:text-white'
          aria-label='Rotate PDF'
        >
          <ArrowPathIcon className='h-4 w-4' />
        </Button>
        <Button
          variant='ghost'
          size='icon'
          onClick={handleFullscreen}
          className='text-gray-300 hover:bg-white/10 hover:text-white'
          aria-label='Toggle fullscreen'
        >
          <ArrowsPointingOutIcon className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
};

export default PDFPreviewOverlay;
