# Pallet Buffer 自動清理部署指南

## 概述
自動清理功能已經實現，包括：
- SQL 清理函數
- API 端點
- Admin UI 組件
- 多種自動化選項

## 部署步驟

### 1. 部署 SQL 函數到 Supabase

```bash
# 執行以下 SQL 腳本
scripts/fix-pallet-number-ordering.sql
scripts/setup-auto-cleanup-cron.sql
```

重要函數：
- `auto_cleanup_pallet_buffer()` - 自動清理函數
- `api_cleanup_pallet_buffer()` - API 調用版本
- `generate_atomic_pallet_numbers_v5()` - 修復排序問題的 v5 版本

### 2. 設置環境變量（可選）

如果需要保護 API 端點，在 `.env.local` 添加：
```
CRON_SECRET=your-secret-key-here
```

### 3. 部署到 Vercel

確保以下文件已部署：
- `/app/api/cleanup-pallet-buffer/route.ts`
- `/app/components/admin/PalletBufferCleanup.tsx`

### 4. 設置自動執行

#### 選項 A: Vercel Cron Jobs (需要 Pro 計劃)

創建 `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cleanup-pallet-buffer",
    "schedule": "*/30 * * * *"
  }]
}
```

#### 選項 B: GitHub Actions

創建 `.github/workflows/cleanup-pallet-buffer.yml`:
```yaml
name: Cleanup Pallet Buffer
on:
  schedule:
    - cron: '*/30 * * * *'  # 每 30 分鐘
  workflow_dispatch:  # 允許手動觸發

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Pallet Buffer
        run: |
          curl -X POST ${{ secrets.API_URL }}/api/cleanup-pallet-buffer \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json"
```

需要在 GitHub Secrets 設置：
- `API_URL`: 你的 Vercel 部署 URL
- `CRON_SECRET`: 與 `.env.local` 中相同的密鑰

#### 選項 C: 外部監控服務

使用 UptimeRobot、Cron-job.org 等服務：
1. 設置 HTTP 監控
2. URL: `https://your-app.vercel.app/api/cleanup-pallet-buffer`
3. Method: POST
4. Headers: `Authorization: Bearer your-secret-key`
5. Schedule: 每 30 分鐘

### 5. 測試部署

#### 測試 API 端點
```bash
# GET - 檢查 buffer 狀態
curl https://your-app.vercel.app/api/cleanup-pallet-buffer

# POST - 執行清理
curl -X POST https://your-app.vercel.app/api/cleanup-pallet-buffer \
  -H "Authorization: Bearer your-secret-key" \
  -H "Content-Type: application/json"
```

#### 測試 Admin UI
1. 訪問 Admin 面板
2. 找到 "Pallet Buffer Cleanup" 組件
3. 點擊 "Manual Cleanup" 測試手動清理

### 6. 監控和維護

清理規則：
- 刪除前一天的所有條目
- 刪除已使用超過 2 小時的條目
- 刪除未使用超過 30 分鐘的條目
- 保持最多 100 個未使用條目

監控要點：
- 檢查清理日誌
- 監控 buffer 表大小
- 觀察性能影響

## 故障排除

### 清理未執行
1. 檢查 API 端點是否正常響應
2. 確認 cron job 設置正確
3. 查看 Vercel/Supabase 日誌

### 權限問題
1. 確認 SQL 函數有正確授權
2. 檢查 service role key 是否正確
3. 驗證 CRON_SECRET 配置

### 性能問題
如果清理影響性能：
1. 調整清理頻率（例如改為每小時）
2. 修改清理條件（延長保留時間）
3. 在低峰時段執行

## 下一步行動

1. **立即部署 SQL 腳本到 Supabase**
   ```bash
   # 在 Supabase SQL Editor 執行
   scripts/fix-pallet-number-ordering.sql
   scripts/setup-auto-cleanup-cron.sql
   ```

2. **測試手動清理**
   - 使用 Admin UI 測試清理功能
   - 確認清理規則符合需求

3. **設置自動化**
   - 選擇合適的自動化方案
   - 配置並測試自動執行

4. **監控運行狀況**
   - 設置告警（如果清理失敗）
   - 定期檢查 buffer 表狀態