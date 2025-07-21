/**
 * TypeScript 遷移 TODO 標記掃描工具
 * 用於追蹤和管理類型遷移過程中的待辦事項
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// TODO 標記正則表達式
const TODO_PATTERN = /@types-migration:todo\((phase\d)\)\s*\[P(\d)\]\s*(.*?)(?:\s*-\s*(.*))?$/;

// TODO 項目接口
export interface TodoItem {
  file: string;
  line: number;
  phase: string;
  priority: number;
  description: string;
  metadata?: string;
  content: string;
}

// 掃描結果統計
export interface TodoStats {
  total: number;
  byPhase: Record<string, number>;
  byPriority: Record<string, number>;
  byFile: Record<string, number>;
}

/**
 * 掃描單個文件中的 TODO 標記
 */
export function scanFile(filePath: string): TodoItem[] {
  const todos: TodoItem[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const match = line.match(TODO_PATTERN);
    if (match) {
      // 跳過示例代碼（在 TODO_EXAMPLES 對象中的標記）
      const isExample = line.includes('TODO_EXAMPLES') || 
                       line.includes('phase1Critical') || 
                       line.includes('phase2High') || 
                       line.includes('phase3Medium') || 
                       line.includes('phase4Low');
      
      if (!isExample) {
        todos.push({
          file: filePath,
          line: index + 1,
          phase: match[1],
          priority: parseInt(match[2]),
          description: match[3].trim(),
          metadata: match[4]?.trim(),
          content: line.trim()
        });
      }
    }
  });

  return todos;
}

/**
 * 掃描整個項目中的 TODO 標記
 */
export async function scanProject(rootPath: string, patterns: string[] = ['**/*.ts', '**/*.tsx']): Promise<TodoItem[]> {
  const todos: TodoItem[] = [];
  
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: rootPath,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/*.test.*', '**/*.spec.*']
    });

    for (const file of files) {
      const filePath = path.join(rootPath, file);
      const fileTodos = scanFile(filePath);
      todos.push(...fileTodos);
    }
  }

  return todos;
}

/**
 * 生成 TODO 統計信息
 */
export function generateStats(todos: TodoItem[]): TodoStats {
  const stats: TodoStats = {
    total: todos.length,
    byPhase: {},
    byPriority: {},
    byFile: {}
  };

  todos.forEach(todo => {
    // 按階段統計
    stats.byPhase[todo.phase] = (stats.byPhase[todo.phase] || 0) + 1;
    
    // 按優先級統計
    const priorityKey = `P${todo.priority}`;
    stats.byPriority[priorityKey] = (stats.byPriority[priorityKey] || 0) + 1;
    
    // 按文件統計
    const relativeFile = todo.file.replace(process.cwd(), '');
    stats.byFile[relativeFile] = (stats.byFile[relativeFile] || 0) + 1;
  });

  return stats;
}

/**
 * 生成 Markdown 格式的報告
 */
export function generateMarkdownReport(todos: TodoItem[], stats: TodoStats): string {
  const report: string[] = [];
  
  report.push('# TypeScript 遷移 TODO 報告');
  report.push(`\n生成時間: ${new Date().toISOString()}\n`);
  
  // 統計摘要
  report.push('## 統計摘要\n');
  report.push(`- **總計 TODO**: ${stats.total} 個`);
  report.push('\n### 按階段分布');
  Object.entries(stats.byPhase).forEach(([phase, count]) => {
    report.push(`- ${phase}: ${count} 個`);
  });
  
  report.push('\n### 按優先級分布');
  Object.entries(stats.byPriority).forEach(([priority, count]) => {
    report.push(`- ${priority}: ${count} 個`);
  });
  
  // 詳細列表
  report.push('\n## 詳細列表\n');
  
  // 按優先級分組
  const groupedByPriority: Record<number, TodoItem[]> = {};
  todos.forEach(todo => {
    if (!groupedByPriority[todo.priority]) {
      groupedByPriority[todo.priority] = [];
    }
    groupedByPriority[todo.priority].push(todo);
  });
  
  // 按優先級從高到低排序
  const priorities = Object.keys(groupedByPriority).map(Number).sort((a, b) => a - b);
  
  priorities.forEach(priority => {
    report.push(`### P${priority} - ${getPriorityDescription(priority)}\n`);
    
    groupedByPriority[priority].forEach(todo => {
      const relativeFile = todo.file.replace(process.cwd(), '');
      report.push(`- [ ] **${relativeFile}:${todo.line}**`);
      report.push(`  - ${todo.description}`);
      if (todo.metadata) {
        report.push(`  - ${todo.metadata}`);
      }
      report.push('');
    });
  });
  
  return report.join('\n');
}

/**
 * 獲取優先級描述
 */
function getPriorityDescription(priority: number): string {
  const descriptions: Record<number, string> = {
    0: 'Critical - 必須立即處理',
    1: 'High - 本期必須完成',
    2: 'Medium - 下期考慮',
    3: 'Low - 長期優化'
  };
  return descriptions[priority] || 'Unknown';
}

/**
 * 保存報告到文件
 */
export function saveReport(report: string, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, report);
}

/**
 * 標準化 TODO 標記格式示例
 */
export const TODO_EXAMPLES = {
  phase1Critical: '// @types-migration:todo(phase1) [P0] 完全替換 any 類型 - Target: 2025-02',
  phase2High: '// @types-migration:todo(phase2) [P1] 添加 zod validation - Owner: @backend-team',
  phase3Medium: '// @types-migration:todo(phase3) [P2] 遷移到新類型系統 - Blocked by: API 重構',
  phase4Low: '// @types-migration:todo(phase4) [P3] 優化類型定義 - 長期改進'
};

/**
 * 主執行函數
 */
async function main() {
  try {
    console.log('🔍 開始掃描 TypeScript 遷移 TODO 標記...');
    
    const rootPath = process.cwd();
    const todos = await scanProject(rootPath);
    const stats = generateStats(todos);
    
    console.log(`📊 掃描完成！找到 ${stats.total} 個 TODO 標記`);
    
    // 生成報告
    const report = generateMarkdownReport(todos, stats);
    const timestamp = new Date().toISOString().split('T')[0];
    const outputPath = path.join(rootPath, 'docs', 'progress-check', `typescript-migration-todo-scan-${timestamp}.md`);
    
    saveReport(report, outputPath);
    
    console.log(`📋 報告已保存到: ${outputPath}`);
    console.log('\n統計摘要:');
    console.log(`- 總計: ${stats.total} 個 TODO`);
    console.log('- 按階段分布:');
    Object.entries(stats.byPhase).forEach(([phase, count]) => {
      console.log(`  - ${phase}: ${count} 個`);
    });
    console.log('- 按優先級分布:');
    Object.entries(stats.byPriority).forEach(([priority, count]) => {
      console.log(`  - ${priority}: ${count} 個`);
    });
    
  } catch (error) {
    console.error('❌ 掃描失敗:', error);
    process.exit(1);
  }
}

// 如果直接執行此文件，運行主函數
if (require.main === module) {
  main();
}