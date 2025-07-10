# 系統工具技術架構文檔

## 概述

NewPennine 倉庫管理系統提供多個系統工具頁面用於開發、調試同系統管理。呢份文檔詳細介紹各個工具頁面嘅技術實現、功能特性同數據流。

## 1. Camera Debug 頁面 (/camera-debug)

### 技術實現

**文件位置**: `/app/camera-debug/page.tsx`

#### 主要功能
- 獨立相機測試工具，用於調試掃描器功能
- 完全獨立運行，唔依賴任何認證或外部組件
- 提供詳細嘅設備檢測同錯誤診斷

#### 技術特點
1. **設備枚舉**
   - 使用 `navigator.mediaDevices.enumerateDevices()` 列出所有媒體設備
   - 識別同顯示所有視頻輸入設備

2. **權限檢查**
   - 支持 Permissions API 檢查相機權限狀態
   - 提供降級處理確保兼容性

3. **相機流管理**
   ```typescript
   const constraints = {
     video: {
       width: { ideal: 640 },
       height: { ideal: 480 },
       facingMode: 'environment', // 優先使用後置相機
     },
     audio: false,
   };
   ```

4. **錯誤診斷系統**
   - NotAllowedError: 用戶拒絕權限
   - NotFoundError: 找唔到相機設備
   - NotReadableError: 相機被占用
   - OverconstrainedError: 不支持請求約束
   - SecurityError: HTTPS 要求或來源問題

5. **自動清理機制**
   - 10秒後自動停止相機流，防止長時間占用

#### UI 組件
- 實時視頻預覽區
- 測試日誌窗口
- 系統信息面板
- 設備狀態指示器

## 2. Unified Demo 頁面 (/unified-demo)

### 技術實現

**文件位置**: `/app/unified-demo/page.tsx`

#### 主要功能
展示新統一 GraphQL Schema 嘅使用方式，為開發者提供 API 使用示例。

#### 核心技術棧
1. **統一數據層**
   ```typescript
   import { unifiedDataLayer } from '@/lib/graphql/unified-data-layer';
   ```

2. **數據類型**
   - Product: 產品數據
   - Pallet: 棧板信息
   - InventoryRecord: 庫存記錄
   - Movement: 移動記錄

3. **查詢功能**
   - 支持分頁 (Connection pattern)
   - 靈活過濾器 (Filter types)
   - 實時數據更新

#### 功能模組
1. **產品管理**
   - 搜索產品（按代碼或描述）
   - 顯示產品詳情（顏色、類型、標準數量）
   - 低庫存警報（庫存少於10嘅產品）

2. **棧板管理**
   - 搜索棧板（按棧板號）
   - 顯示棧板狀態（ACTIVE/INACTIVE）
   - 顯示相關產品信息

3. **庫存管理**
   - 按產品代碼查詢庫存
   - 顯示各倉位庫存分佈
   - 實時更新時間顯示

4. **移動記錄**
   - 追蹤棧板移動歷史
   - 顯示操作員信息
   - 顯示來源同目標位置

#### API 調用模式
```typescript
// 使用統一數據層進行查詢
const result = await unifiedDataLayer.getProducts(filter, { first: 20 });
setProducts(result.edges.map(edge => edge.node));
```

## 3. Access 頁面 (/access)

### 技術實現

**文件位置**: `/app/access/page.tsx`

#### 主要功能
作為系統訪問門戶，驗證用戶權限後自動重定向到相應頁面。

#### 認證流程
1. **用戶驗證**
   ```typescript
   const user = await unifiedAuth.getCurrentUser();
   ```

2. **域名驗證**
   - 只允許 `@pennineindustries.com` 域名
   - 非授權域名重定向到登錄頁

3. **角色判定**
   ```typescript
   const userRole = await getUserRoleFromDatabase(user.email);
   setRedirectPath(userRole.defaultPath);
   ```

4. **自動重定向**
   - 3秒倒計時後自動跳轉
   - 根據用戶角色跳轉到對應頁面

#### UI 特性
- Framer Motion 動畫效果
- 漸進式加載動畫
- 成功/失敗狀態指示
- 粒子效果背景

#### 安全信息顯示
- 當前登錄用戶郵箱
- Session 過期時間
- 認證狀態確認

## 4. GraphQL Monitor 頁面 (/admin/graphql-monitor)

### 技術實現

**文件位置**: `/app/admin/graphql-monitor/page.tsx`

#### 主要功能
實時監控 GraphQL API 性能同健康狀態。

#### 監控模組

1. **系統健康狀態**
   - 運行時間 (Uptime)
   - 內存使用量
   - 平均響應時間
   - 錯誤率

2. **速率限制 (Rate Limiting)**
   - 總請求數
   - 被阻擋請求數
   - 活躍連接數
   - 頻繁觸發限制嘅 IP 地址

3. **緩存性能**
   - 緩存命中率
   - 緩存大小
   - 高性能查詢列表
   - 需要優化嘅查詢

4. **預熱策略 (Warmup Strategies)**
   - 活躍預熱任務
   - 今日完成數量
   - 成功率統計
   - 各策略執行狀態

5. **性能分析**
   - 響應時間趨勢圖
   - 緩存命中率圖表
   - 吞吐量分析
   - 實時性能指標

6. **性能測試**
   - 自動化測試控制面板
   - 多種測試場景（基本、負載、壓力、峰值）
   - A/B 測試比較
   - AI 優化建議

#### 數據可視化
使用 Recharts 提供豐富圖表：
- LineChart: 響應時間趨勢
- AreaChart: 緩存命中率同錯誤率
- BarChart: 吞吐量分析
- Progress: 各項指標進度條

#### API 端點整合
通過 `/api/graphql-monitoring` 提供數據：
- GET: 獲取各種監控數據
- POST: 觸發優化操作

## 5. 數據訪問分析 API (/api/analytics/data-access)

### 技術實現

**文件位置**: `/app/api/analytics/data-access/route.ts`

#### 主要功能
記錄 DataAccessStrategy 性能指標，用於分析同優化數據訪問模式。

#### 數據結構
```typescript
{
  operation: string;      // 操作名稱
  strategy: string;       // 使用策略
  duration: number;       // 執行時間(ms)
  timestamp: number;      // 時間戳
  success: boolean;       // 是否成功
  dataSize?: number;      // 數據大小(bytes)
}
```

## 6. 硬件抽象層整合

### 技術實現

**Hook**: `/lib/hardware/hooks/useHardware.ts`

#### 主要功能
提供 React 組件中訪問硬件功能嘅統一接口。

#### 功能特性
1. **打印機管理**
   - 單個打印任務
   - 批量打印
   - 打印隊列管理
   - 失敗任務重試

2. **掃描器支持**
   - 開始/停止掃描
   - 實時掃描結果回調

3. **設備監控**
   - 實時設備狀態
   - 設備列表更新
   - 故障警報通知

4. **隊列管理**
   - 查看隊列詳情
   - 清空打印隊列
   - 重試失敗任務

#### 使用示例
```typescript
const {
  print,
  printers,
  queueStatus,
  startScanning
} = useHardware({
  onAlert: (alert) => console.log('Hardware alert:', alert),
  onScan: (result) => console.log('Scan result:', result)
});
```

## 7. 技術架構特點

### 統一設計模式
1. **Client Components**: 所有工具頁面都係客戶端組件
2. **錯誤處理**: 統一錯誤處理同用戶提示
3. **狀態管理**: 使用 React Hooks 進行狀態管理
4. **實時更新**: 支持實時數據更新同自動刷新

### 性能優化
1. **懶加載**: 按需加載組件同數據
2. **緩存策略**: 智能緩存減少不必要請求
3. **批量操作**: 支持批量處理提高效率
4. **虛擬化**: 大數據列表使用虛擬滾動

### 安全考慮
1. **權限驗證**: Access 頁面進行嚴格權限檢查
2. **域名限制**: 只允許特定域名訪問
3. **會話管理**: 自動會話超時處理
4. **數據驗證**: API 端點進行數據驗證

## 8. 開發調試功能

### Camera Debug
- 用於測試掃描器硬件兼容性
- 診斷相機權限問題
- 測試不同設備配置

### Unified Demo
- 展示 API 使用方式
- 測試新功能集成
- 性能基準測試

### GraphQL Monitor
- 實時性能監控
- 識別性能瓶頸
- 優化查詢策略

## 總結

系統工具頁面為開發者提供強大嘅調試同管理功能，通過統一嘅技術架構同設計模式，確保系統嘅可維護性同擴展性。每個工具都有明確嘅用途同技術實現，共同構成完整嘅開發支持體系。