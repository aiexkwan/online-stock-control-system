'use client';

import React, { useEffect, useRef, useState } from 'react';

export default function CameraDebugPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [testStarted, setTestStarted] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logEntry]);
    (process.env.NODE_ENV as string) !== 'production' &&
      (process.env.NODE_ENV as string) !== 'production' &&
      console.log(`[CameraDebug] ${message}`);
  };

  const startCameraTest = async () => {
    setTestStarted(true);
    setLogs([]);
    setCameraActive(false);

    try {
      addLog('🚀 開始獨立相機測試...');

      // 基本環境檢查
      addLog(`📱 Navigator: ${typeof navigator !== 'undefined' ? '可用' : '不可用'}`);
      addLog(`🌐 UserAgent: ${navigator.userAgent.substring(0, 80)}...`);
      addLog(`📍 Platform: ${navigator.platform}`);
      addLog(`🔒 Protocol: ${window.location.protocol}`);
      addLog(`🏠 Host: ${window.location.host}`);

      // MediaDevices 檢查
      if (!navigator.mediaDevices) {
        addLog('❌ MediaDevices API 不可用');
        return;
      }
      addLog('✅ MediaDevices API 可用');

      if (!navigator.mediaDevices.getUserMedia) {
        addLog('❌ getUserMedia 方法不可用');
        return;
      }
      addLog('✅ getUserMedia 方法可用');

      // 設備枚舉
      try {
        addLog('📋 枚舉媒體設備...');
        const devices = await navigator.mediaDevices.enumerateDevices();
        addLog(`📊 找到 ${devices.length} 個設備`);

        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        addLog(`📹 找到 ${videoDevices.length} 個視頻設備`);

        videoDevices.forEach((device, index) => {
          addLog(
            `📷 設備 ${index + 1}: ${device.label || '未命名'} (${device.deviceId.substring(0, 10)}...)`
          );
        });
      } catch (enumError: any) {
        addLog(`⚠️ 設備枚舉失敗: ${enumError.message}`);
      }

      // 權限檢查（如果支持）
      if ('permissions' in navigator) {
        try {
          // @ts-ignore - permissions API 可能不在類型定義中
          const permission = await navigator.permissions.query({ name: 'camera' });
          addLog(`🔐 相機權限狀態: ${permission.state}`);
        } catch (permError: any) {
          addLog(`🔐 權限檢查失敗: ${permError.message}`);
        }
      }

      // 嘗試獲取相機流
      addLog('📸 請求相機權限...');

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment',
        },
        audio: false,
      };

      addLog(`⚙️ 使用約束: ${JSON.stringify(constraints)}`);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      addLog('✅ 相機流獲取成功！');

      // 檢查流詳細信息
      const tracks = stream.getTracks();
      addLog(`🎬 獲得 ${tracks.length} 個媒體軌道`);

      tracks.forEach((track, index) => {
        addLog(`🎯 軌道 ${index + 1}: ${track.kind} - ${track.label} (${track.readyState})`);

        if (track.kind === 'video') {
          const settings = track.getSettings();
          addLog(
            `📐 視頻設置: ${settings.width}x${settings.height}, 朝向: ${settings.facingMode || '未知'}`
          );
        }
      });

      // 連接到視頻元素
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        addLog('📺 視頻流已連接到 video 元素');

        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            addLog(
              `🎥 視頻元數據加載完成: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`
            );
          }
        };

        videoRef.current.onplay = () => {
          addLog('▶️ 視頻播放開始');
        };

        videoRef.current.onerror = e => {
          addLog(`❌ 視頻播放錯誤: ${e}`);
        };
      }

      // 自動停止測試（防止長時間占用相機）
      setTimeout(() => {
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
            addLog(`🛑 停止軌道: ${track.kind}`);
          });
          setCameraActive(false);
          addLog('🏁 測試完成 - 相機已釋放');
        }
      }, 10000); // 10秒後自動停止
    } catch (error: any) {
      addLog(`❌ 相機測試失敗: ${error.name} - ${error.message}`);

      // 詳細錯誤分析
      switch (error.name) {
        case 'NotAllowedError':
          addLog('🚫 分析: 用戶拒絕了相機權限或瀏覽器阻止了訪問');
          break;
        case 'NotFoundError':
          addLog('📷 分析: 找不到相機設備');
          break;
        case 'NotReadableError':
          addLog('📵 分析: 相機被其他應用程序占用');
          break;
        case 'OverconstrainedError':
          addLog('⚙️ 分析: 相機不支持請求的約束條件');
          break;
        case 'SecurityError':
          addLog('🔒 分析: 安全錯誤 - 可能是 HTTPS 要求或來源問題');
          break;
        case 'AbortError':
          addLog('⏹️ 分析: 操作被中止');
          break;
        default:
          addLog(`🔍 分析: 未知錯誤類型 - ${error.name}`);
      }

      // 額外調試信息
      if (error.constraint) {
        addLog(`🎯 問題約束: ${error.constraint}`);
      }

      if (error.stack) {
        addLog(`📋 錯誤堆疊: ${error.stack.substring(0, 200)}...`);
      }
    }
  };

  return (
    <div className='min-h-screen bg-gray-900 p-4 text-white'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='mb-6 text-center text-3xl font-bold'>🔧 獨立相機調試工具</h1>

        <div className='mb-6 text-center'>
          <p className='mb-4 text-gray-300'>
            這是一個完全獨立的相機測試頁面，不依賴任何認證或外部組件
          </p>
          <button
            onClick={startCameraTest}
            disabled={testStarted && cameraActive}
            className='rounded-lg bg-red-600 px-6 py-3 font-bold text-white transition-colors hover:bg-red-700 disabled:bg-gray-600'
          >
            {testStarted && cameraActive ? '🔴 測試進行中...' : '🚀 開始相機測試'}
          </button>
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* 相機視頻區域 */}
          <div className='rounded-lg bg-gray-800 p-4'>
            <h2 className='mb-4 text-xl font-semibold'>📹 相機視頻</h2>
            <div
              className='flex items-center justify-center rounded-lg bg-black'
              style={{ height: '300px' }}
            >
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className='max-h-full max-w-full object-contain'
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className='text-center text-gray-400'>
                  <div className='mb-2 text-4xl'>📷</div>
                  <div>相機未激活</div>
                </div>
              )}
            </div>
            <div className='mt-2 flex items-center gap-2'>
              <div
                className={`h-3 w-3 rounded-full ${cameraActive ? 'bg-green-500' : 'bg-red-500'}`}
              ></div>
              <span className='text-sm'>相機狀態: {cameraActive ? '已激活' : '未激活'}</span>
            </div>
          </div>

          {/* 測試日誌 */}
          <div className='rounded-lg bg-gray-800 p-4'>
            <h2 className='mb-4 text-xl font-semibold'>📋 測試日誌</h2>
            <div
              className='overflow-y-auto rounded-lg bg-black p-3 font-mono text-sm'
              style={{ height: '300px' }}
            >
              {logs.length === 0 ? (
                <div className='text-gray-500'>點擊 &quot;開始相機測試&quot; 開始...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className='mb-1 text-green-400'>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 系統信息 */}
        <div className='mt-6 rounded-lg bg-gray-800 p-4'>
          <h2 className='mb-4 text-xl font-semibold'>ℹ️ 系統信息</h2>
          <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
            <div>
              <strong>🌐 瀏覽器:</strong>{' '}
              {navigator.userAgent.includes('Chrome')
                ? 'Chrome'
                : navigator.userAgent.includes('Safari')
                  ? 'Safari'
                  : navigator.userAgent.includes('Firefox')
                    ? 'Firefox'
                    : '其他'}
            </div>
            <div>
              <strong>📱 平台:</strong> {navigator.platform}
            </div>
            <div>
              <strong>🔒 協議:</strong> {window.location.protocol}
            </div>
            <div>
              <strong>🏠 主機:</strong> {window.location.host}
            </div>
            <div>
              <strong>📍 路徑:</strong> {window.location.pathname}
            </div>
            <div>
              <strong>🔧 MediaDevices:</strong>{' '}
              {typeof navigator.mediaDevices !== 'undefined' ? '支持' : '不支持'}
            </div>
          </div>
        </div>

        {/* 返回按鈕 */}
        <div className='mt-6 text-center'>
          <button
            onClick={() => window.history.back()}
            className='rounded bg-gray-600 px-4 py-2 font-bold text-white hover:bg-gray-700'
          >
            ← 返回
          </button>
        </div>
      </div>
    </div>
  );
}
