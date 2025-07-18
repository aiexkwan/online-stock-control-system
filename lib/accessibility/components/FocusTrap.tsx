/**
 * FocusTrap Component
 * 焦點陷阱組件 - 用於對話框、模態框等需要限制焦點範圍的場景
 */

'use client';

import React, { useEffect, useRef, useImperativeHandle } from 'react';
import { useFocusTrap } from '../hooks/useFocusManagement';

export interface FocusTrapProps {
  /**
   * 子組件
   */
  children: React.ReactNode;
  
  /**
   * 是否啟用焦點陷阱
   */
  active?: boolean;
  
  /**
   * 是否自動聚焦第一個可聚焦元素
   */
  autoFocus?: boolean;
  
  /**
   * 退出時是否恢復之前的焦點
   */
  restoreFocusOnExit?: boolean;
  
  /**
   * 是否允許ESC鍵退出
   */
  escapeToExit?: boolean;
  
  /**
   * 啟用時的回調
   */
  onActivate?: () => void;
  
  /**
   * 停用時的回調
   */
  onDeactivate?: () => void;
  
  /**
   * 自定義CSS類名
   */
  className?: string;
  
  /**
   * HTML元素類型
   */
  as?: keyof JSX.IntrinsicElements;
}

export interface FocusTrapRef {
  /**
   * 手動釋放焦點陷阱
   */
  release: () => void;
}

/**
 * FocusTrap 組件
 * 實施焦點陷阱功能，確保焦點在指定容器內循環
 */
export const FocusTrap = React.forwardRef<FocusTrapRef, FocusTrapProps>(({
  children,
  active = true,
  autoFocus = true,
  restoreFocusOnExit = true,
  escapeToExit = true,
  onActivate,
  onDeactivate,
  className,
  as: Component = 'div',
}, ref) => {
  const containerRef = useRef<HTMLElement>(null);
  
  // 使用焦點陷阱Hook
  const { release } = useFocusTrap(containerRef, active, {
    autoFocus,
    restoreFocusOnExit,
    escapeToExit,
  });
  
  // 暴露release方法給父組件
  useImperativeHandle(ref, () => ({
    release,
  }), [release]);
  
  // 處理啟用/停用回調
  useEffect(() => {
    if (active) {
      onActivate?.();
    } else {
      onDeactivate?.();
    }
  }, [active, onActivate, onDeactivate]);
  
  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={className}
      data-focus-trap={active ? 'active' : 'inactive'}
    >
      {Component !== 'div' ? (
        React.createElement(Component, { className }, children)
      ) : (
        children
      )}
    </div>
  );
});

FocusTrap.displayName = 'FocusTrap';

/**
 * DialogFocusTrap 組件 - 針對對話框優化的焦點陷阱
 */
export interface DialogFocusTrapProps extends Omit<FocusTrapProps, 'as'> {
  /**
   * 對話框是否開啟
   */
  open: boolean;
  
  /**
   * 對話框關閉回調
   */
  onClose?: () => void;
  
  /**
   * 對話框標題ID（用於aria-labelledby）
   */
  titleId?: string;
  
  /**
   * 對話框描述ID（用於aria-describedby）
   */
  descriptionId?: string;
}

export const DialogFocusTrap: React.FC<DialogFocusTrapProps> = ({
  children,
  open,
  onClose,
  titleId,
  descriptionId,
  className,
  ...focusTrapProps
}) => {
  const handleEscapeKey = React.useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);
  
  // ESC鍵處理
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleEscapeKey();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleEscapeKey]);
  
  if (!open) return null;
  
  return (
    <FocusTrap
      {...focusTrapProps}
      active={open}
      className={className}
      as="div"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        {children}
      </div>
    </FocusTrap>
  );
};

/**
 * MenuFocusTrap 組件 - 針對選單優化的焦點陷阱
 */
export interface MenuFocusTrapProps extends Omit<FocusTrapProps, 'as'> {
  /**
   * 選單是否開啟
   */
  open: boolean;
  
  /**
   * 選單關閉回調
   */
  onClose?: () => void;
  
  /**
   * 選單類型
   */
  menuType?: 'menu' | 'listbox' | 'tree' | 'grid';
  
  /**
   * 選單標籤
   */
  label?: string;
}

export const MenuFocusTrap: React.FC<MenuFocusTrapProps> = ({
  children,
  open,
  onClose,
  menuType = 'menu',
  label,
  className,
  ...focusTrapProps
}) => {
  if (!open) return null;
  
  return (
    <FocusTrap
      {...focusTrapProps}
      active={open}
      className={className}
      as="div"
      onDeactivate={onClose}
    >
      <div
        role={menuType}
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </div>
    </FocusTrap>
  );
};

/**
 * FormFocusTrap 組件 - 針對表單優化的焦點陷阱
 */
export interface FormFocusTrapProps extends Omit<FocusTrapProps, 'as'> {
  /**
   * 表單提交回調
   */
  onSubmit?: (event: React.FormEvent) => void;
  
  /**
   * 表單標籤
   */
  label?: string;
  
  /**
   * 是否禁用提交
   */
  disabled?: boolean;
}

export const FormFocusTrap: React.FC<FormFocusTrapProps> = ({
  children,
  onSubmit,
  label,
  disabled = false,
  className,
  ...focusTrapProps
}) => {
  const handleSubmit = (event: React.FormEvent) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    
    onSubmit?.(event);
  };
  
  return (
    <FocusTrap
      {...focusTrapProps}
      className={className}
      as="form"
    >
      <form
        onSubmit={handleSubmit}
        aria-label={label}
        noValidate
      >
        {children}
      </form>
    </FocusTrap>
  );
};

/**
 * useFocusTrapRef Hook - 用於獲取焦點陷阱的ref
 */
export function useFocusTrapRef() {
  const ref = useRef<FocusTrapRef>(null);
  
  const release = React.useCallback(() => {
    ref.current?.release();
  }, []);
  
  return {
    ref,
    release,
  };
}

/**
 * withFocusTrap HOC - 為組件添加焦點陷阱功能
 */
export function withFocusTrap<P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<FocusTrapProps> = {}
) {
  const WrappedComponent = React.forwardRef<HTMLElement, P & { focusTrapActive?: boolean }>((
    { focusTrapActive = true, ...props },
    ref
  ) => {
    return (
      <FocusTrap
        active={focusTrapActive}
        {...options}
      >
        <Component {...(props as P)} ref={ref} />
      </FocusTrap>
    );
  });
  
  WrappedComponent.displayName = `withFocusTrap(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * FocusScope 組件 - 輕量級的焦點範圍限制
 */
export interface FocusScopeProps {
  children: React.ReactNode;
  trapped?: boolean;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  className?: string;
}

export const FocusScope: React.FC<FocusScopeProps> = ({
  children,
  trapped = false,
  onEscapeKeyDown,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!trapped) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscapeKeyDown?.(event);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [trapped, onEscapeKeyDown]);
  
  if (trapped) {
    return (
      <FocusTrap active={trapped} className={className}>
        {children}
      </FocusTrap>
    );
  }
  
  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

export default FocusTrap;