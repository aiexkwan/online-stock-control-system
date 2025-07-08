/**
 * Layout Compatibility Manager
 * 確保現有布局不受影響的關鍵組件
 */

import { WidgetLayoutItem, ILayoutCompatibilityManager } from './types';

export class LayoutCompatibilityManager implements ILayoutCompatibilityManager {
  // 存儲布局快照用於驗證和回滾
  private layoutSnapshots = new Map<string, WidgetLayoutItem[]>();

  /**
   * 驗證布局完整性
   * 確保新布局與舊布局完全一致（位置、大小不變）
   */
  validateLayoutIntegrity(oldLayout: WidgetLayoutItem[], newLayout: WidgetLayoutItem[]): boolean {
    // 檢查數量是否一致
    if (oldLayout.length !== newLayout.length) {
      console.warn('[LayoutCompatibility] Layout count mismatch');
      return false;
    }

    // 檢查每個 widget 的位置和大小
    for (const oldWidget of oldLayout) {
      const newWidget = newLayout.find(w => w.i === oldWidget.i);

      if (!newWidget) {
        console.warn(`[LayoutCompatibility] Widget missing: ${oldWidget.i}`);
        return false;
      }

      // 嚴格檢查位置和大小
      if (
        newWidget.x !== oldWidget.x ||
        newWidget.y !== oldWidget.y ||
        newWidget.w !== oldWidget.w ||
        newWidget.h !== oldWidget.h
      ) {
        console.warn(
          `[LayoutCompatibility] Layout changed for widget ${oldWidget.i}:`,
          `Old: (${oldWidget.x},${oldWidget.y},${oldWidget.w}x${oldWidget.h})`,
          `New: (${newWidget.x},${newWidget.y},${newWidget.w}x${newWidget.h})`
        );
        return false;
      }

      // 檢查其他重要屬性
      if (
        newWidget.static !== oldWidget.static ||
        newWidget.minW !== oldWidget.minW ||
        newWidget.maxW !== oldWidget.maxW ||
        newWidget.minH !== oldWidget.minH ||
        newWidget.maxH !== oldWidget.maxH
      ) {
        console.warn(`[LayoutCompatibility] Widget constraints changed for ${oldWidget.i}`);
        return false;
      }
    }

    console.log('[LayoutCompatibility] Layout integrity validated successfully');
    return true;
  }

  /**
   * 遷移現有布局配置
   * 添加新的元數據但保持原有屬性不變
   */
  migrateLayout(existingLayout: WidgetLayoutItem[]): WidgetLayoutItem[] {
    return existingLayout.map(widget => ({
      // 保持所有現有屬性
      ...widget,
      // 添加新的元數據（如果需要）
      metadata: {
        ...widget.metadata,
        registryVersion: '2.0',
        migratedAt: new Date().toISOString(),
      },
    }));
  }

  /**
   * 捕獲當前路由的布局快照
   */
  async captureCurrentLayout(route: string): Promise<WidgetLayoutItem[]> {
    try {
      // 這裡需要從實際的布局系統中獲取當前布局
      // 暫時返回空數組，實際實現將在集成時完成
      const currentLayout: WidgetLayoutItem[] = [];

      // 存儲快照
      this.layoutSnapshots.set(route, [...currentLayout]);

      console.log(`[LayoutCompatibility] Captured layout snapshot for ${route}`);
      return currentLayout;
    } catch (error) {
      console.error(`[LayoutCompatibility] Failed to capture layout for ${route}:`, error);
      throw error;
    }
  }

  /**
   * 恢復路由的布局
   */
  async restoreLayout(route: string, layout: WidgetLayoutItem[]): Promise<void> {
    try {
      // 驗證要恢復的布局
      const snapshot = this.layoutSnapshots.get(route);
      if (snapshot && !this.validateLayoutIntegrity(snapshot, layout)) {
        throw new Error('Layout integrity check failed during restore');
      }

      // 這裡需要實際恢復布局到系統
      // 暫時只記錄日誌，實際實現將在集成時完成
      console.log(`[LayoutCompatibility] Restored layout for ${route}`);
    } catch (error) {
      console.error(`[LayoutCompatibility] Failed to restore layout for ${route}:`, error);
      throw error;
    }
  }

  /**
   * 獲取布局快照
   */
  getLayoutSnapshot(route: string): WidgetLayoutItem[] | undefined {
    return this.layoutSnapshots.get(route);
  }

  /**
   * 清除布局快照
   */
  clearLayoutSnapshot(route: string): void {
    this.layoutSnapshots.delete(route);
  }

  /**
   * 創建布局備份
   */
  createLayoutBackup(route: string, layout: WidgetLayoutItem[]): string {
    const backupId = `backup_${route}_${Date.now()}`;
    const backup = {
      route,
      layout: [...layout],
      timestamp: new Date().toISOString(),
      version: '2.0',
    };

    // 存儲到 localStorage（實際實現可能需要更持久的存儲）
    if (typeof window !== 'undefined') {
      localStorage.setItem(backupId, JSON.stringify(backup));
    }

    console.log(`[LayoutCompatibility] Created backup: ${backupId}`);
    return backupId;
  }

  /**
   * 恢復布局備份
   */
  restoreLayoutBackup(backupId: string): WidgetLayoutItem[] | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const backupStr = localStorage.getItem(backupId);
    if (!backupStr) {
      console.warn(`[LayoutCompatibility] Backup not found: ${backupId}`);
      return null;
    }

    try {
      const backup = JSON.parse(backupStr);
      console.log(`[LayoutCompatibility] Restored backup: ${backupId}`);
      return backup.layout;
    } catch (error) {
      console.error(`[LayoutCompatibility] Failed to parse backup: ${backupId}`, error);
      return null;
    }
  }

  /**
   * 列出所有布局備份
   */
  listLayoutBackups(route?: string): string[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const backups: string[] = [];
    const prefix = route ? `backup_${route}_` : 'backup_';

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        backups.push(key);
      }
    }

    return backups.sort().reverse(); // 最新的備份在前
  }

  /**
   * 比較兩個布局的差異
   */
  compareLayouts(
    layout1: WidgetLayoutItem[],
    layout2: WidgetLayoutItem[]
  ): {
    added: string[];
    removed: string[];
    modified: string[];
    unchanged: string[];
  } {
    const ids1 = new Set(layout1.map(w => w.i));
    const ids2 = new Set(layout2.map(w => w.i));

    const added = Array.from(ids2).filter(id => !ids1.has(id));
    const removed = Array.from(ids1).filter(id => !ids2.has(id));

    const modified: string[] = [];
    const unchanged: string[] = [];

    // 檢查共同的 widgets
    const common = Array.from(ids1).filter(id => ids2.has(id));
    for (const id of common) {
      const widget1 = layout1.find(w => w.i === id)!;
      const widget2 = layout2.find(w => w.i === id)!;

      if (
        widget1.x !== widget2.x ||
        widget1.y !== widget2.y ||
        widget1.w !== widget2.w ||
        widget1.h !== widget2.h
      ) {
        modified.push(id);
      } else {
        unchanged.push(id);
      }
    }

    return { added, removed, modified, unchanged };
  }
}

// 導出單例實例
export const layoutCompatibilityManager = new LayoutCompatibilityManager();
