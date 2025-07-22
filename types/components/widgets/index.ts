/**
 * Widget 類型統一導出
 * Unified widget types export
 */

// Common widget types
export * from './common';
export * from './states';
export * from './charts';
export * from './filters';
export * from './data-display';

// Re-export dashboard types for backward compatibility
export type {
  WidgetType,
  DashboardWidget,
  DashboardLayoutItem,
  DashboardConfig,
  DashboardLayout,
  DashboardLayoutExtended,
  DashboardTheme,
  WidgetRegistryItem,
  AdminWidgetConfig,
  AdminDashboardLayout,
  WidgetData,
  ThemeKey,
  WidgetCategoryType,
  BaseWidgetRendererProps,
  ComponentProps,
} from '@/types/components/dashboard';

// Type utilities
export type WidgetPropsOf<T extends Record<string, unknown>> = T extends { props: infer P }
  ? P
  : never;
export type WidgetConfigOf<T extends Record<string, unknown>> = T extends { config: infer C }
  ? C
  : never;
export type WidgetStateOf<T extends Record<string, unknown>> = T extends { state: infer S }
  ? S
  : never;

// Widget factory types
export interface WidgetFactory<TConfig = unknown, TState = unknown, TProps = unknown> {
  create: (config: TConfig) => {
    config: TConfig;
    state: TState;
    props: TProps;
  };
  validate: (config: TConfig) => { isValid: boolean; errors: string[] };
  migrate: (oldConfig: unknown, version: string) => TConfig;
}

// Widget registry types
export interface WidgetRegistration<TConfig = unknown, TState = unknown, TProps = unknown> {
  id: string;
  name: string;
  description: string;
  version: string;
  factory: WidgetFactory<TConfig, TState, TProps>;
  component: React.ComponentType<TProps>;
  icon?: React.ComponentType | string;
  tags?: string[];
  category: string;
  deprecated?: boolean;
  dependencies?: string[];
}

// Widget type guards
export const isWidget = (value: unknown): value is { type: string; config: unknown } => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'config' in value &&
    typeof (value as { type: unknown }).type === 'string'
  );
};

export const isWidgetWithData = (
  value: unknown
): value is { type: string; config: unknown; data: unknown } => {
  return isWidget(value) && 'data' in value;
};

export const isWidgetWithState = (
  value: unknown
): value is { type: string; config: unknown; state: unknown } => {
  return isWidget(value) && 'state' in value;
};
