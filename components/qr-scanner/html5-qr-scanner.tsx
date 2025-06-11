'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { CameraIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface Html5QrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  hint?: string;
}

type ScannerState = 'initializing' | 'ready' | 'error' | 'permission-denied';

export const Html5QrScanner: React.FC<Html5QrScannerProps> = ({ 
  open, 
  onClose, 
  onScan, 
  title, 
  hint 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<ScannerState>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [jsQR, setJsQR] = useState<((data: Uint8ClampedArray, width: number, height: number, options?: any) => any) | null>(null);

  // 動態加載 jsQR
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('jsqr').then((module) => {
        setJsQR(() => module.default);
      }).catch((err) => {
        console.error('Failed to load jsQR:', err);
        setState('error');
        setErrorMessage('Failed to load QR scanner library');
      });
    }
  }, []);

  useEffect(() => {
    if (!open || !jsQR) {
      setState('initializing');
      setErrorMessage('');
      return;
    }

    let stopped = false;
    let animationId: number;
    
    const startScanner = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      try {
        setState('initializing');
        
        // 使用與基礎測試相同的方法
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: { ideal: 'environment' }
          }
        });

        if (stopped) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        // 等待視頻準備就緒
        videoRef.current.onloadedmetadata = () => {
          if (stopped) return;
          setState('ready');
          startScanning();
        };

        const startScanning = () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          if (!video || !canvas || stopped) return;

          const context = canvas.getContext('2d');
          if (!context) return;

          const scan = () => {
            if (stopped || !video || !canvas) return;

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              // 設置 canvas 尺寸
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              // 繪製視頻幀到 canvas
              context.drawImage(video, 0, 0, canvas.width, canvas.height);

              // 獲取圖像數據
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

              // 使用 jsQR 解碼
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });

              if (code && !stopped) {
                stopped = true;
                onScan(code.data);
                onClose();
                return;
              }
            }

            // 繼續掃描
            if (!stopped) {
              animationId = requestAnimationFrame(scan);
            }
          };

          scan();
        };
        
      } catch (err: any) {
        console.error('HTML5 camera scanning error:', err);
        setState('error');
        
        if (err.name === 'NotAllowedError') {
          setState('permission-denied');
          setErrorMessage('Camera permission denied. Please allow camera access.');
        } else if (err.name === 'NotFoundError') {
          setErrorMessage('No camera found. Please ensure your device has a camera.');
        } else if (err.name === 'NotReadableError') {
          setErrorMessage('Camera is being used by another application.');
        } else {
          setErrorMessage(err.message || 'Failed to access camera. Please try again.');
        }
      }
    };

    startScanner();

    return () => {
      stopped = true;
      if (animationId) cancelAnimationFrame(animationId);
      
      // 停止視頻流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // 清理視頻元素
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [open, onClose, onScan, jsQR]);

  if (!open) return null;

  const renderContent = () => {
    switch (state) {
      case 'initializing':
        return (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white text-center">Initializing HTML5 scanner...</p>
            <p className="text-gray-300 text-sm text-center mt-2">
              Loading QR decoder and camera...
            </p>
          </div>
        );

      case 'ready':
        return (
          <div className="relative">
            <video 
              ref={videoRef} 
              className="w-[400px] h-[300px] bg-black rounded-lg" 
              autoPlay 
              muted 
              playsInline 
            />
            <canvas 
              ref={canvasRef} 
              className="hidden" 
            />
            {hint && <div className="text-sm text-gray-300 mt-2 mb-2 text-center">{hint}</div>}
            <div className="text-xs text-gray-400 text-center mt-2">
              Position the QR code within the frame
            </div>
            <div className="text-xs text-green-400 text-center mt-1">
              📹 HTML5 Scanner active - Scanning for QR codes...
            </div>
            
            {/* 掃描框覆蓋層 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-green-400 border-dashed rounded-lg opacity-50"></div>
            </div>
          </div>
        );

      case 'permission-denied':
        return (
          <div className="flex flex-col items-center text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Camera Permission Required</h3>
            <p className="text-gray-300 mb-4 max-w-sm">
              Please allow camera access in your browser's address bar
            </p>
            <div className="text-sm text-gray-400 mb-4">
              <p>To enable camera access:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Click the camera icon in your browser's address bar</li>
                <li>Select "Allow" for camera permissions</li>
                <li>Refresh the page if needed</li>
              </ul>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Scanner Error</h3>
            <p className="text-gray-300 mb-4 max-w-sm">
              {errorMessage}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mb-2"
              variant="outline"
            >
              Refresh Page
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
      <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center shadow-2xl max-w-md mx-4">
        {title && <div className="text-xl font-bold text-white mb-4 text-center">{title}</div>}
        
        <div className="min-h-[300px] flex items-center justify-center">
          {renderContent()}
        </div>
        
        <Button 
          className="mt-6 w-32" 
          variant="destructive" 
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  );
}; 