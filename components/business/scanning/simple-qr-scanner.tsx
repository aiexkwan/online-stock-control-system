'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface SimpleQRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

export const SimpleQRScanner: React.FC<SimpleQRScannerProps> = ({
  open,
  onClose,
  onScan,
  title = 'QR Code Scanner',
}) => {
  // Initialize all hooks at the top level (legacy implementation)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [isScanning, setIsScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const isCleaningRef = useRef<boolean>(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cleanup function (legacy implementation)
  const cleanup = useCallback(() => {
    if (isCleaningRef.current) {
      return; // Silent skip to reduce log spam
    }

    isCleaningRef.current = true;
    isScanningRef.current = false;
    setIsScanning(false);

    // Cancel animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Stop video stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      videoRef.current.srcObject = null;

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }

    // Stop stream ref
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Reset cleaning flag
    setTimeout(() => {
      isCleaningRef.current = false;
    }, 50);
  }, []);

  // Handle close button click (legacy implementation)
  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [onClose, cleanup]);

  // Main scanning effect (legacy implementation)
  useEffect(() => {
    if (!open) {
      cleanup();
      setStatus('Initializing...');
      return;
    }

    // 確保開新相機之前，舊嘅已經關閉
    cleanup();

    // Strategy 4: unknown + type narrowing - 修復錯誤的類型定義
    let jsQR: typeof import('jsqr').default | null = null;
    let localStream: MediaStream | null = null;

    const initializeScanner = async () => {
      try {
        // Load jsQR library
        const jsQRModule = await import('jsqr');
        jsQR = jsQRModule.default;

        // Request camera permission
        setStatus('Requesting camera permission...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isMobile ? 'environment' : 'user',
            width: { ideal: isMobile ? 1280 : 1920 },
            height: { ideal: isMobile ? 720 : 1080 },
          },
        });

        localStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadedmetadata', () => {
            setStatus('Camera ready. Position QR code in view.');
            setIsScanning(true);
            isScanningRef.current = true;
            if (jsQR) startScanning(jsQR);
          });
        }
      } catch (error) {
        console.error('Camera initialization error:', error);
        setStatus('Failed to access camera. Please check permissions.');
      }
    };

    const startScanning = (jsQRLib: typeof import('jsqr').default) => {
      const scan = () => {
        if (!videoRef.current || !canvasRef.current || !jsQRLib || !isScanningRef.current) {
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
          animationRef.current = requestAnimationFrame(scan);
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        try {
          const code = jsQRLib(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            setStatus('QR Code detected!');
            isScanningRef.current = false;
            setIsScanning(false);

            // 先 cleanup，然後延遲 call onScan
            cleanup();

            // 添加觸覺反饋 (移動裝置)
            if (isMobile && 'vibrate' in navigator) {
              navigator.vibrate([50, 50, 50]); // 成功掃描振動
            }

            // 用 setTimeout 確保 cleanup 完成先 call onScan
            setTimeout(() => {
              onScan(code.data);
            }, 50);

            return;
          }
        } catch (error) {
          console.error('QR scanning error:', error);
        }

        animationRef.current = requestAnimationFrame(scan);
      };

      animationRef.current = requestAnimationFrame(scan);
    };

    initializeScanner();

    return () => {
      // 停止 local stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      // 最後清理
      cleanup();
    };
  }, [open, onScan, cleanup, isMobile]);

  if (!open) return null;

  // 確保只喺 client side render
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 p-4'
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
      onClick={e => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className={`relative rounded-lg bg-white ${isMobile ? 'h-full max-h-screen w-full p-4' : 'w-full max-w-lg p-6'}`}
        style={{ zIndex: 10000 }}
        onClick={e => e.stopPropagation()}
      >
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-xl font-bold text-black'>{title}</h2>
          <Button
            onClick={handleClose}
            variant='ghost'
            size='sm'
            className='text-gray-500 hover:text-gray-700'
          >
            <XMarkIcon className='h-5 w-5' />
          </Button>
        </div>

        <div className='space-y-4'>
          <div
            className='relative overflow-hidden rounded-lg bg-black'
            style={{ height: isMobile ? 'calc(100vh - 200px)' : '300px' }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className='h-full w-full object-cover'
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas ref={canvasRef} className='hidden' />

            {/* Scanning indicator */}
            {isScanning && (
              <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                <div className='h-48 w-48 animate-pulse rounded-lg border-2 border-green-500'></div>
              </div>
            )}

            {/* Status message */}
            <div className='absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 p-2 text-center text-sm text-white'>
              {status}
            </div>
          </div>

          <div className='space-y-1 text-sm text-gray-600'>
            <p>
              •{' '}
              {isMobile
                ? 'Hold device steady when scanning'
                : 'Hold the QR code steady within the frame'}
            </p>
            <p>• Ensure good lighting conditions</p>
            <p>
              •{' '}
              {isMobile
                ? 'Point camera at barcode/QR code'
                : 'Keep the code flat and avoid reflections'}
            </p>
            {isMobile && <p>• Tap anywhere outside to close scanner</p>}
          </div>

          <Button onClick={handleClose} variant='outline' className='w-full'>
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
