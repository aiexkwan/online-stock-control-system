import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button } from '../ui/button';
import { CameraIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface QrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  hint?: string;
}

type ScannerState = 'initializing' | 'ready' | 'error' | 'no-camera' | 'permission-denied';

export const QrScanner: React.FC<QrScannerProps> = ({ open, onClose, onScan, title, hint }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<{ codeReader: BrowserMultiFormatReader, controls: any } | null>(null);
  const [state, setState] = useState<ScannerState>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setState('initializing');
      setErrorMessage('');
      return;
    }

    let stopped = false;
    let timeoutId: NodeJS.Timeout;
    
    const startScanner = async () => {
      if (!videoRef.current) return;
      
      try {
        setState('initializing');
        
        // 設置超時機制
        timeoutId = setTimeout(() => {
          if (!stopped) {
            setState('error');
            setErrorMessage('Camera initialization timeout. Please try again.');
          }
        }, 10000); // 10秒超時
        
        // 檢查是否支持相機
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setState('error');
          setErrorMessage('Camera not supported on this device');
          return;
        }

        const codeReader = new BrowserMultiFormatReader();
        scannerRef.current = { codeReader, controls: null };
        
        // 獲取相機設備列表
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        
        if (!devices || devices.length === 0) {
          setState('no-camera');
          setErrorMessage('No camera devices found. Please ensure your device has a camera.');
          return;
        }

        // 優先選擇後置相機
        let selectedCamera = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        
        if (!selectedCamera) {
          selectedCamera = devices[0];
        }

        const deviceId = selectedCamera?.deviceId;
        
        if (!deviceId) {
          setState('error');
          setErrorMessage('Cannot access camera device. Please check camera permissions.');
          return;
        }

        // 直接開始掃描，讓 zxing 處理權限請求
        const controls = await codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
          if (result && !stopped) {
            stopped = true;
            if (controls) controls.stop();
            if (timeoutId) clearTimeout(timeoutId);
            onScan(result.getText());
            onClose();
          }
          if (err && !stopped) {
            // 掃描錯誤不需要顯示，繼續嘗試
            console.debug('Scanning...', err.message);
          }
        });
        
        scannerRef.current = { codeReader, controls };
        if (timeoutId) clearTimeout(timeoutId);
        setState('ready');
        
      } catch (err: any) {
        console.error('Camera scanning error:', err);
        if (timeoutId) clearTimeout(timeoutId);
        setState('error');
        
        if (err.name === 'NotAllowedError') {
          setState('permission-denied');
          setErrorMessage('Camera permission denied. Please allow camera access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setErrorMessage('No camera found. Please ensure your device has a camera.');
        } else if (err.name === 'NotSupportedError') {
          setErrorMessage('Camera not supported on this device or browser.');
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
      if (timeoutId) clearTimeout(timeoutId);
      if (scannerRef.current?.controls) {
        try {
          scannerRef.current.controls.stop();
        } catch (e) {
          console.debug('Error stopping scanner:', e);
        }
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

      case 'no-camera':
        return (
          <div className="flex flex-col items-center text-center">
            <CameraIcon className="h-16 w-16 text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Camera Found</h3>
            <p className="text-gray-300 mb-4 max-w-sm">
              No camera devices were detected on this device.
            </p>
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