/**
 * Dashboard Container - 新載入機制的 Dashboard 容器
 * 負責 Card 的渲染、佈局管理和生命週期控制
 * 
 * @module DashboardContainer
 * @version 1.0.0
 */

import React, { 
  useEffect, 
  useState, 
  useCallback, 
  useMemo, 
  Suspense,
  ErrorInfo,
  ReactNode,
  Component
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CardLoader } from './CardLoader';
import { CardRegistry } from './CardRegistry';
import { 
  CardLayoutConfig, 
  CardRendererConfig,
  CardProps,
  CardError 
} from './types';

/**
 * Dashboard 容器屬性
 */
export interface DashboardContainerProps {
  // 佈局配置
  layout: CardLayoutConfig[];
  
  // 渲染配置
  config?: CardRendererConfig;
  
  // 路由信息（用於預載入）
  route?: string;
  
  // 響應式斷點
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  
  // 事件處理
  onCardMount?: (cardId: string, cardType: string) => void;
  onCardUnmount?: (cardId: string, cardType: string) => void;
  onCardError?: (cardId: string, error: Error) => void;
  onLayoutChange?: (layout: CardLayoutConfig[]) => void;
  
  // 樣式
  className?: string;
  style?: React.CSSProperties;
  
  // 編輯模式
  isEditMode?: boolean;
  onCardAdd?: (type: string, position?: number) => void;
  onCardRemove?: (cardId: string) => void;
  onCardMove?: (cardId: string, newPosition: number) => void;
  onCardResize?: (cardId: string, size: { width?: string; height?: string }) => void;
}

/**
 * Card 載入狀態
 */
interface CardLoadState {
  id: string;
  type: string;
  status: 'loading' | 'ready' | 'error';
  component?: React.ComponentType<CardProps>;
  error?: Error;
}

/**
 * 簡單的 ErrorBoundary 組件
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackRender: (props: { error: Error }) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallbackRender({ error: this.state.error });
    }

    return this.props.children;
  }
}

/**
 * Dashboard Container 組件
 * 使用新的 Card 載入機制實現高性能的 Dashboard
 */
export const DashboardContainer: React.FC<DashboardContainerProps> = ({
  layout,
  config = {},
  route,
  breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
  onCardMount,
  onCardUnmount,
  onCardError,
  onLayoutChange,
  className = '',
  style,
  isEditMode = false,
  onCardAdd,
  onCardRemove,
  onCardMove,
  onCardResize,
}) => {
  // Card 載入狀態
  const [cardStates, setCardStates] = useState<Map<string, CardLoadState>>(new Map());
  
  // 當前視窗寬度
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  // 預載入 Cards
  useEffect(() => {
    if (route) {
      CardLoader.loadForRoute(route).catch(error => {
        console.error('[DashboardContainer] Route preload failed:', error);
      });
    }
  }, [route]);

  // 載入佈局中的 Cards
  useEffect(() => {
    const loadCards = async () => {
      const newStates = new Map<string, CardLoadState>();

      // 初始化載入狀態
      layout.forEach(item => {
        newStates.set(item.id, {
          id: item.id,
          type: item.type,
          status: 'loading',
        });
      });

      setCardStates(newStates);

      // 並行載入所有 Cards
      const loadPromises = layout.map(async item => {
        try {
          const loadedCard = await CardLoader.loadCard(item.type);
          
          newStates.set(item.id, {
            id: item.id,
            type: item.type,
            status: 'ready',
            component: loadedCard.component,
          });

          // 觸發掛載事件
          onCardMount?.(item.id, item.type);
        } catch (error) {
          const cardError = error instanceof Error ? error : new Error(String(error));
          
          newStates.set(item.id, {
            id: item.id,
            type: item.type,
            status: 'error',
            error: cardError,
          });

          // 觸發錯誤事件
          onCardError?.(item.id, cardError);
        }
      });

      await Promise.allSettled(loadPromises);
      setCardStates(new Map(newStates));
    };

    loadCards();

    // 清理函數
    return () => {
      layout.forEach(item => {
        onCardUnmount?.(item.id, item.type);
      });
    };
  }, [layout, onCardMount, onCardUnmount, onCardError]);

  // 響應式佈局監聽
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 計算網格列數
  const gridColumns = useMemo(() => {
    if (viewportWidth < breakpoints.sm!) return 1;
    if (viewportWidth < breakpoints.md!) return 2;
    if (viewportWidth < breakpoints.lg!) return 3;
    if (viewportWidth < breakpoints.xl!) return 4;
    return 6;
  }, [viewportWidth, breakpoints]);

  // 渲染單個 Card
  const renderCard = useCallback((layoutItem: CardLayoutConfig) => {
    const cardState = cardStates.get(layoutItem.id);
    
    if (!cardState || cardState.status === 'loading') {
      return (
        <CardSkeleton 
          key={layoutItem.id}
          width={layoutItem.width}
          height={layoutItem.height}
        />
      );
    }

    if (cardState.status === 'error') {
      return (
        <CardErrorFallback
          key={layoutItem.id}
          error={cardState.error!}
          cardId={layoutItem.id}
          cardType={layoutItem.type}
          onRetry={() => {
            // 重試載入
            setCardStates(prev => {
              const newStates = new Map(prev);
              newStates.set(layoutItem.id, {
                ...cardState,
                status: 'loading',
              });
              return newStates;
            });
          }}
        />
      );
    }

    const CardComponent = cardState.component!;
    const definition = CardRegistry.get(layoutItem.type);

    return (
      <CardWrapper
        key={layoutItem.id}
        cardId={layoutItem.id}
        gridArea={layoutItem.gridArea}
        width={layoutItem.width}
        height={layoutItem.height}
        isEditMode={isEditMode}
        onRemove={() => onCardRemove?.(layoutItem.id)}
        onMove={(position) => onCardMove?.(layoutItem.id, position)}
        onResize={(size) => onCardResize?.(layoutItem.id, size)}
      >
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <CardErrorFallback
              error={error}
              cardId={layoutItem.id}
              cardType={layoutItem.type}
            />
          )}
          onError={(error, info) => {
            console.error(`[Card ${layoutItem.id}] Error:`, error, info);
            onCardError?.(layoutItem.id, error);
          }}
        >
          <Suspense fallback={<CardSkeleton />}>
            <CardComponent
              config={layoutItem.config || {}}
              manifest={definition?.manifest}
              theme={config.theme}
              isEditMode={isEditMode}
              onConfigChange={(newConfig) => {
                const newLayout = layout.map(item =>
                  item.id === layoutItem.id
                    ? { ...item, config: { ...item.config, ...newConfig } }
                    : item
                );
                onLayoutChange?.(newLayout);
              }}
              onRemove={() => onCardRemove?.(layoutItem.id)}
            />
          </Suspense>
        </ErrorBoundary>
      </CardWrapper>
    );
  }, [
    cardStates, 
    isEditMode, 
    config.theme,
    layout,
    onCardRemove,
    onCardMove,
    onCardResize,
    onCardError,
    onLayoutChange
  ]);

  // 生成網格樣式
  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
    gap: '1rem',
    ...style,
  }), [gridColumns, style]);

  return (
    <div className={`dashboard-container ${className}`} style={gridStyle}>
      <AnimatePresence mode="popLayout">
        {layout.map(renderCard)}
      </AnimatePresence>
      
      {/* 編輯模式工具欄 */}
      {isEditMode && (
        <EditModeToolbar
          onAddCard={onCardAdd}
          availableCards={CardRegistry.getAll()}
        />
      )}
    </div>
  );
};

/**
 * Card 骨架屏組件
 */
const CardSkeleton: React.FC<{
  width?: string | number;
  height?: string | number;
}> = ({ width = '100%', height = 300 }) => {
  return (
    <div 
      className="card-skeleton animate-pulse"
      style={{ width, height }}
    >
      <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-full p-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Card 錯誤顯示組件
 */
const CardErrorFallback: React.FC<{
  error: Error;
  cardId: string;
  cardType: string;
  onRetry?: () => void;
}> = ({ error, cardId, cardType, onRetry }) => {
  return (
    <div className="card-error bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
        Card Loading Error
      </h3>
      <p className="text-sm text-red-600 dark:text-red-300 mb-2">
        Failed to load {cardType} (ID: {cardId})
      </p>
      <details className="text-xs text-red-500 dark:text-red-400">
        <summary className="cursor-pointer">Error Details</summary>
        <pre className="mt-2 whitespace-pre-wrap">{error.message}</pre>
      </details>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      )}
    </div>
  );
};

/**
 * Card 包裝器組件
 */
const CardWrapper: React.FC<{
  cardId: string;
  children: ReactNode;
  gridArea?: string;
  width?: string | number;
  height?: string | number;
  isEditMode?: boolean;
  onRemove?: () => void;
  onMove?: (position: number) => void;
  onResize?: (size: { width?: string; height?: string }) => void;
}> = ({
  cardId,
  children,
  gridArea,
  width,
  height,
  isEditMode,
  onRemove,
  onMove,
  onResize,
}) => {
  const style: React.CSSProperties = {
    gridArea,
    width,
    height,
    position: 'relative',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      style={style}
      className="card-wrapper"
    >
      {children}
      
      {/* 編輯模式控制 */}
      {isEditMode && (
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
          <button
            onClick={onRemove}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
            title="Remove Card"
          >
            ✕
          </button>
        </div>
      )}
    </motion.div>
  );
};

/**
 * 編輯模式工具欄
 */
const EditModeToolbar: React.FC<{
  onAddCard?: (type: string, position?: number) => void;
  availableCards: any[];
}> = ({ onAddCard, availableCards }) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600"
        >
          +
        </button>
        
        {showAddMenu && (
          <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 min-w-[200px]">
            <h3 className="font-semibold mb-2">Add Card</h3>
            <div className="space-y-1">
              {availableCards.map(card => (
                <button
                  key={card.type}
                  onClick={() => {
                    onAddCard?.(card.type);
                    setShowAddMenu(false);
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  {card.manifest.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};