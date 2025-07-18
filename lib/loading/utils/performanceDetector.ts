/**
 * Performance Detector
 * 性能檢測器
 * 
 * 檢測網絡狀況、設備性能，用於適應性載入策略
 */

import { PerformanceMetrics } from '../types';
import { logger } from '@/lib/logger';

// 網絡信息接口
interface NetworkInformation {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export class PerformanceDetector {
  private metrics: PerformanceMetrics | null = null;
  private lastUpdate: number = 0;
  private readonly cacheTime = 30000; // 30 秒快取

  constructor() {
    this.detectMetrics();
  }

  /**
   * 獲取性能指標
   */
  public getMetrics(): PerformanceMetrics | undefined {
    // 如果快取過期，重新檢測
    if (Date.now() - this.lastUpdate > this.cacheTime) {
      this.detectMetrics();
    }
    
    return this.metrics || undefined;
  }

  /**
   * 檢測性能指標
   */
  private detectMetrics(): void {
    try {
      const networkInfo = this.getNetworkInfo();
      const deviceInfo = this.getDeviceInfo();
      
      this.metrics = {
        ...networkInfo,
        ...deviceInfo,
        isLowEndDevice: this.isLowEndDevice(deviceInfo),
        isSlowNetwork: this.isSlowNetwork(networkInfo),
      };
      
      this.lastUpdate = Date.now();
      
      logger.debug('Performance metrics detected', this.metrics);
    } catch (error) {
      logger.warn('Failed to detect performance metrics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // 提供預設值
      this.metrics = this.getDefaultMetrics();
    }
  }

  /**
   * 獲取網絡信息
   */
  private getNetworkInfo() {
    const connection = (navigator as Navigator & { connection?: NetworkInformation; mozConnection?: NetworkInformation; webkitConnection?: NetworkInformation }).connection || 
                      (navigator as Navigator & { connection?: NetworkInformation; mozConnection?: NetworkInformation; webkitConnection?: NetworkInformation }).mozConnection || 
                      (navigator as Navigator & { connection?: NetworkInformation; mozConnection?: NetworkInformation; webkitConnection?: NetworkInformation }).webkitConnection;

    if (connection) {
      return {
        networkType: this.mapNetworkType(connection.type || connection.effectiveType),
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      };
    }

    // 如果無法檢測網絡信息，使用預設值
    return {
      networkType: 'unknown' as const,
      effectiveType: 'unknown',
      downlink: 1, // 假設 1 Mbps
      rtt: 100,    // 假設 100ms RTT
    };
  }

  /**
   * 獲取設備信息
   */
  private getDeviceInfo() {
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const hardwareConcurrency = navigator.hardwareConcurrency;

    return {
      deviceMemory: deviceMemory || 2, // 預設 2GB
      hardwareConcurrency: hardwareConcurrency || 2, // 預設 2 核心
    };
  }

  /**
   * 映射網絡類型
   */
  private mapNetworkType(type: string): PerformanceMetrics['networkType'] {
    switch (type) {
      case 'slow-2g':
        return 'slow-2g';
      case '2g':
        return '2g';
      case '3g':
        return '3g';
      case '4g':
        return '4g';
      default:
        return 'unknown';
    }
  }

  /**
   * 判斷是否為低端設備
   */
  private isLowEndDevice(deviceInfo: { deviceMemory: number; hardwareConcurrency: number }): boolean {
    // 記憶體少於 2GB 或 CPU 核心少於 2 個
    return deviceInfo.deviceMemory < 2 || deviceInfo.hardwareConcurrency < 2;
  }

  /**
   * 判斷是否為慢速網絡
   */
  private isSlowNetwork(networkInfo: { 
    networkType: PerformanceMetrics['networkType']; 
    downlink: number; 
    rtt: number; 
  }): boolean {
    // 網絡類型為 2G 或更慢，或下行速度小於 1Mbps，或 RTT 大於 300ms
    return (
      networkInfo.networkType === 'slow-2g' ||
      networkInfo.networkType === '2g' ||
      networkInfo.downlink < 1 ||
      networkInfo.rtt > 300
    );
  }

  /**
   * 獲取預設性能指標
   */
  private getDefaultMetrics(): PerformanceMetrics {
    return {
      networkType: 'unknown',
      effectiveType: 'unknown',
      downlink: 1,
      rtt: 100,
      deviceMemory: 2,
      hardwareConcurrency: 2,
      isLowEndDevice: false,
      isSlowNetwork: false,
    };
  }

  /**
   * 強制重新檢測
   */
  public forceUpdate(): void {
    this.lastUpdate = 0;
    this.detectMetrics();
  }

  /**
   * 監聽網絡變化
   */
  public startNetworkMonitoring(callback: (metrics: PerformanceMetrics) => void): () => void {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    
    if (!connection) {
      return () => {}; // 無法監聽，返回空函數
    }

    const handleChange = () => {
      this.forceUpdate();
      const metrics = this.getMetrics();
      if (metrics) {
        callback(metrics);
      }
    };

    connection.addEventListener('change', handleChange);

    return () => {
      connection.removeEventListener('change', handleChange);
    };
  }

  /**
   * 估算載入時間
   */
  public estimateLoadTime(dataSize: number, type: 'api' | 'image' | 'component' = 'api'): number {
    const metrics = this.getMetrics();
    if (!metrics) return 1000; // 預設 1 秒

    const { downlink, rtt, isSlowNetwork, isLowEndDevice } = metrics;

    // 基礎傳輸時間 (以 KB 為單位)
    const transferTime = (dataSize / 1024 / downlink) * 1000;
    
    // 處理時間倍數
    const processingMultiplier = isLowEndDevice ? 1.5 : 1;
    
    // 網絡延遲
    const networkDelay = rtt * 2; // 往返時間
    
    // 類型倍數
    const typeMultiplier = {
      api: 1,
      image: 1.2,
      component: 0.8,
    }[type];

    const totalTime = (transferTime + networkDelay) * processingMultiplier * typeMultiplier;

    // 最小 100ms，最大 30 秒
    return Math.max(100, Math.min(30000, totalTime));
  }

  /**
   * 獲取建議的載入策略
   */
  public getRecommendedStrategy() {
    const metrics = this.getMetrics();
    if (!metrics) return 'default';

    const { isSlowNetwork, isLowEndDevice } = metrics;

    if (isSlowNetwork && isLowEndDevice) {
      return 'minimal'; // 最簡載入
    } else if (isSlowNetwork || isLowEndDevice) {
      return 'optimized'; // 優化載入
    } else {
      return 'enhanced'; // 增強載入
    }
  }
}