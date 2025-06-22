// 在瀏覽器 console 運行來修復雙層問題
function fixDoubleLayer() {
  console.log('=== 修復雙層渲染問題 ===');
  
  // 找出所有嵌套的 grid-stack-item
  const nestedItems = document.querySelectorAll('.grid-stack-item .grid-stack-item');
  console.log(`找到 ${nestedItems.length} 個嵌套的 widgets`);
  
  nestedItems.forEach((nested, i) => {
    const parent = nested.closest('.grid-stack-item');
    const grandParent = parent?.parentElement;
    
    console.log(`\n處理嵌套 widget ${i + 1}:`);
    console.log(`  Parent ID: ${parent?.getAttribute('gs-id')}`);
    console.log(`  Nested ID: ${nested.getAttribute('gs-id')}`);
    
    // 如果嵌套的 widget 和父層有相同的 ID，移除父層的邊框
    if (parent && parent.getAttribute('gs-id') === nested.getAttribute('gs-id')) {
      console.log('  -> 隱藏父層邊框');
      parent.style.background = 'transparent';
      parent.style.border = 'none';
      parent.style.boxShadow = 'none';
    }
  });
  
  // 檢查空的 content 容器
  const emptyContents = document.querySelectorAll('.grid-stack-item-content:empty');
  console.log(`\n找到 ${emptyContents.length} 個空的 content 容器`);
  emptyContents.forEach(empty => {
    empty.style.display = 'none';
  });
  
  // 強制套用 CSS 修復
  const style = document.createElement('style');
  style.textContent = `
    /* 修復雙層問題 */
    .grid-stack-item:has(.grid-stack-item) {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
    
    .grid-stack-item .grid-stack-item {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      margin: 0 !important;
    }
    
    .grid-stack-item-content:empty {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
  
  console.log('\n✅ 修復完成');
}

// 執行修復
fixDoubleLayer();

// 監聽 DOM 變化自動修復
const observer = new MutationObserver(() => {
  const nestedItems = document.querySelectorAll('.grid-stack-item .grid-stack-item');
  if (nestedItems.length > 0) {
    console.log('檢測到新的嵌套 widgets，自動修復...');
    fixDoubleLayer();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('🔄 已啟用自動修復監聽');