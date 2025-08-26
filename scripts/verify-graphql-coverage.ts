#!/usr/bin/env tsx

/**
 * GraphQL 功能覆蓋驗證腳本
 * 確保 GraphQL 系統能夠完全替代現有的 REST API 功能
 */

import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import chalk from 'chalk';

// GraphQL 客戶端配置
const client = new ApolloClient({
  uri: 'http://localhost:3000/api/graphql',
  cache: new InMemoryCache(),
});

import type { DocumentNode } from 'graphql';

interface EndpointTest {
  name: string;
  restEndpoint: string;
  graphqlQuery: DocumentNode;
  variables?: any;
  description: string;
}

const endpointTests: EndpointTest[] = [
  {
    name: 'Dashboard Stats',
    restEndpoint: '/api/stats/dashboard',
    graphqlQuery: gql`
      query GetDashboardStats($input: DashboardStatsInput!) {
        dashboardStats(input: $input) {
          totalOrders
          completedOrders
          pendingTransfers
          lowStockItems
          todayProduction
          weeklyTrend
        }
      }
    `,
    variables: { input: { timeRange: 'today' } },
    description: '儀表板統計數據',
  },
  {
    name: 'Stock Levels',
    restEndpoint: '/api/tables/stock-levels',
    graphqlQuery: gql`
      query GetStockLevels($input: StockLevelsInput) {
        stockLevels(input: $input) {
          items {
            productCode
            productDesc
            warehouse
            location
            quantity
            value
          }
          total
          aggregates {
            totalQuantity
            totalValue
            uniqueProducts
          }
        }
      }
    `,
    variables: {
      input: {
        filter: { includeZeroStock: false },
        limit: 10,
      },
    },
    description: '庫存水平查詢',
  },
  {
    name: 'Stock Transfers',
    restEndpoint: '/api/tables/transfers',
    graphqlQuery: gql`
      query GetStockTransfers($status: String, $limit: Int) {
        stockTransfers(status: $status, limit: $limit) {
          id
          productCode
          productDesc
          quantity
          fromLocation
          toLocation
          status
          createdAt
          createdBy
        }
      }
    `,
    variables: { status: 'PENDING', limit: 10 },
    description: '庫存轉移記錄',
  },
  {
    name: 'Transfer Detail',
    restEndpoint: '/api/transfers/[id]',
    graphqlQuery: gql`
      query GetTransferDetail($id: String!) {
        transferDetail(id: $id) {
          id
          productCode
          productDesc
          quantity
          fromLocation
          toLocation
          status
          createdAt
          completedAt
          notes
          pallet {
            plt_num
            product_code
            f_loc
          }
        }
      }
    `,
    variables: { id: 'test-transfer-id' },
    description: '轉移詳情查詢',
  },
  {
    name: 'Inventory Analysis',
    restEndpoint: '/api/reports/inventory-analysis',
    graphqlQuery: gql`
      query GetInventoryAnalysis($input: InventoryAnalysisInput!) {
        inventoryAnalysis(input: $input) {
          summary {
            totalValue
            totalQuantity
            uniqueProducts
            totalLocations
          }
          distribution {
            byWarehouse {
              warehouse
              totalValue
              totalQuantity
              productCount
            }
            byCategory {
              category
              totalValue
              totalQuantity
              percentage
            }
          }
          trends {
            stockMovement {
              date
              inbound
              outbound
              netChange
            }
          }
          insights {
            topProducts {
              productCode
              totalValue
              totalQuantity
            }
            lowStockItems {
              productCode
              currentStock
              minimumLevel
            }
          }
        }
      }
    `,
    variables: {
      input: {
        timeRange: 'LAST_30_DAYS',
        includeZeroStock: false,
      },
    },
    description: '庫存分析報告',
  },
  {
    name: 'Create Transfer',
    restEndpoint: '/api/transfers (POST)',
    graphqlQuery: gql`
      mutation CreateTransfer($input: CreateTransferInput!) {
        createTransfer(input: $input) {
          success
          message
          transfer {
            id
            productCode
            quantity
            fromLocation
            toLocation
            status
          }
        }
      }
    `,
    variables: {
      input: {
        productCode: 'TEST001',
        quantity: 10,
        fromLocation: 'A001',
        toLocation: 'B001',
        notes: 'Test transfer',
      },
    },
    description: '創建庫存轉移',
  },
];

async function testGraphQLEndpoint(test: EndpointTest): Promise<{
  success: boolean;
  error?: string;
  responseTime?: number;
  dataReceived?: boolean;
}> {
  const startTime = Date.now();

  try {
    const result = await client.query({
      query: test.graphqlQuery,
      variables: test.variables,
      fetchPolicy: 'network-only', // 確保不使用緩存
    });

    const responseTime = Date.now() - startTime;
    const dataReceived = result.data && Object.keys(result.data).length > 0;

    return {
      success: !result.error,
      responseTime,
      dataReceived,
      error: result.error?.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      responseTime: Date.now() - startTime,
      dataReceived: false,
    };
  }
}

async function verifyGraphQLCoverage(): Promise<void> {
  console.log(chalk.blue('🔍 開始驗證 GraphQL 功能覆蓋...'));

  let passedTests = 0;
  let failedTests = 0;
  const results: Array<{
    test: EndpointTest;
    result: Awaited<ReturnType<typeof testGraphQLEndpoint>>;
  }> = [];

  for (const test of endpointTests) {
    console.log(chalk.yellow(`\n🧪 測試: ${test.name}`));
    console.log(chalk.gray(`   替代: ${test.restEndpoint}`));
    console.log(chalk.gray(`   描述: ${test.description}`));

    const result = await testGraphQLEndpoint(test);
    results.push({ test, result });

    if (result.success && result.dataReceived) {
      console.log(chalk.green(`   ✅ 通過 (${result.responseTime}ms)`));
      passedTests++;
    } else {
      console.log(chalk.red(`   ❌ 失敗: ${result.error || '未接收到數據'}`));
      if (result.responseTime) {
        console.log(chalk.gray(`   響應時間: ${result.responseTime}ms`));
      }
      failedTests++;
    }
  }

  // 生成詳細報告
  console.log(chalk.blue('\n📊 測試結果摘要:'));
  console.log(`總測試: ${endpointTests.length}`);
  console.log(chalk.green(`通過: ${passedTests}`));
  console.log(chalk.red(`失敗: ${failedTests}`));
  console.log(`成功率: ${((passedTests / endpointTests.length) * 100).toFixed(1)}%`);

  // 性能分析
  const avgResponseTime =
    results
      .filter(r => r.result.responseTime)
      .reduce((sum, r) => sum + (r.result.responseTime || 0), 0) / results.length;

  console.log(`\n⏱️  平均響應時間: ${avgResponseTime.toFixed(0)}ms`);

  // 失敗的測試詳情
  const failedResults = results.filter(r => !r.result.success || !r.result.dataReceived);
  if (failedResults.length > 0) {
    console.log(chalk.red('\n❌ 失敗的測試:'));
    failedResults.forEach(({ test, result }) => {
      console.log(chalk.red(`  - ${test.name}: ${result.error || '未接收到數據'}`));
    });
  }

  // 成功的測試
  const successResults = results.filter(r => r.result.success && r.result.dataReceived);
  if (successResults.length > 0) {
    console.log(chalk.green('\n✅ 成功的測試:'));
    successResults.forEach(({ test, result }) => {
      console.log(chalk.green(`  - ${test.name} (${result.responseTime}ms)`));
    });
  }

  // 遷移就緒評估
  const readinessScore = (passedTests / endpointTests.length) * 100;
  console.log(chalk.blue('\n🚀 遷移就緒評估:'));

  if (readinessScore >= 90) {
    console.log(chalk.green(`✅ 系統就緒 (${readinessScore.toFixed(1)}%)`));
    console.log(chalk.green('   可以安全地開始移除 REST API endpoints'));
  } else if (readinessScore >= 70) {
    console.log(chalk.yellow(`⚠️  基本就緒 (${readinessScore.toFixed(1)}%)`));
    console.log(chalk.yellow('   建議先修復失敗的測試再開始遷移'));
  } else {
    console.log(chalk.red(`❌ 未就緒 (${readinessScore.toFixed(1)}%)`));
    console.log(chalk.red('   需要修復更多問題才能開始遷移'));
  }
}

async function testServerConnection(): Promise<boolean> {
  console.log(chalk.blue('🔌 測試 GraphQL 服務器連接...'));

  try {
    const result = await client.query({
      query: gql`
        query TestConnection {
          __schema {
            queryType {
              name
            }
          }
        }
      `,
      fetchPolicy: 'network-only',
    });

    if (result.data && result.data.__schema) {
      console.log(chalk.green('✅ GraphQL 服務器連接成功'));
      return true;
    } else {
      console.log(chalk.red('❌ GraphQL 服務器響應異常'));
      return false;
    }
  } catch (error) {
    console.log(chalk.red(`❌ GraphQL 服務器連接失敗: ${error}`));
    return false;
  }
}

async function main() {
  console.log(chalk.blue('🚀 開始 GraphQL 功能覆蓋驗證'));

  // 測試服務器連接
  const serverConnected = await testServerConnection();
  if (!serverConnected) {
    console.log(chalk.red('\n❌ 無法連接到 GraphQL 服務器，請確保開發服務器正在運行'));
    console.log(chalk.yellow('   提示: 運行 npm run dev 啟動開發服務器'));
    process.exit(1);
  }

  // 執行功能覆蓋驗證
  await verifyGraphQLCoverage();

  console.log(chalk.blue('\n✅ GraphQL 功能覆蓋驗證完成!'));
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('驗證過程中出現錯誤:'), error);
    process.exit(1);
  });
}

export { verifyGraphQLCoverage, testServerConnection };
