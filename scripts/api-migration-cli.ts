#!/usr/bin/env tsx

/**
 * API 遷移管理 CLI 工具
 * 用於監控、分析和安全移除 REST API endpoints
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { Glob } from 'glob';
import APIUsageMonitor from '../lib/monitoring/api-usage-monitor';

const program = new Command();
const monitor = new APIUsageMonitor();

interface RestEndpoint {
  file: string;
  path: string;
  method: string;
  line: number;
  handler: string;
}

program.name('api-migration').description('API 遷移管理工具').version('1.0.0');

// 掃描所有 REST API endpoints
program
  .command('scan')
  .description('掃描項目中的所有 REST API endpoints')
  .option('-o, --output <file>', '將結果輸出到文件')
  .action(async options => {
    console.log(chalk.blue('🔍 掃描項目中的 REST API endpoints...'));

    const endpoints = await scanRestEndpoints();

    const table = new Table({
      head: ['File', 'Method', 'Path', 'Line', 'Handler'],
      colWidths: [30, 8, 25, 6, 20],
    });

    endpoints.forEach(endpoint => {
      table.push([
        chalk.green(endpoint.file),
        chalk.yellow(endpoint.method),
        chalk.cyan(endpoint.path),
        endpoint.line.toString(),
        endpoint.handler,
      ]);
    });

    console.log(table.toString());
    console.log(chalk.blue(`\n📊 總計發現 ${endpoints.length} 個 REST API endpoints`));

    if (options.output) {
      await fs.writeJson(options.output, endpoints, { spaces: 2 });
      console.log(chalk.green(`✅ 結果已保存到 ${options.output}`));
    }
  });

// 查看 API 使用統計
program
  .command('usage')
  .description('查看 API 使用統計')
  .option('-e, --endpoint <path>', '查看特定 endpoint 的使用情況')
  .option('-d, --days <number>', '查看最近 N 天的數據', '7')
  .action(async options => {
    console.log(chalk.blue('📊 獲取 API 使用統計...'));

    const days = parseInt(options.days);
    const timeRange = {
      from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
      to: new Date().toISOString(),
    };

    const stats = await monitor.getUsageStats(options.endpoint, timeRange);

    if (stats.length === 0) {
      console.log(chalk.yellow('⚠️  未找到使用記錄'));
      return;
    }

    const table = new Table({
      head: [
        'Endpoint',
        'Total Calls',
        'Unique Users',
        'Avg Response Time',
        'Error Rate',
        'Last Used',
      ],
      colWidths: [35, 12, 13, 18, 12, 20],
    });

    stats.forEach(stat => {
      const errorRate = (stat.errorRate * 100).toFixed(1) + '%';
      const avgTime = stat.avgResponseTime.toFixed(0) + 'ms';
      const lastUsed = new Date(stat.lastUsed).toLocaleDateString();

      table.push([
        chalk.cyan(stat.endpoint),
        stat.totalCalls.toString(),
        stat.uniqueUsers.toString(),
        avgTime,
        stat.errorRate > 0.1 ? chalk.red(errorRate) : chalk.green(errorRate),
        lastUsed,
      ]);
    });

    console.log(table.toString());
  });

// 生成遷移報告
program
  .command('report')
  .description('生成 API 遷移狀態報告')
  .option('-o, --output <file>', '將報告保存到文件')
  .action(async options => {
    console.log(chalk.blue('📈 生成 API 遷移報告...'));

    const report = await monitor.generateReport();

    console.log(chalk.green('\n📋 遷移狀態摘要:'));
    console.log(`總 endpoints: ${report.summary.totalEndpoints}`);
    console.log(`活躍 endpoints: ${report.summary.activeEndpoints}`);
    console.log(`未使用 endpoints: ${report.summary.unusedEndpoints}`);
    console.log(`高使用率 endpoints: ${report.summary.highUsageEndpoints}`);

    console.log(chalk.green('\n✅ 建議立即移除:'));
    report.recommendations.safeToRemove.forEach(endpoint => {
      console.log(chalk.gray(`  - ${endpoint}`));
    });

    console.log(chalk.yellow('\n⚠️  需要注意:'));
    report.recommendations.needsAttention.forEach(endpoint => {
      console.log(chalk.yellow(`  - ${endpoint}`));
    });

    console.log(chalk.red('\n🔴 高優先級遷移:'));
    report.recommendations.highPriority.forEach(endpoint => {
      console.log(chalk.red(`  - ${endpoint}`));
    });

    if (options.output) {
      await fs.writeJson(options.output, report, { spaces: 2 });
      console.log(chalk.green(`\n💾 報告已保存到 ${options.output}`));
    }
  });

// 安全移除 API endpoint
program
  .command('remove')
  .description('安全移除指定的 REST API endpoint')
  .argument('<endpoint>', '要移除的 endpoint 路徑')
  .option('--force', '強制移除，跳過安全檢查')
  .option('--dry-run', '模擬執行，不實際修改文件')
  .action(async (endpoint, options) => {
    console.log(chalk.blue(`🗑️  準備移除 endpoint: ${endpoint}`));

    // 安全檢查
    if (!options.force) {
      const safetyCheck = await monitor.isSafeToRemove(endpoint);

      if (!safetyCheck.safe) {
        console.log(chalk.red(`❌ 不安全移除: ${safetyCheck.reason}`));

        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: '是否強制移除此 endpoint？',
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow('❌ 取消移除操作'));
          return;
        }
      } else {
        console.log(chalk.green(`✅ 安全移除: ${safetyCheck.reason}`));
      }
    }

    // 查找並移除 endpoint
    const endpoints = await scanRestEndpoints();
    const targetEndpoint = endpoints.find(ep => ep.path === endpoint);

    if (!targetEndpoint) {
      console.log(chalk.red(`❌ 未找到 endpoint: ${endpoint}`));
      return;
    }

    if (options.dryRun) {
      console.log(chalk.blue('🔍 模擬執行模式:'));
      console.log(`  文件: ${targetEndpoint.file}`);
      console.log(`  行號: ${targetEndpoint.line}`);
      console.log(`  處理器: ${targetEndpoint.handler}`);
      return;
    }

    // 實際移除文件
    const confirmed = await confirmRemoval(targetEndpoint);
    if (confirmed) {
      await removeEndpointFromFile(targetEndpoint);
      console.log(chalk.green(`✅ 已成功移除 ${endpoint}`));
    } else {
      console.log(chalk.yellow('❌ 取消移除操作'));
    }
  });

// 批量移除安全的 endpoints
program
  .command('batch-remove')
  .description('批量移除所有安全的 REST API endpoints')
  .option('--dry-run', '模擬執行，不實際修改文件')
  .action(async options => {
    console.log(chalk.blue('🗂️  批量移除安全的 REST API endpoints...'));

    const report = await monitor.generateReport();
    const safeEndpoints = report.recommendations.safeToRemove;

    if (safeEndpoints.length === 0) {
      console.log(chalk.yellow('⚠️  沒有發現可安全移除的 endpoints'));
      return;
    }

    console.log(chalk.green(`✅ 發現 ${safeEndpoints.length} 個可安全移除的 endpoints:`));
    safeEndpoints.forEach(endpoint => {
      console.log(chalk.gray(`  - ${endpoint}`));
    });

    if (options.dryRun) {
      console.log(chalk.blue('\n🔍 模擬執行模式，不會實際修改文件'));
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `確定要移除這 ${safeEndpoints.length} 個 endpoints 嗎？`,
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('❌ 取消批量移除操作'));
      return;
    }

    // 逐一移除
    let successCount = 0;
    let failureCount = 0;

    for (const endpoint of safeEndpoints) {
      try {
        const endpoints = await scanRestEndpoints();
        const targetEndpoint = endpoints.find(ep => ep.path === endpoint);

        if (targetEndpoint) {
          await removeEndpointFromFile(targetEndpoint);
          console.log(chalk.green(`✅ 已移除: ${endpoint}`));
          successCount++;
        } else {
          console.log(chalk.yellow(`⚠️  未找到: ${endpoint}`));
        }
      } catch (error) {
        console.log(chalk.red(`❌ 移除失敗: ${endpoint} - ${error}`));
        failureCount++;
      }
    }

    console.log(chalk.blue(`\n📊 批量移除完成:`));
    console.log(`  成功: ${successCount}`);
    console.log(`  失敗: ${failureCount}`);
  });

// 工具函數
async function scanRestEndpoints(): Promise<RestEndpoint[]> {
  const endpoints: RestEndpoint[] = [];
  const pattern = ['app/api/**/*.ts', '!app/api/graphql/**'];

  const files = await new Glob(pattern, { cwd: process.cwd() }).walk();

  for await (const file of files) {
    const filePath = path.join(process.cwd(), file);
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // 匹配 Next.js API 路由格式
      const exportMatch = line.match(
        /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/
      );
      if (exportMatch) {
        const method = exportMatch[1];
        const relativePath = file.replace(/^app\/api/, '').replace(/\/route\.ts$/, '') || '/';

        endpoints.push({
          file: file,
          path: relativePath,
          method,
          line: index + 1,
          handler: `${method} handler`,
        });
      }
    });
  }

  return endpoints;
}

async function confirmRemoval(endpoint: RestEndpoint): Promise<boolean> {
  console.log(chalk.yellow('\n⚠️  準備移除以下 endpoint:'));
  console.log(`文件: ${endpoint.file}`);
  console.log(`路徑: ${endpoint.path}`);
  console.log(`方法: ${endpoint.method}`);
  console.log(`行號: ${endpoint.line}`);

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '確定要移除此 endpoint 嗎？',
      default: false,
    },
  ]);

  return confirm;
}

async function removeEndpointFromFile(endpoint: RestEndpoint): Promise<void> {
  const filePath = path.join(process.cwd(), endpoint.file);

  // 檢查文件是否只包含要移除的處理器
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // 計算有多少個導出的處理器
  const handlerCount = lines.filter(line =>
    line.match(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/)
  ).length;

  if (handlerCount === 1) {
    // 如果只有一個處理器，刪除整個文件
    await fs.remove(filePath);
    console.log(chalk.blue(`🗑️  已刪除文件: ${endpoint.file}`));
  } else {
    // 如果有多個處理器，只移除指定的處理器
    // 這需要更複雜的 AST 解析，暫時標記為需要手動處理
    console.log(
      chalk.yellow(`⚠️  ${endpoint.file} 包含多個處理器，需要手動移除 ${endpoint.method} 處理器`)
    );
  }
}

program.parse();
