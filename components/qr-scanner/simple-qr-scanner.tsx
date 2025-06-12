'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
  title = "QR Code Scanner"
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [isScanning, setIsScanning] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const isCleaningRef = useRef<boolean>(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (isCleaningRef.current) {
      console.log('SimpleQRScanner: cleanup already in progress, skipping');
      return;
    }
    
    isCleaningRef.current = true;
    console.log('SimpleQRScanner: cleanup called');
    isScanningRef.current = false;
    setIsScanning(false);
    
    if (animationRef.current) {
      console.log('Cancelling animation frame...');
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      console.log('Clearing video srcObject...');
      const stream = videoRef.current.srcObject as MediaStream;
      videoRef.current.srcObject = null;
      
      // 停止 video element 嘅 stream tracks
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log(`Stopping video stream track: ${track.kind}, enabled: ${track.enabled}`);
          track.stop();
        });
      }
    }
    
    if (streamRef.current) {
      console.log('Stopping camera tracks from streamRef...');
      streamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}, enabled: ${track.enabled}`);
        track.stop();
        console.log(`Track ${track.kind} stopped`);
      });
      streamRef.current = null;
    }
    
    console.log('SimpleQRScanner: cleanup completed');
    
    // Reset cleaning flag after a short delay
    setTimeout(() => {
      isCleaningRef.current = false;
    }, 100);
  }, []);

  // Handle close button click
  const handleClose = useCallback(() => {
    console.log('SimpleQRScanner: handleClose called');
    cleanup();
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      cleanup();
      setStatus('Initializing...');
      return;
    }

    // 確保開新相機之前，舊嘅已經關閉
    cleanup();

    let jsQR: any = null;
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
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        localStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadedmetadata', () => {
            setStatus('Camera ready. Position QR code in view.');
            setIsScanning(true);
            isScanningRef.current = true;
            startScanning(jsQR);
          });
        }
      } catch (error) {
        console.error('Camera initialization error:', error);
        setStatus('Failed to access camera. Please check permissions.');
      }
    };

    const startScanning = (jsQRLib: any) => {
      const scan = () => {
        if (!videoRef.current || !canvasRef.current || !jsQRLib || !isScanningRef.current) {
          return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

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
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            setStatus('QR Code detected!');
            isScanningRef.current = false;
            setIsScanning(false);
            
            // 先 cleanup，然後延遲 call onScan
            cleanup();
            
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
      console.log('useEffect cleanup: stopping local stream');
      
      // 停止 local stream
      if (localStream) {
        localStream.getTracks().forEach(track => {
          console.log(`useEffect cleanup: stopping track ${track.kind}`);
          track.stop();
        });
      }
      
      // 再 call 一次 cleanup 確保所有嘢都清理晒
      cleanup();
    };
  }, [open, onScan, cleanup]);

  if (!open) return null;

  // 確保只喺 client side render
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-black bg-opacity-90 flex items-center justify-center p-4"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 max-w-lg w-full relative" 
        style={{ zIndex: 10000 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-black">{title}</h2>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="bg-black rounded-lg overflow-hidden relative" style={{ height: '300px' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Scanning indicator */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-green-500 w-48 h-48 rounded-lg animate-pulse"></div>
              </div>
            )}
            
            {/* Status message */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2 text-center text-sm">
              {status}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Hold the QR code steady within the frame</p>
            <p>• Ensure good lighting conditions</p>
            <p>• Keep the code flat and avoid reflections</p>
          </div>
          
          <Button 
            onClick={handleClose} 
            variant="outline" 
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};