/**
 * ProductCodeValidator 使用示例
 *
 * 本檔案展示了 ProductCodeValidator 的各種使用方式，
 * 包括基本驗證、批量處理、錯誤處理等實際應用場景。
 *
 * 注意：此檔案僅用於演示，實際使用時請根據需求調整。
 */

import ProductCodeValidator from '@/app/services/productCodeValidator';
import type { ValidationResult as _ValidationResult } from '@/app/services/productCodeValidator';
import { createLogger } from '@/lib/logger';

const exampleLogger = createLogger('ProductCodeValidatorExample');

/**
 * 基本使用示例
 */
export async function basicUsageExample(): Promise<void> {
  try {
    exampleLogger.info('Starting basic usage example');

    // 驗證單個產品代碼
    const singleResult = await ProductCodeValidator.validateAndEnrichCodes(['ABC123']);

    console.log('單個產品代碼驗證結果:', {
      productCode: singleResult.enrichedOrders[0].product_code,
      description: singleResult.enrichedOrders[0].product_desc,
      isValid: singleResult.enrichedOrders[0].is_valid,
      wasCorrected: singleResult.enrichedOrders[0].was_corrected,
    });

    // 驗證多個產品代碼
    const multipleResult = await ProductCodeValidator.validateAndEnrichCodes([
      'ABC123',
      'XYZ789',
      'INVALID001',
      'abc124', // 測試相似度匹配和大小寫處理
    ]);

    console.log('批量驗證摘要:', multipleResult.summary);

    multipleResult.enrichedOrders.forEach((order, index) => {
      console.log(`產品 ${index + 1}:`, {
        originalCode: order.original_code || order.product_code,
        validatedCode: order.product_code,
        description: order.product_desc,
        status: order.is_valid ? '有效' : '無效',
        corrected: order.was_corrected ? '已修正' : '未修正',
        confidence: order.confidence_score
          ? `${(order.confidence_score * 100).toFixed(1)}%`
          : 'N/A',
      });
    });
  } catch (error) {
    exampleLogger.error(error, 'Basic usage example failed');
  }
}

/**
 * 批量處理示例
 */
export async function batchProcessingExample(): Promise<void> {
  try {
    exampleLogger.info('Starting batch processing example');

    // 模擬從訂單系統獲取的產品代碼列表
    const orderCodes = [
      'ABC123',
      'XYZ789',
      'DEF456',
      'GHI789',
      'abc124',
      'xyz790',
      'invalid001',
      'test999',
      '',
      null,
      undefined,
      'GOOD001',
    ].filter(Boolean) as string[]; // 移除 null 和 undefined

    const result = await ProductCodeValidator.validateAndEnrichCodes(orderCodes);

    console.log('批量處理結果統計:');
    console.log(`總計: ${result.summary.total}`);
    console.log(
      `有效: ${result.summary.valid} (${((result.summary.valid / result.summary.total) * 100).toFixed(1)}%)`
    );
    console.log(
      `已修正: ${result.summary.corrected} (${((result.summary.corrected / result.summary.total) * 100).toFixed(1)}%)`
    );
    console.log(
      `無效: ${result.summary.invalid} (${((result.summary.invalid / result.summary.total) * 100).toFixed(1)}%)`
    );

    // 分析需要人工處理的項目
    const needsAttention = result.enrichedOrders.filter(
      order => !order.is_valid || order.was_corrected
    );

    if (needsAttention.length > 0) {
      console.log('\n需要注意的項目:');
      needsAttention.forEach(order => {
        if (!order.is_valid) {
          console.log(`❌ 無效代碼: "${order.original_code || order.product_code}"`);
        } else if (order.was_corrected) {
          console.log(
            `⚠️  已修正: "${order.original_code}" → "${order.product_code}" (信心度: ${(order.confidence_score! * 100).toFixed(1)}%)`
          );
        }
      });
    }
  } catch (error) {
    exampleLogger.error(error, 'Batch processing example failed');
  }
}

/**
 * 相似度匹配示例
 */
export async function similarityMatchingExample(): Promise<void> {
  try {
    exampleLogger.info('Starting similarity matching example');

    // 測試各種類型的錯誤和相似代碼
    const testCodes = [
      'ABC124', // 與 ABC123 相似 (最後一位不同)
      'ABC12', // 缺少字符
      'ABCD123', // 多餘字符
      'XYZ788', // 與 XYZ789 相似
      'abc123', // 大小寫問題
      'A BC123', // 包含空格
      'ABC-123', // 包含特殊字符
    ];

    for (const testCode of testCodes) {
      console.log(`\n測試代碼: "${testCode}"`);

      // 直接查找相似代碼
      const similarCodes = ProductCodeValidator.findSimilarCodes(testCode);

      if (similarCodes.length > 0) {
        console.log('找到相似代碼:');
        similarCodes.forEach((code, index) => {
          const similarity = ProductCodeValidator.calculateSimilarity(testCode, code.code);
          console.log(
            `  ${index + 1}. ${code.code} - ${code.description} (相似度: ${(similarity * 100).toFixed(1)}%)`
          );
        });
      } else {
        console.log('未找到相似代碼');
      }

      // 使用驗證器自動修正
      const result = await ProductCodeValidator.validateAndEnrichCodes([testCode]);
      const validated = result.enrichedOrders[0];

      console.log('自動驗證結果:', {
        是否有效: validated.is_valid ? '是' : '否',
        是否修正: validated.was_corrected ? '是' : '否',
        最終代碼: validated.product_code,
        描述: validated.product_desc,
      });
    }
  } catch (error) {
    exampleLogger.error(error, 'Similarity matching example failed');
  }
}

/**
 * 性能監控示例
 */
export async function performanceMonitoringExample(): Promise<void> {
  try {
    exampleLogger.info('Starting performance monitoring example');

    // 測試不同大小的批次
    const batchSizes = [1, 10, 25, 50, 100];

    for (const size of batchSizes) {
      const testCodes = Array(size)
        .fill(0)
        .map((_, i) => `TEST${i.toString().padStart(3, '0')}`);

      const startTime = Date.now();
      const result = await ProductCodeValidator.validateAndEnrichCodes(testCodes);
      const processingTime = Date.now() - startTime;

      console.log(`批次大小 ${size}:`, {
        處理時間: `${processingTime}ms`,
        平均每個: `${(processingTime / size).toFixed(2)}ms`,
        有效率: `${((result.summary.valid / result.summary.total) * 100).toFixed(1)}%`,
      });
    }

    // 測試快取性能
    console.log('\n快取性能測試:');
    const cacheTestCodes = ['ABC123', 'XYZ789', 'DEF456'];

    // 第一次調用 (冷快取)
    const coldStart = Date.now();
    await ProductCodeValidator.validateAndEnrichCodes(cacheTestCodes);
    const coldTime = Date.now() - coldStart;

    // 第二次調用 (熱快取)
    const warmStart = Date.now();
    await ProductCodeValidator.validateAndEnrichCodes(cacheTestCodes);
    const warmTime = Date.now() - warmStart;

    console.log(`冷快取: ${coldTime}ms`);
    console.log(`熱快取: ${warmTime}ms`);
    console.log(`性能提升: ${(((coldTime - warmTime) / coldTime) * 100).toFixed(1)}%`);

    // 顯示快取統計
    const cacheStats = ProductCodeValidator.getCacheStats();
    console.log('\n快取統計:', {
      快取大小: cacheStats.cacheSize,
      最大快取: cacheStats.maxCacheSize,
      產品總數: cacheStats.totalProductCodes,
      最後更新: new Date(cacheStats.lastRefresh).toLocaleString('zh-TW'),
    });
  } catch (error) {
    exampleLogger.error(error, 'Performance monitoring example failed');
  }
}

/**
 * 錯誤處理示例
 */
export async function errorHandlingExample(): Promise<void> {
  try {
    exampleLogger.info('Starting error handling example');

    // 測試各種錯誤情況
    const errorTests = [
      {
        name: '空陣列',
        test: () => ProductCodeValidator.validateAndEnrichCodes([]),
      },
      {
        name: '超大批次',
        test: () => ProductCodeValidator.validateAndEnrichCodes(Array(101).fill('ABC123')),
      },
      {
        name: '無效輸入類型',
        test: () => ProductCodeValidator.validateAndEnrichCodes(null as any), // Testing invalid input types intentionally
      },
    ];

    for (const errorTest of errorTests) {
      console.log(`\n測試: ${errorTest.name}`);
      try {
        const result = await errorTest.test();
        console.log('意外成功:', result.summary);
      } catch (error) {
        console.log('預期錯誤:', error instanceof Error ? error.message : '未知錯誤');
      }
    }

    // 測試降級策略（需要模擬數據庫故障）
    console.log('\n測試系統健康檢查:');
    const health = await ProductCodeValidator.healthCheck();
    console.log('系統狀態:', health.status);
    console.log('詳細信息:', health.details);
  } catch (error) {
    exampleLogger.error(error, 'Error handling example failed');
  }
}

/**
 * 實際應用場景示例：訂單處理
 */
export async function orderProcessingScenarioExample(): Promise<void> {
  try {
    exampleLogger.info('Starting order processing scenario example');

    // 模擬訂單數據
    interface OrderItem {
      id: string;
      productCode: string;
      quantity: number;
      unitPrice: number;
    }

    const orderItems: OrderItem[] = [
      { id: '001', productCode: 'ABC123', quantity: 10, unitPrice: 25.5 },
      { id: '002', productCode: 'xyz789', quantity: 5, unitPrice: 15.75 },
      { id: '003', productCode: 'INVALID001', quantity: 2, unitPrice: 30.0 },
      { id: '004', productCode: 'abc124', quantity: 8, unitPrice: 22.25 },
      { id: '005', productCode: '', quantity: 1, unitPrice: 10.0 },
    ];

    console.log('處理訂單項目...');

    // 提取產品代碼進行驗證
    const productCodes = orderItems.map(item => item.productCode);
    const validationResult = await ProductCodeValidator.validateAndEnrichCodes(productCodes);

    // 合併驗證結果到訂單項目
    interface EnrichedOrderItem extends OrderItem {
      validatedProductCode: string;
      productDescription: string;
      isValid: boolean;
      wasCorrected: boolean;
      confidenceScore?: number;
      totalValue: number;
    }

    const enrichedItems: EnrichedOrderItem[] = orderItems.map((item, index) => {
      const validation = validationResult.enrichedOrders[index];
      return {
        ...item,
        validatedProductCode: validation.product_code,
        productDescription: validation.product_desc,
        isValid: validation.is_valid,
        wasCorrected: validation.was_corrected,
        confidenceScore: validation.confidence_score,
        totalValue: item.quantity * item.unitPrice,
      };
    });

    // 分析處理結果
    const validItems = enrichedItems.filter(item => item.isValid);
    const correctedItems = enrichedItems.filter(item => item.wasCorrected);
    const invalidItems = enrichedItems.filter(item => !item.isValid);

    console.log('\n訂單處理結果:');
    console.log(`總項目: ${enrichedItems.length}`);
    console.log(`有效項目: ${validItems.length}`);
    console.log(`修正項目: ${correctedItems.length}`);
    console.log(`無效項目: ${invalidItems.length}`);

    if (correctedItems.length > 0) {
      console.log('\n已修正的項目:');
      correctedItems.forEach(item => {
        console.log(
          `- 項目 ${item.id}: "${item.productCode}" → "${item.validatedProductCode}" (信心度: ${(item.confidenceScore! * 100).toFixed(1)}%)`
        );
      });
    }

    if (invalidItems.length > 0) {
      console.log('\n需要人工處理的無效項目:');
      invalidItems.forEach(item => {
        console.log(
          `- 項目 ${item.id}: "${item.productCode}" - 總值: $${item.totalValue.toFixed(2)}`
        );
      });
    }

    // 計算訂單統計
    const totalOrderValue = enrichedItems.reduce((sum, item) => sum + item.totalValue, 0);
    const validOrderValue = validItems.reduce((sum, item) => sum + item.totalValue, 0);
    const problemOrderValue = totalOrderValue - validOrderValue;

    console.log('\n訂單價值分析:');
    console.log(`總訂單值: $${totalOrderValue.toFixed(2)}`);
    console.log(
      `有效項目值: $${validOrderValue.toFixed(2)} (${((validOrderValue / totalOrderValue) * 100).toFixed(1)}%)`
    );
    console.log(
      `問題項目值: $${problemOrderValue.toFixed(2)} (${((problemOrderValue / totalOrderValue) * 100).toFixed(1)}%)`
    );
  } catch (error) {
    exampleLogger.error(error, 'Order processing scenario example failed');
  }
}

/**
 * 執行所有示例
 */
export async function runAllExamples(): Promise<void> {
  console.log('='.repeat(80));
  console.log('ProductCodeValidator 使用示例');
  console.log('='.repeat(80));

  const examples = [
    { name: '基本使用', fn: basicUsageExample },
    { name: '批量處理', fn: batchProcessingExample },
    { name: '相似度匹配', fn: similarityMatchingExample },
    { name: '性能監控', fn: performanceMonitoringExample },
    { name: '錯誤處理', fn: errorHandlingExample },
    { name: '訂單處理場景', fn: orderProcessingScenarioExample },
  ];

  for (const example of examples) {
    console.log(`\n${'='.repeat(40)}`);
    console.log(`執行示例: ${example.name}`);
    console.log('='.repeat(40));

    try {
      await example.fn();
      console.log(`✅ ${example.name} 示例執行完成`);
    } catch (error) {
      console.error(`❌ ${example.name} 示例執行失敗:`, error);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('所有示例執行完成');
  console.log('='.repeat(80));
}

// 如果直接執行此檔案 (Node.js 環境)
if (typeof require !== 'undefined' && require.main === module) {
  runAllExamples().catch(console.error);
}
