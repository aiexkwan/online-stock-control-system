'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button } from '../ui/button';
import { CameraIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface DirectQrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  hint?: string;
}

type ScannerState = 'initializing' | 'ready' | 'error' | 'permission-denied';

export const DirectQrScanner: React.FC<DirectQrScannerProps> = ({ 
  open, 
  onClose, 
  onScan, 
  title, 
  hint 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [state, setState] = useState<ScannerState>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setState('initializing');
      setErrorMessage('');
      return;
    }

    let stopped = false;
    let scanInterval: NodeJS.Timeout;
    
    const startScanner = async () => {
      if (!videoRef.current) return;
      
      try {
        setState('initializing');
        
        // 直接使用 getUserMedia，就像基礎測試一樣
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: { ideal: 'environment' } // 優先後置相機
          }
        });

        if (stopped) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        // 等待視頻加載
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          }
        });

        setState('ready');

        // 創建 QR 掃描器
        const codeReader = new BrowserMultiFormatReader();
        scannerRef.current = codeReader;

        // 開始掃描循環
        const scanFrame = async () => {
          if (stopped || !videoRef.current || !scannerRef.current) return;

          try {
            const result = await scannerRef.current.decodeFromVideoElement(videoRef.current);
            if (result && !stopped) {
              stopped = true;
              onScan(result.getText());
              onClose();
              return;
            }
          } catch (err) {
            // 掃描失敗是正常的，繼續嘗試
          }

          // 每 100ms 掃描一次
          if (!stopped) {
            scanInterval = setTimeout(scanFrame, 100);
          }
        };

        // 開始掃描
        scanFrame();
        
      } catch (err: any) {
        console.error('Direct camera scanning error:', err);
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
      if (scanInterval) clearTimeout(scanInterval);
      
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
  }, [open, onClose, onScan]);

  if (!open) return null;

  const renderContent = () => {
    switch (state) {
      case 'initializing':
        return (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white text-center">Initializing camera...</p>
            <p className="text-gray-300 text-sm text-center mt-2">
              Please allow camera access when prompted
            </p>
          </div>
        );

      case 'ready':
        return (
          <>
            <video 
              ref={videoRef} 
              className="w-[400px] h-[300px] bg-black rounded-lg" 
              autoPlay 
              muted 
              playsInline 
            />
            {hint && <div className="text-sm text-gray-300 mt-2 mb-2 text-center">{hint}</div>}
            <div className="text-xs text-gray-400 text-center mt-2">
              Position the QR code within the frame
            </div>
            <div className="text-xs text-green-400 text-center mt-1">
              📹 Camera active - Scanning for QR codes...
            </div>
          </>
        );

      case 'permission-denied':
        return (
          <div className="flex flex-col items-center text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Camera Permission Required</h3>
            <p className="text-gray-300 mb-4 max-w-sm">
              Please allow camera access in your browser to scan QR codes.
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
            <h3 className="text-lg font-semibold text-white mb-2">Camera Error</h3>
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