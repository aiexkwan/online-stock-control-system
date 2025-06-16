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
      return null;
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