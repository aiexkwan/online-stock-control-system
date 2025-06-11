'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';

interface WorkingQrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  hint?: string;
}

export const WorkingQrScanner: React.FC<WorkingQrScannerProps> = ({ 
  open, 
  onClose, 
  onScan, 
  title = "QR Scanner", 
  hint 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [jsQR, setJsQR] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[WorkingQrScanner] ${message}`);
  };

  // 動態加載 jsQR
  useEffect(() => {
    if (typeof window !== 'undefined' && !jsQR) {
      import('jsqr').then((module) => {
        setJsQR(() => module.default);
        addLog('✅ jsQR 庫加載成功');
      }).catch((err) => {
        addLog(`❌ jsQR 加載失敗: ${err.message}`);
      });
    }
  }, [jsQR]);

  useEffect(() => {
    if (!open || !jsQR) {
      setLogs([]);
      setCameraActive(false);
      setIsScanning(false);
      return;
    }

    let stream: MediaStream | null = null;
    let scanningInterval: NodeJS.Timeout | null = null;
    let stopped = false;

    const startCamera = async () => {
      try {
        addLog('🚀 啟動基於成功測試的掃描器...');
        
        // 使用與成功測試相同的約束條件
        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'environment'
          },
          audio: false
        };

        addLog('📸 請求相機權限...');
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        addLog('✅ 相機流獲取成功！');

        if (stopped) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

                 if (videoRef.current) {
           videoRef.current.srcObject = stream;
           addLog('📺 視頻流已連接');

           videoRef.current.onloadedmetadata = () => {
             if (videoRef.current && !stopped) {
               addLog(`🎥 視頻準備就緒: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
               setCameraActive(true);
               startScanning();
             }
           };

           // 備用方案：如果 onloadedmetadata 沒有觸發，使用 oncanplay
           videoRef.current.oncanplay = () => {
             if (videoRef.current && !stopped && !cameraActive) {
               addLog(`🎬 視頻可以播放 (備用)`);
               setCameraActive(true);
               startScanning();
             }
           };

           // 強制觸發檢查 - 有時候事件不會自動觸發
           setTimeout(() => {
             if (videoRef.current && !stopped && !cameraActive) {
               if (videoRef.current.readyState >= 1) { // HAVE_METADATA
                 addLog(`🔧 強制觸發視頻準備 (readyState: ${videoRef.current.readyState})`);
                 setCameraActive(true);
                 startScanning();
               }
             }
           }, 2000);
         }

      } catch (error: any) {
        addLog(`❌ 相機啟動失敗: ${error.name} - ${error.message}`);
      }
    };

    const startScanning = () => {
      if (stopped || !videoRef.current || !canvasRef.current) return;

      setIsScanning(true);
      addLog('🔍 開始 QR 掃描...');

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        addLog('❌ 無法獲取 Canvas 上下文');
        return;
      }

      let scanCount = 0;
      const maxScans = 1000; // 防止無限掃描

      const scanFrame = () => {
        if (stopped || scanCount > maxScans) {
          addLog('🛑 掃描停止');
          return;
        }

        scanCount++;

        try {
          if (video.readyState === video.HAVE_ENOUGH_DATA) {
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;

            if (videoWidth > 0 && videoHeight > 0) {
              // 設置 canvas 尺寸
              canvas.width = videoWidth;
              canvas.height = videoHeight;

              // 繪製當前幀
              context.drawImage(video, 0, 0, videoWidth, videoHeight);

              // 獲取圖像數據
              const imageData = context.getImageData(0, 0, videoWidth, videoHeight);

              // 使用 jsQR 解碼
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });

              if (code && code.data) {
                addLog(`🎯 QR Code 檢測到: ${code.data}`);
                stopped = true;
                setIsScanning(false);
                
                // 立即調用回調
                onScan(code.data);
                onClose();
                return;
              }
            }
          }
        } catch (scanError) {
          // 掃描錯誤是正常的，不需要記錄
        }

        // 繼續掃描 - 使用 requestAnimationFrame 獲得最佳性能
        if (!stopped) {
          requestAnimationFrame(scanFrame);
        }
      };

      scanFrame();
    };

    startCamera();

    return () => {
      stopped = true;
      setIsScanning(false);
      setCameraActive(false);
      
      if (scanningInterval) {
        clearInterval(scanningInterval);
      }

      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          addLog('🛑 相機軌道已停止');
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [open, onScan, onClose, jsQR]);

  const simulateScan = () => {
    const testQR = 'PLT240001';
    addLog(`🎯 模擬掃描: ${testQR}`);
    onScan(testQR);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4 text-black">{title}</h2>
        
        {hint && (
          <p className="text-gray-600 mb-4 text-sm">{hint}</p>
        )}
        
        {/* 相機區域 */}
        <div className="mb-4">
          <div className="bg-black rounded-lg p-4 flex items-center justify-center relative" style={{ minHeight: '350px' }}>
            {cameraActive ? (
              <>
                                 <video
                   ref={videoRef}
                   autoPlay
                   muted
                   playsInline
                   controls={false}
                   className="max-w-full max-h-[300px] object-contain rounded"
                   style={{ transform: 'scaleX(-1)' }}
                   onError={(e) => {
                     console.error('Video error:', e);
                     addLog(`❌ 視頻錯誤: ${e.type}`);
                   }}
                   onPlay={() => addLog('▶️ 視頻開始播放')}
                   onPlaying={() => addLog('🎭 視頻正在播放')}
                 />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* 掃描框 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-green-400 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
                    
                    {/* 掃描線動畫 */}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-0.5 bg-green-400 animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-white text-center">
                <div className="text-6xl mb-2">📷</div>
                <div>啟動相機中...</div>
              </div>
            )}
          </div>
        </div>

        {/* 狀態顯示 */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${cameraActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-700">
              相機: {cameraActive ? '已激活' : '未激活'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isScanning ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-700">
              掃描: {isScanning ? '進行中' : '等待中'}
            </span>
          </div>
        </div>

        {/* 控制按鈕 */}
        <div className="flex gap-3 mb-4">
          <Button 
            onClick={simulateScan}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            🎯 模擬掃描
          </Button>
          <Button 
            onClick={onClose}
            variant="destructive"
            className="flex-1"
          >
            關閉
          </Button>
        </div>

        {/* 簡化日誌 */}
        <div className="border rounded-lg p-3 bg-gray-50 max-h-32 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-2 text-black">狀態:</h3>
          {logs.length === 0 ? (
            <div className="text-gray-500 text-sm">準備中...</div>
          ) : (
            logs.slice(-5).map((log, index) => (
              <div key={index} className="text-xs text-gray-700 font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}; 