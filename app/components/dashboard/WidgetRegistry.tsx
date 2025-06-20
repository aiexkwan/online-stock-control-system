/**
 * 小部件註冊系統
 */

import { WidgetType, WidgetRegistryItem, WidgetComponentProps } from '@/app/types/dashboard';

// 小部件註冊表
class WidgetRegistryClass {
  private widgets = new Map<WidgetType, WidgetRegistryItem>();

  // 註冊小部件
  register(item: WidgetRegistryItem) {
    this.widgets.set(item.type, item);
  }

  // 獲取小部件
  get(type: WidgetType): WidgetRegistryItem | undefined {
    return this.widgets.get(type);
  }

  // 獲取所有小部件
  getAll(): WidgetRegistryItem[] {
    return Array.from(this.widgets.values());
  }

  // 創建小部件組件
  createComponent(type: WidgetType, props: WidgetComponentProps): React.ReactElement | null {
    const item = this.get(type);
    if (!item) {
      console.error(`Unknown widget type: ${type}`);
      // Return a placeholder component for unknown widgets
      return (
        <div className="flex items-center justify-center h-full bg-slate-800 rounded-lg border border-red-500">
          <p className="text-red-400 text-center p-4">
            Unknown widget type: {type}<br />
            <span className="text-sm text-slate-400">Please remove this widget</span>
          </p>
        </div>
      );
    }
    
    const Component = item.component;
    return <Component {...props} />;
  }

  // 獲取默認配置
  getDefaultConfig(type: WidgetType): any {
    const item = this.get(type);
    return item ? { ...item.defaultConfig } : {};
  }

  // 獲取默認大小
  getDefaultSize(type: WidgetType): any {
    const item = this.get(type);
    return item ? { ...item.defaultSize } : { w: 4, h: 4 };
  }
}

// 導出單例
export const WidgetRegistry = new WidgetRegistryClass();