/**
 * Right Side Card Wrapper
 * 右側佈局卡片包裝器 - 自動解決雙重標題問題
 *
 * Created: 2025-08-13
 * Purpose: Automatically handle double title issues for right-side layout cards
 */

'use client';

import React from 'react';
import {
  EnhancedGlassmorphicCard,
  EnhancedGlassmorphicCardProps,
} from './EnhancedGlassmorphicCard';

interface RightSideCardWrapperProps extends EnhancedGlassmorphicCardProps {
  /**
   * 自動檢測並處理雙重標題
   * 右側卡片通常會出現容器標題與內容標題衝突的問題
   */
  autoSuppressTitle?: boolean;
}

/**
 * Right Side Card Wrapper Component
 * 專為右側佈局設計的卡片包裝器
 */
export const RightSideCardWrapper: React.FC<RightSideCardWrapperProps> = ({
  autoSuppressTitle: _autoSuppressTitle = true,
  children,
  ...props
}) => {
  return (
    <EnhancedGlassmorphicCard
      {...props}
      // 右側卡片的默認配置
      variant={props.variant || 'glass'}
      padding={props.padding || 'base'}
      animate={props.animate !== false} // 默認啟用動畫
    >
      {children}
    </EnhancedGlassmorphicCard>
  );
};

/**
 * Utility function to wrap any component for right-side usage
 * 工具函數：為任何組件包裹右側卡片容器
 */
export function withRightSideCard<T extends object>(
  Component: React.ComponentType<T>,
  cardProps?: Partial<EnhancedGlassmorphicCardProps>
) {
  const WrappedComponent = React.forwardRef<HTMLDivElement, T>((props, ref) => {
    return (
      <RightSideCardWrapper {...cardProps}>
        <Component {...(props as T)} ref={ref} />
      </RightSideCardWrapper>
    );
  });

  WrappedComponent.displayName = `withRightSideCard(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default RightSideCardWrapper;
