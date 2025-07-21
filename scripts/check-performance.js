#!/usr/bin/env node

/**
 * 簡單的性能檢查腳本
 * 檢查 bundle 大小和基本項目指標
 */

const fs = require('fs');
const path = require('path');

// 計算目錄大小
function calculateDirectorySize(dirPath, maxDepth = 3) {
  try {
    if (maxDepth <= 0) return 0;

    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      if (file.isDirectory()) {
        totalSize += calculateDirectorySize(filePath, maxDepth - 1);
      } else {
        const stat = fs.statSync(filePath);
        totalSize += stat.size;
      }
    }

    return totalSize;
  } catch (error) {
    console.error(`Error calculating directory size for ${dirPath}:`, error.message);
    return 0;
  }
}

// 檢查 bundle 大小
function checkBundleSize() {
  const nextDir = path.join(process.cwd(), '.next');
  try {
    const stat = fs.statSync(nextDir);
    if (stat.isDirectory()) {
      const sizeInBytes = calculateDirectorySize(nextDir);
      const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);
      const sizeInKB = (sizeInBytes / 1024).toFixed(2);

      console.log(`✅ Bundle exists`);
      console.log(`📦 Bundle size: ${sizeInMB} MB (${sizeInKB} KB)`);

      return {
        exists: true,
        sizeInBytes,
        sizeInMB: parseFloat(sizeInMB),
        sizeInKB: parseFloat(sizeInKB)
      };
    }
  } catch (error) {
    console.log(`❌ Bundle not found (.next directory missing)`);
    return {
      exists: false,
      sizeInBytes: 0,
      sizeInMB: 0,
      sizeInKB: 0
    };
  }
}

// 檢查 package.json 大小
function checkPackageSize() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const stat = fs.statSync(packagePath);
    const sizeInKB = (stat.size / 1024).toFixed(2);

    console.log(`📄 Package.json size: ${sizeInKB} KB`);

    return {
      exists: true,
      sizeInKB: parseFloat(sizeInKB)
    };
  } catch (error) {
    console.log(`❌ Package.json not found`);
    return {
      exists: false,
      sizeInKB: 0
    };
  }
}

// 檢查 node_modules 大小
function checkNodeModulesSize() {
  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    const stat = fs.statSync(nodeModulesPath);
    if (stat.isDirectory()) {
      const sizeInBytes = calculateDirectorySize(nodeModulesPath, 2); // 限制深度
      const sizeInMB = (sizeInBytes / 1024 / 1024).toFixed(2);

      console.log(`📚 Node modules size: ${sizeInMB} MB`);

      return {
        exists: true,
        sizeInMB: parseFloat(sizeInMB)
      };
    }
  } catch (error) {
    console.log(`❌ Node modules not found`);
    return {
      exists: false,
      sizeInMB: 0
    };
  }
}

// 主函數
function main() {
  console.log('🔍 檢查性能指標...\n');

  const timestamp = new Date().toISOString();
  console.log(`⏰ 測試時間: ${timestamp}\n`);

  console.log('== Bundle 檢查 ==');
  const bundleMetrics = checkBundleSize();

  console.log('\n== Package 檢查 ==');
  const packageMetrics = checkPackageSize();

  console.log('\n== Node Modules 檢查 ==');
  const nodeModulesMetrics = checkNodeModulesSize();

  console.log('\n== 總結 ==');
  console.log(`項目狀態: ${bundleMetrics.exists ? '✅ 已構建' : '⚠️ 尚未構建'}`);
  console.log(`依賴安裝: ${nodeModulesMetrics.exists ? '✅ 已安裝' : '❌ 未安裝'}`);
  console.log(`配置文件: ${packageMetrics.exists ? '✅ 存在' : '❌ 不存在'}`);

  // 生成報告
  const report = {
    timestamp,
    bundle: bundleMetrics,
    package: packageMetrics,
    nodeModules: nodeModulesMetrics,
    summary: {
      projectBuilt: bundleMetrics.exists,
      dependenciesInstalled: nodeModulesMetrics.exists,
      configExists: packageMetrics.exists,
      totalSizeMB: bundleMetrics.sizeInMB + nodeModulesMetrics.sizeInMB
    }
  };

  // 保存報告
  try {
    const reportDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const reportPath = path.join(reportDir, 'performance-check.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📊 報告已保存: ${reportPath}`);

    // 輸出建議
    console.log('\n== 建議 ==');
    if (!bundleMetrics.exists) {
      console.log('💡 運行 npm run build 來構建項目');
    }
    if (bundleMetrics.sizeInMB > 10) {
      console.log('⚠️ Bundle 大小超過 10MB，考慮優化');
    }
    if (nodeModulesMetrics.sizeInMB > 500) {
      console.log('⚠️ Node modules 大小超過 500MB，考慮清理');
    }

  } catch (error) {
    console.error('保存報告時出錯:', error.message);
  }
}

// 運行主函數
main();
