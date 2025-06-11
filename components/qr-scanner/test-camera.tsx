'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { CameraIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface TestCameraProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  hint?: string;
}

type CameraState = 'initializing' | 'ready' | 'error' | 'permission-denied';

export const TestCamera: React.FC<TestCameraProps> = ({ 
  open, 
  onClose, 
  onScan, 
  title, 
  hint 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setState('initializing');
      setErrorMessage('');
      return;
    }

    let stopped = false;
    
    const startCamera = async () => {
      if (!videoRef.current) return;
      
      try {
        setState('initializing');
        
        // 使用與基礎測試完全相同的方法
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
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
        };
        
      } catch (err: any) {
        console.error('Test camera error:', err);
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

    startCamera();

    return () => {
      stopped = true;
      
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
  }, [open]);

  if (!open) return null;

  const handleTestScan = () => {
    // 模擬掃描成功
    onScan('PLT240001');
    onClose();
  };

  const renderContent = () => {
    switch (state) {
      case 'initializing':
        return (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white text-center">Initializing camera...</p>
            <p className="text-gray-300 text-sm text-center mt-2">
              Using the same method as the working diagnostic test
            </p>
          </div>
        );

      case 'ready':
        return (
          <div className="flex flex-col items-center">
            <video 
              ref={videoRef} 
              className="w-[400px] h-[300px] bg-black rounded-lg mb-4" 
              autoPlay 
              muted 
              playsInline 
            />
            {hint && <div className="text-sm text-gray-300 mb-2 text-center">{hint}</div>}
            <div className="text-xs text-green-400 text-center mb-4">
              ✅ Camera is working! This proves the camera access is functional.
            </div>
            
            {/* 測試按鈕 */}
            <Button 
              onClick={handleTestScan}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Simulate QR Scan (PLT240001)
            </Button>
            
            <p className="text-xs text-gray-400 text-center mt-2">
              Click the button above to simulate a successful QR scan
            </p>
          </div>
        );

      case 'permission-denied':
        return (
          <div className="flex flex-col items-center text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Camera Permission Required</h3>
            <p className="text-gray-300 mb-4 max-w-sm">
              Please allow camera access in your browser to test the camera.
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