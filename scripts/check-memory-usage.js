#!/usr/bin/env node

/**
 * 記憶體使用情況檢查腳本
 * 檢查 Node.js 進程嘅記憶體使用情況
 */

console.log('📊 記憶體使用情況檢查...\n');

// 格式化記憶體大小
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 檢查 Node.js 進程記憶體使用
function checkNodeMemory() {
  const usage = process.memoryUsage();

  console.log('🔍 Node.js 進程記憶體使用:');
  console.log(`  RSS (Resident Set Size): ${formatBytes(usage.rss)}`);
  console.log(`  Heap Used: ${formatBytes(usage.heapUsed)}`);
  console.log(`  Heap Total: ${formatBytes(usage.heapTotal)}`);
  console.log(`  External: ${formatBytes(usage.external)}`);
  console.log(`  Array Buffers: ${formatBytes(usage.arrayBuffers)}`);

  // 檢查是否超過 100MB
  const totalMemoryMB = usage.rss / (1024 * 1024);
  if (totalMemoryMB > 100) {
    console.log(`⚠️  記憶體使用 ${totalMemoryMB.toFixed(2)} MB 超過 100MB 目標`);
  } else {
    console.log(`✅ 記憶體使用 ${totalMemoryMB.toFixed(2)} MB 符合 < 100MB 目標`);
  }
}

// 檢查系統記憶體使用
function checkSystemMemory() {
  const os = require('os');
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  console.log('\n🖥️  系統記憶體使用:');
  console.log(`  總記憶體: ${formatBytes(totalMemory)}`);
  console.log(`  使用中: ${formatBytes(usedMemory)}`);
  console.log(`  剩餘: ${formatBytes(freeMemory)}`);
  console.log(`  使用率: ${((usedMemory / totalMemory) * 100).toFixed(2)}%`);
}

// 執行檢查
checkNodeMemory();
checkSystemMemory();

// 如果有 --watch 參數，持續監控
if (process.argv.includes('--watch')) {
  console.log('\n🔄 持續監控中 (每 5 秒更新)...');
  setInterval(() => {
    console.log('\n--- 更新 ---');
    checkNodeMemory();
  }, 5000);
}

console.log('\n✅ 記憶體檢查完成');
