# Print-Label 模組清理與遷移統一計劃

- **目標模組**: `/app/(app)/print-label`
- **分析時間**: `2025-08-27`
- **文件目的**: 本文件整合了初始的分析報告和詳細的執行工作流程，作為清理 `print-label` 模組的唯一真相來源。

---

## 📋 最終結論與概況

**✅ 可以安全刪除（需預處理API依賴）**

### 執行原則

- **嚴格遵守**: 清理過程不可添加新功能，不可修改現有UI。

### 核心理由

> 前端入口已封閉，QCLabelCard已完全投入使用，用戶無法訪問print-label路徑。在處理完唯一的API依賴後，可安全移除整個模組。

- **執行模式**: 條件式清理（需預處理API依賴）
- **預計工作量**: 2-3天
- **風險等級**: 低（用戶無法訪問該模組，且已有完整替代方案）

---

## 🔒 關鍵事實與現狀評估

### 用戶無法訪問

- **AuthChecker.tsx:24**: `/print-label` 路徑已被註釋封閉，用戶無法通過UI導航或直接URL訪問。
- **實際入口**: 現有功能通過 `Admin > Operations > QC Label` 路徑訪問 `QCLabelCard` 組件。
- **用戶體驗**: 不受影響，已有完整替代方案。

### 功能已被完全取代

- **QCLabelCard**: 已在生產環境投入使用，100%滿足實際業務需求。
- **已廢棄功能**: 用戶已確認不再需要 `print-label` 模組中的硬件測試、打印監控、URL預填充等特殊功能。

### ⚠️ 待處理的唯一依賴

- **API端點**: `/api/print-label-updates` 仍被 `useStockUpdates.tsx` 依賴，這是執行清理前唯一需要處理的技術環節。
- **其他引用**: 其餘引用主要為測試、監控配置文件和中間件中的公開路由列表，可在主模組移除後一併清理。

---

## 🔄 三階段執行流程

### 第一階段：API依賴遷移處理 (1-2天)

**目標**: 將 `useStockUpdates.tsx` 對舊 REST API 的依賴遷移到 Supabase RPC 函數，解除清理工作的唯一阻礙。

#### 步驟1.1：修改 `useStockUpdates.tsx`

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

#### 步驟1.2：測試API遷移

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

#### 步驟1.3：驗證遷移成功

- [ ] QCLabelCard功能完全正常
- [ ] 庫存更新正確執行
- [ ] 沒有控制台錯誤
- [ ] 相關單元測試和整合測試全部通過

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
sed -i '' '/print-label-html/d' middleware.ts
sed -i '' '/\/\/.*print-label/d' app/components/AuthChecker.tsx
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

---

### 第三階段：驗證和監控 (1天)

#### 驗證檢查清單

**構建驗證**:

```bash
npm run type-check
npm run lint
npm run build
npm run test
npm run test:e2e
```

**功能驗證**:

- [ ] QCLabelCard 功能完全正常
- [ ] Admin面板 Operations > QC Label 可正常訪問
- [ ] 標籤生成流程無錯誤
- [ ] 庫存更新正確執行
- [ ] 無控制台404或JavaScript錯誤

---

## 📊 預期收益與成功指標

### 技術指標 (成功指標)

- **構建大小減少**: 預期 -15MB (~1-2%)
- **文件數量減少**: 27個文件
- **API端點減少**: 2個REST端點
- **代碼行數減少**: ~500行

### 業務指標

- **用戶體驗**: 無影響（QCLabelCard完全替代）
- **功能完整性**: 100%保持
- **系統穩定性**: 維持或改善
- **維護複雜度**: 顯著降低

### 驗證標準

- ✅ 所有自動化測試通過
- ✅ 系統構建成功且無警告
- ✅ 線上環境無404錯誤出現
- ✅ QCLabelCard功能在遷移後完全正常
- ✅ 性能指標改善或維持
- ✅ 部署後24小時運行無異常

---

## 🔙 回滾計劃

**如果在第一階段（API遷移）出現問題**:

```bash
git checkout HEAD~1 -- app/components/qc-label-form/hooks/modules/useStockUpdates.tsx
```

**如果在第二/三階段（清理與驗證）出現重大問題**:

```bash
# 1. 查找備份分支
git branch | grep backup/print-label-cleanup
# 2. 硬重置到備份狀態
git checkout main
git reset --hard <backup-branch-name>
# 3. 強制推送以覆蓋遠端
git push origin main --force-with-lease
```

---

## 📞 支援和聯絡

- **執行前**: 通知開發團隊，安排執行窗口，確保系統備份。
- **執行中**: 持續監控，記錄步驟，及時溝通。
- **執行後**: 更新系統文檔，分享結果，歸檔本計劃。

**計劃建立日期**: 2025-08-27  
**下次審查日期**: API依賴遷移完成後  
**負責人**: 開發團隊  
**審查人**: 架構師 + 安全審計員
