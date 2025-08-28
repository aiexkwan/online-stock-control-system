'use client';

import { useCallback, useRef, useEffect, useMemo } from 'react';

interface SoundOptions {
  volume?: number;
  enabled?: boolean;
}

/**
 * useSoundFeedback 性能優化版本
 * 主要改進：
 * 1. 更強制的記憶體清理邏輯
 * 2. 防止記憶體洩漏的安全措施
 * 3. 優化音頻資源管理
 * 4. 減少不必要的重新創建
 * 5. 支援 AbortController 模式的清理
 */
export function useSoundFeedback(options: SoundOptions = {}) {
  const { volume = 0.5, enabled = true } = options;

  // 穩定化選項以避免不必要的重新創建
  const stableOptions = useMemo(() => ({ volume, enabled }), [volume, enabled]);

  // 強化版資源管理
  const audioContextRef = useRef<AudioContext | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);
  const mountedRef = useRef(true);

  // 初始化 AudioContext 和清理機制
  useEffect(() => {
    mountedRef.current = true;

    if (typeof window === 'undefined' || audioContextRef.current) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (AudioCtx) {
        audioContextRef.current = new AudioCtx();
      }
    } catch (error) {
      console.warn('Failed to create AudioContext:', error);
    }

    // 強化版清理函式
    const cleanup = () => {
      mountedRef.current = false;

      // 清理所有已註冊的音效資源
      cleanupFunctionsRef.current.forEach(cleanupFn => {
        try {
          cleanupFn();
        } catch (error) {
          console.warn('Sound cleanup error:', error);
        }
      });
      cleanupFunctionsRef.current = [];

      // 強制關閉 AudioContext
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
        } catch (error) {
          console.warn('Failed to close AudioContext:', error);
        } finally {
          audioContextRef.current = null;
        }
      }
    };

    return cleanup;
  }, []);

  // 通用音效播放器，實施強化版資源管理
  const playSound = useCallback(
    (soundConfig: {
      frequencies: number[];
      durations: number[];
      volumeEnvelope: Array<{ time: number; volume: number }>;
      totalDuration: number;
    }) => {
      if (!stableOptions.enabled || !audioContextRef.current || !mountedRef.current) return;

      const context = audioContextRef.current;

      // 嘗試恢復 AudioContext（處理瀏覽器自動暫停）
      if (context.state === 'suspended') {
        context.resume().catch(error => {
          console.warn('Failed to resume AudioContext:', error);
          return;
        });
      }

      try {
        const oscillators: OscillatorNode[] = [];
        const gainNodes: GainNode[] = [];

        // 創建音頻節點
        soundConfig.frequencies.forEach(freq => {
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(context.destination);

          oscillators.push(oscillator);
          gainNodes.push(gainNode);
        });

        const now = context.currentTime;

        // 設定頻率
        oscillators.forEach((osc, index) => {
          const freq = soundConfig.frequencies[index] || soundConfig.frequencies[0];
          osc.frequency.setValueAtTime(freq, now);
        });

        // 設定音量包絡
        const primaryGainNode = gainNodes[0];
        soundConfig.volumeEnvelope.forEach(point => {
          const volume = point.volume * stableOptions.volume;
          primaryGainNode.gain.linearRampToValueAtTime(volume, now + point.time);
        });

        // 開始播放
        oscillators.forEach(osc => {
          osc.start(now);
          osc.stop(now + soundConfig.totalDuration);
        });

        // 強化版清理函式
        const cleanup = () => {
          oscillators.forEach(osc => {
            try {
              osc.disconnect();
            } catch (e) {
              // 忽略已經斷開連接的節點
            }
          });
          gainNodes.forEach(gain => {
            try {
              gain.disconnect();
            } catch (e) {
              // 忽略已經斷開連接的節點
            }
          });
        };

        // 註冊清理函式
        oscillators[0].onended = cleanup;
        cleanupFunctionsRef.current.push(cleanup);

        // 安全清理機制：即使 onended 事件失敗，也要確保清理
        setTimeout(
          () => {
            if (!mountedRef.current) return;

            const index = cleanupFunctionsRef.current.indexOf(cleanup);
            if (index > -1) {
              cleanupFunctionsRef.current.splice(index, 1);
              cleanup();
            }
          },
          (soundConfig.totalDuration + 0.1) * 1000
        );
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    },
    [stableOptions]
  );

  // Play success sound (rising tone)
  const playSuccess = useCallback(() => {
    playSound({
      frequencies: [800, 1000],
      durations: [0.1, 0.1],
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

  // Play error sound (falling tone with dissonance)
  const playError = useCallback(() => {
    playSound({
      frequencies: [300, 305], // 添加不協和音效
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

  // Play warning sound (three short beeps)
  const playWarning = useCallback(() => {
    playSound({
      frequencies: [600],
      durations: [0.4],
      volumeEnvelope: [
        { time: 0, volume: 0 },
        // Beep 1
        { time: 0.01, volume: 0.7 },
        { time: 0.08, volume: 0.7 },
        { time: 0.09, volume: 0 },
        // Beep 2
        { time: 0.15, volume: 0.7 },
        { time: 0.22, volume: 0.7 },
        { time: 0.23, volume: 0 },
        // Beep 3
        { time: 0.29, volume: 0.7 },
        { time: 0.36, volume: 0.7 },
        { time: 0.37, volume: 0 },
      ],
      totalDuration: 0.4,
    });
  }, [playSound]);

  // Play scan sound (quick high beep)
  const playScan = useCallback(() => {
    playSound({
      frequencies: [1500],
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

  // 使用 useMemo 穩定化返回對象，防止不必要的重新渲染
  return useMemo(
    () => ({
      playSuccess,
      playError,
      playWarning,
      playScan,
    }),
    [playSuccess, playError, playWarning, playScan]
  );
}

// Hook with persistent settings
export function useSoundSettings() {
  const getSoundEnabled = useCallback(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('soundFeedbackEnabled');
    return stored ? stored === 'true' : true;
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('soundFeedbackEnabled', enabled.toString());
  }, []);

  const getSoundVolume = useCallback(() => {
    if (typeof window === 'undefined') return 0.5;
    const stored = localStorage.getItem('soundFeedbackVolume');
    return stored ? parseFloat(stored) : 0.5;
  }, []);

  const setSoundVolume = useCallback((volume: number) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('soundFeedbackVolume', volume.toString());
  }, []);

  return {
    getSoundEnabled,
    setSoundEnabled,
    getSoundVolume,
    setSoundVolume,
  };
}
