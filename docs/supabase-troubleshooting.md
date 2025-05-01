# Supabase 連接疑難排解指南

## 常見問題

### 用戶不存在錯誤

當使用者嘗試登入時看到「用戶不存在」的錯誤，可能有以下幾個原因：

1. **API 金鑰問題**：系統使用的 Supabase API 金鑰可能已過期或無效。
2. **資料庫連接問題**：無法連接到 Supabase 資料庫。
3. **資料表權限問題**：用戶沒有權限讀取 `data_id` 資料表。
4. **用戶真的不存在**：資料庫中確實沒有該用戶 ID 的記錄。

## 臨時解決方案

為了解決這個問題，我們已經實施了以下臨時解決方案：

1. **硬編碼測試用戶**：系統現在包含硬編碼的測試用戶，即使 Supabase 連接失敗也能登入。
   - 用戶 ID: `testuser`, 密碼: `testuser`
   - 用戶 ID: `admin`, 密碼: `admin123`

2. **連接錯誤檢查**：系統會在登入前檢查 Supabase 連接，如果發現 API 金鑰無效，會顯示友好的錯誤訊息。

## 永久解決方案

要永久解決這個問題，您需要：

1. **更新 Supabase API 金鑰**：
   - 登入 [Supabase 控制面板](https://app.supabase.io/)
   - 選擇您的專案
   - 進入「設定 > API」
   - 複製「anon」或「service_role」金鑰
   - 更新專案中的 API 金鑰：
     - 在 `next.config.js` 中更新 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 值
     - 或創建/更新 `.env.local` 文件中的 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 值

2. **更新資料表權限**：
   - 在 Supabase 控制面板中，進入「資料庫 > 資料表」
   - 選擇 `data_id` 資料表
   - 進入「資料表權限」標籤
   - 確保有以下權限政策：
     ```sql
     -- 讀取權限
     CREATE POLICY "enableSelect" ON "public"."data_id"
     FOR SELECT TO "anon", "authenticated" USING (true);
     
     -- 更新權限
     CREATE POLICY "updatepassword" ON "public"."data_id"
     FOR UPDATE TO "anon", "authenticated" USING (true) WITH CHECK (true);
     ```

3. **添加新用戶**：
   - 在 Supabase 控制面板中，進入「資料庫 > 資料表」
   - 選擇 `data_id` 資料表
   - 點擊「插入資料」按鈕
   - 輸入新用戶資訊，包括：
     - `id`: 用戶 ID
     - `name`: 用戶名稱
     - `department`: 部門
     - `password`: 初始密碼 (與 ID 相同)
     - 其他權限欄位 (`qc`, `receive`, `void`, `view`, `resume`, `report`)

## API 金鑰有效期

Supabase API 金鑰通常不會過期，除非您手動輪換或刪除它們。如果金鑰無效，請檢查：

1. 專案狀態是否為活動狀態
2. 金鑰是否被撤銷或輪換
3. 金鑰是否正確複製（無多餘空格）

## 聯絡支援

如果問題仍然存在，請聯絡系統管理員或 Supabase 支援。 