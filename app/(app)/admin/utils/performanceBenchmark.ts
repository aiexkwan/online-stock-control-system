/**
 * ChatbotCard 性能基準測試工具
 *
 * 職責：
 * - 測量ChatbotCard系統的整體性能
 * - 對比優化前後的性能指標
 * - 生成詳細的性能報告
 * - 驗證15-20%性能提升目標
 */

import { performanceMonitor, createPerformanceBenchmark } from './performanceMonitor';

// 性能測試場景
export interface PerformanceTestScenario {
  name: string;
  description: string;
  steps: PerformanceTestStep[];
  expectedImprovementPercent: number;
}

export interface PerformanceTestStep {
  action: string;
  delay?: number;
  validation?: (results: any) => boolean;
}

// 性能基準測試結果
export interface BenchmarkResults {
  scenario: string;
  totalTime: number;
  averageRenderTime: number;
  renderCount: number;
  memoryUsage: number;
  performanceScore: number;
  improvementPercent?: number;
}

/**
 * ChatbotCard 性能測試場景
 */
export const chatbotCardTestScenarios: PerformanceTestScenario[] = [
  {
    name: 'basic_interaction',
    description: '基本聊天交互測試',
    steps: [
      { action: 'render_component', delay: 100 },
      { action: 'type_message', delay: 500 },
      { action: 'send_message', delay: 1000 },
      { action: 'receive_response', delay: 2000 },
      { action: 'show_suggestions', delay: 500 },
    ],
    expectedImprovementPercent: 15,
  },
  {
    name: 'heavy_message_list',
    description: '大量消息列表渲染測試',
    steps: [
      { action: 'render_component', delay: 100 },
      { action: 'load_50_messages', delay: 1000 },
      { action: 'scroll_to_bottom', delay: 500 },
      { action: 'add_new_message', delay: 300 },
      { action: 'update_suggestions', delay: 200 },
    ],
    expectedImprovementPercent: 20,
  },
  {
    name: 'suggestion_system',
    description: '建議系統性能測試',
    steps: [
      { action: 'render_component', delay: 100 },
      { action: 'generate_suggestions', delay: 800 },
      { action: 'filter_suggestions', delay: 300 },
      { action: 'user_select_category', delay: 200 },
      { action: 'update_contextual_suggestions', delay: 500 },
    ],
    expectedImprovementPercent: 18,
  },
  {
    name: 'ai_response_rendering',
    description: 'AI 回應渲染性能測試',
    steps: [
      { action: 'render_component', delay: 100 },
      { action: 'receive_list_response', delay: 600 },
      { action: 'render_table_response', delay: 800 },
      { action: 'handle_error_response', delay: 300 },
      { action: 'retry_failed_request', delay: 400 },
    ],
    expectedImprovementPercent: 16,
  },
];

/**
 * 性能基準測試執行器
 */
export class ChatbotCardBenchmark {
  private results: Map<string, BenchmarkResults> = new Map();
  private baselineResults: Map<string, BenchmarkResults> = new Map();

  /**
   * 執行單一測試場景
   */
  async runScenario(scenario: PerformanceTestScenario): Promise<BenchmarkResults> {
    const benchmark = createPerformanceBenchmark(`ChatbotCard_${scenario.name}`);
    console.log(`🚀 開始執行性能測試: ${scenario.description}`);

    // 重置性能監控
    performanceMonitor.reset();

    // 記錄初始記憶體使用
    const initialMemory = this.getMemoryUsage();
    let renderCount = 0;
    let totalRenderTime = 0;

    // 執行測試步驟
    for (const step of scenario.steps) {
      console.log(`  📋 執行步驟: ${step.action}`);

      // 模擬步驟執行
      await this.simulateAction(step.action, step.delay);
      benchmark.measure();

      // 收集渲染指標
      const metrics = performanceMonitor.getMetrics();
      renderCount = metrics.reduce((sum, m) => sum + m.renderCount, 0);
      totalRenderTime = metrics.reduce((sum, m) => sum + m.totalRenderTime, 0);

      // 驗證步驟結果
      if (step.validation) {
        const isValid = step.validation({ metrics, renderCount, totalRenderTime });
        if (!isValid) {
          console.warn(`  ⚠️ 步驟驗證失敗: ${step.action}`);
        }
      }
    }

    // 完成測試並收集結果
    const benchmarkResults = benchmark.finish();
    const finalMemory = this.getMemoryUsage();

    const results: BenchmarkResults = {
      scenario: scenario.name,
      totalTime: benchmarkResults.totalTime,
      averageRenderTime: renderCount > 0 ? totalRenderTime / renderCount : 0,
      renderCount,
      memoryUsage: finalMemory - initialMemory,
      performanceScore: this.calculatePerformanceScore(
        benchmarkResults,
        renderCount,
        totalRenderTime
      ),
    };

    this.results.set(scenario.name, results);
    console.log(`✅ 完成測試: ${scenario.name}，性能評分: ${results.performanceScore.toFixed(2)}`);

    return results;
  }

  /**
   * 執行所有測試場景
   */
  async runAllScenarios(): Promise<Map<string, BenchmarkResults>> {
    console.log('🎯 開始 ChatbotCard 完整性能基準測試');

    for (const scenario of chatbotCardTestScenarios) {
      await this.runScenario(scenario);
      // 在測試間隔中等待，讓系統穩定
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return this.results;
  }

  /**
   * 設置基線性能數據（優化前）
   */
  setBaseline(results: Map<string, BenchmarkResults>) {
    this.baselineResults = new Map(results);
    console.log('📊 已設置性能基線數據');
  }

  /**
   * 計算性能改善百分比
   */
  calculateImprovement(): Map<string, number> {
    const improvements = new Map<string, number>();

    for (const [scenario, current] of this.results) {
      const baseline = this.baselineResults.get(scenario);
      if (baseline) {
        const improvement =
          ((baseline.performanceScore - current.performanceScore) / baseline.performanceScore) *
          100;
        improvements.set(scenario, improvement);

        // 更新結果中的改善百分比
        current.improvementPercent = improvement;
      }
    }

    return improvements;
  }

  /**
   * 生成詳細的性能報告
   */
  generateReport(): string {
    const improvements = this.calculateImprovement();
    const hasBaseline = this.baselineResults.size > 0;

    let report = '# ChatbotCard 性能測試報告\n\n';
    report += `測試時間: ${new Date().toISOString()}\n`;
    report += `測試場景數: ${this.results.size}\n\n`;

    // 總體性能概況
    if (hasBaseline) {
      const totalImprovement =
        Array.from(improvements.values()).reduce((sum, imp) => sum + imp, 0) / improvements.size;
      report += `## 📈 總體性能改善\n\n`;
      report += `平均性能提升: **${totalImprovement.toFixed(2)}%**\n`;
      report += `目標達成狀況: ${totalImprovement >= 15 ? '✅ 已達成' : '❌ 未達成'} (目標: 15-20%)\n\n`;
    }

    // 詳細測試結果
    report += '## 📊 詳細測試結果\n\n';
    report +=
      '| 測試場景 | 總時間(ms) | 平均渲染時間(ms) | 渲染次數 | 記憶體變化(MB) | 性能評分 | 改善幅度 |\n';
    report +=
      '|---------|-----------|-----------------|---------|---------------|---------|----------|\n';

    for (const [scenario, results] of this.results) {
      const improvement = improvements.get(scenario) || 0;
      const improvementText = hasBaseline
        ? `${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)}%`
        : 'N/A';

      report += `| ${scenario} | ${results.totalTime.toFixed(2)} | ${results.averageRenderTime.toFixed(2)} | ${results.renderCount} | ${(results.memoryUsage / 1024 / 1024).toFixed(2)} | ${results.performanceScore.toFixed(2)} | ${improvementText} |\n`;
    }

    // 性能建議
    report += '\n## 💡 性能分析與建議\n\n';

    for (const [scenario, results] of this.results) {
      const targetScenario = chatbotCardTestScenarios.find(s => s.name === scenario);
      if (targetScenario) {
        const improvement = improvements.get(scenario) || 0;
        const metTarget = improvement >= targetScenario.expectedImprovementPercent;

        report += `### ${targetScenario.description}\n`;
        report += `- 預期改善: ${targetScenario.expectedImprovementPercent}%\n`;
        report += `- 實際改善: ${improvement.toFixed(2)}%\n`;
        report += `- 達成狀況: ${metTarget ? '✅' : '❌'}\n`;

        if (!metTarget && hasBaseline) {
          report += this.generateOptimizationSuggestions(scenario, results);
        }

        report += '\n';
      }
    }

    return report;
  }

  /**
   * 模擬動作執行
   */
  private async simulateAction(action: string, delay = 0): Promise<void> {
    // 這裡可以根據實際需要來模擬不同的動作
    // 目前使用簡單的延遲來模擬
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * 獲取當前記憶體使用量
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize || 0;
    }
    return 0;
  }

  /**
   * 計算性能評分
   */
  private calculatePerformanceScore(
    benchmarkResults: any,
    renderCount: number,
    totalRenderTime: number
  ): number {
    // 性能評分算法：基於時間、渲染次數和效率
    const timeScore = Math.max(0, 100 - benchmarkResults.totalTime / 100);
    const renderEfficiency = renderCount > 0 ? 100 - totalRenderTime / renderCount : 100;
    const overallScore = (timeScore + renderEfficiency) / 2;

    return Math.max(0, Math.min(100, overallScore));
  }

  /**
   * 生成優化建議
   */
  private generateOptimizationSuggestions(scenario: string, results: BenchmarkResults): string {
    let suggestions = '- **優化建議**:\n';

    if (results.averageRenderTime > 16) {
      suggestions += '  - 平均渲染時間超過16ms，建議檢查是否有不必要的重渲染\n';
    }

    if (results.renderCount > 50) {
      suggestions += '  - 渲染次數較多，建議檢查React.memo和useCallback的使用\n';
    }

    if (results.memoryUsage > 5 * 1024 * 1024) {
      suggestions += '  - 記憶體使用量較大，建議檢查是否有記憶體洩漏\n';
    }

    if (results.performanceScore < 70) {
      suggestions += '  - 整體性能評分較低，建議全面檢視組件架構\n';
    }

    return suggestions;
  }
}

/**
 * 全局基準測試實例
 */
export const chatbotCardBenchmark = new ChatbotCardBenchmark();

/**
 * 快速性能測試函數
 */
export const runQuickPerformanceTest = async (): Promise<void> => {
  console.log('⚡ 開始快速性能測試...');

  const basicScenario = chatbotCardTestScenarios[0]; // 基本交互測試
  const results = await chatbotCardBenchmark.runScenario(basicScenario);

  console.log('📋 快速測試結果:');
  console.table({
    '總時間(ms)': results.totalTime.toFixed(2),
    '平均渲染時間(ms)': results.averageRenderTime.toFixed(2),
    渲染次數: results.renderCount,
    性能評分: results.performanceScore.toFixed(2),
  });
};

// 開發環境下自動暴露測試工具
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).chatbotCardBenchmark = chatbotCardBenchmark;
  (window as any).runQuickPerformanceTest = runQuickPerformanceTest;
}
