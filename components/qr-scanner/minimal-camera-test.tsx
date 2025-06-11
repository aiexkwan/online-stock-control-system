'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';

interface MinimalCameraTestProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

export const MinimalCameraTest: React.FC<MinimalCameraTestProps> = ({ 
  open, 
  onClose, 
  onScan, 
  title = "Minimal Camera Test" 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[MinimalCameraTest] ${message}`);
  };

  useEffect(() => {
    if (!open) {
      setLogs([]);
      setCameraActive(false);
      return;
    }

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        addLog('🚀 開始最簡化相機測試...');
        
        // 檢查基本環境
        addLog(`📱 平台: ${navigator.platform}`);
        addLog(`🌐 用戶代理: ${navigator.userAgent.substring(0, 100)}...`);
        
        // 檢查 MediaDevices 支持
        if (!navigator.mediaDevices) {
          addLog('❌ MediaDevices API 不可用');
          return;
        }
        addLog('✅ MediaDevices API 可用');

        // 檢查 getUserMedia 支持
        if (!navigator.mediaDevices.getUserMedia) {
          addLog('❌ getUserMedia 不可用');
          return;
        }
        addLog('✅ getUserMedia 可用');

        // 嘗試獲取相機權限 - 最簡單的約束
        addLog('📸 請求相機權限（最簡約束）...');
        
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });

        addLog('✅ 相機權限獲取成功！');
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
          addLog('📹 視頻流已連接到 video 元素');
          
          videoRef.current.onloadedmetadata = () => {
            addLog('🎬 視頻元數據加載完成');
            addLog(`📐 視頻尺寸: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
          };

          videoRef.current.onplay = () => {
            addLog('▶️ 視頻開始播放');
          };

          videoRef.current.onerror = (e) => {
            addLog(`❌ 視頻錯誤: ${e}`);
          };
        }

      } catch (error: any) {
        addLog(`❌ 相機啟動失敗: ${error.name} - ${error.message}`);
        
        // 詳細錯誤分析
        if (error.name === 'NotAllowedError') {
          addLog('🚫 用戶拒絕了相機權限');
        } else if (error.name === 'NotFoundError') {
          addLog('📷 找不到相機設備');
        } else if (error.name === 'NotReadableError') {
          addLog('📵 相機被其他應用占用');
        } else if (error.name === 'OverconstrainedError') {
          addLog('⚙️ 相機約束條件不支持');
        } else {
          addLog(`🔍 未知錯誤類型: ${error.name}`);
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          addLog('🛑 相機軌道已停止');
        });
      }
      setCameraActive(false);
    };
  }, [open]);

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
        
        {/* 相機區域 */}
        <div className="mb-4">
          <div className="bg-black rounded-lg p-4 flex items-center justify-center" style={{ minHeight: '300px' }}>
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="max-w-full max-h-[250px] object-contain"
                style={{ transform: 'scaleX(-1)' }} // 鏡像效果
              />
            ) : (
              <div className="text-white text-center">
                <div className="text-6xl mb-2">📷</div>
                <div>等待相機啟動...</div>
              </div>
            )}
          </div>
        </div>

        {/* 控制按鈕 */}
        <div className="flex gap-3 mb-4">
          <Button 
            onClick={simulateScan}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            🎯 模擬掃描 QR Code
          </Button>
          <Button 
            onClick={onClose}
            variant="destructive"
            className="flex-1"
          >
            關閉
          </Button>
        </div>

        {/* 日誌區域 */}
        <div className="border rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-2 text-black">測試日誌:</h3>
          {logs.length === 0 ? (
            <div className="text-gray-500 text-sm">等待測試開始...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-xs text-gray-700 font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>

        {/* 狀態指示 */}
        <div className="mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${cameraActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>相機狀態: {cameraActive ? '已激活' : '未激活'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 