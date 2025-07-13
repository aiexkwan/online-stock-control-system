# 測試代碼審查檢查清單

**用途**: Pull Request 代碼審查  
**範圍**: 測試相關代碼質量檢查  
**基於**: NewPennine v1.1 測試覆蓋率提升項目經驗  

---

## 📋 通用測試檢查項目

### ✅ 基本要求
- [ ] 所有新功能都有對應測試
- [ ] 測試文件命名正確 (`*.test.ts` 或 `*.test.tsx`)
- [ ] 測試文件位置正確 (`__tests__/` 或同級 `__tests__` 目錄)
- [ ] 測試描述清晰且有意義
- [ ] 沒有被跳過的測試 (`skip` 或 `todo`)

### ✅ 測試覆蓋完整性
- [ ] Happy path (正常流程) 測試
- [ ] Error cases (錯誤情況) 測試  
- [ ] Edge cases (邊界值) 測試
- [ ] Input validation (輸入驗證) 測試
- [ ] Authentication/Authorization (認證授權) 測試

### ✅ 測試隔離與清理
- [ ] 使用 `beforeEach(() => jest.clearAllMocks())`
- [ ] 沒有測試間的狀態依賴
- [ ] 正確的 mock 設置和清理
- [ ] 異步操作正確等待

### ✅ 測試命名與組織
- [ ] 使用描述性的 `describe` 和 `test` 名稱
- [ ] 測試分組邏輯清晰
- [ ] 遵循 BDD 風格描述 ("should do X when Y")

---

## 🔧 技術特定檢查項目

### API Route 測試
- [ ] 使用正確的 Next.js 15 測試方法
- [ ] Request/Response 對象正確創建
- [ ] HTTP 狀態碼測試
- [ ] 請求體和查詢參數測試
- [ ] 錯誤響應格式測試

**範例檢查**:
```typescript
// ✅ 正確
const request = new NextRequest('http://localhost/api/endpoint');
const response = await GET(request);
expect(response.status).toBe(200);

// ❌ 避免 (過時方法)
testApiHandler({ handler: GET, test: async ({ fetch }) => {} });
```

### Service 層測試
- [ ] Supabase client 正確 mock
- [ ] RPC 函數調用測試
- [ ] 數據庫查詢鏈測試 
- [ ] 錯誤處理和重試邏輯
- [ ] 並發操作測試

**檢查要點**:
```typescript
// ✅ 正確 mock 設置
const mockSupabase = createMockSupabaseClient();
mockSupabase.from().select().eq.mockResolvedValue({
  data: mockData,
  error: null
});

// ✅ RPC 函數測試
expect(mockSupabase.rpc).toHaveBeenCalledWith('function_name', {
  param1: 'value1'
});
```

### React Component 測試
- [ ] 使用 React Testing Library
- [ ] 測試用戶交互而非實現細節
- [ ] 正確等待異步渲染
- [ ] Props 和狀態變化測試
- [ ] Error boundary 測試

**檢查要點**:
```typescript
// ✅ 正確的異步測試
await waitFor(() => {
  expect(screen.getByText('Updated!')).toBeInTheDocument();
});

// ✅ 用戶交互測試
await user.click(screen.getByRole('button', { name: /submit/i }));
```

### Hook 測試
- [ ] 使用 `renderHook` 和 `act`
- [ ] 測試狀態變化
- [ ] 副作用測試
- [ ] 依賴變化測試
- [ ] 清理函數測試

**檢查要點**:
```typescript
// ✅ 正確的 Hook 測試
const { result } = renderHook(() => useMyHook());

await act(async () => {
  result.current.updateData('new value');
});

expect(result.current.data).toBe('new value');
```

---

## 🎯 專項檢查清單

### Mock 策略檢查
- [ ] Mock 對象結構符合真實 API
- [ ] 使用 `createMockSupabaseClient` 統一工廠
- [ ] RPC 函數 mock 覆蓋所有調用
- [ ] 外部 API 使用 MSW mock
- [ ] Mock 數據使用工廠函數生成

### 性能測試檢查
- [ ] 大數據集測試
- [ ] 並發操作測試
- [ ] 緩存行為測試
- [ ] 響應時間基準測試
- [ ] 記憶體洩漏檢查

### 錯誤處理檢查  
- [ ] 網絡錯誤模擬
- [ ] 數據庫錯誤處理
- [ ] 輸入驗證失敗
- [ ] 認證失敗情況
- [ ] 超時和重試邏輯

### 安全性檢查
- [ ] 不包含真實憑證或 API 密鑰
- [ ] 敏感數據已脫敏
- [ ] 權限控制測試
- [ ] SQL 注入防護測試
- [ ] XSS 防護測試

---

## 📊 測試質量指標

### 覆蓋率要求
- [ ] 新增功能測試覆蓋率 > 80%
- [ ] 核心服務測試覆蓋率 > 90%
- [ ] 關鍵業務邏輯 100% 覆蓋
- [ ] 沒有降低整體覆蓋率

### 測試執行要求
- [ ] 所有測試通過
- [ ] 測試執行時間 < 5 分鐘
- [ ] 沒有跳過的測試
- [ ] 沒有測試警告

### 代碼質量要求
- [ ] 測試代碼符合 ESLint 規則
- [ ] TypeScript 類型正確
- [ ] 沒有 console.log 或調試代碼
- [ ] 測試代碼可讀性良好

---

## 🚨 常見問題檢查

### Mock 相關問題
- [ ] 避免無限遞歸 mock
- [ ] Mock 函數返回值類型正確
- [ ] 避免過度 mock（保持測試真實性）
- [ ] Mock 清理正確執行

### 異步測試問題
- [ ] 所有 async/await 正確使用
- [ ] 使用 `act()` 包裝狀態更新
- [ ] 使用 `waitFor()` 等待異步操作
- [ ] Timer mock 正確設置和清理

### TypeScript 相關問題
- [ ] 避免複雜的 `ReturnType` 語法
- [ ] 類型斷言合理使用
- [ ] Mock 類型與真實類型一致
- [ ] 避免 `any` 類型濫用

### 測試數據問題
- [ ] 使用有意義的測試數據
- [ ] 避免硬編碼魔法數字
- [ ] 測試數據獨立生成
- [ ] 邊界值測試覆蓋

---

## ⚡ 快速檢查命令

### 本地檢查
```bash
# 運行新增測試
npm test -- --testPathPattern="新文件路徑"

# 檢查覆蓋率變化
npm run test:coverage

# 檢查測試性能
npm run test:performance

# 運行特定測試套件
npm test -- --testNamePattern="測試名稱"
```

### CI 檢查
```bash
# CI 環境測試
npm run test:ci

# 覆蓋率報告
npm run test:coverage -- --ci

# 並行測試檢查
npm run test:parallel
```

---

## 📚 參考標準

### 測試文件範例
- ✅ **好範例**: `app/services/__tests__/transactionLog.service.test.ts`
- ✅ **好範例**: `app/void-pallet/services/__tests__/inventoryService.test.ts`
- ✅ **API 範例**: `__tests__/templates/api-route.template.ts`

### 文檔參考
- [測試最佳實踐指南](./api-testing-guide.md)
- [測試快速參考](./testing-quick-reference.md)
- [測試錯誤記錄](./issue-library/test-fixing-errors.md)

### 工具標準
- **Mock 工廠**: `__tests__/mocks/factories.ts`
- **測試輔助**: `__tests__/utils/supabase-test-helpers.ts`
- **場景數據**: `__tests__/mocks/scenarios/`

---

## 🎯 審查決策指南

### ✅ 可以通過審查
- 所有檢查項目都符合
- 測試覆蓋率沒有下降
- 測試執行正常且快速
- 代碼質量符合標準

### ⚠️ 需要改進
- 部分非關鍵項目不符合
- 測試覆蓋率略有下降但有合理原因
- 測試執行稍慢但仍在接受範圍內

### ❌ 需要重新提交
- 關鍵測試項目缺失
- 測試失敗或錯誤
- 測試覆蓋率顯著下降
- 代碼質量問題嚴重

---

## 💡 審查最佳實踐

### 對審查者
1. **檢查測試邏輯**：確保測試真正驗證功能
2. **運行測試**：本地執行確保通過
3. **查看覆蓋率**：使用工具檢查覆蓋變化
4. **提供建設性反饋**：具體指出改進點

### 對提交者
1. **自我檢查**：提交前使用此清單自檢
2. **運行全套測試**：確保沒有破壞現有測試
3. **更新文檔**：如有新模式或工具及時更新
4. **回應反饋**：積極回應審查意見

---

## 📈 持續改進

### 定期更新
- [ ] 每月檢查清單更新
- [ ] 新發現問題補充到清單
- [ ] 根據團隊反饋調整標準
- [ ] 與最佳實踐指南保持同步

### 團隊培訓
- [ ] 新人 onboarding 使用此清單
- [ ] 定期團隊分享最佳實踐
- [ ] 鼓勵提出改進建議
- [ ] 建立測試質量文化

---

**檢查清單版本**: v1.0  
**最後更新**: 2025-07-12  
**基於項目**: NewPennine 測試覆蓋率提升 v1.1  
**維護責任**: 開發團隊  

---

> 💡 **提醒**: 這個清單是活文檔，隨著項目發展會持續更新。如果發現新的問題或改進點，請及時更新此清單！