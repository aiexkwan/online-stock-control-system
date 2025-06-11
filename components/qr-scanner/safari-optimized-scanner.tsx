'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { CameraIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface SafariOptimizedScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  hint?: string;
}

type ScannerState = 'initializing' | 'ready' | 'error' | 'permission-denied';

export const SafariOptimizedScanner: React.FC<SafariOptimizedScannerProps> = ({ 
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
  const [isScanning, setIsScanning] = useState(false);
  const [jsQR, setJsQR] = useState<any>(null);

  // 動態加載 jsQR（更安全的方式）
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('jsqr').then((module) => {
        console.log('jsQR loaded successfully');
        setJsQR(() => module.default);
      }).catch((err) => {
        console.error('Failed to load jsQR:', err);
        setState('error');
        setErrorMessage('Failed to load QR scanner library. Please refresh the page.');
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
        
        // 針對 iPhone Safari 優化的相機配置
        const constraints = {
          video: {
            width: { ideal: 640, max: 640 },
            height: { ideal: 480, max: 480 },
            facingMode: 'environment', // iPhone 後置相機
            frameRate: { ideal: 30, max: 30 }
          }
        };

        console.log('Requesting camera with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (stopped) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log('Camera stream obtained successfully');
        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        // 等待視頻準備就緒
        videoRef.current.onloadedmetadata = () => {
          if (stopped) return;
          console.log('Video metadata loaded, starting scanning');
          setState('ready');
          setIsScanning(true);
          startScanning();
        };

        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
          setState('error');
          setErrorMessage('Video playback error');
        };

        const startScanning = () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          if (!video || !canvas || stopped) return;

          const context = canvas.getContext('2d');
          if (!context) {
            console.error('Cannot get 2D context');
            setState('error');
            setErrorMessage('Canvas context error');
            return;
          }

          let scanCount = 0;
          const maxScans = 3000; // 5分鐘限制

          const scan = () => {
            if (stopped || !video || !canvas || scanCount > maxScans) return;

            scanCount++;

            try {
              if (video.readyState === video.HAVE_ENOUGH_DATA) {
                // 設置 canvas 尺寸匹配視頻
                const videoWidth = video.videoWidth;
                const videoHeight = video.videoHeight;
                
                if (videoWidth > 0 && videoHeight > 0) {
                  canvas.width = videoWidth;
                  canvas.height = videoHeight;

                  // 繪製視頻幀到 canvas
                  context.drawImage(video, 0, 0, videoWidth, videoHeight);

                  // 獲取圖像數據
                  const imageData = context.getImageData(0, 0, videoWidth, videoHeight);

                  // 使用 jsQR 解碼
                  const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                  });

                  if (code && code.data && !stopped) {
                    console.log('QR Code detected:', code.data);
                    stopped = true;
                    setIsScanning(false);
                    onScan(code.data);
                    onClose();
                    return;
                  }
                }
              }
            } catch (scanError) {
              console.debug('Scan error (normal):', scanError);
            }

            // 繼續掃描 - 針對 iPhone 調整頻率
            if (!stopped) {
              animationId = requestAnimationFrame(scan);
            }
          };

          scan();
        };
        
      } catch (err: any) {
        console.error('Safari camera scanning error:', err);
        setState('error');
        
        if (err.name === 'NotAllowedError') {
          setState('permission-denied');
          setErrorMessage('Camera permission denied. Please allow camera access.');
        } else if (err.name === 'NotFoundError') {
          setErrorMessage('No camera found. Please ensure your device has a camera.');
        } else if (err.name === 'NotReadableError') {
          setErrorMessage('Camera is being used by another application.');
        } else if (err.name === 'OverconstrainedError') {
          setErrorMessage('Camera constraints not supported. Trying fallback...');
          // 嘗試更簡單的約束條件
          tryFallbackConstraints();
        } else {
          setErrorMessage(err.message || 'Failed to access camera. Please try again.');
        }
      }
    };

    // 備用約束條件
    const tryFallbackConstraints = async () => {
      try {
        console.log('Trying fallback constraints...');
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true // 最簡單的約束
        });
        
        if (stopped) {
          fallbackStream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          setState('ready');
          setIsScanning(true);
        }
      } catch (fallbackErr: any) {
        console.error('Fallback also failed:', fallbackErr);
        setState('error');
        setErrorMessage('All camera access methods failed.');
      }
    };

    startScanner();

    return () => {
      stopped = true;
      setIsScanning(false);
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
            <p className="text-white text-center">Initializing Safari-optimized scanner...</p>
            <p className="text-gray-300 text-sm text-center mt-2">
              Loading QR decoder for iPhone/Safari...
            </p>
          </div>
        );

      case 'ready':
        return (
          <div className="relative">
            <video 
              ref={videoRef} 
              className="w-[350px] h-[280px] bg-black rounded-lg object-cover" 
              autoPlay 
              muted 
              playsInline
              webkit-playsinline="true"
            />
            <canvas 
              ref={canvasRef} 
              className="hidden" 
            />
            {hint && <div className="text-sm text-gray-300 mt-2 mb-2 text-center">{hint}</div>}
            <div className="text-xs text-gray-400 text-center mt-2">
              Position the QR code within the scanning area
            </div>
            <div className="text-xs text-green-400 text-center mt-1">
              {isScanning ? '📱 Safari Scanner active - Scanning...' : '📱 Safari Scanner ready'}
            </div>
            
            {/* 針對 iPhone 優化的掃描框 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 border-2 border-green-400 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
              </div>
            </div>
          </div>
        );

      case 'permission-denied':
        return (
          <div className="flex flex-col items-center text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Camera Permission Required</h3>
            <p className="text-gray-300 mb-4 max-w-sm">
              Please allow camera access in Safari settings.
            </p>
                         <div className="text-sm text-gray-400 mb-4">
               <p>For iPhone Safari:</p>
               <ul className="list-disc list-inside mt-2 space-y-1">
                 <li>Settings &gt; Safari &gt; Camera</li>
                 <li>Allow camera access for this website</li>
                 <li>Refresh the page</li>
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