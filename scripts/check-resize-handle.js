// 在瀏覽器 console 運行檢查 resize handles
function checkResizeHandles() {
  console.log('=== 檢查 Resize Handles ===');
  
  // 檢查編輯模式
  const dashboard = document.querySelector('.gridstack-dashboard');
  const isEditMode = dashboard?.classList.contains('edit-mode');
  console.log(`編輯模式: ${isEditMode ? '✅ 是' : '❌ 否'}`);
  
  // 檢查 grid 實例
  const gridEl = document.querySelector('.grid-stack');
  const hasGrid = gridEl?._gridstack || gridEl?.gridstack;
  console.log(`Gridstack 實例: ${hasGrid ? '✅ 存在' : '❌ 不存在'}`);
  
  // 檢查每個 widget
  const widgets = document.querySelectorAll('.grid-stack-item');
  console.log(`\nWidget 總數: ${widgets.length}`);
  
  widgets.forEach((widget, i) => {
    console.log(`\n--- Widget ${i + 1} ---`);
    console.log(`ID: ${widget.getAttribute('gs-id')}`);
    console.log(`位置: (${widget.getAttribute('gs-x')}, ${widget.getAttribute('gs-y')})`);
    console.log(`大小: ${widget.getAttribute('gs-w')}×${widget.getAttribute('gs-h')}`);
    
    // 檢查 resize handles
    const handles = widget.querySelectorAll('.ui-resizable-handle');
    console.log(`Resize handles: ${handles.length}`);
    
    if (handles.length > 0) {
      handles.forEach((handle, j) => {
        const classes = Array.from(handle.classList);
        const computed = window.getComputedStyle(handle);
        console.log(`  Handle ${j + 1}: ${classes.join(', ')}`);
        console.log(`    顯示: ${computed.display}`);
        console.log(`    位置: ${computed.position}`);
        console.log(`    大小: ${computed.width} × ${computed.height}`);
        console.log(`    透明度: ${computed.opacity}`);
        console.log(`    z-index: ${computed.zIndex}`);
        console.log(`    指標事件: ${computed.pointerEvents}`);
      });
    }
    
    // 檢查是否可拖拽/調整
    const isResizable = widget.classList.contains('ui-resizable');
    const isDraggable = widget.classList.contains('ui-draggable');
    console.log(`可調整大小: ${isResizable ? '✅' : '❌'}`);
    console.log(`可拖拽: ${isDraggable ? '✅' : '❌'}`);
  });
  
  // 檢查 Gridstack 設定
  if (hasGrid) {
    const grid = gridEl._gridstack || gridEl.gridstack;
    console.log('\n=== Gridstack 設定 ===');
    console.log(`移動已啟用: ${!grid.opts.disableDrag}`);
    console.log(`調整大小已啟用: ${!grid.opts.disableResize}`);
  }
}

// 手動啟用 resize
function enableResize() {
  const gridEl = document.querySelector('.grid-stack');
  const grid = gridEl?._gridstack || gridEl?.gridstack;
  
  if (grid) {
    console.log('手動啟用 resize...');
    grid.enable();
    grid.enableMove(true);
    grid.enableResize(true);
    
    // 對每個 widget 啟用
    const widgets = document.querySelectorAll('.grid-stack-item');
    widgets.forEach(widget => {
      grid.movable(widget, true);
      grid.resizable(widget, true);
    });
    
    console.log('✅ Resize 已啟用');
  } else {
    console.log('❌ 找不到 Gridstack 實例');
  }
}

// 執行檢查
checkResizeHandles();