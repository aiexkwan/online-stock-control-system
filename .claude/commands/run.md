# 指令執行庫

## 優先閱讀文檔
- [系統規範](../../CLAUDE.local.md)
- [工具包](../../docs/Others/Tools-Bag.md)
- [指令列表](../settings.local.json)
- [Agent專長簡介](../../.claude/agents/README.md)
- [歷史記錄文檔](../../docs/Others/History.md)
- [計劃文檔庫](`docs/planning`)

# 任務
- 提問用戶需要執行以下哪一個動作，並根據回應，執行下列各種分類動作
    - 如用戶有直接提供 $ARGUMENTS，則無需再詢問

## 處理流程

0. 閱讀所有 `優先閱讀文檔`，並根據用戶選擇的動作，查看下列的下一步動作

1. 參數列表

### **-fix -oth** $ARGUMENTS
- 分配Agent
- 完成修改後，*必需建立一次性的測試文件證實修復工作*
    - 如測試未能通過，先暫停繼續執行計劃，並執行修正，直至解決 *不可跳過*
    - 成功後 *必須刪除一次性的測試文件*
- 更新[歷史記錄文檔](../../docs/Others/History.md)
- 完成

---

### **-aly** $ARGUMENTS
- 分配Agent
- 開始分析問題
- 分析完成後，詢問用戶 *嚴禁未詢問下建立文檔*
    - 是否直接執行分析結果
    - 是否需要根據分析建立計劃文檔[如是，需提供儲存路徑]
- 完成

---

### **-exc** $ARGUMENTS
- 根據 $ARGUMENTS 執行

---

### **-aud** $ARGUMENTS
- 分配Agent
- 作出驗證，確保一切運作正常
- 建立 *一次性* 的測試文件作測試，測試後 *必須刪除一次性的測試文件*
- 運行 `npm run typecheck` & `npm run lint`檢查error
- 詢問用戶，獲取`審核工作報告`的儲存路徑，並儲存`審核工作報告`
- 更新[歷史記錄文檔](../../docs/Others/History.md)

---

### **-mod -edit** $ARGUMENTS、**-mod -add** $ARGUMENTS、**-mod -del** $ARGUMENTS-
- 分配Agent=
- 使用工具作出驗證，確保一切運作正常
- 建立 *一次性* 的測試文件作測試，測試後 *必須刪除一次性的測試文件*
    - 如測試未能通過，必須先執行修正，直至解決 *不可跳過*
- 運行 `npm run typecheck` & `npm run lint`檢查error
    - 如有發現 *必須* 解決
- 更新[歷史記錄文檔](../../docs/Others/History.md)

---

### **-inv**：$ARGUMENTS
- 分配Agent
- 調查方向
    - 組件用途
    - 有否直接或間接被引用／import
    - 在哪個頁面／組件被使用
    - 刪除／簡化可能性
- 過程中必須使用*ultrathink*及與用戶互動／對答，以獲取下一步動作指引
- 答案必須保持簡潔，無需意見／建議
    - FrontEnd 有／否正被使用
    - BackEnd 有／否正被使用
    - (如有使用) 被使用的組件／頁面
    - 如果刪除，對系統現時正在運作既所有組件有冇影響（唔需要講未來）
    - 特別關注：對`app/(app)/admin/cards`內組件影響
- 更新[歷史記錄文檔](../../docs/Others/History.md)
