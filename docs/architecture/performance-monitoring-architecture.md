# 性能監控系統架構設計

## 架構概述

基於現有 SimplePerformanceMonitor 的分析，設計了一個模塊化、可擴展的性能監控系統架構，遵循 SOLID 原則和現代軟件工程最佳實踐。

## 核心架構原則

### 1. 單一職責原則 (SRP)
- **MetricsCollector**: 專門收集指標數據
- **StatisticsCalculator**: 專門計算統計數據
- **AlertManager**: 專門處理警報邏輯
- **WebVitalsMonitor**: 專門監控 Web Vitals
- **PerformanceBudgetValidator**: 專門驗證性能預算

### 2. 開放封閉原則 (OCP)
- Strategy 模式支持不同的指標收集策略
- Observer 模式支持多種警報通知方式
- 插件系統支持自定義指標類型

### 3. 依賴倒置原則 (DIP)
- 定義抽象接口，具體實現依賴於抽象
- 使用依賴注入管理組件間的依賴關係

## 系統架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard UI  │  Reports UI  │  Alerts UI  │  Admin UI        │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  Performance  │  WebVitals   │  Budget      │  Alert           │
│  Service      │  Service     │  Service     │  Service         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Domain Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  Metrics      │  Statistics  │  Budgets     │  Alerts          │
│  Domain       │  Domain      │  Domain      │  Domain          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  Data Storage │  Event Bus   │  Cache       │  External APIs   │
│  (TimeSeries) │  (EventEmitter)│ (Redis)    │  (Monitoring)    │
└─────────────────────────────────────────────────────────────────┘
```

## 模塊化設計

### Core Module (核心模塊)
```typescript
// 核心接口定義
interface IMetricsCollector {
  collect(metric: MetricData): Promise<void>;
  subscribe(observer: IMetricsObserver): void;
  unsubscribe(observer: IMetricsObserver): void;
}

interface IStatisticsCalculator {
  calculateBasicStats(metrics: MetricData[]): BasicStats;
  calculateAdvancedStats(metrics: MetricData[]): AdvancedStats;
  calculateTrends(metrics: MetricData[], timeRange: TimeRange): TrendAnalysis;
}

interface IAlertManager {
  addRule(rule: AlertRule): void;
  evaluateRules(metrics: MetricData[]): Alert[];
  notify(alert: Alert): Promise<void>;
}

// 核心實現
class MetricsCollector implements IMetricsCollector {
  private observers: IMetricsObserver[] = [];
  private strategy: ICollectionStrategy;
  
  constructor(strategy: ICollectionStrategy) {
    this.strategy = strategy;
  }
  
  async collect(metric: MetricData): Promise<void> {
    const processedMetric = await this.strategy.process(metric);
    this.notifyObservers(processedMetric);
  }
  
  private notifyObservers(metric: MetricData): void {
    this.observers.forEach(observer => observer.onMetricCollected(metric));
  }
}
```

### WebVitals Module (Web Vitals 模塊)
```typescript
// Web Vitals 專門監控
class WebVitalsMonitor implements IMetricsCollector {
  private coreVitalsCollector: CoreWebVitalsCollector;
  private additionalMetricsCollector: AdditionalMetricsCollector;
  
  constructor() {
    this.coreVitalsCollector = new CoreWebVitalsCollector();
    this.additionalMetricsCollector = new AdditionalMetricsCollector();
  }
  
  async collect(metric: MetricData): Promise<void> {
    if (this.isCoreVital(metric)) {
      await this.coreVitalsCollector.collect(metric);
    } else {
      await this.additionalMetricsCollector.collect(metric);
    }
  }
  
  private isCoreVital(metric: MetricData): boolean {
    return ['LCP', 'FID', 'CLS'].includes(metric.name);
  }
}

// Core Web Vitals 收集器
class CoreWebVitalsCollector {
  private lcpCollector: LCPCollector;
  private fidCollector: FIDCollector;
  private clsCollector: CLSCollector;
  
  constructor() {
    this.lcpCollector = new LCPCollector();
    this.fidCollector = new FIDCollector();
    this.clsCollector = new CLSCollector();
  }
  
  async collect(metric: MetricData): Promise<void> {
    switch (metric.name) {
      case 'LCP':
        await this.lcpCollector.collect(metric);
        break;
      case 'FID':
        await this.fidCollector.collect(metric);
        break;
      case 'CLS':
        await this.clsCollector.collect(metric);
        break;
    }
  }
}
```

### Budget Module (性能預算模塊)
```typescript
// 性能預算驗證系統
class PerformanceBudgetValidator {
  private budgetConfiguration: BudgetConfiguration;
  private validationEngine: ValidationEngine;
  
  constructor(config: BudgetConfiguration) {
    this.budgetConfiguration = config;
    this.validationEngine = new ValidationEngine();
  }
  
  async validate(metrics: MetricData[]): Promise<ValidationResult> {
    const budgets = await this.budgetConfiguration.getBudgets();
    const results = await Promise.all(
      budgets.map(budget => this.validationEngine.validate(budget, metrics))
    );
    
    return this.aggregateResults(results);
  }
  
  private aggregateResults(results: BudgetValidationResult[]): ValidationResult {
    const failed = results.filter(r => !r.passed);
    const passed = results.filter(r => r.passed);
    
    return {
      overall: failed.length === 0,
      passed: passed.length,
      failed: failed.length,
      details: results
    };
  }
}

// 預算配置管理
class BudgetConfiguration {
  private budgets: Map<string, Budget> = new Map();
  
  addBudget(name: string, budget: Budget): void {
    this.budgets.set(name, budget);
  }
  
  getBudget(name: string): Budget | undefined {
    return this.budgets.get(name);
  }
  
  getAllBudgets(): Budget[] {
    return Array.from(this.budgets.values());
  }
}
```

### Alert Module (警報模塊)
```typescript
// 警報管理系統
class AlertManager implements IAlertManager {
  private rules: AlertRule[] = [];
  private notifiers: INotifier[] = [];
  
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }
  
  evaluateRules(metrics: MetricData[]): Alert[] {
    const alerts: Alert[] = [];
    
    for (const rule of this.rules) {
      const evaluation = rule.evaluate(metrics);
      if (evaluation.triggered) {
        alerts.push(evaluation.alert);
      }
    }
    
    return alerts;
  }
  
  async notify(alert: Alert): Promise<void> {
    await Promise.all(
      this.notifiers.map(notifier => notifier.notify(alert))
    );
  }
}

// 警報規則
abstract class AlertRule {
  constructor(
    public name: string,
    public threshold: number,
    public severity: AlertSeverity
  ) {}
  
  abstract evaluate(metrics: MetricData[]): RuleEvaluation;
}

class ThresholdRule extends AlertRule {
  constructor(
    name: string,
    private metricName: string,
    threshold: number,
    severity: AlertSeverity
  ) {
    super(name, threshold, severity);
  }
  
  evaluate(metrics: MetricData[]): RuleEvaluation {
    const relevantMetrics = metrics.filter(m => m.name === this.metricName);
    const latestValue = relevantMetrics[relevantMetrics.length - 1]?.value;
    
    const triggered = latestValue > this.threshold;
    
    return {
      triggered,
      alert: triggered ? new Alert(
        this.name,
        `${this.metricName} exceeded threshold: ${latestValue} > ${this.threshold}`,
        this.severity,
        new Date()
      ) : null
    };
  }
}
```

## 數據流架構

### 1. 數據收集流程
```
Browser APIs → Web Vitals → MetricsCollector → EventBus → Processing Pipeline
                    │
                    ▼
            Statistics Calculator → Storage → Dashboard
                    │
                    ▼
              Alert Manager → Notifications
```

### 2. 處理管道
```typescript
class MetricsProcessingPipeline {
  private stages: IProcessingStage[] = [];
  
  addStage(stage: IProcessingStage): void {
    this.stages.push(stage);
  }
  
  async process(metrics: MetricData[]): Promise<MetricData[]> {
    let result = metrics;
    
    for (const stage of this.stages) {
      result = await stage.process(result);
    }
    
    return result;
  }
}

// 處理階段接口
interface IProcessingStage {
  process(metrics: MetricData[]): Promise<MetricData[]>;
}

// 數據清理階段
class DataCleaningStage implements IProcessingStage {
  async process(metrics: MetricData[]): Promise<MetricData[]> {
    return metrics.filter(metric => this.isValid(metric));
  }
  
  private isValid(metric: MetricData): boolean {
    return metric.value >= 0 && metric.timestamp > 0;
  }
}

// 數據聚合階段
class DataAggregationStage implements IProcessingStage {
  async process(metrics: MetricData[]): Promise<MetricData[]> {
    // 按時間窗口聚合數據
    const aggregated = this.aggregateByTimeWindow(metrics, 60000); // 1分鐘
    return aggregated;
  }
  
  private aggregateByTimeWindow(metrics: MetricData[], windowMs: number): MetricData[] {
    // 實現時間窗口聚合邏輯
    return metrics; // 簡化實現
  }
}
```

## 系統整合架構

### 1. 與現有系統整合
```typescript
// 與 Widget 系統整合
class WidgetPerformanceIntegration {
  private performanceMonitor: PerformanceMonitor;
  
  constructor(monitor: PerformanceMonitor) {
    this.performanceMonitor = monitor;
  }
  
  instrumentWidget(widgetId: string): WidgetInstrumentation {
    return new WidgetInstrumentation(widgetId, this.performanceMonitor);
  }
}

class WidgetInstrumentation {
  private timer: PerformanceTimer;
  
  constructor(
    private widgetId: string,
    private monitor: PerformanceMonitor
  ) {}
  
  startMonitoring(): void {
    this.timer = this.monitor.startTimer(this.widgetId);
  }
  
  recordLoadTime(): void {
    this.timer.recordLoadTime();
  }
  
  recordRenderTime(): void {
    this.timer.recordRenderTime();
  }
  
  complete(): void {
    this.timer.complete();
  }
}
```

### 2. API 設計
```typescript
// RESTful API 設計
@Controller('/api/performance')
class PerformanceController {
  constructor(private performanceService: PerformanceService) {}
  
  @Get('/metrics')
  async getMetrics(@Query() query: MetricsQuery): Promise<MetricData[]> {
    return await this.performanceService.getMetrics(query);
  }
  
  @Post('/metrics')
  async recordMetric(@Body() metric: MetricData): Promise<void> {
    await this.performanceService.recordMetric(metric);
  }
  
  @Get('/stats/:metricName')
  async getStats(@Param('metricName') metricName: string): Promise<StatisticsResult> {
    return await this.performanceService.getStatistics(metricName);
  }
  
  @Get('/alerts')
  async getAlerts(): Promise<Alert[]> {
    return await this.performanceService.getAlerts();
  }
}

// GraphQL API 設計
@Resolver(Metric)
class MetricResolver {
  constructor(private performanceService: PerformanceService) {}
  
  @Query(() => [Metric])
  async metrics(
    @Args('filter') filter: MetricFilter,
    @Args('timeRange') timeRange: TimeRange
  ): Promise<Metric[]> {
    return await this.performanceService.getMetrics(filter, timeRange);
  }
  
  @Mutation(() => Boolean)
  async recordMetric(@Args('metric') metric: MetricInput): Promise<boolean> {
    await this.performanceService.recordMetric(metric);
    return true;
  }
}
```

## 部署架構

### 1. 微服務架構
```yaml
# docker-compose.yml
version: '3.8'
services:
  performance-collector:
    image: performance-collector:latest
    environment:
      - REDIS_URL=redis://redis:6379
      - POSTGRES_URL=postgresql://postgres:5432/metrics
    depends_on:
      - redis
      - postgres

  performance-analyzer:
    image: performance-analyzer:latest
    environment:
      - REDIS_URL=redis://redis:6379
      - POSTGRES_URL=postgresql://postgres:5432/metrics
    depends_on:
      - redis
      - postgres

  alert-manager:
    image: alert-manager:latest
    environment:
      - REDIS_URL=redis://redis:6379
      - NOTIFICATION_WEBHOOKS=http://webhook-service:3000
    depends_on:
      - redis

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=metrics
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
```

### 2. 監控和健康檢查
```typescript
// 健康檢查服務
@Injectable()
class HealthCheckService {
  constructor(
    private metricsCollector: MetricsCollector,
    private alertManager: AlertManager,
    private database: DatabaseService
  ) {}
  
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkMetricsCollector(),
      this.checkAlertManager(),
      this.checkDatabase()
    ]);
    
    return {
      overall: checks.every(check => check.healthy),
      components: checks
    };
  }
  
  private async checkMetricsCollector(): Promise<ComponentHealth> {
    try {
      const isResponding = await this.metricsCollector.ping();
      return { name: 'metrics-collector', healthy: isResponding };
    } catch (error) {
      return { name: 'metrics-collector', healthy: false, error: error.message };
    }
  }
}
```

## 配置管理

### 1. 統一配置系統
```typescript
// 配置管理
interface PerformanceConfig {
  collector: {
    enabled: boolean;
    batchSize: number;
    flushInterval: number;
    maxMemoryUsage: number;
  };
  webVitals: {
    enabled: boolean;
    sampleRate: number;
    thresholds: {
      LCP: number;
      FID: number;
      CLS: number;
    };
  };
  alerts: {
    enabled: boolean;
    notifiers: NotifierConfig[];
    rules: AlertRuleConfig[];
  };
  budget: {
    enabled: boolean;
    budgets: BudgetConfig[];
  };
}

class ConfigManager {
  private config: PerformanceConfig;
  
  constructor(configPath: string) {
    this.loadConfig(configPath);
  }
  
  private loadConfig(path: string): void {
    // 載入配置邏輯
  }
  
  getConfig(): PerformanceConfig {
    return this.config;
  }
  
  updateConfig(updates: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...updates };
    this.notifyConfigChange();
  }
}
```

## 性能優化策略

### 1. 數據採樣和聚合
```typescript
// 採樣策略
class SamplingStrategy {
  private sampleRate: number = 0.1; // 10% 採樣率
  
  shouldSample(metric: MetricData): boolean {
    return Math.random() < this.sampleRate;
  }
  
  setSampleRate(rate: number): void {
    this.sampleRate = Math.max(0, Math.min(1, rate));
  }
}

// 數據聚合
class MetricsAggregator {
  private buffer: MetricData[] = [];
  private flushInterval: number = 60000; // 1分鐘
  
  constructor() {
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  add(metric: MetricData): void {
    this.buffer.push(metric);
  }
  
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const aggregated = this.aggregate(this.buffer);
    await this.store(aggregated);
    
    this.buffer = [];
  }
  
  private aggregate(metrics: MetricData[]): AggregatedMetric[] {
    // 實現數據聚合邏輯
    return [];
  }
}
```

### 2. 緩存策略
```typescript
// 緩存管理
class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number = 300000; // 5分鐘
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value as T;
  }
  
  set<T>(key: string, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
}
```

## 遷移策略

### 1. 向後兼容性
```typescript
// 向後兼容的適配器
class LegacyPerformanceAdapter {
  private newMonitor: PerformanceMonitor;
  
  constructor(monitor: PerformanceMonitor) {
    this.newMonitor = monitor;
  }
  
  // 保持舊 API 兼容
  recordMetric(name: string, value: number, category?: string): void {
    this.newMonitor.collect({
      name,
      value,
      category: category || 'general',
      timestamp: Date.now(),
      tags: {}
    });
  }
  
  getBasicStats(metricName: string): SimpleStats | null {
    // 轉換新 API 結果為舊格式
    const stats = this.newMonitor.getStatistics(metricName);
    return this.convertToLegacyStats(stats);
  }
}
```

### 2. 漸進式遷移
```typescript
// 特性開關
class FeatureToggle {
  private features: Map<string, boolean> = new Map();
  
  isEnabled(feature: string): boolean {
    return this.features.get(feature) || false;
  }
  
  enable(feature: string): void {
    this.features.set(feature, true);
  }
  
  disable(feature: string): void {
    this.features.set(feature, false);
  }
}

// 混合模式監控
class HybridPerformanceMonitor {
  private legacyMonitor: SimplePerformanceMonitor;
  private newMonitor: PerformanceMonitor;
  private featureToggle: FeatureToggle;
  
  constructor(
    legacyMonitor: SimplePerformanceMonitor,
    newMonitor: PerformanceMonitor,
    featureToggle: FeatureToggle
  ) {
    this.legacyMonitor = legacyMonitor;
    this.newMonitor = newMonitor;
    this.featureToggle = featureToggle;
  }
  
  recordMetric(name: string, value: number, category?: string): void {
    if (this.featureToggle.isEnabled('new-monitoring')) {
      this.newMonitor.collect({
        name,
        value,
        category: category || 'general',
        timestamp: Date.now(),
        tags: {}
      });
    } else {
      this.legacyMonitor.recordMetric(name, value, category);
    }
  }
}
```

## 總結

這個架構設計提供了：

1. **模塊化架構**: 符合 SOLID 原則，易於維護和擴展
2. **Web Vitals 專門支持**: 完整的 Web Vitals 監控能力
3. **性能預算系統**: 多維度的性能預算驗證
4. **事件驅動**: 低耦合的組件通信
5. **微服務支持**: 可獨立部署和擴展
6. **向後兼容**: 漸進式遷移策略
7. **高性能**: 採樣、聚合、緩存等優化策略

該架構既保持了現有系統的簡潔性，又提供了企業級的可擴展性和可維護性。