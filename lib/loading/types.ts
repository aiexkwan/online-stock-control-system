/**
 * Loading System Types
 * 載入系統類型定義
 */

export interface LoadingState {
  /** 載入狀態 ID */
  id: string;
  /** 是否正在載入 */
  isLoading: boolean;
  /** 載入進度 (0-100) */
  progress?: number;
  /** 載入文字 */
  text?: string;
  /** 載入類型 */
  type: LoadingType;
  /** 優先級 */
  priority: LoadingPriority;
  /** 開始時間 */
  startTime: number;
  /** 預計完成時間 */
  estimatedDuration?: number;
  /** 錯誤訊息 */
  error?: string;
  /** 載入策略 */
  strategy?: LoadingStrategy;
}

export type LoadingType =
  | 'page' // 頁面級載入
  | 'component' // 組件級載入
  | 'data' // 數據載入
  | 'image' // 圖片載入
  | 'api' // API 請求
  | 'widget' // Widget 載入
  | 'background'; // 背景載入

export type LoadingPriority = 'low' | 'medium' | 'high' | 'critical';

export interface LoadingStrategy {
  /** 策略名稱 */
  name: string;
  /** 防抖時間 (ms) */
  debounceTime?: number;
  /** 超時時間 (ms) */
  timeout?: number;
  /** 最小顯示時間 (ms) - 避免閃爍 */
  minShowTime?: number;
  /** 是否使用骨架屏 */
  useSkeleton?: boolean;
  /** 是否顯示進度 */
  showProgress?: boolean;
  /** 錯誤重試次數 */
  retryCount?: number;
  /** 性能感知 */
  performanceAware?: boolean;
}

export interface LoadingContextValue {
  /** 當前載入狀態列表 */
  loadingStates: Map<string, LoadingState>;
  /** 全局載入狀態 */
  isGlobalLoading: boolean;
  /** 開始載入 */
  startLoading: (options: StartLoadingOptions) => void;
  /** 結束載入 */
  stopLoading: (id: string) => void;
  /** 更新載入進度 */
  updateProgress: (id: string, progress: number) => void;
  /** 更新載入文字 */
  updateText: (id: string, text: string) => void;
  /** 設置載入錯誤 */
  setError: (id: string, error: string) => void;
  /** 清除所有載入狀態 */
  clearAll: () => void;
  /** 獲取載入狀態 */
  getLoadingState: (id: string) => LoadingState | undefined;
}

export interface StartLoadingOptions {
  /** 載入狀態 ID */
  id: string;
  /** 載入類型 */
  type: LoadingType;
  /** 優先級 */
  priority?: LoadingPriority;
  /** 載入文字 */
  text?: string;
  /** 載入策略 */
  strategy?: Partial<LoadingStrategy>;
  /** 預計持續時間 */
  estimatedDuration?: number;
}

export interface UseLoadingOptions {
  /** 載入狀態 ID */
  id: string;
  /** 載入類型 */
  type?: LoadingType;
  /** 優先級 */
  priority?: LoadingPriority;
  /** 載入策略 */
  strategy?: Partial<LoadingStrategy>;
  /** 自動開始 */
  autoStart?: boolean;
}

export interface UseLoadingResult {
  /** 是否正在載入 */
  isLoading: boolean;
  /** 載入進度 */
  progress?: number;
  /** 載入文字 */
  text?: string;
  /** 錯誤訊息 */
  error?: string;
  /** 開始載入 */
  startLoading: (text?: string) => void;
  /** 結束載入 */
  stopLoading: () => void;
  /** 更新進度 */
  updateProgress: (progress: number) => void;
  /** 更新文字 */
  updateText: (text: string) => void;
  /** 設置錯誤 */
  setError: (error: string) => void;
  /** 載入狀態 */
  loadingState?: LoadingState;
}

export interface PerformanceMetrics {
  /** 網絡類型 */
  networkType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  /** 有效連接類型 */
  effectiveType: string;
  /** 下行速度 (Mbps) */
  downlink: number;
  /** RTT (ms) */
  rtt: number;
  /** 裝置記憶體 (GB) */
  deviceMemory: number;
  /** CPU 核心數 */
  hardwareConcurrency: number;
  /** 是否低端裝置 */
  isLowEndDevice: boolean;
  /** 是否慢速網絡 */
  isSlowNetwork: boolean;
}

export interface AdaptiveLoadingConfig {
  /** 性能指標 */
  performanceMetrics: PerformanceMetrics;
  /** 骨架屏配置 */
  skeleton: {
    /** 是否啟用 */
    enabled: boolean;
    /** 複雜度級別 */
    complexity: 'simple' | 'medium' | 'detailed';
    /** 動畫類型 */
    animation: 'pulse' | 'wave' | 'none';
  };
  /** 載入策略配置 */
  strategy: {
    /** 防抖時間 */
    debounceTime: number;
    /** 超時時間 */
    timeout: number;
    /** 最小顯示時間 */
    minShowTime: number;
    /** 是否顯示進度 */
    showProgress: boolean;
  };
}

export interface LoadingComponentProps {
  /** 載入狀態 ID */
  id?: string;
  /** 是否正在載入 */
  isLoading?: boolean;
  /** 載入文字 */
  text?: string;
  /** 載入進度 */
  progress?: number;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 自定義類名 */
  className?: string;
  /** 錯誤訊息 */
  error?: string;
  /** 載入完成回調 */
  onComplete?: () => void;
  /** 錯誤回調 */
  onError?: (error: string) => void;
}

export interface SkeletonLoaderProps extends LoadingComponentProps {
  /** 骨架類型 */
  type?: 'text' | 'avatar' | 'card' | 'list' | 'table' | 'chart' | 'custom';
  /** 行數 */
  rows?: number;
  /** 是否顯示頭像 */
  avatar?: boolean;
  /** 是否顯示標題 */
  title?: boolean;
  /** 動畫類型 */
  animation?: 'pulse' | 'wave' | 'none';
  /** 複雜度 */
  complexity?: 'simple' | 'medium' | 'detailed';
}

export interface ProgressIndicatorProps extends LoadingComponentProps {
  /** 進度條類型 */
  type?: 'linear' | 'circular' | 'step';
  /** 是否顯示百分比 */
  showPercentage?: boolean;
  /** 是否顯示步驟 */
  showSteps?: boolean;
  /** 步驟數據 */
  steps?: string[];
  /** 當前步驟 */
  currentStep?: number;
}

export interface LoadingOverlayProps extends LoadingComponentProps {
  /** 是否全螢幕 */
  fullscreen?: boolean;
  /** 背景透明度 */
  opacity?: number;
  /** 是否可取消 */
  cancellable?: boolean;
  /** 取消回調 */
  onCancel?: () => void;
  /** 子組件 */
  children?: React.ReactNode;
}
