/**
 * Test Grid Parser
 * 測試 grid template 解析邏輯
 */

import { adminDashboardLayouts } from '../app/admin/components/dashboard/adminDashboardLayouts';
import { captureThemeLayout } from '../lib/widgets/layout-snapshot';

console.log('🧪 Testing Grid Template Parser...\n');

// 測試 injection theme
const injectionLayout = adminDashboardLayouts['injection'];
console.log('📐 Injection Theme Grid Template:');
console.log(injectionLayout.gridTemplate);
console.log('\n');

// 捕獲布局
const capturedWidgets = captureThemeLayout('injection', injectionLayout);

// 查找有問題的 widgets
const widget4 = capturedWidgets.find(w => w.metadata?.gridArea === 'widget4');
const widget6 = capturedWidgets.find(w => w.metadata?.gridArea === 'widget6');
const widget8 = capturedWidgets.find(w => w.metadata?.gridArea === 'widget8');

console.log('🔍 Widget Positions:');
console.log('widget4 (AvailableSoonWidget):', widget4 ? `(${widget4.x},${widget4.y}) ${widget4.w}x${widget4.h}` : 'Not found');
console.log('widget6 (Chart):', widget6 ? `(${widget6.x},${widget6.y}) ${widget6.w}x${widget6.h}` : 'Not found');  
console.log('widget8 (AvailableSoonWidget):', widget8 ? `(${widget8.x},${widget8.y}) ${widget8.w}x${widget8.h}` : 'Not found');

console.log('\n📊 All Widgets:');
capturedWidgets.forEach(widget => {
  console.log(`${widget.metadata?.gridArea}: (${widget.x},${widget.y}) ${widget.w}x${widget.h}`);
});

// 測試 system theme
console.log('\n\n📐 System Theme Grid Template:');
const systemLayout = adminDashboardLayouts['system'];
console.log(systemLayout.gridTemplate);

const systemWidgets = captureThemeLayout('system', systemLayout);
const widget2 = systemWidgets.find(w => w.metadata?.gridArea === 'widget2');

console.log('\n🔍 Widget Positions:');
console.log('widget2 (ReportGeneratorWidget):', widget2 ? `(${widget2.x},${widget2.y}) ${widget2.w}x${widget2.h}` : 'Not found');

console.log('\n📊 All System Widgets:');
systemWidgets.forEach(widget => {
  console.log(`${widget.metadata?.gridArea}: (${widget.x},${widget.y}) ${widget.w}x${widget.h}`);
});