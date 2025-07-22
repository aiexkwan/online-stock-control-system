/**
 * Layout Snapshot Tool
 * 捕獲和記錄當前布局配置，建立兼容性測試基準
 */

import { AdminDashboardLayout, AdminWidgetConfig } from '@/types/components/dashboard';
import { WidgetLayoutItem } from './types';

// 將 grid area 字符串轉換為 x, y, w, h 座標
function parseGridArea(
  gridArea: string,
  gridTemplate: string
): { x: number; y: number; w: number; h: number } {
  // 解析 grid template，先嘗試按引號分割（處理單行格式）
  const quotedSections = gridTemplate.match(/"[^"]+"/g) || [];

  // 如果有引號分割，每個引號內容代表一行
  const rows =
    quotedSections.length > 0
      ? quotedSections.map(section => section.replace(/"/g, ''))
      : gridTemplate
          .trim()
          .split('\n')
          .filter(line => line.trim());

  const cols = rows[0]?.split(/\s+/).length || 0;

  // 建立 grid area 到座標的映射
  const gridMap = new Map<string, { startX: number; endX: number; startY: number; endY: number }>();

  rows.forEach((row, rowIndex) => {
    // 分割每行的區域
    const areas = row.trim().split(/\s+/);
    areas.forEach((area, colIndex) => {
      if (!gridMap.has(area)) {
        gridMap.set(area, {
          startX: colIndex,
          endX: colIndex,
          startY: rowIndex,
          endY: rowIndex,
        });
      } else {
        const existing = gridMap.get(area)!;
        existing.endX = Math.max(existing.endX, colIndex);
        existing.endY = Math.max(existing.endY, rowIndex);
      }
    });
  });

  const coords = gridMap.get(gridArea);
  if (!coords) {
    console.warn(
      `Grid area "${gridArea}" not found in template. Available areas:`,
      Array.from(gridMap.keys())
    );
    console.warn(`Grid template rows:`, rows);
    return { x: 0, y: 0, w: 1, h: 1 };
  }

  return {
    x: coords.startX,
    y: coords.startY,
    w: coords.endX - coords.startX + 1,
    h: coords.endY - coords.startY + 1,
  };
}

// 將 AdminWidgetConfig 轉換為 WidgetLayoutItem
export function convertAdminWidgetToLayoutItem(
  widget: AdminWidgetConfig,
  gridTemplate: string,
  theme: string
): WidgetLayoutItem {
  const { x, y, w, h } = parseGridArea(widget.gridArea, gridTemplate);

  // 生成唯一的 widget ID
  // 對於有 component 的 widget，如果是重複使用的組件（如 AvailableSoonWidget），加上 gridArea 後綴
  let widgetId: string;
  if (widget.component) {
    // 檢查是否是會重複使用的組件
    const reusableComponents = ['AvailableSoonWidget', 'ReportGeneratorWidget'];
    if (reusableComponents.includes(widget.component)) {
      widgetId = `${widget.component}_${widget.gridArea}`;
    } else {
      widgetId = widget.component;
    }
  } else {
    widgetId = `${widget.type}_${widget.gridArea}_${theme}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  return {
    i: widgetId,
    x,
    y,
    w,
    h,
    static: false, // 默認可調整
    minW: 1,
    maxW: 12,
    minH: 1,
    maxH: 12,
    metadata: {
      registryVersion: '1.0', // 標記為舊版本
      originalConfig: widget,
      theme,
      gridArea: widget.gridArea,
      capturedAt: new Date().toISOString(),
    },
  };
}

// 捕獲特定主題的布局快照
export function captureThemeLayout(
  theme: string,
  layout: AdminDashboardLayout
): WidgetLayoutItem[] {
  return layout.widgets.map(widget =>
    convertAdminWidgetToLayoutItem(widget, layout.gridTemplate, theme)
  );
}

// 捕獲所有布局快照
export function captureAllLayouts(
  layouts: Record<string, AdminDashboardLayout>
): Record<string, WidgetLayoutItem[]> {
  const snapshots: Record<string, WidgetLayoutItem[]> = {};

  Object.entries(layouts).forEach(([theme, layout]) => {
    snapshots[theme] = captureThemeLayout(theme, layout);
  });

  return snapshots;
}

// 驗證布局完整性
export function validateLayoutSnapshot(
  original: AdminDashboardLayout,
  converted: WidgetLayoutItem[]
): boolean {
  if (original.widgets.length !== converted.length) {
    console.error('Widget count mismatch');
    return false;
  }

  // 檢查每個 widget 是否都有對應的轉換結果
  for (let i = 0; i < original.widgets.length; i++) {
    const originalWidget = original.widgets[i];
    const convertedWidget = converted.find(
      w =>
        w.metadata?.originalConfig === originalWidget ||
        w.metadata?.gridArea === originalWidget.gridArea
    );

    if (!convertedWidget) {
      console.error(`Widget not found in conversion: ${originalWidget.gridArea}`);
      return false;
    }
  }

  return true;
}

// 生成布局報告
export function generateLayoutReport(snapshots: Record<string, WidgetLayoutItem[]>): string {
  let report = '# Layout Snapshot Report\n\n';
  report += `Generated at: ${new Date().toISOString()}\n\n`;

  Object.entries(snapshots).forEach(([theme, widgets]) => {
    report += `## Theme: ${theme}\n`;
    report += `Total widgets: ${widgets.length}\n\n`;

    report += '| Widget ID | Position | Size | Grid Area |\n';
    report += '|-----------|----------|------|----------|\n';

    widgets.forEach(widget => {
      report += `| ${widget.i} | (${widget.x},${widget.y}) | ${widget.w}x${widget.h} | ${widget.metadata?.gridArea || 'N/A'} |\n`;
    });

    report += '\n';
  });

  return report;
}

// 保存布局快照到文件（用於測試基準）
export function saveLayoutSnapshot(
  snapshots: Record<string, WidgetLayoutItem[]>,
  filename: string = 'layout-baseline.json'
): string {
  const data = {
    version: '2.0',
    timestamp: new Date().toISOString(),
    snapshots,
    metadata: {
      totalThemes: Object.keys(snapshots).length,
      totalWidgets: Object.values(snapshots).reduce((sum, widgets) => sum + widgets.length, 0),
    },
  };

  // 在實際實現中，這裡會保存到文件系統
  // 現在返回 JSON 字符串
  return JSON.stringify(data, null, 2);
}

// 載入布局快照（用於比較）
export function loadLayoutSnapshot(jsonData: string): Record<string, WidgetLayoutItem[]> | null {
  try {
    const data = JSON.parse(jsonData);
    if (data.version !== '2.0') {
      console.warn(`Unsupported snapshot version: ${data.version}`);
    }
    return data.snapshots;
  } catch (error) {
    console.error('Failed to load layout snapshot:', error);
    return null;
  }
}
