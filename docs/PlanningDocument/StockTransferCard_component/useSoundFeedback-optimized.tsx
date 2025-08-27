/**
 * useSoundFeedback 性能優化版本
 * 主要改進：
 * 1. 更強制的記憶體清理邏輯
 * 2. 防止記憶體洩漏的安全措施
 * 3. 優化音頻資源管理
 * 4. 減少不必要的重新創建
 */

'use client';

import { useCallback, useRef, useEffect, useMemo } from 'react';

interface SoundOptions {
  volume?: number;
  enabled?: boolean;
}

export function useSoundFeedback(options: SoundOptions = {}) {
  const { volume = 0.5, enabled = true } = options;

  // 性能優化：使用 useMemo 穩定選項引用
  const stableOptions = useMemo(() => ({ volume, enabled }), [volume, enabled]);

  // Audio contexts - 使用更強的類型定義
  const audioContextRef = useRef<AudioContext | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // 性能優化：初始化音頻上下文，避免重複創建
  useEffect(() => {
    if (typeof window === 'undefined' || audioContextRef.current) return;

    try {
      const AudioCtx = window.AudioContext || 
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    } catch (error) {
      console.warn('Failed to create AudioContext:', error);
    }

    // 強化的清理函數
    const cleanup = () => {
      // 執行所有註冊的清理函數
      cleanupFunctionsRef.current.forEach(cleanupFn => {
        try {
          cleanupFn();
        } catch (error) {
          console.warn('Sound cleanup error:', error);
        }
      });
      cleanupFunctionsRef.current = [];

      // 關閉音頻上下文
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
        } catch (error) {
          console.warn('Failed to close AudioContext:', error);
        }
        audioContextRef.current = null;
      }
    };

    return cleanup;
  }, []); // 移除不必要的依賴

  // 性能優化：通用音效播放函數
  const playSound = useCallback((soundConfig: {
    frequency: number[];
    durations: number[];
    volumeEnvelope: Array<{ time: number; volume: number }>;
    totalDuration: number;
  }) => {
    if (!stableOptions.enabled || !audioContextRef.current) return;

    const context = audioContextRef.current;
    if (context.state === 'suspended') {
      context.resume();
    }

    try {
      const oscillators: OscillatorNode[] = [];
      const gainNodes: GainNode[] = [];

      // 創建振盪器和增益節點
      soundConfig.frequency.forEach(freq => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillators.push(oscillator);
        gainNodes.push(gainNode);
      });

      const now = context.currentTime;

      // 配置頻率
      oscillators.forEach((osc, index) => {
        const freq = soundConfig.frequency[index] || soundConfig.frequency[0];
        osc.frequency.setValueAtTime(freq, now);
      });

      // 配置音量包絡
      const gainNode = gainNodes[0]; // 使用第一個增益節點統一控制音量
      soundConfig.volumeEnvelope.forEach(point => {
        const volume = point.volume * stableOptions.volume;
        gainNode.gain.linearRampToValueAtTime(volume, now + point.time);
      });

      // 播放聲音
      oscillators.forEach(osc => {
        osc.start(now);
        osc.stop(now + soundConfig.totalDuration);
      });

      // 註冊清理函數
      const cleanup = () => {
        oscillators.forEach(osc => {
          try {
            osc.disconnect();
          } catch (e) {
            // 忽略已斷連的振盪器
          }
        });
        gainNodes.forEach(gain => {
          try {
            gain.disconnect();
          } catch (e) {
            // 忽略已斷連的增益節點
          }
        });
      };

      // 自動清理
      oscillators[0].onended = cleanup;
      
      // 添加到清理函數列表（以防 onended 未觸發）
      cleanupFunctionsRef.current.push(cleanup);
      
      // 定時清理（雙重保險）
      setTimeout(() => {
        const index = cleanupFunctionsRef.current.indexOf(cleanup);
        if (index > -1) {
          cleanupFunctionsRef.current.splice(index, 1);
          cleanup();
        }
      }, (soundConfig.totalDuration + 0.1) * 1000);

    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, [stableOptions]);

  // 成功音效 - 使用優化的通用函數
  const playSuccess = useCallback(() => {
    playSound({
      frequency: [800, 1200, 1000, 1400],
      durations: [0.1, 0.1, 0.1, 0.1],
      volumeEnvelope: [
        { time: 0, volume: 0 },
        { time: 0.01, volume: 1 },
        { time: 0.1, volume: 1 },
        { time: 0.12, volume: 0 },
        { time: 0.15, volume: 1 },
        { time: 0.25, volume: 1 },
        { time: 0.3, volume: 0 },
      ],
      totalDuration: 0.3,
    });
  }, [playSound]);

  // 錯誤音效 - 優化版本
  const playError = useCallback(() => {
    playSound({
      frequency: [300, 305], // 雙重頻率產生不和諧音
      durations: [0.3, 0.3],
      volumeEnvelope: [
        { time: 0, volume: 0 },
        { time: 0.02, volume: 0.8 },
        { time: 0.28, volume: 0.8 },
        { time: 0.3, volume: 0 },
      ],
      totalDuration: 0.3,
    });
  }, [playSound]);

  // 警告音效 - 優化版本
  const playWarning = useCallback(() => {
    playSound({
      frequency: [600],
      durations: [0.4],
      volumeEnvelope: [
        { time: 0, volume: 0 },
        // 三次嗶聲
        { time: 0.01, volume: 0.7 },
        { time: 0.08, volume: 0.7 },
        { time: 0.09, volume: 0 },
        { time: 0.15, volume: 0.7 },
        { time: 0.22, volume: 0.7 },
        { time: 0.23, volume: 0 },
        { time: 0.29, volume: 0.7 },
        { time: 0.36, volume: 0.7 },
        { time: 0.37, volume: 0 },
      ],
      totalDuration: 0.4,
    });
  }, [playSound]);

  // 掃描音效 - 優化版本
  const playScan = useCallback(() => {
    playSound({
      frequency: [1500],
      durations: [0.1],
      volumeEnvelope: [
        { time: 0, volume: 0 },
        { time: 0.01, volume: 0.6 },
        { time: 0.05, volume: 0.6 },
        { time: 0.06, volume: 0 },
      ],
      totalDuration: 0.1,
    });
  }, [playSound]);

  // 性能優化：使用 useMemo 穩定返回值
  return useMemo(() => ({
    playSuccess,
    playError,
    playWarning,
    playScan,
  }), [playSuccess, playError, playWarning, playScan]);
}

// Hook with persistent settings - 性能優化版本
export function useSoundSettings() {
  // 性能優化：使用 useMemo 創建穩定的API
  const api = useMemo(() => {
    const getSoundEnabled = () => {
      if (typeof window === 'undefined') return true;
      const stored = localStorage.getItem('soundFeedbackEnabled');
      return stored ? stored === 'true' : true;
    };

    const setSoundEnabled = (enabled: boolean) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem('soundFeedbackEnabled', enabled.toString());
    };

    const getSoundVolume = () => {
      if (typeof window === 'undefined') return 0.5;
      const stored = localStorage.getItem('soundFeedbackVolume');
      return stored ? Math.max(0, Math.min(1, parseFloat(stored))) : 0.5;
    };

    const setSoundVolume = (volume: number) => {
      if (typeof window === 'undefined') return;
      const clampedVolume = Math.max(0, Math.min(1, volume));
      localStorage.setItem('soundFeedbackVolume', clampedVolume.toString());
    };

    return {
      getSoundEnabled,
      setSoundEnabled,
      getSoundVolume,
      setSoundVolume,
    };
  }, []); // 空依賴數組，確保API穩定

  return api;
}