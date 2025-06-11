'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CameraIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function CameraTest() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkCameraSupport();
    return () => {
      stopStream();
    };
  }, []);

  const checkCameraSupport = () => {
    // 檢查瀏覽器支持
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    setIsSupported(supported);

    if (supported) {
      // 檢查設備列表
      navigator.mediaDevices.enumerateDevices()
        .then(deviceList => {
          const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
          setDevices(videoDevices);
        })
        .catch(err => {
          console.error('Error enumerating devices:', err);
          setError('Failed to enumerate camera devices');
        });
    }
  };

  const requestPermission = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // 優先後置相機
        } 
      });
      
      setHasPermission(true);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
      
    } catch (err: any) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setError('Camera not supported on this device.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is being used by another application.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  };

  const StatusIcon = ({ status }: { status: boolean | null }) => {
    if (status === null) return <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />;
    return status ? 
      <CheckCircleIcon className="w-5 h-5 text-green-500" /> : 
      <XCircleIcon className="w-5 h-5 text-red-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl"
    >
      <div className="flex items-center mb-6">
        <CameraIcon className="h-8 w-8 text-blue-400 mr-3" />
        <h2 className="text-xl font-bold text-white">Camera Diagnostics</h2>
      </div>

      <div className="space-y-4">
        {/* 瀏覽器支持檢查 */}
        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
          <span className="text-white">Browser Support</span>
          <StatusIcon status={isSupported} />
        </div>

        {/* HTTPS 檢查 */}
        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
          <span className="text-white">HTTPS Connection</span>
          <StatusIcon status={window.location.protocol === 'https:' || window.location.hostname === 'localhost'} />
        </div>

        {/* 設備檢查 */}
        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
          <span className="text-white">Camera Devices Found</span>
          <span className="text-white font-mono">{devices.length}</span>
        </div>

        {/* 設備列表 */}
        {devices.length > 0 && (
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <h3 className="text-white font-semibold mb-2">Available Cameras:</h3>
            <ul className="space-y-1">
              {devices.map((device, index) => (
                <li key={device.deviceId} className="text-sm text-gray-300">
                  {index + 1}. {device.label || `Camera ${index + 1}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 權限檢查 */}
        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
          <span className="text-white">Camera Permission</span>
          <StatusIcon status={hasPermission} />
        </div>

        {/* 錯誤信息 */}
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700/50 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex gap-3">
          {!isStreaming ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={requestPermission}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Test Camera
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={stopStream}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Stop Camera
            </motion.button>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={checkCameraSupport}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Refresh
          </motion.button>
        </div>

        {/* 視頻預覽 */}
        {isStreaming && (
          <div className="mt-4">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full max-w-md mx-auto bg-black rounded-lg"
            />
            <p className="text-center text-sm text-gray-400 mt-2">
              Camera is working! You should see the video feed above.
            </p>
          </div>
        )}

        {/* 故障排除提示 */}
        <div className="p-4 bg-slate-900/50 rounded-lg">
          <h3 className="text-white font-semibold mb-2">Troubleshooting Tips:</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Ensure you're using HTTPS or localhost</li>
            <li>• Allow camera permissions when prompted</li>
            <li>• Check if another app is using the camera</li>
            <li>• Try refreshing the page</li>
            <li>• Check browser camera settings</li>
            <li>• Ensure your device has a camera</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
} 