# 必須導守

0. 獲取問題／任務方向後，根據任務性質調用`.claude/agents`中適當既Agents執行任務
    - [Agent專長簡介](../../.claude/agents/README.md)
1. ❌ 此文檔只供閱讀，禁止修改此文檔 ❌
2. 根據用戶選擇的動作/提供的參數，閱讀下列不同章節，獲取詳細信息

# -fix -oth

# -aly

# -doc

# -exc

1. `計劃文檔`
   
# `-mod -edit`
- 留意：*必須使用Supabase MCP到database查看表格結構及約束條件*
- 組件：`StockTranfardCard`
- 根據以下描述，檢視現時組件內的 UI及功能 是否符合描述 及有否過度工程化地方
- 如果屬實，更改組件以符合下列描述（更揍無需新增以下描述以外功能）
- 如有不符合，一律先詢問用戶處理方法
- UI設計圖
┌────────────────────────────────────────────────────────────────────────────┐
│ Stock Transfer - Transfer stock between locations                          │
├────────────────────────────────────────────────────────────────────────────┤
│ Select Destination                                     Verify Operator     │
│ ┌───────────────────────────────────────────────┐      ┌─────────────────┐ │
│ │ (●) Fold Mill   (○) Production   (○) PipeLine │      │ clock Number    | │
│ └───────────────────────────────────────────────┘      └─────────────────┘ │
├────────────────────────────────────────────────────────────────────────────┤
│ Scan / Search Pallet                                                       │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ [ Enter or scan pallet number]                                         │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────┤
│ Transfer Log                                                               │
│ ┌────────────────────────────────────────────────────────────────────────┐ │
│ │ [ Transfer records ]                                                   │ │
│ │                                                                        │ │
│ │                                                                        │ │
│ │                                                                        │ │
│ │                                                                        │ │
│ │                                                                        │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘

- 運作邏輯
- 初始時
    - 只有`Destination`及`clock number`可點選
    - `Transfer Log`顯示`record_histroy`表，`action`欄=`Stock Transfer`的所有列
    - `Fold Mill`,`Production`及`PipeLine`三欄為互斥關係
- 用戶*必須*先選擇`Destination`，及輸入`clock number`
- 系統需要將`clock number`，到`data_id`搜尋`id`欄並驗證存在
- 驗證成功後，方可輸入`Scan/Search Pallet`欄（否則維持不可輸入狀態）
- 用戶輸入`Scan/Search Pallet`欄後，系統自動開始搜尋
    - `Scan/Search Pallet`欄採用「onblur」進行搜尋
        - 支援手動輸入`Pallet Number`或`Series`
        - 掃描輸入`Series`
- 系統利用輸入的`Pallet Number`或`Series`到`record_palletinfo`表搜尋`plt_num`及`series`兩欄
    - 搜尋成功：返回`plt_num`,`product_qty`及`product_code`兩欄值
    - 令用`plt_num`到`record_history`表，搜尋`plt_num`欄&`time`欄為「最新」的一列，並返回`loc`欄，即`最後紀錄位置`

- 判斷是否非法轉移
    - 非法轉移例子1：`最後紀錄位置`=`Production` & `用戶選擇的Destination`=`Production`
    - 非法轉移例子2：`最後紀錄位置`=`PipeLine` & `用戶選擇的Destination`=`PipeLine`
    - 非法轉移例子3：`最後紀錄位置`=`Fold Mill` & `用戶選擇的Destination`=`Fold Mill`
    - 非法轉移例子4：`最後紀錄位置`=`Voided`
    - 假如是非法轉移，以「全屏overlay」形式發出警告
    - Overlay UI設計圖
  ┌────────────────────────────────────────────────────────────────────────┐ 
  │ [ Error ]                                                              │
  │ [ Reason : Vaild Transfer ]                                            │ 
  │ [ Deatils : `簡單描述非法轉移內容`]                                       │ 
  │                                                                        │
  │                         ┌─────────────┐                                │
  │                         │   Confime   |                                │
  │                         └─────────────┘                                │
  └────────────────────────────────────────────────────────────────────────┘
- RPC更新各表格，以保持一致性
    - 更新`record_transfer`表
        - `tran_date`欄：[Supabase會自動填入]
        - `f_loc`欄：填入[最後紀錄位置]
        - `t_loc`欄：填入[用戶選擇的`Destination`]
        - `plt_num`欄：填入[`用戶輸入的plt_num`]或[`用戶輸入series後搜尋返回的plt_num`]
        - `operator_id`欄：填入[`用戶輸入clock number`]

    - 更新`record_inventoyr`表
        - `latest_update`及`uuid`欄：[Supabase會自動填入]
        - `product_code`欄：填入[`record_palletinfo`表返回的`product_code`]
        - `plt_num`欄：填入[`用戶輸入的plt_num`]或[`用戶輸入series後搜尋返回的plt_num`]
        - 根據`最後紀錄位置`更新對應的欄位
            - `最後紀錄位置`=`await` > `await`欄輸入[(負數)`record_palletinfo`表返回的`product_qty`]
            - `最後紀錄位置`=`Await_grn` > `await_grn`欄輸入[(負數)`record_palletinfo`表返回的`product_qty`]
            - `最後紀錄位置`=`Production` > `injection`欄輸入[(負數)`record_palletinfo`表返回的`product_qty`]
            - `最後紀錄位置`=`PipeLine` > `pipeline`欄輸入[(負數)`record_palletinfo`表返回的`product_qty`]
            - `最後紀錄位置`=`Fold Mill` > `fold`欄輸入[(負數)`record_palletinfo`表返回的`product_qty`]
        
        - 根據[用戶選擇的`Destination`]更新對應的欄位
            - `用戶選擇的Destination`=`Production` > `injection`欄輸入[(正數)`record_palletinfo`表返回的`product_qty`]
            - `用戶選擇的Destination`=`PipeLine` > `pipeline`欄輸入[(正數)`record_palletinfo`表返回的`product_qty`]
            - `用戶選擇的Destination`=`Fold Mill` > `fold`欄輸入[(正數)`record_palletinfo`表返回的`product_qty`]

    - 更新`record_history`表
        - `time`及`uuid`欄：[Supabase會自動填入]
        - `id`欄：填入[`用戶輸入clock number`]
        - `action`欄：填入「`Stock Transfer`」
        - `plt_num`欄：填入[`用戶輸入的plt_num`]或[`用戶輸入series後搜尋返回的plt_num`]
        - `loc`欄：填入[用戶選擇的`Destination`]
        - `remark`欄：填入[`Moved From {`最後紀錄位置`} to {`Destination`}`]

    - 更新`work_level`表
        - 尋找`id`欄＝`用戶輸入clock number` ＆ `latest_update`＝當天日期的列
            - 搜尋成功
                - 在該列的`move`欄，在原有數值上 +1
                - 更新`latest_update`為當下時間
            - 搜尋失敗則新增一列，
                - `uuid`,`latest_update`,`qc`, `grn`, `loading`欄：[Supabase會自動填入]
                - `id`欄：填入`用戶輸入clock number`
                - `move`欄：填入`1`

# `-mod -add`
    
# `-mod -del`
 