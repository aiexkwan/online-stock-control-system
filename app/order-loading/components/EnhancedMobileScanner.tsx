'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MobileButton, MobileInput, MobileCard } from '@/components/ui/mobile';
import { mobileConfig, cn } from '@/lib/mobile-config';
import { 
  MagnifyingGlassIcon,
  CameraIcon,
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { UnifiedSearch } from '@/components/ui/unified-search';
import { useSoundFeedback } from '@/app/hooks/useSoundFeedback';

interface EnhancedMobileScannerProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: any) => void;
  isLoading: boolean;
  recentScans?: Array<{
    value: string;
    timestamp: Date;
    success: boolean;
  }>;
}

export function EnhancedMobileScanner({
  value,
  onChange,
  onSelect,
  isLoading,
  recentScans = []
}: EnhancedMobileScannerProps) {
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  const [lastScanResult, setLastScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const inputRef = useRef<any>(null);
  const sound = useSoundFeedback();

  // Auto-focus on mount and mode changes
  useEffect(() => {
    if (scanMode === 'manual' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [scanMode]);

  // Clear last scan result after delay
  useEffect(() => {
    if (lastScanResult) {
      const timer = setTimeout(() => {
        setLastScanResult(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastScanResult]);

  // Haptic feedback simulation (vibration API)
  const triggerHaptic = (pattern: 'success' | 'error' | 'warning') => {
    if ('vibrate' in navigator) {
      switch (pattern) {
        case 'success':
          navigator.vibrate([50, 50, 50]); // Short triple vibration
          break;
        case 'error':
          navigator.vibrate(200); // Long vibration
          break;
        case 'warning':
          navigator.vibrate([100, 50, 100]); // Two medium vibrations
          break;
      }
    }
  };

  const handleScanSuccess = (result: any) => {
    sound.playSuccess();
    triggerHaptic('success');
    setLastScanResult({ success: true, message: 'Scan successful!' });
    onSelect(result);
  };

  const handleScanError = (message: string) => {
    sound.playError();
    triggerHaptic('error');
    setLastScanResult({ success: false, message });
  };

  return (
    <div className={mobileConfig.spacing.stack}>
      {/* Scan Mode Toggle */}
      <div className="flex gap-2">
        <MobileButton
          variant={scanMode === 'manual' ? 'primary' : 'secondary'}
          size="sm"
          fullWidth
          onClick={() => setScanMode('manual')}
          icon={<QrCodeIcon className="h-5 w-5" />}
        >
          Manual Input
        </MobileButton>
        <MobileButton
          variant={scanMode === 'camera' ? 'primary' : 'secondary'}
          size="sm"
          fullWidth
          onClick={() => setScanMode('camera')}
          icon={<CameraIcon className="h-5 w-5" />}
          disabled // Camera scanning to be implemented
        >
          Camera Scan
        </MobileButton>
      </div>

      {/* Scan Result Feedback */}
      {lastScanResult && (
        <div className={cn(
          "p-4 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2",
          lastScanResult.success 
            ? "bg-green-500/20 border border-green-500/50" 
            : "bg-red-500/20 border border-red-500/50"
        )}>
          {lastScanResult.success ? (
            <CheckCircleIcon className="h-6 w-6 text-green-400" />
          ) : (
            <XCircleIcon className="h-6 w-6 text-red-400" />
          )}
          <span className={cn(
            mobileConfig.fontSize.bodyLarge,
            lastScanResult.success ? "text-green-300" : "text-red-300"
          )}>
            {lastScanResult.message}
          </span>
        </div>
      )}

      {/* Manual Input Mode */}
      {scanMode === 'manual' && (
        <div className="relative">
          <UnifiedSearch
            ref={inputRef}
            searchType="pallet"
            onSelect={handleScanSuccess}
            placeholder="Scan or type pallet/series..."
            enableAutoDetection={true}
            value={value}
            onChange={onChange}
            isLoading={isLoading}
            disabled={isLoading}
          />
          
          {/* Scanning indicator */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/50 rounded-xl flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-purple-300">Processing scan...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Scans - Quick Access */}
      {recentScans.length > 0 && (
        <div>
          <h4 className={cn(mobileConfig.fontSize.bodySmall, "text-slate-400 mb-2")}>
            Recent Scans
          </h4>
          <div className="flex flex-wrap gap-2">
            {recentScans.slice(0, 3).map((scan, index) => (
              <MobileButton
                key={index}
                variant="secondary"
                size="sm"
                onClick={() => {
                  onChange(scan.value);
                  sound.playScan();
                }}
                className={cn(
                  "flex items-center gap-2",
                  scan.success ? "border-green-700/50" : "border-red-700/50"
                )}
              >
                {scan.success ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-400" />
                ) : (
                  <XCircleIcon className="h-4 w-4 text-red-400" />
                )}
                <span className="font-mono">{scan.value}</span>
              </MobileButton>
            ))}
          </div>
        </div>
      )}

      {/* Visual Scan Guide */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <h4 className={cn(mobileConfig.fontSize.bodySmall, "text-slate-400 mb-2")}>
          Scan Tips
        </h4>
        <ul className={cn(mobileConfig.fontSize.bodySmall, "text-slate-500 space-y-1")}>
          <li>• Hold device steady when scanning</li>
          <li>• Ensure barcode is well-lit</li>
          <li>• Tap input field to use keyboard</li>
          <li>• Recent scans appear above for quick access</li>
        </ul>
      </div>
    </div>
  );
}