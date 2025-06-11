'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import jsQR from 'jsqr';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  hint?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({ 
  open, 
  onClose, 
  onScan, 
  title = "QR Code Scanner",
  hint
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<string>('Preparing...');
  const [logs, setLogs] = useState<string[]>([]);
  const [showVideo, setShowVideo] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scanningRef = useRef<boolean>(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logEntry]);
    console.log(`[QRScanner] ${message}`);
  };

  const startQRScanning = () => {
    if (!videoRef.current || !canvasRef.current) {
      addLog('❌ Scan failed: Video or Canvas element not found');
      return;
    }

    if (scanningRef.current) {
      addLog('⚠️ Scanning already in progress');
      return;
    }

    addLog('🔍 Starting QR Code scanning...');
    scanningRef.current = true;
    setIsScanning(true);
    setStatus('🔍 Scanning QR Code...');

    const scan = () => {
      if (!scanningRef.current || !videoRef.current || !canvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scan);
        return;
      }

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Scan with jsQR
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        addLog(`✅ QR Code scan successful: ${code.data}`);
        setStatus('✅ QR Code scan successful');
        scanningRef.current = false;
        setIsScanning(false);
        onScan(code.data);
      } else {
        // Continue scanning
        requestAnimationFrame(scan);
      }
    };

    requestAnimationFrame(scan);
  };

  const stopQRScanning = () => {
    addLog('🛑 Stopping QR Code scanning');
    scanningRef.current = false;
    setIsScanning(false);
    setStatus('🛑 Scanning stopped');
  };

  useEffect(() => {
    if (!open) {
      addLog('❌ Scanner closed');
      setStatus('Preparing...');
      setLogs([]);
      setShowVideo(false);
      return;
    }

    addLog('🚀 Scanner opened');
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        addLog('📱 Checking device support...');
        
        if (!navigator.mediaDevices) {
          addLog('❌ navigator.mediaDevices not available');
          setStatus('❌ Device does not support camera');
          return;
        }
        
        if (!navigator.mediaDevices.getUserMedia) {
          addLog('❌ getUserMedia not available');
          setStatus('❌ Browser does not support camera');
          return;
        }

        addLog('✅ Device support check passed');
        addLog('🔑 Requesting camera permission...');
        setStatus('🔑 Requesting camera permission...');

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        addLog('✅ Camera permission granted, media stream created successfully');
        setStatus('✅ Camera permission granted');

                 if (!videoRef.current) {
           addLog('⚠️ Video element temporarily unavailable, waiting for DOM rendering...');
           addLog(`🔍 Debug: videoRef=${!!videoRef}, videoRef.current=${!!videoRef.current}, open=${open}`);
           // Wait for DOM rendering to complete, increased wait time
           setTimeout(() => {
             if (!videoRef.current) {
               addLog('❌ Video element still not available after waiting, trying longer wait...');
               // Wait another 500ms
               setTimeout(() => {
                 if (!videoRef.current) {
                   addLog('❌ Video element still not available after 600ms');
                   return;
                 }
                 if (!stream) {
                   addLog('❌ Stream is null after waiting');
                   return;
                 }
                 addLog('✅ Video element available after extended wait, continuing setup...');
                 setupVideo(stream);
               }, 500);
               return;
             }
             if (!stream) {
               addLog('❌ Stream is null');
               return;
             }
             addLog('✅ Video element now available, continuing setup...');
             setupVideo(stream);
           }, 100);
           return;
         }

         if (stream) {
           setupVideo(stream);
         } else {
           addLog('❌ Stream is null after camera initialization');
         }
       } catch (error: any) {
         addLog(`❌ Camera error: ${error.name} - ${error.message}`);
         setStatus(`❌ Error: ${error.message}`);
       }
     };

     const setupVideo = (stream: MediaStream) => {
       if (!videoRef.current) {
         addLog('❌ setupVideo: Video element not found');
         return;
       }

       const video = videoRef.current;
       addLog('📺 Starting video element setup...');

               // Log video element initial state in detail
       addLog(`📊 Initial state: readyState=${video.readyState}, srcObject=${!!video.srcObject}`);

       // Setup event listeners
       video.onloadstart = () => {
         addLog('🎬 onloadstart: Loading started');
         setStatus('🎬 Loading video...');
       };

       video.onloadedmetadata = () => {
         addLog('📊 onloadedmetadata: Metadata loaded');
         addLog(`📐 Video dimensions: ${video.videoWidth} x ${video.videoHeight}`);
         setStatus('📊 Metadata loaded');
         if (video.videoWidth > 0) {
           setShowVideo(true);
         }
       };

       video.oncanplay = () => {
         addLog('▶️ oncanplay: Ready to play');
         setStatus('▶️ Ready to play');
         if (video.videoWidth > 0) {
           setShowVideo(true);
         }
       };

       video.onplay = () => {
         addLog('🎪 onplay: Playback started');
         setStatus('🎪 Playing');
         // After video starts playing, automatically start QR scanning
         setTimeout(() => {
           if (video.videoWidth > 0 && video.videoHeight > 0) {
             addLog('🚀 Automatically starting QR Code scanning');
             startQRScanning();
           }
         }, 1000);
       };

       video.onerror = (e) => {
         addLog(`❌ video error: ${video.error?.message || 'Unknown error'}`);
         setStatus('❌ Video error');
       };

       // Set srcObject
       addLog('🔗 Setting video.srcObject...');
       video.srcObject = stream;
       addLog(`✅ srcObject set: ${!!video.srcObject}`);

       // Immediately check status
       setTimeout(() => {
         addLog(`📊 Status after 500ms: readyState=${video.readyState}, srcObject=${!!video.srcObject}, videoWidth=${video.videoWidth}`);
         
         if (!video.srcObject) {
           addLog('⚠️ srcObject is empty, trying to reset...');
           video.srcObject = stream;
           
           setTimeout(() => {
             addLog(`📊 Status after reset: readyState=${video.readyState}, srcObject=${!!video.srcObject}, videoWidth=${video.videoWidth}`);
             if (video.srcObject && video.videoWidth > 0) {
               setShowVideo(true);
               setStatus('✅ Camera ready');
             }
           }, 500);
         }
       }, 500);
     };

    initCamera();

    return () => {
      addLog('🧹 Cleaning up resources...');
      // Stop scanning
      scanningRef.current = false;
      setIsScanning(false);
      
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          addLog('🛑 Camera track stopped');
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [open]);

  const manualReset = () => {
    addLog('🔧 User manual reset...');
    
    if (!videoRef.current) {
      addLog('❌ Video element not found, cannot reset');
      return;
    }
    
    if (!videoRef.current.srcObject) {
      addLog('❌ srcObject is empty, cannot reset');
      return;
    }
    
    const video = videoRef.current;
    const currentStream = video.srcObject as MediaStream;
    
    addLog('🔄 Resetting srcObject...');
    video.srcObject = currentStream;
    
    setTimeout(() => {
      if (video) {
        addLog(`📊 After manual reset: readyState=${video.readyState}, srcObject=${!!video.srcObject}, videoWidth=${video.videoWidth}`);
        if (video.videoWidth > 0) {
          setShowVideo(true);
          setStatus('✅ Manual reset successful');
        }
      }
    }, 500);
  };

  if (!open) return null;

  // Add rendering log
  React.useEffect(() => {
    if (open) {
      addLog('🎨 Component started rendering...');
    }
  }, [open]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[95vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4 text-black">{title}</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Camera Area */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-black">Camera Video</h3>
            <div className="bg-black rounded-lg p-4 flex items-center justify-center relative" style={{ height: '300px' }}>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                controls={false}
                className={`max-w-full max-h-full object-contain ${showVideo ? 'block' : 'hidden'}`}
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              {!showVideo && (
                <div className="text-white text-center absolute">
                  <div className="text-4xl mb-2">📷</div>
                  <div>{status}</div>
                </div>
              )}
              {showVideo && isScanning && (
                <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-sm">
                  🔍 Scanning...
                </div>
              )}
              {hint && (
                <div className="absolute bottom-2 left-0 right-0 text-center text-white bg-black bg-opacity-50 py-2">
                  {hint}
                </div>
              )}
            </div>
            
            {/* Control Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button 
                onClick={isScanning ? stopQRScanning : startQRScanning} 
                className={isScanning ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                disabled={!showVideo}
              >
                {isScanning ? '🛑 Stop Scanning' : '🔍 Start Scanning'}
              </Button>
              <Button onClick={() => onScan('PLT240001')} className="bg-green-600 hover:bg-green-700">
                🎯 Simulate Scan
              </Button>
            </div>
            <div className="mt-2">
              <Button onClick={manualReset} className="w-full bg-orange-600 hover:bg-orange-700">
                🔧 Manual Reset
              </Button>
            </div>
          </div>

          {/* Log Area */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-black">Detailed Logs</h3>
            <div 
              className="bg-black rounded-lg p-3 font-mono text-xs overflow-y-auto text-green-400"
              style={{ height: '300px' }}
            >
              {logs.length === 0 ? (
                <div className="text-gray-500">Waiting to start...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={onClose} variant="destructive">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}; 