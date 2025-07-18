/**
 * ScreenReaderOnly Component
 * 螢幕閱讀器專用組件 - 為視覺隱藏但對螢幕閱讀器可見的內容
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ScreenReaderOnlyProps {
  /**
   * 內容
   */
  children: React.ReactNode;
  
  /**
   * 自定義CSS類名
   */
  className?: string;
  
  /**
   * HTML元素類型
   */
  as?: keyof JSX.IntrinsicElements;
  
  /**
   * 是否在聚焦時顯示（用於調試）
   */
  showOnFocus?: boolean;
  
  /**
   * 是否在hover時顯示（用於調試）
   */
  showOnHover?: boolean;
}

/**
 * ScreenReaderOnly 組件
 * 實施視覺隱藏但對輔助技術可見的內容
 */
export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  className,
  as: Component = 'span',
  showOnFocus = false,
  showOnHover = false,
}) => {
  return (
    <Component
      className={cn(
        // 基本的螢幕閱讀器專用樣式
        'sr-only',
        
        // 調試模式：聚焦時顯示
        showOnFocus && [
          'focus-within:not-sr-only focus-within:absolute focus-within:z-50',
          'focus-within:bg-black focus-within:text-white focus-within:p-2',
          'focus-within:rounded focus-within:text-sm focus-within:whitespace-nowrap',
        ],
        
        // 調試模式：hover時顯示
        showOnHover && [
          'hover:not-sr-only hover:absolute hover:z-50',
          'hover:bg-black hover:text-white hover:p-2',
          'hover:rounded hover:text-sm hover:whitespace-nowrap',
        ],
        
        className
      )}
    >
      {children}
    </Component>
  );
};

/**
 * VisuallyHidden 組件 - ScreenReaderOnly 的別名
 */
export const VisuallyHidden = ScreenReaderOnly;

/**
 * LiveRegion 組件 - 用於動態內容宣告
 */
export interface LiveRegionProps {
  /**
   * 內容
   */
  children: React.ReactNode;
  
  /**
   * 宣告優先級
   */
  priority?: 'polite' | 'assertive' | 'off';
  
  /**
   * 是否原子性更新
   */
  atomic?: boolean;
  
  /**
   * 相關內容類型
   */
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  
  /**
   * 自定義CSS類名
   */
  className?: string;
  
  /**
   * 區域標籤
   */
  label?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'all',
  className,
  label,
}) => {
  return (
    <div
      className={cn('sr-only', className)}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      aria-label={label}
    >
      {children}
    </div>
  );
};

/**
 * Status 組件 - 用於狀態更新宣告
 */
export interface StatusProps {
  /**
   * 狀態內容
   */
  children: React.ReactNode;
  
  /**
   * 自定義CSS類名
   */
  className?: string;
  
  /**
   * 狀態標籤
   */
  label?: string;
}

export const Status: React.FC<StatusProps> = ({
  children,
  className,
  label,
}) => {
  return (
    <div
      className={cn('sr-only', className)}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      {children}
    </div>
  );
};

/**
 * Alert 組件 - 用於重要訊息宣告
 */
export interface AlertProps {
  /**
   * 警告內容
   */
  children: React.ReactNode;
  
  /**
   * 自定義CSS類名
   */
  className?: string;
  
  /**
   * 警告標籤
   */
  label?: string;
}

export const Alert: React.FC<AlertProps> = ({
  children,
  className,
  label,
}) => {
  return (
    <div
      className={cn('sr-only', className)}
      role="alert"
      aria-label={label}
      aria-live="assertive"
    >
      {children}
    </div>
  );
};

/**
 * Description 組件 - 用於提供額外描述
 */
export interface DescriptionProps {
  /**
   * 描述內容
   */
  children: React.ReactNode;
  
  /**
   * 描述ID（用於 aria-describedby）
   */
  id: string;
  
  /**
   * 自定義CSS類名
   */
  className?: string;
}

export const Description: React.FC<DescriptionProps> = ({
  children,
  id,
  className,
}) => {
  return (
    <div
      id={id}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
};

/**
 * Label 組件 - 用於提供標籤
 */
export interface LabelProps {
  /**
   * 標籤內容
   */
  children: React.ReactNode;
  
  /**
   * 標籤ID（用於 aria-labelledby）
   */
  id: string;
  
  /**
   * 自定義CSS類名
   */
  className?: string;
}

export const Label: React.FC<LabelProps> = ({
  children,
  id,
  className,
}) => {
  return (
    <div
      id={id}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  );
};

/**
 * Instructions 組件 - 用於提供使用說明
 */
export interface InstructionsProps {
  /**
   * 說明內容
   */
  children: React.ReactNode;
  
  /**
   * 說明ID
   */
  id?: string;
  
  /**
   * 自定義CSS類名
   */
  className?: string;
  
  /**
   * 說明類型
   */
  type?: 'usage' | 'keyboard' | 'navigation' | 'error';
}

export const Instructions: React.FC<InstructionsProps> = ({
  children,
  id,
  className,
  type = 'usage',
}) => {
  const getAriaLabel = () => {
    const labels = {
      usage: '使用說明',
      keyboard: '鍵盤操作說明',
      navigation: '導航說明',
      error: '錯誤處理說明',
    };
    return labels[type];
  };

  return (
    <div
      id={id}
      className={cn('sr-only', className)}
      aria-label={getAriaLabel()}
      role="note"
    >
      {children}
    </div>
  );
};

/**
 * Progress 組件 - 用於進度宣告
 */
export interface ProgressProps {
  /**
   * 當前進度值
   */
  value: number;
  
  /**
   * 最大值
   */
  max?: number;
  
  /**
   * 進度描述
   */
  description?: string;
  
  /**
   * 自定義CSS類名
   */
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  description,
  className,
}) => {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div
      className={cn('sr-only', className)}
      role="status"
      aria-live="polite"
    >
      {description && `${description}: `}
      進度 {percentage}% (第 {value} 步，共 {max} 步)
    </div>
  );
};

/**
 * Count 組件 - 用於數量宣告
 */
export interface CountProps {
  /**
   * 當前數量
   */
  current: number;
  
  /**
   * 總數量
   */
  total?: number;
  
  /**
   * 項目名稱
   */
  itemName?: string;
  
  /**
   * 自定義CSS類名
   */
  className?: string;
}

export const Count: React.FC<CountProps> = ({
  current,
  total,
  itemName = '項目',
  className,
}) => {
  return (
    <ScreenReaderOnly className={className}>
      {total !== undefined 
        ? `第 ${current} 個${itemName}，共 ${total} 個${itemName}`
        : `${current} 個${itemName}`
      }
    </ScreenReaderOnly>
  );
};

/**
 * useLiveRegion Hook - 用於動態宣告
 */
export function useLiveRegion() {
  const [message, setMessage] = React.useState<string>('');
  const [priority, setPriority] = React.useState<'polite' | 'assertive'>('polite');
  
  const announce = React.useCallback((
    newMessage: string,
    newPriority: 'polite' | 'assertive' = 'polite'
  ) => {
    // 清空訊息後重新設置，確保螢幕閱讀器會讀出
    setMessage('');
    setPriority(newPriority);
    
    setTimeout(() => {
      setMessage(newMessage);
    }, 100);
  }, []);
  
  const LiveRegionComponent = React.useCallback(() => (
    <LiveRegion priority={priority}>
      {message}
    </LiveRegion>
  ), [message, priority]);
  
  return {
    announce,
    LiveRegionComponent,
    message,
    priority,
  };
}

/**
 * withScreenReaderSupport HOC - 為組件添加螢幕閱讀器支援
 */
export function withScreenReaderSupport<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    description?: string;
    instructions?: string;
    announceOnMount?: string;
  } = {}
) {
  const WrappedComponent = React.forwardRef<HTMLElement, P>((props, ref) => {
    const { announce, LiveRegionComponent } = useLiveRegion();
    
    // 組件掛載時宣告
    React.useEffect(() => {
      if (options.announceOnMount) {
        announce(options.announceOnMount);
      }
    }, [announce]);
    
    return (
      <>
        <Component {...(props as P)} ref={ref} />
        
        {/* 描述 */}
        {options.description && (
          <ScreenReaderOnly>
            {options.description}
          </ScreenReaderOnly>
        )}
        
        {/* 使用說明 */}
        {options.instructions && (
          <Instructions type="usage">
            {options.instructions}
          </Instructions>
        )}
        
        {/* 實時宣告區域 */}
        <LiveRegionComponent />
      </>
    );
  });
  
  WrappedComponent.displayName = `withScreenReaderSupport(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ScreenReaderOnly;