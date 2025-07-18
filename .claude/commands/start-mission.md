# Start Mission Command

## 用法
`/start` 或 `/start [任務描述]`

## 執行流程
1. 開啟 Ultrathink, Sequential-thinking, Task 工具
2. 閱讀 docs/general_rules.md
3. 檢查 docs/Today_Todo/ 的當天 todolist
   - 如為空，詢問用戶要執行什麼
   - 如有任務，顯示並確認下一步
4. 執行任務
5. 使用 Playwright 等測試工具驗證成果
6. 更新進度到相關文檔

## 測試憑證
- Email: ${env.local.SYS_LOGIN}
- Password: ${env.local.SYS_PASSWORD}

## 相關命令
- `/plan` - 如需先建立計劃
- `/check` - 查看當前進度