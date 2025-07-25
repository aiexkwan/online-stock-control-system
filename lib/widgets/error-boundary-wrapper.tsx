/**
 * Widget Error Boundary Wrapper
 * 自動為所有 widgets 添加錯誤邊界保護
 */

import React from 'react';
import { WidgetErrorBoundary, WidgetErrorFallback, ERROR_MESSAGES } from '@/lib/error-handling';

/**
 * Wraps a widget component with error boundary
 * @param widgetName - Name of the widget for error tracking
 * @param importFn - Dynamic import function for the widget
 */
export function wrapWidgetWithErrorBoundary(
  widgetName: string,
  importFn: () => Promise<{ default: React.ComponentType }>
): () => Promise<{ default: React.ComponentType }> {
  return async () => {
    try {
      const importedModule = await importFn();

      // 強化 null 檢查
      if (!importedModule || typeof importedModule !== 'object') {
        throw new Error(`Failed to import module for ${widgetName}: module is null or invalid`);
      }

      const WidgetComponent = importedModule.default || importedModule;

      // 檢查組件是否有效
      if (!WidgetComponent || typeof WidgetComponent !== 'function') {
        throw new Error(`Invalid component for ${widgetName}: component is not a function`);
      }

      // Return a wrapped component
      const WrappedWidget = (props: React.ComponentProps<typeof WidgetComponent>) => {
        return (
          <WidgetErrorBoundary
            widgetName={widgetName}
            fallback={({ retry, reset }) => (
              <WidgetErrorFallback
                error={new Error(ERROR_MESSAGES.RENDERING.WIDGET_FAILED)}
                retry={retry}
                reset={reset}
                widgetName={widgetName}
              />
            )}
            recoveryStrategy={{
              primaryAction: 'retry',
              secondaryActions: ['refresh'],
              autoRetry: {
                enabled: true,
                maxAttempts: 3,
                delayMs: 1000,
                backoffMultiplier: 2,
              },
            }}
          >
            <WidgetComponent {...props} />
          </WidgetErrorBoundary>
        );
      };

      // Preserve display name for debugging
      WrappedWidget.displayName = `ErrorBoundary(${WidgetComponent.displayName || WidgetComponent.name || widgetName})`;

      // Return the wrapped component as default export
      return { default: WrappedWidget };
    } catch (error) {
      console.error(`[wrapWidgetWithErrorBoundary] Failed to wrap widget ${widgetName}:`, error);

      // 返回一個錯誤組件而不是失敗
      const ErrorComponent = () => (
        <div className='rounded border border-red-300 bg-red-50 p-4'>
          <h4 className='font-semibold text-red-700'>Widget Import Failed</h4>
          <p className='mt-1 text-sm text-red-600'>Widget: {widgetName}</p>
          <p className='mt-2 text-xs text-gray-600'>
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      );

      ErrorComponent.displayName = `ImportError(${widgetName})`;

      return { default: ErrorComponent };
    }
  };
}

/**
 * Wraps all widget imports with error boundaries
 * @param widgetImports - Object containing widget import functions
 * @returns Object with wrapped import functions
 */
export function wrapAllWidgetsWithErrorBoundary(
  widgetImports: Record<string, () => Promise<{ default: React.ComponentType }>>
): Record<string, () => Promise<{ default: React.ComponentType }>> {
  const wrappedImports: Record<string, () => Promise<{ default: React.ComponentType }>> = {};

  for (const [widgetName, importFn] of Object.entries(widgetImports)) {
    // Skip already wrapped widgets
    if (widgetName.includes('WithErrorBoundary')) {
      wrappedImports[widgetName] = importFn;
    } else {
      wrappedImports[widgetName] = wrapWidgetWithErrorBoundary(widgetName, importFn);
    }
  }

  return wrappedImports;
}
