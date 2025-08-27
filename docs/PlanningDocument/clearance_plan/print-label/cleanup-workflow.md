# Print-Label 清理執行 Workflow

基於 [清理分析報告](./print-label.md) 的結論，本文件提供完整的執行工作流程。

---

## 📋 執行概況

- **目標模組**: `/app/(app)/print-label`
- **執行模式**: 條件式清理（需預處理API依賴）
- **預計工作量**: 2-3天
- **風險等級**: 低（用戶無法訪問該模組）

---

## 🔄 三階段執行流程

### 第一階段：API依賴遷移處理 (1-2天)

#### 關鍵發現
- `useStockUpdates.tsx` 仍使用 `/api/print-label-updates`
- QCLabelCard 已使用 `process_qc_label_unified` RPC函數
- 需要將舊API調用遷移到新的RPC架構

#### 執行步驟

**步驟1.1：修改useStockUpdates.tsx**
```typescript
// 位置：app/components/qc-label-form/hooks/modules/useStockUpdates.tsx
// 第57行：替換API端點

// 原代碼：
const response = await fetch('/api/print-label-updates', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productCode: productInfo.code,
    quantity: totalQuantity,
    userId: userIdNum,
    palletCount: palletCount,
    description: productInfo.description,
  }),
});

// 新代碼：直接調用RPC函數
const supabase = createClient();
const { data, error } = await supabase.rpc('handle_print_label_updates', {
  p_product_code: productInfo.code,
  p_quantity: totalQuantity,
  p_user_id: userIdNum,
  p_pallet_count: palletCount,
  p_description: productInfo.description || null,
});
```

**步驟1.2：測試API遷移**
```bash
# 測試QCLabelCard功能
npm run test -- --testPathPattern=QCLabelCard

# 測試useStockUpdates功能
npm run test -- --testPathPattern=useStockUpdates

# 手動功能測試
# 1. 啟動開發伺服器
npm run dev

# 2. 訪問 Admin > Operations > QC Label
# 3. 測試標籤生成流程
# 4. 驗證庫存更新正常
```

**步驟1.3：驗證遷移成功**
- [ ] QCLabelCard功能完全正常
- [ ] 庫存更新正確執行
- [ ] 沒有控制台錯誤
- [ ] 相關測試全部通過

---

### 第二階段：執行清理 (1天)

#### 清理文件清單 (27個文件)

**主要模組文件**:
```bash
# 1. Print-label 頁面組件
app/(app)/print-label/
  ├── page.tsx         # 主頁面組件 (390行)
  └── layout.tsx       # 佈局組件

# 2. API端點 
app/api/print-label-html/
  └── route.ts         # HTML預覽API
app/api/print-label-updates/
  └── route.ts         # 庫存更新API

# 3. 相關組件（需確認無其他使用）
app/components/print-label-pdf/
```

**配置文件清理**:
```bash
# 1. 中間件配置
middleware.ts:62
  # 移除：'/api/print-label-html',

# 2. 認證檢查器
app/components/AuthChecker.tsx:24
  # 移除：//'/print-label',

# 3. 全域跳轉連結
app/components/GlobalSkipLinks.tsx:78
  # 移除print-label引用

# 4. 測試配置
vitest.setup.ts
scripts/lighthouse-quick-test.js
scripts/performance-lighthouse-test.js
.lighthouserc.js
```

#### 執行腳本

**自動清理腳本** (建議使用)：
```bash
#!/bin/bash
# cleanup-print-label.sh

set -e  # 遇到錯誤就停止

echo "🚀 開始清理 print-label 模組..."

# 步驟1：備份當前狀態
echo "📦 建立備份分支..."
git checkout -b backup/print-label-cleanup-$(date +%Y%m%d-%H%M%S)
git checkout main

# 步驟2：移除主要文件
echo "🗑️ 移除主要模組文件..."
git rm -r app/\(app\)/print-label/
git rm -r app/api/print-label-html/
git rm -r app/api/print-label-updates/

# 步驟3：檢查組件依賴後移除
echo "🔍 檢查 print-label-pdf 組件使用情況..."
if ! grep -r "print-label-pdf" --exclude-dir=node_modules --exclude-dir=.git . > /dev/null 2>&1; then
    echo "📁 移除無依賴的 print-label-pdf 組件..."
    git rm -r app/components/print-label-pdf/ 2>/dev/null || echo "⚠️ print-label-pdf 已不存在"
else
    echo "⚠️ print-label-pdf 仍被其他模組使用，跳過刪除"
fi

# 步驟4：清理配置引用
echo "⚙️ 清理配置文件引用..."

# 移除中間件路由
sed -i '' '/print-label-html/d' middleware.ts

# 移除AuthChecker註釋行
sed -i '' '/\/\/.*print-label/d' app/components/AuthChecker.tsx

# 移除GlobalSkipLinks引用
sed -i '' '/print-label.*startsWith/d' app/components/GlobalSkipLinks.tsx

# 步驟5：清理測試和監控配置
echo "🧪 清理測試和監控配置..."
sed -i '' '/print-label/d' vitest.setup.ts
sed -i '' '/Print Label.*print-label/d' scripts/lighthouse-quick-test.js
sed -i '' '/Print Label.*print-label/d' scripts/performance-lighthouse-test.js
sed -i '' '/print-label/d' .lighthouserc.js

echo "✅ 清理完成！"
echo "📋 接下來請執行驗證步驟..."
```

**手動清理步驟**：
```bash
# 1. 建立備份
git checkout -b backup/print-label-cleanup-$(date +%Y%m%d-%H%M%S)
git checkout main

# 2. 移除主要文件
git rm -r app/\(app\)/print-label/
git rm -r app/api/print-label-html/  
git rm -r app/api/print-label-updates/

# 3. 檢查並移除組件（如無其他依賴）
# 先檢查使用情況
grep -r "print-label-pdf" --exclude-dir=node_modules .
# 如果只在清理目標中出現，則移除
git rm -r app/components/print-label-pdf/

# 4. 清理配置引用
# 編輯以下文件，移除print-label相關行：
# - middleware.ts
# - app/components/AuthChecker.tsx  
# - app/components/GlobalSkipLinks.tsx
# - vitest.setup.ts
# - scripts/lighthouse-quick-test.js
# - scripts/performance-lighthouse-test.js
# - .lighthouserc.js
```

---

### 第三階段：驗證和監控 (1天)

#### 驗證檢查清單

**構建驗證**:
```bash
# 1. TypeScript編譯檢查
npm run type-check

# 2. ESLint檢查
npm run lint

# 3. 構建測試
npm run build

# 4. 單元測試
npm run test

# 5. E2E測試（如有）
npm run test:e2e
```

**功能驗證**:
- [ ] QCLabelCard 功能完全正常
- [ ] Admin面板 Operations > QC Label 可正常訪問
- [ ] 標籤生成流程無錯誤
- [ ] 庫存更新正確執行
- [ ] 無控制台404錯誤
- [ ] 無控制台JavaScript錯誤

**性能驗證**:
```bash
# 1. 構建大小檢查
npm run build
# 檢查 .next/static 大小是否減少

# 2. 開發環境啟動速度
time npm run dev

# 3. Lighthouse效能測試
npm run lighthouse:test
```

**監控設置**:
```bash
# 部署後24小時監控
# 1. 檢查錯誤日誌
tail -f logs/application.log | grep -i error

# 2. 檢查404狀態
# 監控訪問日誌中的404錯誤

# 3. 用戶行為監控
# 確認用戶能正常使用QCLabelCard功能
```

---

## 🔙 回滾計劃

### 緊急回滾程序

**如果在第一階段（API遷移）出現問題**:
```bash
# 1. 立即回滾代碼變更
git checkout HEAD~1 -- app/components/qc-label-form/hooks/modules/useStockUpdates.tsx

# 2. 重啟服務
npm run dev

# 3. 驗證功能正常
# 測試QCLabelCard標籤生成功能
```

**如果在第二階段（清理）出現問題**:
```bash
# 1. 從備份分支恢復
git branch  # 找到備份分支名稱
git checkout main
git reset --hard backup/print-label-cleanup-YYYYMMDD-HHMMSS

# 2. 強制推送（如果已推送到遠端）
git push origin main --force-with-lease

# 3. 重新部署
npm run build
npm run start
```

**如果在第三階段（驗證）發現問題**:
```bash
# 1. 詳細檢查錯誤日誌
npm run dev 2>&1 | tee debug.log

# 2. 如果是小問題，嘗試修復
# 檢查是否有遺漏的引用

# 3. 如果是大問題，執行完整回滾
git reset --hard backup/print-label-cleanup-YYYYMMDD-HHMMSS
```

### 回滾檢查清單
- [ ] 代碼恢復到清理前狀態
- [ ] 所有功能正常工作
- [ ] 沒有新的錯誤出現
- [ ] 用戶可正常使用系統
- [ ] 通知相關團隊回滾情況

---

## 📊 成功指標

### 技術指標
- **構建大小減少**: 預期 -15MB (~1-2%)
- **文件數量減少**: 27個文件
- **API端點減少**: 2個REST端點
- **代碼行數減少**: ~500行

### 業務指標  
- **用戶體驗**: 無影響（QCLabelCard完全替代）
- **功能完整性**: 100%保持
- **系統穩定性**: 維持或改善
- **維護複雜度**: 降低

### 驗證標準
- ✅ 所有測試通過
- ✅ 構建成功且無警告
- ✅ 無404錯誤出現
- ✅ QCLabelCard功能完全正常
- ✅ 性能指標改善或維持
- ✅ 24小時運行無異常

---

## 📞 支援和聯絡

### 執行前準備
- [ ] 通知開發團隊清理計劃
- [ ] 安排適當的執行時間窗口
- [ ] 準備緊急聯絡人清單
- [ ] 確保有完整的系統備份

### 執行期間
- [ ] 持續監控系統狀態
- [ ] 記錄每個步驟的執行結果
- [ ] 如遇問題立即停止並評估
- [ ] 保持與團隊的溝通

### 執行後
- [ ] 更新系統文檔
- [ ] 記錄經驗教訓
- [ ] 分享執行結果
- [ ] 歸檔相關文檔

---

**工作流程建立日期**: 2025-08-27  
**下次審查日期**: API依賴遷移完成後  
**負責人**: 開發團隊  
**審查人**: 架構師 + 安全審計員