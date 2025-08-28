#!/usr/bin/env node

/**
 * 功能凍結狀態檢查腳本
 * 用於在提交前檢查是否違反凍結規定
 */

const fs = require('fs');
const path = require('path');

const FREEZE_STATUS_FILE = path.join(__dirname, '..', '.freeze-status');
const FREEZE_NOTICE_FILE = path.join(__dirname, '..', 'docs', 'FREEZE_NOTICE.md');

function checkFreezeStatus() {
  try {
    // 檢查凍結狀態文件
    if (!fs.existsSync(FREEZE_STATUS_FILE)) {
      console.log('✅ No freeze status file found. Development is not frozen.');
      return 0;
    }

    const freezeStatus = JSON.parse(fs.readFileSync(FREEZE_STATUS_FILE, 'utf8'));

    if (freezeStatus.status === 'FROZEN') {
      console.log('🔒 ============================================');
      console.log('🔒 FEATURE DEVELOPMENT FREEZE IS ACTIVE');
      console.log('🔒 ============================================');
      console.log(`📅 Frozen since: ${freezeStatus.startDate}`);
      console.log(`📋 Mode: ${freezeStatus.mode}`);
      console.log(`❌ Reason: ${freezeStatus.reason}`);
      console.log('');
      console.log('❌ PROHIBITED:');
      Object.entries(freezeStatus.restrictions).forEach(([key, value]) => {
        if (!value) {
          console.log(`   - ${key}`);
        }
      });
      console.log('');
      console.log('✅ ALLOWED:');
      Object.entries(freezeStatus.allowed).forEach(([key, value]) => {
        if (value) {
          console.log(`   - ${key}`);
        }
      });
      console.log('');
      console.log('🎯 FOCUS AREAS:');
      freezeStatus.focusAreas.forEach(area => {
        console.log(`   - ${area}`);
      });
      console.log('');
      console.log(`📄 For details, see: ${FREEZE_NOTICE_FILE}`);
      console.log('🔒 ============================================');

      // 檢查環境變量以允許緊急修復
      if (process.env.EMERGENCY_FIX === 'true') {
        console.log('⚠️  EMERGENCY FIX MODE - Proceeding despite freeze');
        return 0;
      }

      return 1; // 返回非零表示凍結狀態激活
    }

    console.log('✅ Development freeze is not active.');
    return 0;
  } catch (error) {
    console.error('Error checking freeze status:', error.message);
    return 0; // 出錯時默認允許繼續
  }
}

// 執行檢查
const exitCode = checkFreezeStatus();

// 如果作為 git hook 調用，可以選擇退出
if (require.main === module) {
  if (exitCode !== 0 && process.env.ENFORCE_FREEZE === 'true') {
    process.exit(exitCode);
  }
}

module.exports = { checkFreezeStatus };
