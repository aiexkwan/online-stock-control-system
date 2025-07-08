# 數據分析系統改進計劃

## 執行摘要

基於 NewPennine 倉庫管理系統的 Analysis Theme，數據分析系統旨在提供深度業務洞察、預測分析同決策支援。現時系統已具備基礎分析功能，包括庫存周轉分析、用戶活動熱力圖、盤點準確性趨勢等。本計劃將大幅增強分析能力，引入機器學習、實時分析同自動化洞察功能。

## 最新更新 (2025-06-27)

### Stock Management 頁面改進
1. **Stock Distribution Widget 改造**
   - 從 Pie Chart 改為 Treemap 視覺化
   - 使用綠色系顯示正常庫存，紅色系顯示低庫存
   - 移除 header 和數據摘要，專注顯示圖表

2. **Stock Level History 新功能**
   - 取代原有的 Stock Alerts widget
   - 顯示多條產品線的庫存歷史趨勢
   - 根據 StockTypeSelector 的類型選擇自動更新
   - 12個時間段顯示，支援頁面時間選擇器

### Warehouse 頁面 Widget 數據計算分析

#### 1. Await Location Qty (等待位置數量)
- **數據來源**: `record_inventory` 表
- **計算方式**: 加總所有 `await` 欄位的值
- **更新頻率**: 實時數據，無需時間範圍

#### 2. Transfer Done (完成轉移)
- **數據來源**: `record_transfer` 表
- **計算方式**: 計算時間範圍內的記錄數量
- **預設值**: 昨天的轉移數量
- **趨勢分析**: 與今天比較顯示增減趨勢

#### 3. Still In Await (仍在等待)
- **數據來源**: `record_history`, `record_inventory`, `record_palletinfo`
- **計算方式**: 
  1. 查詢時間範圍內移到 'Await' 的棧板
  2. 檢查這些棧板現在是否還在 await 位置
  3. 計算仍在 await 的棧板產品數量總和
- **性能考慮**: 需要跨三個表查詢，可能影響性能

#### 4. Still In Await % (仍在等待百分比)
- **數據來源**: 同上
- **計算方式**: (仍在 await 的數量 / 移到 await 的總數量) × 100%
- **視覺化**: 進度條顯示

#### 5. Order Progress (訂單進度)
- **數據來源**: `data_order` 表
- **計算方式**: (已裝載數量 / 訂單數量) × 100%
- **狀態分類**: 完成(≥100%)、進行中(>0%)、待處理(0%)

#### 6. Transfer Time Distribution (轉移時間分布)
- **數據來源**: `record_transfer` 表
- **計算方式**: 將時間範圍分成12段，統計每段的轉移次數
- **視覺化**: 線形圖顯示活動分布

#### 7. Transfer List (轉移列表)
- **數據來源**: `record_transfer`, `data_id` 表
- **顯示內容**: 最近50條倉庫部門的轉移記錄
- **過濾條件**: 操作員部門為 'Warehouse'

#### 8. Work Level (工作水平)
- **數據來源**: `work_level`, `data_id` 表
- **計算方式**: 按日期分組統計倉庫部門的移動次數
- **視覺化**: 面積圖顯示每日工作量趨勢

### Supabase RPC Functions 清理成果

已成功刪除以下過時的 RPC functions：
- `generate_atomic_pallet_numbers_v5_with_cleanup`
- `test_atomic_pallet_generation_v2`
- `monitor_pallet_generation_performance_v2`

保留的核心 functions：
- `execute_sql_query` - Ask Database 功能
- `generate_atomic_pallet_numbers_v3` - 棧板號碼生成（QC用）
- `generate_atomic_pallet_numbers_v6` - 棧板號碼生成（GRN用）
- `search_pallet_optimized_v2` - 棧板搜尋
- `update_stock_level_void` - Void 操作

建議未來行動：
1. 刪除所有未使用的 buffer 相關函數
2. 評估物化視圖函數的必要性
3. 整合重複的函數

## 現狀分析

### 現有系統架構
```
app/admin/[theme]/page.tsx -> theme='analysis'
├── InventoryTurnoverAnalysis - 庫存周轉分析
├── UserActivityHeatmap - 用戶活動熱力圖
├── StocktakeAccuracyTrend - 盤點準確性趨勢
├── VoidRecordsAnalysis - 作廢記錄分析
├── TopProductsInventoryChart - 熱門產品庫存圖表
├── RealTimeInventoryMap - 實時庫存地圖
└── AnalyticsDashboardWidget - 分析儀表板
```

### 系統優勢
1. **全面數據覆蓋**: 涵蓋庫存、用戶行為、盤點、產品等多維度
2. **視覺化豐富**: 多種圖表類型展示分析結果
3. **實時更新**: 基於 GraphQL stable client 的即時數據
4. **互動性強**: 支援鑽取同篩選功能

### 現有問題

#### 1. 缺乏預測分析能力
```typescript
// 現有：只顯示歷史數據
const InventoryTurnoverAnalysis = () => {
  const { data } = useQuery(INVENTORY_TURNOVER_QUERY);
  return <TurnoverChart data={data} />;
};

// 缺乏：未來趨勢預測、異常檢測、智能建議
```

#### 2. 分析深度不足
- 冇根因分析功能
- 冇相關性分析
- 冇統計顯著性檢驗
- 冇多維度交叉分析

#### 3. 自動化程度低
- 冇自動化報告生成
- 冇異常自動告警
- 冇智能洞察推送
- 冇自適應分析模型

#### 4. 業務洞察有限
- 冇競爭分析功能
- 冇成本效益分析
- 冇風險評估模型
- 冇決策支援系統

## 改進目標

### 短期目標（1-2 個月）
1. **預測分析系統**：實現庫存需求預測、銷售趨勢預測
2. **異常檢測系統**：自動識別數據異常同業務異常
3. **深度分析工具**：提供根因分析、相關性分析功能
4. **自動化報告**：定期生成同分發分析報告

### 中期目標（3-6 個月）
1. **機器學習平台**：建立 ML 模型訓練同部署系統
2. **實時分析引擎**：處理實時數據流同即時分析
3. **商業智能工具**：提供 OLAP 分析同多維度數據探索
4. **決策支援系統**：基於數據分析的智能決策建議

### 長期目標（6-12 個月）
1. **AI 驅動洞察**：自動發現業務機會同風險
2. **預測性運營**：基於預測模型優化運營決策
3. **個性化分析**：為不同用戶提供定制化分析
4. **行業基準**：與行業標準比較同競爭分析

## 分階段實施計劃

### 第一階段：預測分析系統（4 週）

#### 1.1 庫存需求預測
```typescript
// 新增：InventoryDemandForecastWidget.tsx
export const InventoryDemandForecastWidget: React.FC = () => {
  const { data } = useGraphQLStable(DEMAND_FORECAST_QUERY);
  const [timeRange, setTimeRange] = useState('3months');
  const [product, setProduct] = useState<string>();
  
  return (
    <WidgetWrapper title="庫存需求預測">
      <div className="forecast-controls">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        <ProductSelector value={product} onChange={setProduct} />
      </div>
      
      <ForecastChart 
        data={data?.forecast}
        confidence={data?.confidence}
        seasonality={data?.seasonality}
      />
      
      <ForecastInsights insights={data?.insights} />
    </WidgetWrapper>
  );
};
```

#### 1.2 銷售趨勢預測
```typescript
// 新增：SalesTrendForecastWidget.tsx
export const SalesTrendForecastWidget: React.FC = () => {
  const { data } = useGraphQLStable(SALES_FORECAST_QUERY);
  
  return (
    <WidgetWrapper title="銷售趨勢預測">
      <SalesForecastChart data={data?.forecast} />
      <TrendAnalysis trends={data?.trends} />
      <SeasonalPatterns patterns={data?.seasonalPatterns} />
      <GrowthPredictions predictions={data?.growthPredictions} />
    </WidgetWrapper>
  );
};
```

#### 1.3 異常檢測系統
```typescript
// 新增：AnomalyDetectionWidget.tsx
export const AnomalyDetectionWidget: React.FC = () => {
  const { data } = useGraphQLStable(ANOMALY_DETECTION_QUERY);
  
  return (
    <WidgetWrapper title="異常檢測">
      <AnomalyTimeline anomalies={data?.anomalies} />
      <AnomalySeverityChart data={data?.severityData} />
      <AnomalyCategories categories={data?.categories} />
      <AnomalyRecommendations recommendations={data?.recommendations} />
    </WidgetWrapper>
  );
};
```

### 第二階段：深度分析工具（4 週）

#### 2.1 根因分析系統
```typescript
// 新增：RootCauseAnalysisWidget.tsx
export const RootCauseAnalysisWidget: React.FC = () => {
  const [selectedIssue, setSelectedIssue] = useState<string>();
  const { data } = useGraphQLStable(ROOT_CAUSE_QUERY, { 
    variables: { issueId: selectedIssue } 
  });
  
  return (
    <WidgetWrapper title="根因分析">
      <IssueSelector onSelect={setSelectedIssue} />
      <CauseEffectDiagram data={data?.fishboneData} />
      <CorrelationMatrix matrix={data?.correlations} />
      <CausalChain chain={data?.causalChain} />
      <ActionRecommendations actions={data?.recommendations} />
    </WidgetWrapper>
  );
};
```

#### 2.2 相關性分析工具
```typescript
// 新增：CorrelationAnalysisWidget.tsx
export const CorrelationAnalysisWidget: React.FC = () => {
  const { data } = useGraphQLStable(CORRELATION_ANALYSIS_QUERY);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  
  return (
    <WidgetWrapper title="相關性分析">
      <MetricSelector 
        metrics={data?.availableMetrics}
        selected={selectedMetrics}
        onChange={setSelectedMetrics}
      />
      <CorrelationHeatmap correlations={data?.correlations} />
      <ScatterPlotMatrix data={data?.scatterData} />
      <StatisticalSignificance stats={data?.significance} />
    </WidgetWrapper>
  );
};
```

#### 2.3 多維度分析工具
```typescript
// 新增：MultiDimensionalAnalysisWidget.tsx
export const MultiDimensionalAnalysisWidget: React.FC = () => {
  const [dimensions, setDimensions] = useState<string[]>(['time', 'product']);
  const { data } = useGraphQLStable(MULTI_DIM_ANALYSIS_QUERY, {
    variables: { dimensions }
  });
  
  return (
    <WidgetWrapper title="多維度分析">
      <DimensionSelector 
        dimensions={dimensions}
        onChange={setDimensions}
      />
      <PivotTable data={data?.pivotData} />
      <DrillDownChart data={data?.chartData} />
      <DimensionalInsights insights={data?.insights} />
    </WidgetWrapper>
  );
};
```

### 第三階段：機器學習平台（6 週）

#### 3.1 ML 模型管理系統
```typescript
// 新增：MLModelManagementWidget.tsx
export const MLModelManagementWidget: React.FC = () => {
  const { data } = useGraphQLStable(ML_MODELS_QUERY);
  
  return (
    <WidgetWrapper title="機器學習模型">
      <ModelList models={data?.models} />
      <ModelPerformance performance={data?.performance} />
      <ModelVersioning versions={data?.versions} />
      <ModelDeployment deployment={data?.deployment} />
    </WidgetWrapper>
  );
};
```

#### 3.2 自動化 ML 管道
```typescript
// 新增：AutoMLPipelineWidget.tsx
export const AutoMLPipelineWidget: React.FC = () => {
  const { data } = useGraphQLStable(AUTOML_PIPELINE_QUERY);
  
  return (
    <WidgetWrapper title="自動化機器學習">
      <PipelineStatus pipelines={data?.pipelines} />
      <FeatureEngineering features={data?.features} />
      <ModelSelection selection={data?.modelSelection} />
      <HyperparameterTuning tuning={data?.hyperparams} />
    </WidgetWrapper>
  );
};
```

#### 3.3 預測模型評估
```typescript
// 新增：PredictiveModelEvaluationWidget.tsx
export const PredictiveModelEvaluationWidget: React.FC = () => {
  const { data } = useGraphQLStable(MODEL_EVALUATION_QUERY);
  
  return (
    <WidgetWrapper title="預測模型評估">
      <AccuracyMetrics metrics={data?.accuracy} />
      <ConfusionMatrix matrix={data?.confusionMatrix} />
      <ROCCurve curve={data?.rocCurve} />
      <FeatureImportance importance={data?.featureImportance} />
    </WidgetWrapper>
  );
};
```

### 第四階段：商業智能系統（6 週）

#### 4.1 OLAP 分析工具
```typescript
// 新增：OLAPAnalysisWidget.tsx
export const OLAPAnalysisWidget: React.FC = () => {
  const [cube, setCube] = useState<string>('sales');
  const { data } = useGraphQLStable(OLAP_QUERY, { variables: { cube } });
  
  return (
    <WidgetWrapper title="OLAP 分析">
      <CubeSelector value={cube} onChange={setCube} />
      <DimensionHierarchy hierarchy={data?.hierarchy} />
      <MeasureSelector measures={data?.measures} />
      <PivotAnalysis data={data?.pivotData} />
    </WidgetWrapper>
  );
};
```

#### 4.2 決策支援系統
```typescript
// 新增：DecisionSupportWidget.tsx
export const DecisionSupportWidget: React.FC = () => {
  const { data } = useGraphQLStable(DECISION_SUPPORT_QUERY);
  
  return (
    <WidgetWrapper title="決策支援">
      <DecisionTree tree={data?.decisionTree} />
      <ScenarioAnalysis scenarios={data?.scenarios} />
      <WhatIfAnalysis whatIf={data?.whatIf} />
      <RecommendationEngine recommendations={data?.recommendations} />
    </WidgetWrapper>
  );
};
```

#### 4.3 業務洞察引擎
```typescript
// 新增：BusinessInsightsWidget.tsx
export const BusinessInsightsWidget: React.FC = () => {
  const { data } = useGraphQLStable(BUSINESS_INSIGHTS_QUERY);
  
  return (
    <WidgetWrapper title="業務洞察">
      <KeyInsights insights={data?.keyInsights} />
      <OpportunityIdentification opportunities={data?.opportunities} />
      <RiskAssessment risks={data?.risks} />
      <ActionableTasks tasks={data?.actionableTasks} />
    </WidgetWrapper>
  );
};
```

## 技術實現方案

### 數據倉庫架構
```sql
-- 分析數據倉庫設計
CREATE SCHEMA analytics;

-- 事實表：銷售數據
CREATE TABLE analytics.fact_sales (
  date_key INTEGER,
  product_key INTEGER,
  customer_key INTEGER,
  sales_amount DECIMAL(15,2),
  quantity INTEGER,
  cost DECIMAL(15,2)
);

-- 維度表：時間維度
CREATE TABLE analytics.dim_date (
  date_key INTEGER PRIMARY KEY,
  date_value DATE,
  year INTEGER,
  quarter INTEGER,
  month INTEGER,
  week INTEGER,
  day_of_week INTEGER
);

-- 預測結果表
CREATE TABLE analytics.predictions (
  id UUID PRIMARY KEY,
  model_name VARCHAR(100),
  prediction_date DATE,
  predicted_value DECIMAL(15,4),
  confidence_interval DECIMAL(5,4),
  actual_value DECIMAL(15,4)
);
```

### GraphQL Schema 擴展
```graphql
type ForecastResult {
  date: Date!
  predictedValue: Float!
  confidenceInterval: Float!
  seasonalComponent: Float
  trendComponent: Float
}

type AnomalyDetection {
  id: ID!
  timestamp: DateTime!
  metric: String!
  value: Float!
  expectedValue: Float!
  severity: AnomalySeverity!
  description: String
}

type CorrelationAnalysis {
  metric1: String!
  metric2: String!
  correlation: Float!
  pValue: Float!
  significant: Boolean!
}

type Query {
  demandForecast(productId: String, timeRange: String): [ForecastResult!]!
  detectAnomalies(metric: String, timeRange: String): [AnomalyDetection!]!
  correlationAnalysis(metrics: [String!]!): [CorrelationAnalysis!]!
}
```

### 機器學習管道
```typescript
// ML Pipeline 架構
export class MLPipeline {
  private models: Map<string, MLModel> = new Map();
  
  async trainModel(modelType: string, data: TrainingData): Promise<MLModel> {
    const model = new MLModel(modelType);
    await model.train(data);
    
    // 評估模型性能
    const evaluation = await this.evaluateModel(model, data.testSet);
    
    // 如果性能符合要求，部署模型
    if (evaluation.accuracy > 0.8) {
      await this.deployModel(model);
      this.models.set(modelType, model);
    }
    
    return model;
  }
  
  async predict(modelType: string, input: PredictionInput): Promise<Prediction> {
    const model = this.models.get(modelType);
    if (!model) {
      throw new Error(`Model ${modelType} not found`);
    }
    
    return await model.predict(input);
  }
  
  private async evaluateModel(model: MLModel, testData: TestData): Promise<Evaluation> {
    // 實施交叉驗證
    const crossValidation = await this.crossValidate(model, testData);
    
    return {
      accuracy: crossValidation.accuracy,
      precision: crossValidation.precision,
      recall: crossValidation.recall,
      f1Score: crossValidation.f1Score
    };
  }
}
```

### 實時分析引擎
```typescript
// 實時分析處理
export class RealTimeAnalyticsEngine {
  private streamProcessor: StreamProcessor;
  private alertingSystem: AlertingSystem;
  
  constructor() {
    this.streamProcessor = new StreamProcessor();
    this.alertingSystem = new AlertingSystem();
  }
  
  async processDataStream(stream: DataStream): Promise<void> {
    await this.streamProcessor.process(stream, {
      windowSize: '5min',
      aggregations: ['sum', 'avg', 'count'],
      anomalyDetection: true
    });
    
    // 檢測異常並發送告警
    const anomalies = await this.detectStreamAnomalies(stream);
    if (anomalies.length > 0) {
      await this.alertingSystem.sendAlerts(anomalies);
    }
  }
  
  private async detectStreamAnomalies(stream: DataStream): Promise<Anomaly[]> {
    // 實施統計異常檢測
    const statistical = await this.statisticalAnomalyDetection(stream);
    
    // 實施機器學習異常檢測
    const mlBased = await this.mlAnomalyDetection(stream);
    
    return [...statistical, ...mlBased];
  }
}
```

## 時間表和成果預期

### 第 1 個月：預測分析系統
**第 1-2 週**：
- 庫存需求預測模型開發
- 銷售趨勢預測系統
- 基礎異常檢測功能

**第 3-4 週**：
- 預測準確性優化
- 異常檢測規則調優
- 用戶界面完善

**預期成果**：
- 庫存預測準確率達到 75%
- 異常檢測召回率達到 85%
- 預測分析響應時間 < 3 秒

### 第 2 個月：深度分析工具
**第 5-6 週**：
- 根因分析系統開發
- 相關性分析工具
- 統計檢驗功能

**第 7-8 週**：
- 多維度分析工具
- 交互式數據探索
- 分析結果可視化

**預期成果**：
- 根因分析準確率達到 80%
- 支援 10+ 維度交叉分析
- 分析結果解釋性提升 60%

### 第 3-4 個月：機器學習平台
**第 9-14 週**：
- ML 模型管理系統
- 自動化訓練管道
- 模型性能監控

**預期成果**：
- 支援 5+ 種 ML 算法
- 模型部署自動化率 90%
- 模型準確率平均提升 20%

### 第 5-6 個月：商業智能系統
**第 15-20 週**：
- OLAP 分析工具
- 決策支援系統
- 業務洞察引擎

**預期成果**：
- 支援複雜 OLAP 查詢
- 決策支援準確率 85%
- 業務洞察自動生成

## 風險評估和緩解策略

### 技術風險

#### 1. 數據質量挑戰
**風險**：數據不完整或不準確影響分析結果
**緩解策略**：
```typescript
// 數據質量監控系統
class DataQualityMonitor {
  async validateData(data: Dataset): Promise<QualityReport> {
    const completeness = this.checkCompleteness(data);
    const accuracy = this.checkAccuracy(data);
    const consistency = this.checkConsistency(data);
    
    return {
      completeness,
      accuracy,
      consistency,
      overallScore: (completeness + accuracy + consistency) / 3
    };
  }
}
```

#### 2. 模型過擬合風險
**風險**：機器學習模型在新數據上表現不佳
**緩解策略**：
- 實施交叉驗證
- 使用正則化技術
- 建立模型監控系統

#### 3. 計算資源限制
**風險**：大數據分析消耗過多資源
**緩解策略**：
- 實施分散式計算
- 使用緩存優化
- 建立資源調度系統

### 業務風險

#### 1. 用戶採用率低
**風險**：業務用戶不使用新分析功能
**緩解策略**：
- 提供用戶培訓
- 設計直觀界面
- 建立使用激勵機制

#### 2. 分析結果誤解
**風險**：用戶誤解分析結果導致錯誤決策
**緩解策略**：
- 提供詳細解釋文檔
- 建立分析結果驗證機制
- 提供專家諮詢支援

### 合規風險

#### 1. 數據隱私保護
**風險**：分析過程中數據隱私洩露
**緩解策略**：
- 實施數據去識別化
- 建立訪問控制機制
- 遵循 GDPR 等法規

#### 2. 算法公平性
**風險**：ML 模型存在偏見
**緩解策略**：
- 實施公平性檢測
- 使用多樣化訓練數據
- 定期進行偏見審計

## 成功指標和KPI

### 系統性能指標
- **查詢響應時間**：目標 < 3 秒
- **系統可用性**：目標 99.9%
- **數據處理吞吐量**：目標 10K records/sec
- **並發用戶支援**：目標 100+ 用戶

### 分析準確性指標
- **預測準確率**：目標 85%
- **異常檢測準確率**：目標 90%
- **根因分析準確率**：目標 80%
- **模型性能穩定性**：目標 95%

### 業務價值指標
- **決策速度提升**：目標 50%
- **分析效率提升**：目標 70%
- **業務洞察質量**：目標 4.5/5
- **成本節約**：目標 25%

### 用戶體驗指標
- **用戶滿意度**：目標 > 4.0/5
- **功能採用率**：目標 80%
- **用戶留存率**：目標 90%
- **支援請求減少**：目標 40%

## 持續優化機制

### 自動化模型更新
```typescript
// 自動模型重訓練系統
class ModelUpdateScheduler {
  async scheduleModelUpdate(modelId: string, schedule: UpdateSchedule): Promise<void> {
    const scheduler = new CronScheduler();
    
    scheduler.schedule(schedule.cron, async () => {
      const newData = await this.getNewTrainingData(modelId);
      const updatedModel = await this.retrainModel(modelId, newData);
      
      if (updatedModel.performance > this.getCurrentModel(modelId).performance) {
        await this.deployModel(updatedModel);
      }
    });
  }
}
```

### 分析結果反饋循環
```typescript
// 分析反饋系統
class AnalyticsFeedbackLoop {
  async collectFeedback(analysisId: string, feedback: UserFeedback): Promise<void> {
    await this.storeFeedback(analysisId, feedback);
    
    // 基於反饋改進分析模型
    if (feedback.rating < 3) {
      await this.flagForReview(analysisId);
      await this.improveAnalysisModel(analysisId, feedback);
    }
  }
}
```

## 結論

數據分析系統改進計劃將通過四個階段的系統性升級，建立一個完整的智能分析平台。從基礎的預測分析到高級的機器學習同商業智能，預期能夠：

1. **提升分析能力 300%**
2. **改善決策質量 50%**
3. **增強業務洞察深度 200%**
4. **實現預測性分析**
5. **建立自動化洞察發現**

成功實施後，NewPennine 數據分析系統將成為業界領先的智能分析平台，為企業決策提供強大的數據支援同洞察能力。