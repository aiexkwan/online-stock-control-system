import React, { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button } from '../ui/button';

export interface QrScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  hint?: string;
}

export const QrScanner: React.FC<QrScannerProps> = ({ open, onClose, onScan, title, hint }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<{ codeReader: BrowserMultiFormatReader, controls: any } | null>(null);

  useEffect(() => {
    if (!open) return;
    let stopped = false;
    const startScanner = async () => {
      if (!videoRef.current) return;
      try {
        const codeReader = new BrowserMultiFormatReader();
        scannerRef.current = { codeReader, controls: null };
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        let backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'));
        if (!backCamera) backCamera = devices[0];
        const deviceId = backCamera?.deviceId;
        if (!devices || devices.length === 0) {
          throw new Error('No camera devices found. Please ensure your device has a camera and it is enabled.');
        }
        if (!deviceId) {
          throw new Error('Cannot access camera device ID. Please ensure your device has a camera and it is enabled.');
        }
        const controls = await codeReader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
          if (result && !stopped) {
            stopped = true;
            if (controls) controls.stop();
            onScan(result.getText());
            onClose();
          }
        });
        scannerRef.current = { codeReader, controls };
      } catch (err: any) {
        onClose();
        // 可根據需要加上 toast 或錯誤回報
        // console.error('Camera scanning error:', err);
      }
    };
    startScanner();
    return () => {
      stopped = true;
      if (scannerRef.current?.controls) {
        scannerRef.current.controls.stop();
      }
    };
  }, [open, onClose, onScan]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
      <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center shadow-2xl">
        {title && <div className="text-xl font-bold text-white mb-2">{title}</div>}
        <video ref={videoRef} className="w-[400px] h-[300px] bg-black rounded-lg" autoPlay muted playsInline />
        {hint && <div className="text-sm text-gray-300 mt-2 mb-2">{hint}</div>}
        <Button className="mt-6 w-32" variant="destructive" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}; 