// 測試 MutationObserver 實現
// 在瀏覽器 console 運行測試編輯模式功能

async function testMutationObserver() {
  console.log('=== 測試 MutationObserver 實現 ===');
  
  // 1. 測試進入編輯模式
  console.log('\n1. 測試進入編輯模式...');
  const editButton = document.querySelector('button:has-text("Edit Dashboard")');
  if (editButton) {
    editButton.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 檢查 widgets 是否可拖拽
    const widgets = document.querySelectorAll('.grid-stack-item');
    console.log(`   找到 ${widgets.length} 個 widgets`);
    
    widgets.forEach((widget, i) => {
      const isDraggable = widget.classList.contains('ui-draggable');
      const isResizable = widget.classList.contains('ui-resizable');
      console.log(`   Widget ${i + 1}: 可拖拽=${isDraggable}, 可調整大小=${isResizable}`);
    });
  }
  
  // 2. 測試新增 widget
  console.log('\n2. 測試新增 widget...');
  const addButton = document.querySelector('button:has-text("Add Widget")');
  if (addButton) {
    console.log('   點擊 Add Widget 按鈕');
    addButton.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 選擇第一個 widget 類型
    const firstWidget = document.querySelector('[role="dialog"] button');
    if (firstWidget) {
      console.log('   選擇 widget');
      firstWidget.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 檢查新 widget 是否可操作
      const newWidgets = document.querySelectorAll('.grid-stack-item');
      const lastWidget = newWidgets[newWidgets.length - 1];
      if (lastWidget) {
        const isDraggable = lastWidget.classList.contains('ui-draggable');
        const isResizable = lastWidget.classList.contains('ui-resizable');
        console.log(`   新 Widget: 可拖拽=${isDraggable}, 可調整大小=${isResizable}`);
      }
    }
  }
  
  // 3. 檢查 MutationObserver 是否正常工作
  console.log('\n3. 檢查 MutationObserver...');
  const observerActive = window.__gridstackObserver !== undefined;
  console.log(`   MutationObserver 活躍: ${observerActive}`);
  
  console.log('\n✅ 測試完成');
  console.log('如果所有 widgets 都顯示為可拖拽和可調整大小，表示 MutationObserver 實現成功！');
}

// 執行測試
testMutationObserver();