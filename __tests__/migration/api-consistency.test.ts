/**
 * GraphQL vs REST API 一致性測試
 * QA專家 - 遷移功能驗證框架
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createTestClient } from 'apollo-server-testing';
import request from 'supertest';
import { app } from '@/app/api/test-server'; // 測試服務器
import { 
  normalizeGraphQLResponse, 
  normalizeRESTResponse,
  deepCompareObjects,
  validateDataStructure 
} from './helpers/response-comparators';

// GraphQL 查詢定義
const INVENTORY_ANALYSIS_QUERY = `
  query InventoryAnalysis($productType: String, $productCodes: [String!]) {
    inventoryAnalysis(productType: $productType, productCodes: $productCodes) {
      products {
        productCode
        description
        currentStock
        orderDemand
        remainingStock
        isSufficient
        fulfillmentRate
      }
      summary {
        totalStock
        totalDemand
        totalRemaining
        overallSufficient
        sufficientCount
        insufficientCount
      }
      metadata {
        calculationTime
        queryTime
        cacheHit
      }
    }
  }
`;

const HISTORY_TREE_QUERY = `
  query HistoryTree($limit: Int, $offset: Int) {
    historyTree(limit: $limit, offset: $offset) {
      nodes {
        id
        type
        timestamp
        description
        metadata
      }
      relationships {
        parent
        child
        type
      }
      pagination {
        total
        hasMore
        nextOffset
      }
    }
  }
`;

describe('🔄 GraphQL → REST API Migration Consistency Tests', () => {
  let graphqlClient: any;
  
  beforeAll(async () => {
    // 初始化 GraphQL 測試客戶端
    graphqlClient = createTestClient({
      typeDefs: ``, // GraphQL Schema placeholder
      resolvers: {} // GraphQL Resolvers placeholder
    });
  });

  afterAll(async () => {
    // 清理測試資源
  });

  describe('📊 InventoryOrderedAnalysisWidget Data Consistency', () => {
    const testCases = [
      {
        name: 'all_products_analysis',
        variables: {},
        restEndpoint: '/api/dashboard/widgets/inventory-analysis'
      },
      {
        name: 'electronics_products_filter',
        variables: { productType: 'Electronics' },
        restEndpoint: '/api/dashboard/widgets/inventory-analysis?productType=Electronics'
      },
      {
        name: 'specific_products_analysis',
        variables: { productCodes: ['PROD001', 'PROD002'] },
        restEndpoint: '/api/dashboard/widgets/inventory-analysis?productCodes=PROD001,PROD002'
      }
    ];

    testCases.forEach(testCase => {
      it(`${testCase.name} - should return identical data structure and values`, async () => {
        // 1. 執行 GraphQL 查詢
        const graphqlResult = await graphqlClient.query({
          query: INVENTORY_ANALYSIS_QUERY,
          variables: testCase.variables
        });

        // 2. 執行 REST API 請求
        const restResult = await request(app)
          .get(testCase.restEndpoint)
          .expect(200);

        // 3. 標準化回應格式
        const normalizedGraphQL = normalizeGraphQLResponse(graphqlResult.data.inventoryAnalysis);
        const normalizedREST = normalizeRESTResponse(restResult.body);

        // 4. 深度比較關鍵欄位
        expect(normalizedGraphQL.products).toHaveLength(normalizedREST.products.length);
        
        // 驗證每個產品的資料一致性
        normalizedGraphQL.products.forEach((graphqlProduct: any, index: number) => {
          const restProduct = normalizedREST.products[index];
          
          expect(graphqlProduct.productCode).toBe(restProduct.productCode);
          expect(graphqlProduct.currentStock).toBe(restProduct.currentStock);
          expect(graphqlProduct.orderDemand).toBe(restProduct.orderDemand);
          expect(graphqlProduct.remainingStock).toBe(restProduct.remainingStock);
          expect(graphqlProduct.isSufficient).toBe(restProduct.isSufficient);
          
          // 驗證浮點數精度 (滿足率計算)
          expect(Math.abs(graphqlProduct.fulfillmentRate - restProduct.fulfillmentRate)).toBeLessThan(0.01);
        });

        // 驗證匯總資料一致性
        expect(normalizedGraphQL.summary.totalStock).toBe(normalizedREST.summary.totalStock);
        expect(normalizedGraphQL.summary.totalDemand).toBe(normalizedREST.summary.totalDemand);
        expect(normalizedGraphQL.summary.totalRemaining).toBe(normalizedREST.summary.totalRemaining);
        expect(normalizedGraphQL.summary.overallSufficient).toBe(normalizedREST.summary.overallSufficient);
      });

      it(`${testCase.name} - should have acceptable performance difference`, async () => {
        const performanceThreshold = 500; // 500ms tolerance
        
        // 測量 GraphQL 執行時間
        const graphqlStart = Date.now();
        await graphqlClient.query({
          query: INVENTORY_ANALYSIS_QUERY,
          variables: testCase.variables
        });
        const graphqlDuration = Date.now() - graphqlStart;

        // 測量 REST API 執行時間
        const restStart = Date.now();
        await request(app).get(testCase.restEndpoint);
        const restDuration = Date.now() - restStart;

        // 驗證 REST API 性能不應明顯劣於 GraphQL
        const performanceDifference = restDuration - graphqlDuration;
        expect(performanceDifference).toBeLessThan(performanceThreshold);
        
        console.log(`📊 Performance Comparison for ${testCase.name}:
          GraphQL: ${graphqlDuration}ms
          REST: ${restDuration}ms  
          Difference: ${performanceDifference}ms`);
      });
    });
  });

  describe('🌳 HistoryTreeV2 Data Consistency', () => {
    const testCases = [
      {
        name: 'default_history_tree',
        variables: { limit: 50, offset: 0 },
        restEndpoint: '/api/dashboard/widgets/history-tree?limit=50&offset=0'
      },
      {
        name: 'paginated_history_tree',
        variables: { limit: 20, offset: 20 },
        restEndpoint: '/api/dashboard/widgets/history-tree?limit=20&offset=20'
      }
    ];

    testCases.forEach(testCase => {
      it(`${testCase.name} - should maintain tree structure integrity`, async () => {
        // 1. GraphQL 查詢
        const graphqlResult = await graphqlClient.query({
          query: HISTORY_TREE_QUERY,
          variables: testCase.variables
        });

        // 2. REST API 請求
        const restResult = await request(app)
          .get(testCase.restEndpoint)
          .expect(200);

        const graphqlData = graphqlResult.data.historyTree;
        const restData = restResult.body;

        // 驗證節點數量一致
        expect(graphqlData.nodes).toHaveLength(restData.nodes.length);
        
        // 驗證關係結構一致  
        expect(graphqlData.relationships).toHaveLength(restData.relationships.length);

        // 驗證分頁資訊
        expect(graphqlData.pagination.total).toBe(restData.pagination.total);
        expect(graphqlData.pagination.hasMore).toBe(restData.pagination.hasMore);

        // 驗證每個節點的資料結構
        graphqlData.nodes.forEach((graphqlNode: any, index: number) => {
          const restNode = restData.nodes[index];
          
          expect(graphqlNode.id).toBe(restNode.id);
          expect(graphqlNode.type).toBe(restNode.type);
          expect(graphqlNode.description).toBe(restNode.description);
          
          // 驗證時間戳格式一致性
          expect(new Date(graphqlNode.timestamp)).toEqual(new Date(restNode.timestamp));
        });
      });
    });
  });

  describe('🚨 Error Handling Consistency', () => {
    const errorTestCases = [
      {
        name: 'invalid_product_type',
        graphqlVariables: { productType: 'INVALID_TYPE' },
        restEndpoint: '/api/dashboard/widgets/inventory-analysis?productType=INVALID_TYPE',
        expectedErrorCode: 'INVALID_PRODUCT_TYPE'
      },
      {
        name: 'missing_required_params',
        graphqlVariables: null,
        restEndpoint: '/api/dashboard/widgets/inventory-analysis?invalidParam=true',
        expectedErrorCode: 'BAD_REQUEST'
      }
    ];

    errorTestCases.forEach(testCase => {
      it(`${testCase.name} - should return consistent error responses`, async () => {
        // GraphQL 錯誤處理
        let graphqlError: any;
        try {
          await graphqlClient.query({
            query: INVENTORY_ANALYSIS_QUERY,
            variables: testCase.graphqlVariables
          });
        } catch (error) {
          graphqlError = error;
        }

        // REST API 錯誤處理
        const restResult = await request(app)
          .get(testCase.restEndpoint)
          .expect(400);

        // 驗證錯誤格式一致性
        expect(graphqlError).toBeDefined();
        expect(restResult.body.error).toBeDefined();
        
        // 驗證錯誤代碼一致
        expect(graphqlError.extensions?.code).toBe(testCase.expectedErrorCode);
        expect(restResult.body.error.code).toBe(testCase.expectedErrorCode);
      });
    });
  });

  describe('💾 Caching Behavior Consistency', () => {
    it('should have consistent cache hit/miss behavior', async () => {
      const endpoint = '/api/dashboard/widgets/inventory-analysis';
      
      // 第一次請求 - 應該是 cache miss
      const firstResponse = await request(app).get(endpoint);
      const secondResponse = await request(app).get(endpoint);
      
      // 驗證快取標頭
      expect(firstResponse.headers['x-cache-status']).toBe('miss');
      expect(secondResponse.headers['x-cache-status']).toBe('hit');
      
      // 驗證快取資料一致性
      expect(firstResponse.body).toEqual(secondResponse.body);
    });

    it('should invalidate cache properly on data updates', async () => {
      const endpoint = '/api/dashboard/widgets/inventory-analysis';
      
      // 建立快取
      await request(app).get(endpoint);
      
      // 模擬資料更新
      await request(app)
        .post('/api/inventory/update')
        .send({ productCode: 'TEST001', stock: 999 });
      
      // 驗證快取失效
      const response = await request(app).get(endpoint);
      expect(response.headers['x-cache-status']).toBe('miss');
    });
  });
});

/**
 * 測試執行命令:
 * npm run test -- __tests__/migration/api-consistency.test.ts
 * 
 * CI/CD 整合:
 * - 每次 PR 自動執行
 * - 部署前必須通過所有測試
 * - 性能退化檢測自動告警
 */