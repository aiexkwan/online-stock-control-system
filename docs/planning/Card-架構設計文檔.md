# Card 系統架構設計文檔

**文檔版本**: 1.0  
**建立日期**: 2025-07-25  
**作者**: 系統架構師團隊  
**審核狀態**: 待審核

## 📋 執行摘要

本文檔定義了新一代 Card 系統的架構設計，旨在解決現有 Widget 系統的複雜性問題，同時保持擴展性和高性能。新架構採用「簡潔但不簡單」的設計理念，通過輕量級註冊機制和智能載入策略，實現最佳的開發體驗和運行性能。

## 🎯 設計目標

### 核心目標
1. **簡潔性**: 降低系統複雜度，提高可維護性
2. **性能**: 首屏載入 <2s，單個 Card 載入 <200ms
3. **擴展性**: 支援第三方 Card 和動態擴展
4. **類型安全**: 100% TypeScript 覆蓋
5. **開發體驗**: 簡單直觀的 API 和開發流程

### 非功能需求
- Bundle Size: 每個 Card <50KB
- 測試覆蓋率: >90%
- 無障礙: WCAG 2.1 AA 標準
- 瀏覽器支援: Chrome 90+, Firefox 88+, Safari 14+

## 🏗️ 核心架構

### 1. 架構概覽

```
┌─────────────────────────────────────────────────────────────┐
│                      Card System Architecture                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Card      │    │    Card      │    │   Card       │  │
│  │ Registry    │◄───┤  Manifest    │◄───┤ Components   │  │
│  └─────────────┘    └──────────────┘    └──────────────┘  │
│         ▲                   ▲                    ▲         │
│         │                   │                    │         │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Card      │    │   Card       │    │   Card       │  │
│  │  Renderer   │    │   Loader     │    │  Provider    │  │
│  └─────────────┘    └──────────────┘    └──────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. 核心組件

#### 2.1 Card Registry (輕量級註冊系統)

```typescript
// lib/cards/CardRegistry.ts
export class CardRegistry {
  private static cards = new Map<string, CardDefinition>();
  
  static register(definition: CardDefinition): void {
    this.cards.set(definition.type, definition);
  }
  
  static get(type: string): CardDefinition | undefined {
    return this.cards.get(type);
  }
  
  static getAll(): CardDefinition[] {
    return Array.from(this.cards.values());
  }
}

// 自動註冊機制
export function registerCard(definition: CardDefinition) {
  return (Component: React.ComponentType<any>) => {
    CardRegistry.register({
      ...definition,
      component: Component,
    });
    return Component;
  };
}
```

#### 2.2 Card Manifest (元數據系統)

```typescript
// lib/cards/types.ts
export interface CardManifest {
  type: string;                    // 唯一標識
  name: string;                    // 顯示名稱
  version: string;                 // 版本號
  category: CardCategory;          // 分類
  description: string;             // 描述
  
  // 配置架構
  configSchema: {
    properties: Record<string, any>;
    required?: string[];
  };
  
  // 性能預算
  performance: {
    maxBundleSize: number;        // KB
    maxRenderTime: number;        // ms
    preloadPriority?: 'high' | 'normal' | 'low';
  };
  
  // 依賴關係
  dependencies?: {
    cards?: string[];             // 依賴的其他 Cards
    data?: string[];              // 數據源依賴
  };
  
  // 能力聲明
  capabilities?: {
    realtime?: boolean;           // 支援實時更新
    export?: boolean;             // 支援導出
    print?: boolean;              // 支援列印
    mobile?: boolean;             // 移動端優化
  };
}
```

#### 2.3 Card Component 標準接口

```typescript
// lib/cards/CardComponent.ts
export interface CardProps<TConfig = any> {
  // 核心配置
  config: TConfig;
  manifest: CardManifest;
  
  // 佈局和樣式
  className?: string;
  style?: React.CSSProperties;
  theme?: CardTheme;
  
  // 數據和狀態
  data?: any;
  loading?: boolean;
  error?: Error | null;
  
  // 生命週期
  onMount?: () => void;
  onUnmount?: () => void;
  onUpdate?: (config: TConfig) => void;
  
  // 交互回調
  onInteraction?: (event: CardInteractionEvent) => void;
  onDataRequest?: (query: DataQuery) => Promise<any>;
  
  // 編輯模式
  isEditMode?: boolean;
  onConfigChange?: (config: Partial<TConfig>) => void;
  onRemove?: () => void;
}

// Card 裝飾器使用示例
@registerCard({
  type: 'stats',
  name: 'Statistics Card',
  version: '2.0.0',
  category: 'data-display',
  // ... 其他 manifest 配置
})
export class StatsCard extends React.Component<CardProps<StatsConfig>> {
  // 實現...
}
```

### 3. 載入機制

#### 3.1 智能載入策略

```typescript
// lib/cards/CardLoader.ts
export class CardLoader {
  // 路由級別代碼分割
  static async loadForRoute(route: string): Promise<void> {
    const layout = await getLayoutForRoute(route);
    const cardTypes = extractCardTypes(layout);
    
    // 並行載入所需 Cards
    await Promise.all(
      cardTypes.map(type => this.loadCard(type))
    );
  }
  
  // 單個 Card 載入
  static async loadCard(type: string): Promise<CardComponent> {
    const manifest = await this.loadManifest(type);
    
    // 根據優先級決定載入策略
    if (manifest.performance.preloadPriority === 'high') {
      return this.loadImmediately(type);
    } else {
      return this.loadLazy(type);
    }
  }
  
  // 預載入機制
  static prefetch(types: string[]): void {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        types.forEach(type => this.loadCard(type));
      });
    }
  }
}
```

#### 3.2 動態導入映射

```typescript
// lib/cards/imports.ts
const cardImports: Record<string, () => Promise<any>> = {
  'stats': () => import('./cards/StatsCard'),
  'chart': () => import('./cards/ChartCard'),
  'table': () => import('./cards/TableCard'),
  // ... 其他 Cards
};

// 支援第三方 Card 註冊
export function registerThirdPartyCard(
  type: string,
  importFn: () => Promise<any>
): void {
  cardImports[type] = importFn;
}
```

### 4. 配置管理系統

#### 4.1 類型安全配置

```typescript
// lib/cards/config/ConfigManager.ts
export class CardConfigManager {
  // 配置驗證
  static validate<T>(
    config: unknown,
    schema: CardManifest['configSchema']
  ): T {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    
    if (!validate(config)) {
      throw new CardConfigError(validate.errors);
    }
    
    return config as T;
  }
  
  // 配置合併
  static merge<T>(
    base: T,
    override: Partial<T>,
    schema: CardManifest['configSchema']
  ): T {
    const merged = deepMerge(base, override);
    return this.validate(merged, schema);
  }
  
  // 配置遷移
  static migrate<T>(
    config: any,
    fromVersion: string,
    toVersion: string,
    migrations: ConfigMigration[]
  ): T {
    return migrations
      .filter(m => m.from >= fromVersion && m.to <= toVersion)
      .reduce((cfg, migration) => migration.transform(cfg), config);
  }
}
```

#### 4.2 配置持久化

```typescript
// lib/cards/config/ConfigPersistence.ts
export class CardConfigPersistence {
  // 保存配置
  static async save(
    cardId: string,
    config: any,
    storage: 'local' | 'remote' = 'local'
  ): Promise<void> {
    if (storage === 'local') {
      localStorage.setItem(`card-config-${cardId}`, JSON.stringify(config));
    } else {
      await api.saveCardConfig(cardId, config);
    }
  }
  
  // 載入配置
  static async load(
    cardId: string,
    storage: 'local' | 'remote' = 'local'
  ): Promise<any> {
    if (storage === 'local') {
      const saved = localStorage.getItem(`card-config-${cardId}`);
      return saved ? JSON.parse(saved) : null;
    } else {
      return api.loadCardConfig(cardId);
    }
  }
}
```

### 5. 數據層整合

#### 5.1 統一數據接口

```typescript
// lib/cards/data/DataProvider.ts
export interface CardDataProvider {
  // 查詢數據
  query<T>(query: DataQuery): Promise<T>;
  
  // 訂閱實時更新
  subscribe<T>(
    query: DataQuery,
    callback: (data: T) => void
  ): Unsubscribe;
  
  // 批量查詢優化
  batchQuery<T>(queries: DataQuery[]): Promise<T[]>;
  
  // 緩存管理
  cache: {
    get(key: string): any;
    set(key: string, value: any, ttl?: number): void;
    invalidate(pattern?: string): void;
  };
}
```

#### 5.2 GraphQL 整合

```typescript
// lib/cards/data/GraphQLProvider.ts
export class GraphQLCardDataProvider implements CardDataProvider {
  constructor(private client: ApolloClient<any>) {}
  
  async query<T>(query: DataQuery): Promise<T> {
    const gqlQuery = this.buildGraphQLQuery(query);
    const result = await this.client.query({
      query: gqlQuery,
      variables: query.variables,
    });
    return result.data;
  }
  
  subscribe<T>(
    query: DataQuery,
    callback: (data: T) => void
  ): Unsubscribe {
    const subscription = this.client.subscribe({
      query: this.buildGraphQLSubscription(query),
      variables: query.variables,
    }).subscribe({
      next: ({ data }) => callback(data),
    });
    
    return () => subscription.unsubscribe();
  }
}
```

### 6. 性能優化策略

#### 6.1 渲染優化

```typescript
// lib/cards/performance/RenderOptimizer.ts
export const CardRenderOptimizer = {
  // 虛擬化大列表
  virtualize: (items: any[], rowHeight: number) => {
    return VirtualList({ items, rowHeight });
  },
  
  // 懶加載圖片
  lazyLoadImages: (container: HTMLElement) => {
    const images = container.querySelectorAll('img[data-lazy]');
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.lazy!;
          imageObserver.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  },
  
  // 防抖更新
  debounceUpdate: debounce((updateFn: Function) => {
    updateFn();
  }, 300),
};
```

#### 6.2 性能監控

```typescript
// lib/cards/performance/PerformanceMonitor.ts
export class CardPerformanceMonitor {
  static measure(cardType: string, phase: 'mount' | 'update' | 'render') {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args: any[]) {
        const start = performance.now();
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;
        
        // 記錄性能數據
        this.reportMetric({
          cardType,
          phase,
          duration,
          timestamp: Date.now(),
        });
        
        // 檢查性能預算
        const manifest = CardRegistry.get(cardType)?.manifest;
        if (manifest && duration > manifest.performance.maxRenderTime) {
          console.warn(`Card ${cardType} exceeded render time budget`);
        }
        
        return result;
      };
    };
  }
}
```

### 7. 擴展機制

#### 7.1 插件 API

```typescript
// lib/cards/plugins/PluginAPI.ts
export interface CardPlugin {
  name: string;
  version: string;
  
  // 生命週期鉤子
  onCardRegister?: (card: CardDefinition) => void;
  onCardMount?: (instance: CardInstance) => void;
  onCardUnmount?: (instance: CardInstance) => void;
  onCardUpdate?: (instance: CardInstance, prevConfig: any) => void;
  
  // 功能擴展
  enhanceCard?: (CardComponent: React.ComponentType) => React.ComponentType;
  provideContext?: () => React.Context<any>;
  registerCommands?: () => CardCommand[];
}

// 插件管理器
export class CardPluginManager {
  private static plugins: CardPlugin[] = [];
  
  static register(plugin: CardPlugin): void {
    this.plugins.push(plugin);
    
    // 應用到已註冊的 Cards
    CardRegistry.getAll().forEach(card => {
      plugin.onCardRegister?.(card);
    });
  }
  
  static applyPlugins(CardComponent: React.ComponentType): React.ComponentType {
    return this.plugins.reduce(
      (Component, plugin) => plugin.enhanceCard?.(Component) || Component,
      CardComponent
    );
  }
}
```

#### 7.2 主題系統

```typescript
// lib/cards/theme/ThemeSystem.ts
export interface CardTheme {
  // 顏色
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    border: string;
    // ... 其他顏色
  };
  
  // 間距
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // 圓角
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  
  // 陰影
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
  
  // 動畫
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

// 主題提供者
export const CardThemeProvider: React.FC<{
  theme: CardTheme;
  children: React.ReactNode;
}> = ({ theme, children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 8. 測試策略

#### 8.1 單元測試

```typescript
// lib/cards/testing/CardTestUtils.ts
export class CardTestUtils {
  // Card 合約測試
  static testCardContract(CardComponent: React.ComponentType<CardProps>) {
    describe('Card Contract', () => {
      it('should implement required props', () => {
        const props = getComponentProps(CardComponent);
        expect(props).toContain(['config', 'manifest']);
      });
      
      it('should handle loading state', () => {
        const { getByTestId } = render(
          <CardComponent loading={true} />
        );
        expect(getByTestId('card-skeleton')).toBeInTheDocument();
      });
      
      it('should handle error state', () => {
        const error = new Error('Test error');
        const { getByText } = render(
          <CardComponent error={error} />
        );
        expect(getByText(/Test error/)).toBeInTheDocument();
      });
    });
  }
  
  // 性能測試
  static async testCardPerformance(
    CardComponent: React.ComponentType<CardProps>,
    config: any
  ) {
    const start = performance.now();
    const { container } = render(
      <CardComponent config={config} />
    );
    const renderTime = performance.now() - start;
    
    expect(renderTime).toBeLessThan(200); // 200ms 預算
    
    // 測試 bundle size
    const bundleSize = await getBundleSize(CardComponent);
    expect(bundleSize).toBeLessThan(50 * 1024); // 50KB 預算
  }
}
```

#### 8.2 視覺迴歸測試

```typescript
// lib/cards/testing/VisualTesting.ts
export const setupVisualTests = (CardComponent: React.ComponentType) => {
  describe('Visual Regression', () => {
    const variants = [
      { name: 'default', props: {} },
      { name: 'loading', props: { loading: true } },
      { name: 'error', props: { error: new Error('Test') } },
      { name: 'edit-mode', props: { isEditMode: true } },
    ];
    
    variants.forEach(({ name, props }) => {
      it(`should match snapshot - ${name}`, async () => {
        const component = render(
          <CardComponent {...defaultProps} {...props} />
        );
        
        await expect(component).toMatchImageSnapshot({
          customSnapshotIdentifier: `${CardComponent.name}-${name}`,
        });
      });
    });
  });
};
```

### 9. 遷移策略

#### 9.1 Widget to Card 遷移工具

```typescript
// lib/cards/migration/MigrationTool.ts
export class WidgetToCardMigrator {
  // 自動遷移配置
  static migrateConfig(
    widgetConfig: WidgetConfig,
    cardType: string
  ): CardConfig {
    const migrationMap = this.getMigrationMap(cardType);
    
    return Object.entries(widgetConfig).reduce((cardConfig, [key, value]) => {
      const mappedKey = migrationMap[key] || key;
      
      if (typeof mappedKey === 'function') {
        return mappedKey(cardConfig, value);
      } else {
        cardConfig[mappedKey] = value;
      }
      
      return cardConfig;
    }, {} as CardConfig);
  }
  
  // 生成遷移報告
  static async generateMigrationReport(
    widgetType: string
  ): Promise<MigrationReport> {
    const usage = await this.findWidgetUsage(widgetType);
    const targetCard = this.suggestTargetCard(widgetType);
    const configChanges = this.analyzeConfigChanges(widgetType, targetCard);
    
    return {
      widgetType,
      targetCard,
      usageCount: usage.length,
      configChanges,
      estimatedEffort: this.estimateEffort(configChanges),
      migrationSteps: this.generateSteps(widgetType, targetCard),
    };
  }
}
```

#### 9.2 向後兼容層

```typescript
// lib/cards/compatibility/CompatibilityLayer.ts
export const createWidgetCompatibilityWrapper = (
  CardComponent: React.ComponentType<CardProps>
): React.ComponentType<WidgetProps> => {
  return function WidgetCompatibilityWrapper(props: WidgetProps) {
    // 轉換 props
    const cardProps = transformWidgetPropsToCardProps(props);
    
    // 添加兼容性警告
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `Widget "${props.type}" is deprecated. Please migrate to Card.`
      );
    }
    
    return <CardComponent {...cardProps} />;
  };
};
```

### 10. 實施計劃

#### Phase 1: 基礎建設（Week 2-3）
1. 實現 Card Registry 和 Manifest 系統
2. 建立 Card Component 標準接口
3. 開發 Card Loader 和智能載入機制
4. 創建第一個示例 Card (StatsCard v2)

#### Phase 2: 工具和生態（Week 4-5）
1. 開發 Card 開發工具（CLI、模板）
2. 建立測試框架和工具
3. 實現性能監控系統
4. 創建開發者文檔

#### Phase 3: 遷移和優化（Week 6-8）
1. 開發 Widget to Card 遷移工具
2. 批量遷移現有 Widgets
3. 性能優化和調校
4. A/B 測試和灰度發布

## 📊 成功指標

| 指標 | 目標 | 測量方法 |
|------|------|----------|
| 首屏載入時間 | <2s | Lighthouse |
| Card 載入時間 | <200ms | Performance API |
| Bundle Size | <50KB/Card | Webpack Bundle Analyzer |
| 測試覆蓋率 | >90% | Jest Coverage |
| TypeScript 覆蓋 | 100% | TypeScript Compiler |
| 開發者滿意度 | >4.5/5 | 內部調查 |

## 🔄 風險和緩解

| 風險 | 影響 | 可能性 | 緩解措施 |
|------|------|--------|----------|
| 遷移複雜度高 | 高 | 中 | 自動化工具 + 漸進遷移 |
| 性能退化 | 高 | 低 | 持續監控 + 性能預算 |
| 開發者抗拒 | 中 | 中 | 培訓 + 文檔 + 工具支援 |
| 第三方整合問題 | 低 | 中 | 插件 API + 兼容層 |

## 📚 附錄

### A. API 參考
- [Card Component API](./api/card-component.md)
- [Card Registry API](./api/card-registry.md)
- [Card Loader API](./api/card-loader.md)

### B. 示例代碼
- [創建新 Card](./examples/create-card.md)
- [遷移 Widget](./examples/migrate-widget.md)
- [性能優化](./examples/performance.md)

### C. 相關文檔
- [Widget to Card 架構分析報告](./Widget-to-Card-架構分析報告.md)
- [性能測試基準](./performance-baseline.md)
- [開發者指南](./developer-guide.md)

---

**下一步**：
1. 審核和批准設計
2. 開始 Phase 1 實施
3. 建立性能基準測試

**聯絡人**：
- 架構設計：Architecture Team
- 前端實施：Frontend Team
- 性能優化：Performance Team