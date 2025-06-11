'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function DetailedDiagnostic() {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];
    
    const logMessage = `[${timestamp}] ${emoji} ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(`[Detailed Diagnostic] ${logMessage}`);
  };

  const clearLogs = () => {
    setLogs([]);
    setCurrentStep(0);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    clearLogs();

    try {
      // 步驟 1: 基本環境檢查
      setCurrentStep(1);
      addLog('開始詳細診斷...', 'info');
      addLog(`瀏覽器: ${navigator.userAgent.substring(0, 50)}...`, 'info');
      addLog(`平台: ${navigator.platform}`, 'info');
      addLog(`協議: ${window.location.protocol}`, 'info');
      addLog(`主機: ${window.location.hostname}`, 'info');

      await sleep(1000);

      // 步驟 2: API 可用性檢查
      setCurrentStep(2);
      addLog('檢查 MediaDevices API...', 'info');
      
      if (!navigator.mediaDevices) {
        addLog('MediaDevices API 不可用', 'error');
        return;
      }
      addLog('MediaDevices API 可用', 'success');

      if (!navigator.mediaDevices.getUserMedia) {
        addLog('getUserMedia 不可用', 'error');
        return;
      }
      addLog('getUserMedia 可用', 'success');

      await sleep(1000);

      // 步驟 3: 設備枚舉
      setCurrentStep(3);
      addLog('枚舉媒體設備...', 'info');
      
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        addLog(`找到 ${devices.length} 個設備`, 'info');
        
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        addLog(`找到 ${videoDevices.length} 個視頻設備`, videoDevices.length > 0 ? 'success' : 'error');
        
        videoDevices.forEach((device, index) => {
          addLog(`設備 ${index + 1}: ${device.label || '未命名'} (${device.deviceId.substring(0, 8)}...)`, 'info');
        });

        if (videoDevices.length === 0) {
          addLog('沒有找到視頻設備', 'error');
          return;
        }
      } catch (err: any) {
        addLog(`設備枚舉失敗: ${err.message}`, 'error');
        return;
      }

      await sleep(1000);

      // 步驟 4: 權限檢查
      setCurrentStep(4);
      addLog('檢查相機權限...', 'info');
      
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        addLog(`權限狀態: ${permissionStatus.state}`, permissionStatus.state === 'granted' ? 'success' : 'warning');
      } catch (err: any) {
        addLog(`權限檢查失敗: ${err.message}`, 'warning');
      }

      await sleep(1000);

      // 步驟 5: 第一次相機訪問嘗試
      setCurrentStep(5);
      addLog('第一次嘗試訪問相機...', 'info');
      
      try {
        const stream1 = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        
        addLog('第一次相機訪問成功', 'success');
        addLog(`視頻軌道數量: ${stream1.getVideoTracks().length}`, 'info');
        
        stream1.getVideoTracks().forEach((track, index) => {
          addLog(`軌道 ${index + 1}: ${track.label} (${track.readyState})`, 'info');
        });

        // 立即停止第一個流
        stream1.getTracks().forEach(track => track.stop());
        addLog('第一個流已停止', 'info');
        
      } catch (err: any) {
        addLog(`第一次相機訪問失敗: ${err.name} - ${err.message}`, 'error');
        return;
      }

      await sleep(2000);

      // 步驟 6: 第二次相機訪問嘗試（測試重複訪問）
      setCurrentStep(6);
      addLog('第二次嘗試訪問相機（測試重複訪問）...', 'info');
      
      try {
        const stream2 = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        
        addLog('第二次相機訪問成功', 'success');
        streamRef.current = stream2;

        if (videoRef.current) {
          videoRef.current.srcObject = stream2;
          addLog('視頻流已設置到 video 元素', 'success');
        }
        
      } catch (err: any) {
        addLog(`第二次相機訪問失敗: ${err.name} - ${err.message}`, 'error');
        return;
      }

      await sleep(1000);

      // 步驟 7: 測試同時訪問
      setCurrentStep(7);
      addLog('測試同時訪問相機（這應該會失敗）...', 'info');
      
      try {
        const stream3 = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        
        addLog('同時訪問成功（意外！）', 'warning');
        stream3.getTracks().forEach(track => track.stop());
        
      } catch (err: any) {
        addLog(`同時訪問失敗（預期行為）: ${err.name}`, 'success');
      }

      await sleep(1000);

      // 步驟 8: 測試不同約束條件
      setCurrentStep(8);
      addLog('測試不同的相機約束條件...', 'info');
      
      const constraints = [
        { video: true },
        { video: { facingMode: 'environment' } },
        { video: { facingMode: 'user' } },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } } }
      ];

      for (let i = 0; i < constraints.length; i++) {
        try {
          // 先停止當前流
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          await sleep(500);
          
          const testStream = await navigator.mediaDevices.getUserMedia(constraints[i]);
          addLog(`約束 ${i + 1} 成功: ${JSON.stringify(constraints[i])}`, 'success');
          
          testStream.getTracks().forEach(track => track.stop());
          
        } catch (err: any) {
          addLog(`約束 ${i + 1} 失敗: ${err.name}`, 'warning');
        }
      }

      setCurrentStep(9);
      addLog('診斷完成！', 'success');
      addLog('如果所有步驟都成功，但掃描器仍然失敗，問題可能在於 QR 解碼庫', 'info');

    } catch (err: any) {
      addLog(`診斷過程中發生錯誤: ${err.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const stopDiagnostic = () => {
    setIsRunning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    addLog('診斷已停止', 'warning');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex items-center mb-6">
        <ExclamationTriangleIcon className="h-8 w-8 text-orange-400 mr-3" />
        <h2 className="text-xl font-bold text-white">Detailed Camera Diagnostic</h2>
      </div>

      {/* 步驟指示器 */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
          <span>診斷進度</span>
          <span>{currentStep}/9</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 9) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 控制按鈕 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={runFullDiagnostic}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              運行中...
            </>
          ) : (
            <>
              <CameraIcon className="h-4 w-4" />
              開始詳細診斷
            </>
          )}
        </button>

        {isRunning && (
          <button
            onClick={stopDiagnostic}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            停止診斷
          </button>
        )}

        <button
          onClick={clearLogs}
          disabled={isRunning}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          清除日誌
        </button>
      </div>

      {/* 視頻預覽 */}
      {streamRef.current && (
        <div className="mb-6">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full max-w-md mx-auto bg-black rounded-lg"
          />
          <p className="text-center text-sm text-green-400 mt-2">
            ✅ 相機流正在顯示
          </p>
        </div>
      )}

      {/* 日誌輸出 */}
      <div className="bg-slate-900/50 border border-slate-600/50 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">詳細日誌：</h3>
        <div className="max-h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">點擊"開始詳細診斷"來運行完整的相機診斷...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-sm text-gray-300 font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 說明 */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <p className="text-blue-200 text-sm">
          💡 這個診斷工具會逐步測試相機訪問的每個環節，幫助找出掃描器失敗的具體原因。
          請運行完整診斷並將結果告訴我。
        </p>
      </div>
    </motion.div>
  );
} 