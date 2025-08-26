/**
 * 服務端全域變數 Polyfill 處理器
 * 專門解決 vendor chunk 中的 self 引用問題
 */

// 立即執行函數，在模塊載入時就進行 polyfill
(() => {
  // 檢查是否在服務端環境
  if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // 定義 self 為 globalThis，避免 ReferenceError
    if (typeof global.self === 'undefined') {
      global.self = globalThis;
    }

    // 為 globalThis 也設置 self 屬性
    if (typeof globalThis.self === 'undefined') {
      globalThis.self = globalThis;
    }

    // 防止 webpackChunk 相關錯誤
    if (typeof global.webpackChunk_N_E === 'undefined') {
      global.webpackChunk_N_E = [];
    }

    // 確保 self.webpackChunk_N_E 正常運作
    if (global.self && typeof global.self.webpackChunk_N_E === 'undefined') {
      global.self.webpackChunk_N_E = global.webpackChunk_N_E;
    }

    console.log('[Server Globals Polyfill] Applied server-side polyfills for self references');
  }
})();

module.exports = {};
