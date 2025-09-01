'use client';

import React, { createContext, useContext, useRef, useEffect, ReactNode, useMemo } from 'react';
import { ServiceContainer } from '../services/ServiceContainer';
import { useMemoryCleanup } from '../hooks/useMemoryCleanup';
import type {
  IServiceContainer,
  IServiceConfiguration,
  IServiceEvents,
} from '../services/interfaces';

/**
 * 服務上下文接口
 */
interface ServiceContextValue {
  container: IServiceContainer;
  isReady: boolean;
  error: Error | null;
}

/**
 * 服務提供者屬性
 */
interface ServiceProviderProps {
  children: ReactNode;
  config?: Partial<IServiceConfiguration>;
  onError?: (error: Error) => void;
  onServiceRecovery?: (serviceName: string) => void;
  enableDevTools?: boolean;
}

/**
 * 服務上下文
 */
const ServiceContext = createContext<ServiceContextValue | null>(null);

/**
 * ServiceProvider - React Context 服務提供者
 *
 * 職責：
 * - 創建和管理服務容器的生命周期
 * - 提供 React 組件樹中的服務訪問
 * - 處理服務初始化和錯誤恢復
 * - 支持開發工具和調試功能
 */
export function ServiceProvider({
  children,
  config,
  onError,
  onServiceRecovery,
  enableDevTools = false,
}: ServiceProviderProps) {
  const containerRef = useRef<IServiceContainer | null>(null);
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const initializationRef = useRef(false);

  // 記憶體清理管理
  const memoryCleanup = useMemoryCleanup({
    componentName: 'ServiceProvider',
    enableMonitoring: true,
    enableDebug: enableDevTools,
  });

  // 創建服務事件處理器
  const serviceEvents = useMemo<IServiceEvents>(
    () => ({
      onServiceError: (serviceName: string, serviceError: Error) => {
        console.error(`Service error in ${serviceName}:`, serviceError);
        setError(serviceError);
        onError?.(serviceError);
      },

      onServiceRecovery: (serviceName: string) => {
        console.log(`Service ${serviceName} recovered`);
        setError(null);
        onServiceRecovery?.(serviceName);
      },

      onConfigurationChange: (newConfig: Partial<IServiceConfiguration>) => {
        if (enableDevTools) {
          console.log('Service configuration updated:', newConfig);
        }
      },

      onServiceDisposed: (serviceName: string) => {
        if (enableDevTools) {
          console.log(`Service ${serviceName} disposed`);
        }
      },
    }),
    [onError, onServiceRecovery, enableDevTools]
  );

  // 創建服務容器
  const container = useMemo(() => {
    if (containerRef.current) {
      return containerRef.current;
    }

    const newContainer = new ServiceContainer(config, serviceEvents);
    containerRef.current = newContainer;

    if (enableDevTools) {
      // 在開發模式下將容器暴露到 window 對象
      (window as any).__SERVICE_CONTAINER__ = newContainer;
    }

    return newContainer;
  }, [config, serviceEvents, enableDevTools]);

  // 初始化服務容器
  useEffect(() => {
    let mounted = true;

    const initializeContainer = async () => {
      if (initializationRef.current) {
        return;
      }

      initializationRef.current = true;
      setError(null);

      try {
        await container.initialize();

        if (mounted) {
          setIsReady(true);

          if (enableDevTools) {
            console.log('ServiceProvider initialized successfully');
          }
        }
      } catch (initError) {
        if (mounted) {
          const error =
            initError instanceof Error ? initError : new Error('Service initialization failed');

          setError(error);
          serviceEvents.onServiceError('ServiceProvider', error);
        }
      }
    };

    initializeContainer();

    return () => {
      mounted = false;
      initializationRef.current = false;
    };
  }, [container, serviceEvents, enableDevTools]);

  // 清理服務容器
  useEffect(() => {
    // 註冊服務容器清理
    memoryCleanup.registerCleanup(() => {
      if (containerRef.current && !(containerRef.current as ServiceContainer).isDisposed) {
        containerRef.current.dispose();
        containerRef.current = null;

        if (enableDevTools) {
          delete (window as any).__SERVICE_CONTAINER__;
        }
      }
    }, 'service-container-cleanup');

    return () => {
      if (containerRef.current && !(containerRef.current as ServiceContainer).isDisposed) {
        containerRef.current.dispose();
        containerRef.current = null;

        if (enableDevTools) {
          delete (window as any).__SERVICE_CONTAINER__;
        }
      }
    };
  }, [enableDevTools, memoryCleanup]);

  // 上下文值
  const contextValue = useMemo<ServiceContextValue>(
    () => ({
      container,
      isReady: isReady && !error,
      error,
    }),
    [container, isReady, error]
  );

  return <ServiceContext.Provider value={contextValue}>{children}</ServiceContext.Provider>;
}

/**
 * 使用服務容器 Hook
 */
export function useServiceContainer(): IServiceContainer {
  const context = useContext(ServiceContext);

  if (!context) {
    throw new Error('useServiceContainer must be used within a ServiceProvider');
  }

  if (!context.isReady) {
    if (context.error) {
      throw new Error(`Services are not available: ${context.error.message}`);
    }
    throw new Error('Services are still initializing');
  }

  return context.container;
}

/**
 * 使用聊天服務 Hook
 */
export function useChatService() {
  const container = useServiceContainer();
  return container.chatService;
}

/**
 * 使用建議服務 Hook
 */
export function useSuggestionService() {
  const container = useServiceContainer();
  return container.suggestionService;
}

/**
 * 使用消息格式化服務 Hook
 */
export function useMessageFormatter() {
  const container = useServiceContainer();
  return container.messageFormatter;
}

/**
 * 使用服務狀態 Hook
 */
export function useServiceStatus() {
  const context = useContext(ServiceContext);

  if (!context) {
    return {
      isReady: false,
      error: new Error('useServiceStatus must be used within a ServiceProvider'),
      container: null,
    };
  }

  return {
    isReady: context.isReady,
    error: context.error,
    container: context.container,
  };
}

/**
 * 使用服務健康檢查 Hook
 */
export function useServiceHealth() {
  const { container, isReady } = useServiceStatus();
  const [healthStatus, setHealthStatus] = React.useState<{
    overall: boolean;
    services: {
      chat: boolean;
      suggestion: boolean;
      formatting: boolean;
    };
    issues?: string[];
    lastCheck?: Date;
  } | null>(null);

  const performHealthCheck = React.useCallback(async () => {
    if (!isReady || !container) {
      return;
    }

    try {
      const health = await (container as ServiceContainer).performHealthCheck();
      setHealthStatus({
        ...health,
        lastCheck: new Date(),
      });
      return health;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStatus = {
        overall: false,
        services: {
          chat: false,
          suggestion: false,
          formatting: false,
        },
        issues: [`Health check failed: ${errorMessage}`],
        lastCheck: new Date(),
      };

      setHealthStatus(errorStatus);
      return errorStatus;
    }
  }, [container, isReady]);

  return {
    healthStatus,
    performHealthCheck,
    isReady,
  };
}

/**
 * 開發工具 Hook（僅開發環境）
 */
export function useServiceDevTools() {
  const { container, isReady } = useServiceStatus();

  return useMemo(() => {
    if (process.env.NODE_ENV !== 'development' || !isReady || !container) {
      return null;
    }

    return {
      container,
      getConfiguration: () => (container as ServiceContainer).getConfiguration(),

      // 服務替換工具（測試用）
      replaceServices: {
        chat: (service: any) => container.replaceChatService(service),
        suggestion: (service: any) => container.replaceSuggestionService(service),
        formatter: (service: any) => container.replaceMessageFormatter(service),
      },

      // 健康檢查
      performHealthCheck: () => (container as ServiceContainer).performHealthCheck(),

      // 配置更新
      updateConfig: (newConfig: Partial<IServiceConfiguration>) =>
        (container as ServiceContainer).updateConfiguration(newConfig),
    };
  }, [container, isReady]);
}
