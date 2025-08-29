/**
 * 數據源配置管理 API
 * 用於監控和管理 REST/GraphQL 共存策略
 */

import { NextRequest, NextResponse } from 'next/server';
import { dataSourceConfig } from '@/lib/data/data-source-config';
import { unifiedDataLayer , DataSourceType } from '@/lib/api/unified-data-layer';
import type { DataSourceRule, ABTestConfig } from '@/lib/data/data-source-config';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        // 獲取完整狀態信息
        const status = unifiedDataLayer.getConfigStatus();
        return NextResponse.json({
          success: true,
          data: status,
        });

      case 'metrics':
        // 僅獲取性能指標
        const configStatus = unifiedDataLayer.getConfigStatus();
        return NextResponse.json({
          success: true,
          data: {
            metrics: configStatus.performanceMetrics,
            lastUpdated: new Date().toISOString(),
          },
        });

      case 'rules':
        // 獲取所有規則
        const rules = dataSourceConfig.getStatus().rules;
        return NextResponse.json({
          success: true,
          data: rules,
        });

      case 'experiments':
        // 獲取 A/B 測試配置
        const experiments = dataSourceConfig.getStatus().abTests;
        return NextResponse.json({
          success: true,
          data: experiments,
        });

      default:
        return NextResponse.json({
          success: true,
          data: unifiedDataLayer.getConfigStatus(),
        });
    }
  } catch (error) {
    console.error('[DataSourceConfig API] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'switch_data_source':
        // 手動切換數據源
        const { targetSource, duration } = data;
        if (!Object.values(DataSourceType).includes(targetSource)) {
          throw new Error('Invalid data source type');
        }

        await unifiedDataLayer.switchDataSource(targetSource, duration);

        return NextResponse.json({
          success: true,
          message: `Switched to ${targetSource}${duration ? ` for ${duration}ms` : ' permanently'}`,
        });

      case 'add_rule':
        // 添加新規則
        const { rule } = data;
        if (!rule || !rule.id || !rule.name || !rule.condition || !rule.target) {
          throw new Error('Invalid rule data');
        }

        dataSourceConfig.addRule({
          ...rule,
          priority: rule.priority || 50,
          enabled: rule.enabled !== undefined ? rule.enabled : true,
          fallbackEnabled: rule.fallbackEnabled !== undefined ? rule.fallbackEnabled : true,
        });

        return NextResponse.json({
          success: true,
          message: `Rule "${rule.name}" added successfully`,
        });

      case 'update_rule':
        // 更新規則
        const { ruleId, updates } = data;
        if (!ruleId) {
          throw new Error('Rule ID is required');
        }

        dataSourceConfig.updateRule(ruleId, updates);

        return NextResponse.json({
          success: true,
          message: `Rule "${ruleId}" updated successfully`,
        });

      case 'remove_rule':
        // 移除規則
        const { ruleId: removeRuleId } = data;
        if (!removeRuleId) {
          throw new Error('Rule ID is required');
        }

        dataSourceConfig.removeRule(removeRuleId);

        return NextResponse.json({
          success: true,
          message: `Rule "${removeRuleId}" removed successfully`,
        });

      case 'add_experiment':
        // 添加 A/B 測試
        const { experiment } = data;
        if (!experiment || !experiment.experimentId || !experiment.name) {
          throw new Error('Invalid experiment data');
        }

        dataSourceConfig.addABTest({
          ...experiment,
          enabled: experiment.enabled !== undefined ? experiment.enabled : true,
          trafficPercentage: experiment.trafficPercentage || 10,
          startDate: new Date(experiment.startDate || Date.now()),
          endDate: experiment.endDate ? new Date(experiment.endDate) : undefined,
        });

        return NextResponse.json({
          success: true,
          message: `Experiment "${experiment.name}" added successfully`,
        });

      case 'remove_experiment':
        // 移除 A/B 測試
        const { experimentId } = data;
        if (!experimentId) {
          throw new Error('Experiment ID is required');
        }

        dataSourceConfig.removeABTest(experimentId);

        return NextResponse.json({
          success: true,
          message: `Experiment "${experimentId}" removed successfully`,
        });

      case 'set_default_source':
        // 設置默認數據源
        const { defaultSource } = data;
        if (!Object.values(DataSourceType).includes(defaultSource)) {
          throw new Error('Invalid data source type');
        }

        dataSourceConfig.setDefaultDataSource(defaultSource);

        return NextResponse.json({
          success: true,
          message: `Default data source set to ${defaultSource}`,
        });

      case 'toggle_fallback':
        // 切換全局 fallback 開關
        const { enabled } = data;
        dataSourceConfig.setGlobalFallbackEnabled(enabled);

        return NextResponse.json({
          success: true,
          message: `Global fallback ${enabled ? 'enabled' : 'disabled'}`,
        });

      case 'simulate_performance':
        // 模擬性能指標（用於測試）
        const { metrics } = data;
        if (metrics) {
          dataSourceConfig.updateMetrics(metrics);
        }

        return NextResponse.json({
          success: true,
          message: 'Performance metrics updated',
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[DataSourceConfig API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config) {
      throw new Error('Configuration data is required');
    }

    // 批量更新配置
    if (config.defaultDataSource) {
      dataSourceConfig.setDefaultDataSource(config.defaultDataSource);
    }

    if (config.globalFallbackEnabled !== undefined) {
      dataSourceConfig.setGlobalFallbackEnabled(config.globalFallbackEnabled);
    }

    if (config.rules) {
      // 清空現有規則並添加新規則
      const currentRules = dataSourceConfig.getStatus().rules;
      currentRules.forEach(rule => dataSourceConfig.removeRule(rule.id));

      config.rules.forEach((rule: DataSourceRule) => dataSourceConfig.addRule(rule));
    }

    if (config.experiments) {
      // 清空現有實驗並添加新實驗
      const currentExperiments = dataSourceConfig.getStatus().abTests;
      currentExperiments.forEach(exp => dataSourceConfig.removeABTest(exp.experimentId));

      config.experiments.forEach((exp: ABTestConfig) => dataSourceConfig.addABTest(exp));
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
    });
  } catch (error) {
    console.error('[DataSourceConfig API] PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    );
  }
}
