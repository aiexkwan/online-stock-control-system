# SearchCard Architecture Design Document

> 📋 **Document Type**: Technical Architecture Design  
> 📅 **Date**: 2025-07-24  
> 🎯 **Status**: Architecture Complete - Ready for Implementation  
> 👥 **Target Audience**: Development Team, System Architects, Technical Leads  

## 架構概述

SearchCard 是 NewPennine WMS 系統統一搜索介面的核心組件，採用現代化的 React + GraphQL 架構，整合全系統 76 個數據表格的搜索能力，提供智能、高性能、用戶友好的搜索體驗。

## 1. 系統架構設計

### 1.1 整體架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    SearchCard 用戶界面層                      │
├─────────────────────────────────────────────────────────────┤
│  SearchInput │ FilterPanel │ ResultDisplay │ ActionBar      │
├─────────────────────────────────────────────────────────────┤
│                    組件狀態管理層                             │
├─────────────────────────────────────────────────────────────┤
│  Apollo Client │ React Query │ State Management │ Cache     │
├─────────────────────────────────────────────────────────────┤
│                    GraphQL API 層                           │
├─────────────────────────────────────────────────────────────┤
│  Search Resolver │ Data Loaders │ Schema │ Directives       │
├─────────────────────────────────────────────────────────────┤
│                    業務邏輯層                                │
├─────────────────────────────────────────────────────────────┤
│  Search Engine │ Index Manager │ Analytics │ Suggestions    │
├─────────────────────────────────────────────────────────────┤
│                    數據存取層                                │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL │ Full-text Search │ Redis Cache │ Elasticsearch│
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心組件架構

#### **SearchCard 主組件結構**

```typescript
// SearchCard 組件架構
interface SearchCardArchitecture {
  // 核心組件
  components: {
    SearchCard: ReactComponent           // 主容器組件
    SearchInput: ReactComponent         // 搜索輸入組件
    FilterPanel: ReactComponent        // 過濾器面板
    ResultDisplay: ReactComponent      // 結果顯示組件
    SuggestionList: ReactComponent     // 建議列表組件
    ActionBar: ReactComponent          // 操作欄組件
  }
  
  // 子組件
  subComponents: {
    SearchTypeSelector: ReactComponent  // 搜索類型選擇器
    EntityFilter: ReactComponent       // 實體過濾器
    DateRangePicker: ReactComponent    // 日期範圍選擇器
    QuantityRangeSlider: ReactComponent // 數量範圍滑塊
    LocationSelector: ReactComponent   // 位置選擇器
    ResultCard: ReactComponent         // 結果卡片
    PaginationControl: ReactComponent  // 分頁控制
    ExportButton: ReactComponent       // 導出按鈕
    SaveSearchButton: ReactComponent   // 保存搜索按鈕
  }
  
  // 功能模組
  modules: {
    SearchEngine: SearchEngineModule    // 搜索引擎模組
    FilterManager: FilterManagerModule  // 過濾器管理模組
    ResultProcessor: ResultProcessorModule // 結果處理模組
    SuggestionEngine: SuggestionEngineModule // 建議引擎模組
    AnalyticsTracker: AnalyticsTrackerModule // 分析追蹤模組
  }
}
```

## 2. 組件設計詳細規格

### 2.1 SearchCard 主組件設計

```typescript
// SearchCard 主組件介面
interface SearchCardProps {
  // 基本配置
  mode?: SearchMode                      // 搜索模式 (global | entity | mixed)
  defaultEntities?: SearchableEntity[]   // 默認搜索實體
  layout?: 'compact' | 'full' | 'modal'  // 佈局模式
  
  // 功能開關
  enableAdvancedFilters?: boolean        // 啟用高級過濾器
  enableSavedSearches?: boolean          // 啟用保存搜索
  enableBarcodeScan?: boolean            // 啟用條碼掃描
  enableExport?: boolean                 // 啟用導出功能
  enableRealTimeSearch?: boolean         // 啟用實時搜索
  
  // 外觀配置
  placeholder?: string                   // 輸入框佔位符
  theme?: 'light' | 'dark' | 'auto'     // 主題模式
  className?: string                     // 自定義樣式類
  
  // 事件回調
  onSearchResult?: (results: SearchResult[]) => void
  onEntitySelect?: (entity: SearchableEntity, result: any) => void
  onFilterChange?: (filters: SearchFilters) => void
  onError?: (error: Error) => void
}

// SearchCard 狀態管理
interface SearchCardState {
  // 搜索狀態
  query: string                          // 當前查詢
  isSearching: boolean                   // 是否正在搜索
  results: SearchResult[]                // 搜索結果
  suggestions: SearchSuggestion[]        // 搜索建議
  
  // 過濾器狀態
  selectedEntities: SearchableEntity[]   // 選中的實體
  activeFilters: SearchFilters           // 啟用的過濾器
  dateRange: DateRange                   // 日期範圍
  
  // UI 狀態
  showFilters: boolean                   // 顯示過濾器面板
  showSuggestions: boolean              // 顯示建議列表
  resultViewMode: 'list' | 'grid' | 'table' // 結果顯示模式
  
  // 錯誤狀態
  error: Error | null                    // 錯誤信息
  loading: boolean                       // 載入狀態
}
```

### 2.2 SearchInput 組件設計

```typescript
// SearchInput 組件功能
interface SearchInputFeatures {
  // 輸入功能
  textInput: {
    placeholder: string                  // 動態佔位符
    autoComplete: boolean               // 自動完成
    spellCheck: boolean                 // 拼寫檢查
    debounceMs: number                  // 防抖時間
  }
  
  // 搜索類型檢測
  typeDetection: {
    enableAutoDetect: boolean           // 啟用自動檢測
    patterns: SearchPattern[]           // 搜索模式
    confidence: number                  // 檢測置信度
  }
  
  // 條碼掃描
  barcodeScanning: {
    enableScanner: boolean              // 啟用掃描器
    supportedFormats: BarcodeFormat[]   // 支持的格式
    autoSubmit: boolean                 // 自動提交
  }
  
  // 語音搜索 (可選)
  voiceSearch: {
    enableVoice: boolean                // 啟用語音
    language: string                    // 語言設定
    continuous: boolean                 // 連續識別
  }
}
```

### 2.3 FilterPanel 組件設計

```typescript
// FilterPanel 組件結構
interface FilterPanelStructure {
  // 實體選擇器
  entitySelector: {
    multiSelect: boolean                // 多選支持
    grouping: boolean                  // 分組顯示
    searchable: boolean                // 可搜索
    defaultSelected: SearchableEntity[] // 默認選中
  }
  
  // 通用過濾器
  commonFilters: {
    dateRange: DateRangeFilter         // 日期範圍
    status: StatusFilter               // 狀態過濾
    location: LocationFilter           // 位置過濾
    quantity: QuantityRangeFilter      // 數量範圍
  }
  
  // 實體特定過濾器
  entityFilters: {
    product: ProductFilters            // 產品過濾器
    pallet: PalletFilters             // 托盤過濾器
    inventory: InventoryFilters       // 庫存過濾器
    order: OrderFilters               // 訂單過濾器
    user: UserFilters                 // 用戶過濾器
  }
  
  // 高級過濾器
  advancedFilters: {
    customFields: CustomFieldFilter[]  // 自定義欄位
    expressions: FilterExpression[]    // 過濾表達式
    presets: FilterPreset[]           // 預設過濾器
  }
}
```

### 2.4 ResultDisplay 組件設計

```typescript
// ResultDisplay 組件功能
interface ResultDisplayFeatures {
  // 顯示模式
  viewModes: {
    list: ListViewConfig               // 列表視圖
    grid: GridViewConfig              // 網格視圖
    table: TableViewConfig            // 表格視圖
    timeline: TimelineViewConfig      // 時間軸視圖
  }
  
  // 結果分組
  grouping: {
    byEntity: boolean                 // 按實體分組
    byRelevance: boolean             // 按相關性分組
    byDate: boolean                  // 按日期分組
    customGrouping: GroupingConfig   // 自定義分組
  }
  
  // 高亮和標記
  highlighting: {
    searchTerms: boolean             // 搜索詞高亮
    matchedFields: boolean           // 匹配欄位標記
    relevanceScore: boolean          // 相關性分數顯示
  }
  
  // 互動功能
  interactions: {
    hover: HoverPreview              // 懸停預覽
    click: ClickAction              // 點擊操作
    contextMenu: ContextMenuConfig  // 右鍵菜單
    bulkActions: BulkActionConfig   // 批量操作
  }
}
```

## 3. 性能優化設計

### 3.1 前端性能優化

```typescript
// 性能優化策略
interface PerformanceOptimizations {
  // 查詢優化
  queryOptimization: {
    debouncing: number                // 防抖延遲 (300ms)
    throttling: number               // 節流間隔 (100ms)
    caching: CacheConfig             // 查詢緩存配置
    batchRequests: boolean           // 批量請求
  }
  
  // 渲染優化
  renderOptimization: {
    virtualScrolling: boolean        // 虛擬滾動
    lazyLoading: boolean            // 懶加載
    memoization: MemoConfig         // 記憶化配置
    codesplitting: boolean         // 代碼分割
  }
  
  // 狀態優化
  stateOptimization: {
    normalizedState: boolean        // 標準化狀態
    selectorMemoization: boolean    // 選擇器記憶化
    immutableUpdates: boolean       // 不可變更新
    batchedUpdates: boolean         // 批量更新
  }
}
```

### 3.2 緩存策略設計

```typescript
// 緩存策略配置
interface CacheStrategyConfig {
  // 前端緩存
  frontendCache: {
    apolloCache: ApolloInMemoryCache   // Apollo 記憶體緩存
    browserCache: BrowserCacheConfig   // 瀏覽器緩存
    sessionStorage: SessionStorageConfig // 會話存儲
    localStorage: LocalStorageConfig    // 本地存儲
  }
  
  // 查詢緩存
  queryCache: {
    ttl: number                       // 生存時間 (秒)
    maxSize: number                   // 最大緩存大小
    evictionPolicy: 'LRU' | 'LFU'    // 驅逐策略
    compression: boolean              // 壓縮存儲
  }
  
  // 結果緩存
  resultCache: {
    searchResults: ResultCacheConfig  // 搜索結果緩存
    suggestions: SuggestionCacheConfig // 建議緩存
    filters: FilterCacheConfig        // 過濾器緩存
  }
}
```

### 3.3 搜索索引策略

```typescript
// 數據庫索引策略
interface DatabaseIndexStrategy {
  // PostgreSQL 全文搜索索引
  fullTextIndexes: {
    productDescriptions: {
      columns: ['description', 'remark']
      language: 'english'
      weights: { description: 'A', remark: 'B' }
    }
    palletRemarks: {
      columns: ['plt_remark', 'series']
      language: 'english'
      weights: { plt_remark: 'A', series: 'B' }
    }
  }
  
  // 複合索引
  compositeIndexes: {
    productInventory: ['product_code', 'latest_update']
    palletLocation: ['plt_num', 'current_location']
    orderStatus: ['order_ref', 'status', 'order_date']
    userDepartment: ['department', 'position', 'name']
  }
  
  // 部分索引
  partialIndexes: {
    activeProducts: 'WHERE is_active = true'
    availablePallets: 'WHERE total_stock > 0'
    pendingOrders: 'WHERE status = \'PENDING\''
  }
  
  // GIN 索引 (JSONB 欄位)
  ginIndexes: {
    metadata: 'metadata jsonb_path_ops'
    customFields: 'custom_fields'
  }
}
```

## 4. 數據流設計

### 4.1 搜索數據流

```
用戶輸入
    ↓
防抖處理 (300ms)
    ↓
查詢預處理
    ↓
類型檢測 & 驗證
    ↓
緩存檢查
    ↓ (cache miss)
GraphQL 查詢
    ↓
數據庫搜索引擎
    ↓
結果後處理
    ↓
相關性排序
    ↓
結果緩存
    ↓
UI 更新
    ↓
用戶互動追蹤
```

### 4.2 過濾器數據流

```
過濾器變更
    ↓
過濾器驗證
    ↓
查詢重構
    ↓
緩存失效
    ↓
新查詢執行
    ↓
結果過濾
    ↓
UI 狀態更新
    ↓
歷史記錄更新
```

## 5. 錯誤處理與降級策略

### 5.1 錯誤處理設計

```typescript
// 錯誤處理策略
interface ErrorHandlingStrategy {
  // 網絡錯誤
  networkErrors: {
    timeout: RetryConfig               // 超時重試
    connectionFailure: FallbackConfig  // 連接失敗降級
    rateLimit: BackoffConfig          // 速率限制退避
  }
  
  // 搜索錯誤
  searchErrors: {
    invalidQuery: ValidationConfig    // 無效查詢處理
    noResults: EmptyStateConfig      // 無結果處理
    tooManyResults: LimitConfig      // 結果過多處理
  }
  
  // 系統錯誤
  systemErrors: {
    databaseError: FallbackConfig    // 數據庫錯誤
    serviceUnavailable: CacheConfig  // 服務不可用
    authentication: AuthConfig       // 認證錯誤
  }
}
```

### 5.2 降級策略

```typescript
// 功能降級策略
interface DegradationStrategy {
  // 搜索功能降級
  searchDegradation: {
    fullTextToExact: boolean         // 全文搜索降級為精確搜索
    multiEntityToSingle: boolean     // 多實體降級為單實體
    advancedToBasic: boolean        // 高級搜索降級為基礎搜索
  }
  
  // 性能降級
  performanceDegradation: {
    disableAnimations: boolean       // 禁用動畫
    reduceResultCount: number        // 減少結果數量
    disableRealTime: boolean        // 禁用實時更新
  }
  
  // 功能降級
  featureDegradation: {
    disableSuggestions: boolean     // 禁用建議
    disableAnalytics: boolean       // 禁用分析
    disableExport: boolean          // 禁用導出
  }
}
```

## 6. 安全性設計

### 6.1 輸入安全

```typescript
// 輸入安全策略
interface InputSecurityStrategy {
  // 查詢安全
  querySecurity: {
    sanitization: SanitizationConfig  // 查詢清理
    validation: ValidationConfig      // 輸入驗證
    injection: InjectionProtectionConfig // 注入保護
  }
  
  // 權限控制
  accessControl: {
    entityPermissions: EntityPermissionConfig // 實體權限
    fieldLevelSecurity: FieldSecurityConfig   // 欄位級安全
    resultFiltering: ResultFilterConfig       // 結果過濾
  }
  
  // 速率限制
  rateLimiting: {
    perUser: RateLimitConfig         // 每用戶限制
    perIP: RateLimitConfig          // 每IP限制
    global: RateLimitConfig         // 全局限制
  }
}
```

### 6.2 數據安全

```typescript
// 數據安全策略
interface DataSecurityStrategy {
  // 敏感數據保護
  sensitiveDataProtection: {
    masking: MaskingConfig           // 數據遮罩
    encryption: EncryptionConfig     // 數據加密
    redaction: RedactionConfig       // 數據消隱
  }
  
  // 審計記錄
  auditLogging: {
    searchQueries: boolean           // 記錄搜索查詢
    accessAttempts: boolean         // 記錄訪問嘗試
    dataExports: boolean            // 記錄數據導出
  }
  
  // 合規性
  compliance: {
    gdpr: GDPRConfig                // GDPR 合規
    dataRetention: RetentionConfig   // 數據保留策略
    rightToBeForgotten: boolean     // 被遺忘權
  }
}
```

## 7. 監控與分析

### 7.1 性能監控

```typescript
// 性能監控指標
interface PerformanceMetrics {
  // 查詢性能
  queryPerformance: {
    responseTime: Metric             // 響應時間
    throughput: Metric              // 吞吐量
    errorRate: Metric               // 錯誤率
    cacheHitRate: Metric            // 緩存命中率
  }
  
  // 用戶體驗
  userExperience: {
    searchTime: Metric              // 搜索時間
    resultLoadTime: Metric          // 結果載入時間
    interactionDelay: Metric        // 互動延遲
    abandonment: Metric             // 放棄率
  }
  
  // 系統資源
  systemResources: {
    cpuUsage: Metric                // CPU 使用率
    memoryUsage: Metric             // 記憶體使用率
    networkLatency: Metric          // 網絡延遲
    diskIO: Metric                  // 磁盤 I/O
  }
}
```

### 7.2 業務分析

```typescript
// 業務分析指標
interface BusinessAnalytics {
  // 搜索行為分析
  searchBehavior: {
    popularQueries: QueryAnalytics    // 熱門查詢
    searchPatterns: PatternAnalytics  // 搜索模式
    userJourneys: JourneyAnalytics    // 用戶路徑
  }
  
  // 功能使用分析
  featureUsage: {
    filterUsage: FilterAnalytics      // 過濾器使用
    entityPreferences: EntityAnalytics // 實體偏好
    exportFrequency: ExportAnalytics  // 導出頻率
  }
  
  // 效率分析
  efficiencyAnalytics: {
    searchSuccess: SuccessAnalytics   // 搜索成功率
    taskCompletion: CompletionAnalytics // 任務完成率
    timeToResult: TimeAnalytics       // 結果獲取時間
  }
}
```

## 8. 可訪問性設計

### 8.1 鍵盤導航

```typescript
// 鍵盤導航支持
interface KeyboardNavigationSupport {
  // 搜索輸入
  searchInput: {
    tabIndex: number                 // Tab 順序
    shortcuts: KeyboardShortcut[]    // 快捷鍵
    ariaLabel: string               // 無障礙標籤
  }
  
  // 結果導航
  resultNavigation: {
    arrowKeys: ArrowKeyConfig       // 方向鍵配置
    enterKey: EnterKeyConfig        // 回車鍵配置
    escapeKey: EscapeKeyConfig      // 退出鍵配置
  }
  
  // 過濾器導航
  filterNavigation: {
    tabOrder: TabOrderConfig        // Tab 順序
    focusManagement: FocusConfig    // 焦點管理
    skipLinks: SkipLinkConfig       // 跳轉連結
  }
}
```

### 8.2 屏幕閱讀器支持

```typescript
// 屏幕閱讀器支持
interface ScreenReaderSupport {
  // ARIA 標籤
  ariaLabels: {
    searchInput: string             // 搜索輸入標籤
    filterPanel: string            // 過濾器面板標籤
    resultList: string             // 結果列表標籤
    loadingState: string           // 載入狀態標籤
  }
  
  // 狀態公告
  statusAnnouncements: {
    searchStarted: string          // 搜索開始
    resultsFound: string           // 找到結果
    noResults: string              // 無結果
    error: string                  // 錯誤信息
  }
  
  // 角色定義
  roleDefinitions: {
    searchBox: 'searchbox'         // 搜索框角色
    listBox: 'listbox'            // 列表框角色
    option: 'option'              // 選項角色
    status: 'status'              // 狀態角色
  }
}
```

## 9. 國際化設計

### 9.1 多語言支持

```typescript
// 國際化配置
interface InternationalizationConfig {
  // 支持語言
  supportedLanguages: {
    'zh-TW': ChineseTraditionalConfig // 繁體中文
    'zh-CN': ChineseSimplifiedConfig  // 簡體中文
    'en-US': EnglishConfig            // 英文
    'ja-JP': JapaneseConfig           // 日文
  }
  
  // 文本翻譯
  textTranslation: {
    ui: UITranslationConfig          // 界面文本
    messages: MessageTranslationConfig // 消息文本
    errors: ErrorTranslationConfig    // 錯誤文本
  }
  
  // 格式化
  formatting: {
    dates: DateFormattingConfig      // 日期格式化
    numbers: NumberFormattingConfig  // 數字格式化
    currencies: CurrencyFormattingConfig // 貨幣格式化
  }
}
```

## 10. 測試策略

### 10.1 測試層級

```typescript
// 測試策略配置
interface TestingStrategy {
  // 單元測試
  unitTests: {
    components: ComponentTestConfig   // 組件測試
    hooks: HookTestConfig            // Hook 測試
    utils: UtilityTestConfig         // 工具函數測試
    coverage: 85                     // 覆蓋率目標
  }
  
  // 整合測試
  integrationTests: {
    api: APITestConfig               // API 測試
    database: DatabaseTestConfig      // 數據庫測試
    cache: CacheTestConfig           // 緩存測試
  }
  
  // E2E 測試
  e2eTests: {
    searchFlows: SearchFlowTestConfig // 搜索流程測試
    filterFlows: FilterFlowTestConfig // 過濾器流程測試
    errorHandling: ErrorTestConfig    // 錯誤處理測試
  }
  
  // 性能測試
  performanceTests: {
    loadTesting: LoadTestConfig      // 負載測試
    stressTesting: StressTestConfig  // 壓力測試
    enduranceTesting: EnduranceTestConfig // 耐久測試
  }
}
```

## 結論

此架構設計為 SearchCard 提供了完整的技術框架，確保其能夠：

1. **高性能**: 通過智能緩存、查詢優化和索引策略實現快速搜索
2. **高可用**: 通過錯誤處理、降級策略和監控確保系統穩定性
3. **高擴展**: 通過模組化設計和標準化接口支持未來功能擴展
4. **高安全**: 通過多層安全策略保護用戶數據和系統資源
5. **高可用**: 通過無障礙設計和國際化支持服務更廣泛的用戶群體

該架構設計已準備好進入實施階段，為 NewPennine WMS 系統提供世界級的搜索體驗。