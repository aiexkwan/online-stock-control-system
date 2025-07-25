/**
 * 統一的 Heroicons 類型定義
 * 匹配 @heroicons/react 的實際類型結構
 */

import * as React from 'react';

// Heroicons 的標準類型定義，與 @heroicons/react 完全匹配
export type HeroIconProps = React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
  title?: string;
  titleId?: string;
} & React.RefAttributes<SVGSVGElement>;

// Heroicons 組件類型
export type HeroIcon = React.ForwardRefExoticComponent<HeroIconProps>;

// 簡化的 SVG 屬性類型，用於一般情況
export type IconProps = React.SVGProps<SVGSVGElement> & {
  className?: string;
  title?: string;
  titleId?: string;
};

// 通用圖標組件類型，可以是 React 組件類型
export type IconComponent = React.ComponentType<IconProps>;
