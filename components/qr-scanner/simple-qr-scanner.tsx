import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button } from '../ui/button';
import { CameraIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface SimpleQrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  hint?: string;
}

export const SimpleQrScanner: React.FC<SimpleQrScannerProps> = ({ open, onClose, onScan, title, hint }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!open) {
      cleanup();
      return;
    }

    startCamera();

    return cleanup;
  }, [open]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scannerRef.current) {
      // BrowserMultiFormatReader 沒有 reset 方法，直接設為 null
      scannerRef.current = null;
    }
    setIsReady(false);
    setError('');
  };

  const startCamera = async () => {
    try {
      setError('');
      setIsReady(false);

      // 請求相機權限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // 優先後置相機
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // 等待視頻加載
        videoRef.current.onloadedmetadata = () => {
          setIsReady(true);
          startScanning();
        };
      }

    } catch (err: any) {
      console.error('Camera error:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is being used by another application.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  };

  const startScanning = () => {
    if (!videoRef.current || !isReady) return;

    try {
      const codeReader = new BrowserMultiFormatReader();
      scannerRef.current = codeReader;

      // 開始掃描 - 使用正確的 API
      codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
        if (result) {
          onScan(result.getText());
          onClose();
        }
        if (err && !(err instanceof Error && err.message.includes('No MultiFormat Readers'))) {
          console.debug('Scanning...', err.message);
        }
      });

    } catch (err: any) {
      console.error('Scanning error:', err);
      setError('Failed to start scanning. Please try again.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
      <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center shadow-2xl max-w-md mx-4">
        {title && <div className="text-xl font-bold text-white mb-4 text-center">{title}</div>}
        
        <div className="min-h-[300px] flex items-center justify-center">
          {error ? (
            <div className="flex flex-col items-center text-center">
              <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Camera Error</h3>
              <p className="text-gray-300 mb-4 max-w-sm">{error}</p>
              <Button onClick={startCamera} className="mb-2" variant="outline">
                Try Again
              </Button>
            </div>
          ) : !isReady ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
              <p className="text-white text-center">Starting camera...</p>
            </div>
          ) : (
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
            </>
          )}
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