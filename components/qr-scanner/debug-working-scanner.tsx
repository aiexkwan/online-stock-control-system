'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';

interface DebugWorkingScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

export const DebugWorkingScanner: React.FC<DebugWorkingScannerProps> = ({ 
  open, 
  onClose, 
  onScan, 
  title = "Debug Working Scanner" 
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [videoState, setVideoState] = useState<string>('未初始化');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logEntry]);
    console.log(`[DebugWorkingScanner] ${message}`);
  };

  const checkVideoState = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      addLog(`📊 視頻狀態檢查:`);
      addLog(`  - readyState: ${video.readyState} (0=HAVE_NOTHING, 1=HAVE_METADATA, 2=HAVE_CURRENT_DATA, 3=HAVE_FUTURE_DATA, 4=HAVE_ENOUGH_DATA)`);
      addLog(`  - networkState: ${video.networkState}`);
      addLog(`  - paused: ${video.paused}`);
      addLog(`  - muted: ${video.muted}`);
      addLog(`  - autoplay: ${video.autoplay}`);
      addLog(`  - playsInline: ${video.playsInline}`);
      addLog(`  - srcObject: ${video.srcObject ? '有' : '無'}`);
      addLog(`  - videoWidth: ${video.videoWidth}`);
      addLog(`  - videoHeight: ${video.videoHeight}`);
      addLog(`  - currentTime: ${video.currentTime}`);
      addLog(`  - duration: ${video.duration}`);
      
      setVideoState(`readyState:${video.readyState}, paused:${video.paused}, size:${video.videoWidth}x${video.videoHeight}`);
    }
  };

  useEffect(() => {
    if (!open) {
      setLogs([]);
      setCameraActive(false);
      setVideoState('未初始化');
      return;
    }

    let stream: MediaStream | null = null;
    let stopped = false;

    const startCamera = async () => {
      try {
        addLog('🚀 開始調試掃描器...');
        
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
          const video = videoRef.current;
          addLog('📺 設置視頻流...');
          
          // 立即檢查初始狀態
          checkVideoState();
          
          video.srcObject = stream;
          addLog('📺 視頻流已設置到 srcObject');
          
          // 檢查設置後的狀態
          setTimeout(() => checkVideoState(), 100);

          // 設置所有可能的事件監聽器
          video.onloadstart = () => {
            addLog('🎬 onloadstart: 開始加載');
            checkVideoState();
          };

          video.ondurationchange = () => {
            addLog('⏱️ ondurationchange: 持續時間改變');
            checkVideoState();
          };

          video.onloadedmetadata = () => {
            addLog('📊 onloadedmetadata: 元數據加載完成');
            checkVideoState();
            if (!stopped) {
              setCameraActive(true);
              addLog('✅ 相機激活 (通過 onloadedmetadata)');
            }
          };

          video.onloadeddata = () => {
            addLog('📈 onloadeddata: 數據加載完成');
            checkVideoState();
            if (!stopped && !cameraActive) {
              setCameraActive(true);
              addLog('✅ 相機激活 (通過 onloadeddata)');
            }
          };

          video.oncanplay = () => {
            addLog('▶️ oncanplay: 可以播放');
            checkVideoState();
            if (!stopped && !cameraActive) {
              setCameraActive(true);
              addLog('✅ 相機激活 (通過 oncanplay)');
            }
          };

          video.oncanplaythrough = () => {
            addLog('🎯 oncanplaythrough: 可以流暢播放');
            checkVideoState();
            if (!stopped && !cameraActive) {
              setCameraActive(true);
              addLog('✅ 相機激活 (通過 oncanplaythrough)');
            }
          };

          video.onplay = () => {
            addLog('🎪 onplay: 開始播放');
            checkVideoState();
          };

          video.onplaying = () => {
            addLog('🎭 onplaying: 正在播放');
            checkVideoState();
          };

          video.onpause = () => {
            addLog('⏸️ onpause: 暫停');
            checkVideoState();
          };

          video.onerror = (e) => {
            addLog(`❌ onerror: ${e.type} - ${video.error?.message || '未知錯誤'}`);
            checkVideoState();
          };

          video.onstalled = () => {
            addLog('🚧 onstalled: 播放停滯');
            checkVideoState();
          };

          video.onwaiting = () => {
            addLog('⏳ onwaiting: 等待數據');
            checkVideoState();
          };

          // 強制播放
          setTimeout(async () => {
            if (video && !stopped) {
              addLog('🔨 嘗試強制播放...');
              try {
                await video.play();
                addLog('✅ 強制播放成功');
                checkVideoState();
              } catch (playError: any) {
                addLog(`❌ 強制播放失敗: ${playError.message}`);
              }
            }
          }, 1000);

          // 定期檢查狀態
          const stateChecker = setInterval(() => {
            if (!stopped && video) {
              checkVideoState();
              if (video.readyState >= 2 && !cameraActive) { // HAVE_CURRENT_DATA 或更高
                addLog('🔧 定期檢查: 視頻準備就緒，激活相機');
                setCameraActive(true);
              }
            } else {
              clearInterval(stateChecker);
            }
          }, 1000);

          // 超時檢查
          setTimeout(() => {
            if (!stopped && !cameraActive) {
              addLog('⏰ 超時檢查: 強制激活相機');
              setCameraActive(true);
            }
          }, 5000);
        }

      } catch (error: any) {
        addLog(`❌ 相機啟動失敗: ${error.name} - ${error.message}`);
      }
    };

    startCamera();

    return () => {
      stopped = true;
      setCameraActive(false);
      setVideoState('已停止');
      
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
  }, [open]);

  const forceActivate = () => {
    addLog('🔨 用戶強制激活相機');
    setCameraActive(true);
    checkVideoState();
  };

  const testPlay = async () => {
    if (videoRef.current) {
      addLog('🎮 用戶測試播放');
      try {
        await videoRef.current.play();
        addLog('✅ 測試播放成功');
      } catch (error: any) {
        addLog(`❌ 測試播放失敗: ${error.message}`);
      }
      checkVideoState();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[95vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4 text-black">{title}</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 相機區域 */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-black">相機視頻</h3>
            <div className="bg-black rounded-lg p-4 flex items-center justify-center" style={{ height: '300px' }}>
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  controls={false}
                  className="max-w-full max-h-full object-contain"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="text-white text-center">
                  <div className="text-4xl mb-2">📷</div>
                  <div>啟動相機中...</div>
                  <div className="text-sm mt-2">{videoState}</div>
                </div>
              )}
            </div>
            
            {/* 控制按鈕 */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={forceActivate} className="bg-orange-600 hover:bg-orange-700">
                🔨 強制激活
              </Button>
              <Button onClick={testPlay} className="bg-purple-600 hover:bg-purple-700">
                🎮 測試播放
              </Button>
              <Button onClick={checkVideoState} className="bg-blue-600 hover:bg-blue-700">
                📊 檢查狀態
              </Button>
              <Button onClick={() => onScan('PLT240001')} className="bg-green-600 hover:bg-green-700">
                🎯 模擬掃描
              </Button>
            </div>
          </div>

          {/* 日誌區域 */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-black">調試日誌</h3>
            <div 
              className="bg-black rounded-lg p-3 font-mono text-xs overflow-y-auto text-green-400"
              style={{ height: '300px' }}
            >
              {logs.length === 0 ? (
                <div className="text-gray-500">等待開始...</div>
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
            關閉
          </Button>
        </div>
      </div>
    </div>
  );
}; 