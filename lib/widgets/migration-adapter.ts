/**
 * Migration Adapter
 * 支援新舊系統並行運行的適配器
 */

import React, { useEffect, useRef } from 'react';
import { WidgetComponentProps } from '@/app/types/dashboard';
import { widgetRegistry } from './enhanced-registry';

interface MigrationAdapterProps extends WidgetComponentProps {
  widgetId: string;
  oldComponent?: React.ComponentType<WidgetComponentProps>;
  enableDualRun?: boolean;
  onLayoutChange?: (oldLayout: any, newLayout: any) => void;
}

/**
 * 遷移適配器組件
 * 可以同時運行新舊兩個版本的 widget，用於驗證和比較
 */
export const MigrationAdapter: React.FC<MigrationAdapterProps> = ({
  widgetId,
  oldComponent: OldComponent,
  enableDualRun = false,
  onLayoutChange,
  ...props
}) => {
  const oldLayoutRef = useRef<any>(null);
  const newLayoutRef = useRef<any>(null);

  // 獲取新版本的組件
  const NewComponent = widgetRegistry.getComponent(widgetId);

  // 監控布局變化
  useEffect(() => {
    if (enableDualRun && onLayoutChange && oldLayoutRef.current && newLayoutRef.current) {
      // 比較新舊布局
      const oldBounds = oldLayoutRef.current.getBoundingClientRect();
      const newBounds = newLayoutRef.current.getBoundingClientRect();

      if (
        oldBounds.width !== newBounds.width ||
        oldBounds.height !== newBounds.height ||
        oldBounds.x !== newBounds.x ||
        oldBounds.y !== newBounds.y
      ) {
        console.warn(`[MigrationAdapter] Layout mismatch detected for ${widgetId}:`, {
          old: oldBounds,
          new: newBounds,
        });
        onLayoutChange(oldBounds, newBounds);
      }
    }
  }, [widgetId, enableDualRun, onLayoutChange]);

  // 如果啟用雙重運行且有舊組件，則並行顯示
  if (enableDualRun && OldComponent && NewComponent) {
    return React.createElement(
      'div',
      { className: 'migration-adapter-container' },
      React.createElement(
        'div',
        {
          className: 'migration-adapter-old',
          ref: oldLayoutRef,
          style: { display: 'none' },
        },
        React.createElement(OldComponent, props)
      ),
      React.createElement(
        'div',
        {
          className: 'migration-adapter-new',
          ref: newLayoutRef,
        },
        React.createElement(NewComponent, props)
      )
    );
  }

  // 優先使用新組件，如果沒有則使用舊組件
  const Component = NewComponent || OldComponent;

  if (!Component) {
    console.error(`[MigrationAdapter] No component found for widget: ${widgetId}`);
    return React.createElement('div', {}, `Widget not found: ${widgetId}`);
  }

  return React.createElement(Component, props);
};

/**
 * 創建遷移包裝器
 * 用於逐步替換現有的 widget 導入
 */
export function createMigrationWrapper(
  widgetId: string,
  oldComponent?: React.ComponentType<WidgetComponentProps>
): React.FC<WidgetComponentProps> {
  const MigrationWrapper = (props: WidgetComponentProps) =>
    React.createElement(MigrationAdapter, {
      widgetId,
      oldComponent,
      enableDualRun: process.env.NEXT_PUBLIC_ENABLE_DUAL_RUN === 'true',
      ...props,
    });

  MigrationWrapper.displayName = `MigrationWrapper(${widgetId})`;

  return MigrationWrapper;
}

/**
 * 批量創建遷移包裝器
 */
export function createMigrationWrappers(
  widgetMap: Record<string, React.ComponentType<WidgetComponentProps>>
): Record<string, React.FC<WidgetComponentProps>> {
  const wrappers: Record<string, React.FC<WidgetComponentProps>> = {};

  Object.entries(widgetMap).forEach(([widgetId, component]) => {
    wrappers[widgetId] = createMigrationWrapper(widgetId, component);
  });

  return wrappers;
}

/**
 * Widget 遷移狀態追蹤
 */
export class MigrationTracker {
  private static instance: MigrationTracker;
  private migrationStatus = new Map<
    string,
    {
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      startTime?: number;
      endTime?: number;
      error?: Error;
      validationPassed?: boolean;
    }
  >();

  private constructor() {}

  static getInstance(): MigrationTracker {
    if (!MigrationTracker.instance) {
      MigrationTracker.instance = new MigrationTracker();
    }
    return MigrationTracker.instance;
  }

  startMigration(widgetId: string): void {
    this.migrationStatus.set(widgetId, {
      status: 'in_progress',
      startTime: Date.now(),
    });
  }

  completeMigration(widgetId: string, validationPassed: boolean): void {
    const status = this.migrationStatus.get(widgetId);
    if (status) {
      status.status = 'completed';
      status.endTime = Date.now();
      status.validationPassed = validationPassed;
    }
  }

  failMigration(widgetId: string, error: Error): void {
    const status = this.migrationStatus.get(widgetId);
    if (status) {
      status.status = 'failed';
      status.endTime = Date.now();
      status.error = error;
    }
  }

  getStatus(widgetId: string) {
    return this.migrationStatus.get(widgetId);
  }

  getAllStatuses() {
    return new Map(this.migrationStatus);
  }

  getMigratedWidgets(): Set<string> {
    const migrated = new Set<string>();
    this.migrationStatus.forEach((status, widgetId) => {
      if (status.status === 'completed' && status.validationPassed) {
        migrated.add(widgetId);
      }
    });
    // 如果沒有狀態記錄，返回所有已註冊的 widgets
    if (migrated.size === 0) {
      const registry = widgetRegistry.getAllDefinitions();
      registry.forEach((definition, widgetId) => {
        migrated.add(widgetId);
      });
    }
    return migrated;
  }

  generateReport(): string {
    let report = '# Widget Migration Report\n\n';
    report += `Generated at: ${new Date().toISOString()}\n\n`;

    const completed = Array.from(this.migrationStatus.entries()).filter(
      ([_, status]) => status.status === 'completed'
    );
    const failed = Array.from(this.migrationStatus.entries()).filter(
      ([_, status]) => status.status === 'failed'
    );
    const inProgress = Array.from(this.migrationStatus.entries()).filter(
      ([_, status]) => status.status === 'in_progress'
    );

    report += `## Summary\n`;
    report += `- Completed: ${completed.length}\n`;
    report += `- Failed: ${failed.length}\n`;
    report += `- In Progress: ${inProgress.length}\n\n`;

    if (completed.length > 0) {
      report += `## Completed Migrations\n`;
      completed.forEach(([widgetId, status]) => {
        const duration = status.endTime && status.startTime ? status.endTime - status.startTime : 0;
        report += `- ${widgetId}: ${duration}ms (Validation: ${status.validationPassed ? 'PASSED' : 'FAILED'})\n`;
      });
      report += '\n';
    }

    if (failed.length > 0) {
      report += `## Failed Migrations\n`;
      failed.forEach(([widgetId, status]) => {
        report += `- ${widgetId}: ${status.error?.message || 'Unknown error'}\n`;
      });
      report += '\n';
    }

    return report;
  }
}

export const migrationTracker = MigrationTracker.getInstance();
