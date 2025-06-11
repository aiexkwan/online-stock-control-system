'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function BasicCameraTest() {
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Camera Test] ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
    setError('');
    setStep(0);
  };

  // 步驟 1: 檢查基本支持
  const checkBasicSupport = () => {
    setStep(1);
    addLog('開始檢查瀏覽器支持...');

    // 檢查 navigator
    if (!navigator) {
      setError('Navigator 不可用');
      addLog('❌ Navigator 不可用');
      return;
    }
    addLog('✅ Navigator 可用');

    // 檢查 mediaDevices
    if (!navigator.mediaDevices) {
      setError('MediaDevices API 不可用');
      addLog('❌ MediaDevices API 不可用');
      return;
    }
    addLog('✅ MediaDevices API 可用');

    // 檢查 getUserMedia
    if (!navigator.mediaDevices.getUserMedia) {
      setError('getUserMedia 不可用');
      addLog('❌ getUserMedia 不可用');
      return;
    }
    addLog('✅ getUserMedia 可用');

    // 檢查協議
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    addLog(`🌐 協議: ${protocol}, 主機: ${hostname}`);
    
    if (protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1') {
      addLog('✅ 安全上下文確認');
    } else {
      addLog('⚠️ 可能不是安全上下文');
    }

    addLog('基本檢查完成，可以進行下一步');
  };

  // 步驟 2: 檢查設備
  const checkDevices = async () => {
    setStep(2);
    addLog('開始檢查相機設備...');

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      addLog(`📱 找到 ${devices.length} 個設備`);

      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      addLog(`📹 找到 ${videoDevices.length} 個視頻設備`);

      videoDevices.forEach((device, index) => {
        addLog(`📹 設備 ${index + 1}: ${device.label || '未命名設備'} (${device.deviceId.substring(0, 8)}...)`);
      });

      if (videoDevices.length === 0) {
        setError('沒有找到相機設備');
        addLog('❌ 沒有找到相機設備');
        return;
      }

      addLog('設備檢查完成，可以嘗試請求權限');
    } catch (err: any) {
      setError(`設備檢查失敗: ${err.message}`);
      addLog(`❌ 設備檢查失敗: ${err.message}`);
    }
  };

  // 步驟 3: 請求權限
  const requestPermission = async () => {
    setStep(3);
    addLog('開始請求相機權限...');

    try {
      addLog('📞 調用 getUserMedia...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      addLog('✅ 成功獲取媒體流');
      addLog(`📺 視頻軌道數量: ${stream.getVideoTracks().length}`);
      
      stream.getVideoTracks().forEach((track, index) => {
        addLog(`📺 軌道 ${index + 1}: ${track.label} (${track.kind})`);
        addLog(`📺 軌道狀態: ${track.readyState}`);
      });

      streamRef.current = stream;

      if (videoRef.current) {
        addLog('🎥 設置視頻元素...');
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          addLog('✅ 視頻元數據加載完成');
          setIsStreaming(true);
        };

        videoRef.current.onerror = (e) => {
          addLog(`❌ 視頻元素錯誤: ${e}`);
        };
      }

    } catch (err: any) {
      setError(`權限請求失敗: ${err.message}`);
      addLog(`❌ 權限請求失敗: ${err.name} - ${err.message}`);
      
      // 詳細錯誤分析
      switch (err.name) {
        case 'NotAllowedError':
          addLog('🚫 用戶拒絕了相機權限');
          break;
        case 'NotFoundError':
          addLog('🔍 沒有找到相機設備');
          break;
        case 'NotReadableError':
          addLog('📱 相機被其他應用占用');
          break;
        case 'OverconstrainedError':
          addLog('⚙️ 相機約束條件無法滿足');
          break;
        case 'SecurityError':
          addLog('🔒 安全錯誤，可能需要 HTTPS');
          break;
        default:
          addLog(`❓ 未知錯誤: ${err.name}`);
      }
    }
  };

  // 停止相機
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addLog(`🛑 停止軌道: ${track.label}`);
      });
      streamRef.current = null;
    }
    setIsStreaming(false);
    addLog('📴 相機已停止');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex items-center mb-6">
        <CameraIcon className="h-8 w-8 text-blue-400 mr-3" />
        <h2 className="text-xl font-bold text-white">Basic Camera Test</h2>
      </div>

      {/* 步驟指示器 */}
      <div className="flex items-center mb-6 space-x-4">
        {[1, 2, 3].map((stepNum) => (
          <div key={stepNum} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300'
            }`}>
              {stepNum}
            </div>
            {stepNum < 3 && <div className="w-8 h-0.5 bg-gray-600 mx-2" />}
          </div>
        ))}
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={checkBasicSupport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          1. 檢查支持
        </button>
        
        <button
          onClick={checkDevices}
          disabled={step < 1}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          2. 檢查設備
        </button>
        
        <button
          onClick={requestPermission}
          disabled={step < 2}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          3. 請求權限
        </button>

        {isStreaming && (
          <button
            onClick={stopCamera}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            停止相機
          </button>
        )}

        <button
          onClick={clearLogs}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          清除日誌
        </button>
      </div>

      {/* 視頻預覽 */}
      {isStreaming && (
        <div className="mb-6">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full max-w-md mx-auto bg-black rounded-lg"
          />
          <p className="text-center text-sm text-green-400 mt-2">
            ✅ 相機正常工作！
          </p>
        </div>
      )}

      {/* 錯誤信息 */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700/50 rounded-lg">
          <p className="text-red-300 font-semibold">錯誤：</p>
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* 日誌輸出 */}
      <div className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">測試日誌：</h3>
        <div className="max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">點擊上方按鈕開始測試...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-sm text-gray-300 font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 系統信息 */}
      <div className="mt-4 p-3 bg-slate-900/30 rounded-lg">
        <h4 className="text-white font-semibold mb-2">系統信息：</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p>🌐 User Agent: {navigator.userAgent.substring(0, 100)}...</p>
          <p>📱 Platform: {navigator.platform}</p>
          <p>🔗 URL: {window.location.href}</p>
        </div>
      </div>
    </motion.div>
  );
} 