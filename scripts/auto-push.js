const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const os = require('os');

// 獲取當前日期時間格式化字串
function getFormattedDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 定義要忽略的目錄和檔案
const ignoreDirs = [
  '.git', 
  'node_modules', 
  '.next',
  'out',
  'build',
  'dist'
];

// 監控設定
const watchOptions = {
  persistent: true,
  ignoreInitial: true,
  ignored: new RegExp(`(${ignoreDirs.join('|')})`),
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 100
  }
};

console.log('🔍 開始監控檔案變更...');

// 設定一個變數來追蹤自上次提交以來的變更
let changesDetected = false;
let debounceTimer = null;

// 設定自動提交的時間間隔 (毫秒)
const AUTO_COMMIT_INTERVAL = 5 * 60 * 1000; // 5分鐘

// 創建檔案變更監控器
const watcher = chokidar.watch('.', watchOptions);

// 根據不同作業系統建立對應的執行指令
function getExecuteCommand(commitMessage) {
  // 檢查當前作業系統
  const isWindows = os.platform() === 'win32';
  
  if (isWindows) {
    // Windows 系統上的指令，使用 PowerShell 腳本
    return `powershell -Command "& {.\\scripts\\push.ps1 -CommitMessage '${commitMessage}'}"`;
  } else {
    // Unix 系統上的指令
    return `chmod +x push.sh && ./push.sh "${commitMessage}"`;
  }
}

// 定義一個處理自動推送的函數
function handleAutoPush() {
  if (!changesDetected) return;
  
  const commitMessage = `自動提交: ${getFormattedDateTime()}`;
  console.log(`🚀 提交更改: ${commitMessage}`);
  
  // 獲取適合當前作業系統的執行指令
  const executeCommand = getExecuteCommand(commitMessage);
  
  exec(executeCommand, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ 錯誤: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ 警告: ${stderr}`);
      return;
    }
    console.log(stdout);
    changesDetected = false;
  });
}

// 監控所有檔案變更 (新增、修改、刪除)
watcher
  .on('add', filePath => {
    console.log(`➕ 檔案新增: ${filePath}`);
    changesDetected = true;
    
    // 重置定時器
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleAutoPush, AUTO_COMMIT_INTERVAL);
  })
  .on('change', filePath => {
    console.log(`✏️ 檔案修改: ${filePath}`);
    changesDetected = true;
    
    // 重置定時器
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleAutoPush, AUTO_COMMIT_INTERVAL);
  })
  .on('unlink', filePath => {
    console.log(`❌ 檔案刪除: ${filePath}`);
    changesDetected = true;
    
    // 重置定時器
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(handleAutoPush, AUTO_COMMIT_INTERVAL);
  })
  .on('error', error => console.error(`❌ 監控錯誤: ${error}`));

// 允許使用 Ctrl+C 退出
process.on('SIGINT', () => {
  console.log('👋 停止監控並結束程式');
  watcher.close();
  process.exit(0);
});

console.log(`⏱️ 設定每 ${AUTO_COMMIT_INTERVAL/1000/60} 分鐘自動提交已變更檔案`); 