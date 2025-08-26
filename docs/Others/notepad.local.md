claude --dangerously-skip-permissions

1.  應用程式層面：
    - 只有 /app/(app)/print-grnlabel/hooks/useGrnLabelBusinessV3.tsx 還在使用
      TransactionLogService
    - 但它調用的 server action createGrnDatabaseEntriesBatch 實際上使用 RPC
      process_grn_label_unified，這個 RPC 不依賴 transaction_log

解釋：useGrnLabelBusinessV3.tsx 調用 server action createGrnDatabaseEntriesBatch

# Void Pallet Workflow and Dataflow

- 用戶在`Pallet Number`inputbox輸入搜尋目標
- 支援兩種輸入搜尋方式
  - 手動輸入`pallet number`
  - 掃描QR-Code輸入`series`
- 根據輸入，到`record_palletinfo`表搜尋資料
  - `pallet number` > 搜尋`plt_num`欄
  - `series` > 搜尋`series`欄並返回`plt_num`欄
- 利用`plt_num`，到`record_history`表搜尋，返回`loc`欄
  - 假如`loc`欄值＝“Voided“/"Void"/"Damaged"
    1. 「全屏overlay」提示用戶
       - "Pallet {plt_num} Already Been Voided"
       - "Please Check Again"
    2. 清空`Pallet Number`inputbox
    3. 停止下一步
- 利用`plt_num`，到`record_palletinfo`表，搜尋返回`product_code`,`plt_remark`,`product_qty`及`generate_time`欄位
- 利用`product_code`，到`data_code`表搜尋並返回`description`欄及`type`欄
- 在`Pallet Information`返回搜尋資料
- `Pallet Information`區域顯示
  - [Pallet Number]: `plt_num`
  - [Product Code]: `product_code`
  - [Product Name]: `description`
  - [Prodcut Type]: `type`
  - [Pallet Quantity]: `product_qty`
  - [Pallet Remark]: `plt_remark`
  - [Pallet Current Location]: `loc`
  - [Created At]: `generate_time`
- 顯示`Void Reason`dropdown選擇器，包括選項
  - `Print Extra`
  - `Wrong Label`
  - `Wrong Quantity`
  - `Used Material`
  - `Damaged`[不再支援「部份`Damage`]
- [取消現有的「輸入用戶密碼確認動作」功能]
- `Confirm Void`: 用戶必須「已選擇`Void Reason`」，方可點選
- 用戶點擊`Confirm Void`後，「全屏overlay」再一次提示用戶
  - "Void Action Cannot Be Undo"
  - "Please Confirm Beore Excute"
  - 提供`Excute`及`Cancel`兩個按鈕
    - 按下`Excute`：繼續執行之後動作
    - 按下`Cancel`：取消執行，並回到之前畫面
- 用戶點選`Confirm Void`後，開始執行以下動作
  - 在`record_grn`表，搜尋`plt_num`欄，如有對應的[Pallet Number]，則刪除該列記錄
  - 在`record_transfer`表，搜尋`plt_num`欄，如有對應的[Pallet Number]，則刪除該列記錄
  - 在`record_inventory`表，加入一列記錄
    - 在`product_code`欄，寫入`product_code`
    - 根據[Current Location]，在對應欄位加上｛[負數][Pallet Quantity]｝- `Await` > `await`欄 - `Await_grn` > `await_grn`欄 - `Fold Mill` > `fold`欄 - `Production` > `injection`欄
      － 假如{Void Reason}=`Damaged`，則在`damage`欄加入｛[正數][Pallet Quantity]｝
  - 在`report_void`表，加入一列記錄
    - `plt_num`欄：[Pallet Number]
    - `reason`欄：`Void Reason`
    - `damage_qty`欄：假如`Void Reason`=`Damaged`，則填入[Pallet Quantity]
  - 如`Pallet Remark`有包含"ACO"字眼，則到`record_aco`表
    - 在`order_ref`欄搜尋對應的｛ACO Order Ref｝，及對應的`code`欄
    - 在該列的`finished_qty`欄，在原有數值上減去[Pallet Quantity]
  - 在`stock_level`表，`stock`欄尋找[Product Code]，並找出`update_time`最新的一列
    - 在該列的`stock_level`欄，在原有數值上減去[Pallet Quantity]
  - 在`record_history`表，加入一列新記錄
    - 根據用戶登入的email，到`data_id`表的`email`欄，尋找對應的`id`欄，並在`record_history`的`id`欄寫入
    - `action`欄寫入"Void Pallet"
    - `plt_num`欄寫入 [Pallet Number]
    - `loc`欄
      － 假如{Void Reason}=`Damaged`，則寫入"Damaged"，其他原因則寫入"Voided"
    - `remark`欄寫入{Void Reason}

# DepartInjCard Workflow and Dataflow

- `Today Finished`
  - 資料提取方式：`record_palletinfo`中，提取`product_code`及`generate_time`
  - `product_code`欄需先到`data_code`表中獲取`type`及`description`，過濾走`type`＝`Material`,`Pipe`,`Parts`,`Test`及`Tools`
  - `generate_time`過濾剩日期＝當天
  - 顯示兩層過濾後的總數

- `Past 7 days`
  - 資料提取方式：`record_palletinfo`6中，提取`product_code`及`generate_time`
  - `product_code`欄需先到`data_code`表中獲取`type`及`description`，過濾走`type`＝`Material`,`Pipe`,`Parts`,`Test`及`Tools`
  - `generate_time`過濾剩日期＝過往7天
  - 顯示兩層過濾後的總數

- `Past 14 days`
  - 資料提取方式：`record_palletinfo`中，，提取`product_code`及`generate_time`
  - `product_code`欄需先到`data_code`表中獲取`type`及`description`，過濾走`type`＝`Material`,`Pipe`,`Parts`,`Test`及`Tools`
  - `generate_time`過濾剩日期＝過往14天的總數
  - 顯示兩層過濾後的總數

- `Top 10 Stock`
  - 固定位置Columns Header：[Product Code],[Description],[Latest Update],[Qty]
  - 資料提取方式：`stock_level`表提取`stock`,`stock_level`及`update_time`欄
  - [過濾1]: 只取各個`stock`的`update_time`欄，只取最新的一列
  - [過濾2]: `stock`欄到`data_code`表中獲取`type`及`description`，過濾走`type`＝`Material`,`Pipe`,`Parts`,`Test`及`Tools`
  - 最終顯示兩重過濾後的
    - [Product Code]: `stock_level`表返回過濾走type`＝`Material`,`Pipe`,`Parts`,`Test`及`Tools`後的`stock`
    - [Description]: `data_code`表返回的`description`
    - [Latest Update]: `stock_level`表過濾最新更新時間後的`update_time`
    - [Qty]: `stock_level`表返回的`stock_level`（由高至低排列）
  - 預設顯示7列數據，支援滾動向下展示餘下列數，最多顯示10列

- `Material Stock`
  - 固定位置Columns Header：[Material Code],[Description],[Latest Update],[Qty]
  - 資料提取方式：`stock_level`表提取`stock`,`stock_level`及`update_time`欄
  - [過濾1]: 只取各個`stock`的`update_time`欄為最新的一列
  - [過濾2]: `stock`欄到`data_code`表中獲取`type`及`description`，過濾走`type`＝`Material`,`Pipe`,`Parts`,`Test`及`Tools`
  - 最終顯示兩重過濾後的
    - [Material Code]: `stock_level`表返回過濾type`＝`Material`後的`stock`
    - [Description]: `data_code`表返回的`description`
    - [Latest Update]: `stock_level`表過濾最新更新時間後後的`update_time`
    - [Qty]: `stock_level`表返回的`stock_level`（由高至低排列）
  - 預設顯示7列數據，支援滾動向下展示餘下列數，沒有最多顯示限制

- `Machine State`
  - 列表table固定位置Columns Header：`Machine Number`,`Latest Active time`,`State`
  - 固定顯示4列：`Machine No.04`,`Machine No.06`,`Machine No.07`,`Machine No.11`,`Machine No.12`,`Machine No.14`
  - 暫時`Latest Active time`,`State`全數顯示`N/A`

- `Coming Soon`
  - 無需顯示任何內容

# DepartPipeCard Workflow and Dataflow

- `Today Finished`
  - 資料提取方式：`record_palletinfo`中，提取`product_code`及`generate_time`
  - `product_code`欄需先到`data_code`表中獲取`type`及`description`，只取`type`=`Pipe`
  - `generate_time`過濾剩日期＝當天
  - 顯示兩層過濾後的總數

- `Past 7 days`
  - 資料提取方式：`record_palletinfo`6中，提取`product_code`及`generate_time`
  - `product_code`欄需先到`data_code`表中獲取`type`及`description`，只取`type`=`Pipe`
  - `generate_time`過濾剩日期＝過往7天
  - 顯示兩層過濾後的總數

- `Past 14 days`
  - 資料提取方式：`record_palletinfo`中，，提取`product_code`及`generate_time`
  - `product_code`欄需先到`data_code`表中獲取`type`及`description`，只取`type`=`Pipe`
  - `generate_time`過濾剩日期＝過往14天的總數
  - 顯示兩層過濾後的總數

- `Top 10 Stock`
  - 固定位置Columns Header：[Product Code],[Description],[Latest Update],[Qty]
  - 資料提取方式：`stock_level`表提取`stock`,`stock_level`及`update_time`欄
  - [過濾1]: 只取各個`stock`的`update_time`欄，只取最新的一列
  - [過濾2]: `stock`欄到`data_code`表中獲取`type`及`description`，只取`type`=`Pipe`
  - 最終顯示兩重過濾後的
    - [Product Code]: `stock_level`表返回過濾`type`=`Material`後的`stock`
    - [Description]: `data_code`表返回的`description`
    - [Latest Update]: `stock_level`表過濾最新更新時間後的`update_time`
    - [Qty]: `stock_level`表返回的`stock_level`
  - 預設顯示7列數據，支援滾動向下展示餘下列數，最多顯示10列

- `Material Stock`
  - 固定位置Columns Header：[Material Code],[Description],[Latest Update],[Qty]
  - 資料提取方式：`stock_level`表提取`stock`,`stock_level`及`update_time`欄
  - [過濾1]: 只取各個`stock`的`update_time`欄為最新的一列
  - [過濾2]: `stock`欄到`data_code`表中獲取`type`及`description`，只取`type`=`Material`
  - 最終顯示兩重過濾後的
    - [Material Code]: `stock_level`表返回過濾`type`=`Material`後的`stock`
    - [Description]: `data_code`表返回的`description`
    - [Latest Update]: `stock_level`表過濾最新更新時間後後的`update_time`
    - [Qty]: `stock_level`表返回的`stock_level`（由高至低排列）
  - 預設顯示7列數據，支援滾動向下展示餘下列數，沒有最多顯示限制

- `Machine State`
  - 列表table固定位置Columns Header：`Machine Number`,`Latest Active time`,`State`
  - 固定顯示4列：`Machine No.01`,`Machine No.02`,`Machine No.03`,`Machine No.04`
  - 暫時`Latest Active time`,`State`全數顯示`N/A`

- `Coming Soon`
  - 無需顯示任何內容

# DepartWareCard Workflow and Dataflow

- `Today Transfered`區
  - 資料提取方式：`record_transfer`中，提取`tran_date`欄位
  - `tran_date`過濾日期＝當天
  - 顯示過濾後的總數
- `Past 7 days`區
  - 資料提取方式：`record_transfer`中，提取`tran_date`欄位
  - `tran_date`過濾日期＝過往7天
  - 顯示兩層過濾後的總數
- `Past 14 days`區
  - 資料提取方式：`record_transfer`中，提取`tran_date`欄位
  - `tran_date`過濾日期＝過往14天的總數
  - 顯示兩層過濾後的總數
- `Last 24 hours Activity`區
  - 列表固定位置Columns Header：[Time],[Staff],[Action],[Detail]
  - 資料提取方式：`recor_history`表提取`time`,`id`,`action`,`plt_num`及`remark`欄位
  - `Action`過濾＝`Stock Transfer`及`Loaded`
  - `time`過濾＝最後更新日期起計的過去24小時
  - `id`欄先到`data_id`表中獲取搜尋並返回`name`欄
  - 顯示
    - [Time]: `time`
    - [Staff]: `name`
    - [Action]: 過濾後的`Action`
    - [Detail]: `{plt_num}－{remark}`
  - 預設顯示7列數據，支援滾動向下展示餘下過去24小時記錄
- `Order Completion`區
  - 列表固定位置Columns Header：[Order],[Completion],[Latest Update]
  - 資料提取方式
    - `data_order`表提取`order_ref`,`product_qty`及`loaded_qty`欄
    - 利用`order_ref`，到`order_loading_history`表搜尋`order_ref`欄並返回`pallet_num`,`product_code`,`action_by`及`action_time`
    - 利用`pallet_num`到`record_palletinfo`，搜尋`plt_num`欄並返回`product_qty`欄
    - 利用`order_ref`，到`doc_upload`表，搜尋`doc_name`欄有包含{order_ref}的列，返回`doc_url`欄
    - 利用`product_code`，到`data_code`表，搜尋`code`欄並返回`description`欄
    - 利用`action_by`，到`data_id`表，搜尋`id`欄並返回`name`欄
  - 顯示
    - [Order]: `order_ref`
    - [Completion]: 「以進度bar形式」`product_qty`減去`loaded_qty`再除以`product_qty`的百分比
    - [Latest Update]: `action_time`
  - 列表支援點擊查看詳細資料
    - 點擊`Order`：用「全屏overlay + Dialog形式」預覽該`order_ref`的`doc_url`內容
    - 點擊`Completion`：用「全屏overlay + Dialog形式」，以列表形式預覽該`order_ref`的`Completion Detail`
      - `Completion Detail`列表預覽內容
        - Dialog標題：“`order_ref` Details“
        - 固定位置Columns Header：`Latest Update`,`Pallet Number`,`Pallet Detail`,`Pallet Quantity`,`Loaded By`
        - 顯示
          - [Latest Update]: `order_loading_history`表返回的`action_time`
          - [Pallet Number]: `order_loading_history`表返回的`pallet_num`
          - [Pallet Detail]: `data_code`表返回的`description`
          - [Pallet Quantity]: `record_palletinfo`表返回的`product_qty`
          - [Loaded By]: `data_id`表返回的`name`
  - 預設顯示7列數據，支援滾動向下展示餘下記錄
- 兩個`Coming Soon`區
  - 無需顯示任何內容

# DataUpdateCard Workflow and Dataflow

- 左邊區域設計圖

  ***

  ｜ ｜
  ｜ Search Product ｜
  ｜ **\*\*\*\***\_\_\_**\*\*\*\*** \***\*\_\_\_\_\*\*** ｜
  ｜ | (輸入欄) | | 搜尋/新增鍵 | ｜
  ｜ |**\*\*\*\***\_**\*\*\*\***| |\***\*\_\_\_\*\***| ｜
  ｜－－－－－－－－－－－－－－－－－－－－－---｜
  ｜ (數據顯示區域) ｜
  ｜ ｜
  ｜ [Code] ｜
  ｜ **\*\*\*\***\_\_\_**\*\*\*\*** ｜
  ｜ ｜**\*\*\*\***\_\_**\*\*\*\***｜ ｜
  ｜ ｜
  ｜ [Description] ｜
  ｜ **\*\*\*\***\_\_\_**\*\*\*\*** ｜
  ｜ ｜**\*\*\*\***\_\_**\*\*\*\***｜ ｜
  ｜ [Type] ｜
  ｜ **\*\*\*\***\_\_\_**\*\*\*\*** ｜
  ｜ ｜**\*\*\*\***\_\_**\*\*\*\***｜ ｜
  ｜ [Colour] ｜
  ｜ **\*\*\*\***\_\_\_**\*\*\*\*** ｜
  ｜ ｜**\*\*\*\***\_\_**\*\*\*\***｜ ｜
  ｜ [Standard Quntity Per Pallet] ｜
  ｜ **\*\*\*\***\_\_\_**\*\*\*\*** ｜
  ｜ ｜**\*\*\*\***\_\_**\*\*\*\***｜ ｜
  ｜ [Special notes] ｜
  ｜ **\*\*\*\***\_\_\_**\*\*\*\*** ｜
  ｜ ｜**\*\*\*\***\_\_**\*\*\*\***｜ ｜
  | **\*\*\*\***\_\_\_\_**\*\*\*\*** |
  | | 更新鍵／確定鍵 | |
  | |**\*\*\*\***\_\_\_**\*\*\*\***| |
  ｜********\*\*********\_\_\_********\*\*********|

- 初始時只顯示`輸入欄`及`Add`鍵
  - 用戶點擊`Add`鍵後
    - `數據顯示區域`顯示下列，及各自對應的一個空白inputbox
      - [Product Code]
      - [Product Description]
      - [Product Type]
      - [Colour]
      - [Standard Quntity Per Pallet]
      - [Special notes]
      - `Update`鍵
    - 用戶輸入及點擊`Update`鍵後，以「全屏overlay」提醒用戶"Confirm to all changes?"
    - 提供`Confirm`及`Cancel`鍵
      - 用戶點擊`Confirm`後執行更新
      - 用戶點擊`Cancel`後取消執行
    - 點擊`Confirm`後，利用用戶新提供的數據，到`data_id`新增一列，並根據用戶提供的各個值填入對應欄位

  - 假如用戶在`輸入欄`「開始輸入」，`Add`鍵則變更成`Search`鍵
    - 用戶在`輸入欄`輸入`product code`後，按下`Search`鍵開始搜尋
    - 令用`product code`，到`data_code`表搜尋`code`欄，並返回表內所有欄位
    - `數據顯示區域`以「List形式」顯示
      - [Product Code]: `code`欄
      - [Product Description]: `description`欄
      - [Product Type]: `type`欄
      - [Colour]: `colour`欄
      - [Standard Quntity Per Pallet]: `standard_qty`欄
      - [Special notes]: `remark`欄
      - `Update`鍵
    - 當資料顯示後，假如用戶點擊`Update`鍵
      - 將顯示的數據欄位，由「list」變成「inputbox」，並預填本身的數值
      - `Update`鍵變成`Confirm`鍵
    - 用戶更新數值及點擊`Confirm`鍵後，以「全屏overlay」提醒用戶"Confirm to all changes?"
      - 提供`Confirm`及`Cancel`鍵
        - 用戶點擊`Confirm`後執行更新
        - 用戶點擊`Cancel`後取消執行
    - 點擊`Confirm`後，利用用戶新提供的數據，到`data_id`搜尋`code`，並根據用戶提供的各個值更新各欄位

- 更新／新增後以「全屏overlay」提醒用戶"All changes are saved!"

- 右邊區域設計圖

  ***

  ｜ ｜
  ｜ Search Supplier ｜
  ｜ **\*\*\*\***\_\_\_**\*\*\*\*** \***\*\_\_\_\_\*\*** ｜
  ｜ | (輸入欄) | | 搜尋/新增鍵 | ｜
  ｜ |**\*\*\*\***\_**\*\*\*\***| |\***\*\_\_\_\*\***| ｜
  ｜－－－－－－－－－－－－－－－－－－－－－---｜
  ｜ (數據顯示區域) ｜
  ｜ ｜
  ｜ [Supplier Code] ｜
  ｜ **\*\*\*\***\_\_\_**\*\*\*\*** ｜
  ｜ ｜**\*\*\*\***\_\_**\*\*\*\***｜ ｜
  ｜ ｜
  ｜ [Supplier Name] ｜
  ｜ **\*\*\*\***\_\_\_**\*\*\*\*** ｜
  ｜ ｜**\*\*\*\***\_\_**\*\*\*\***｜ ｜
  | **\*\*\*\***\_\_\_\_**\*\*\*\*** |
  | | 更新鍵／確定鍵 | |
  | |**\*\*\*\***\_\_\_**\*\*\*\***| |
  ｜********\*\*********\_\_\_********\*\*********|

- 初始時只顯示`輸入欄`及`Add`鍵
  - 用戶點擊`Add`鍵後
    - `數據顯示區域`顯示下列，及各自對應的一個空白inputbox
      - [Supplier Code]
      - [Supplier Name]
      - `Update`鍵
    - 用戶輸入及點擊`Update`鍵後，以「全屏overlay」提醒用戶"Confirm to all changes?"
    - 提供`Confirm`及`Cancel`鍵
      - 用戶點擊`Confirm`後執行更新
      - 用戶點擊`Cancel`後取消執行
    - 點擊`Confirm`後，利用用戶新提供的數據，到`data_supplier`新增一列，並根據用戶提供的各個值填入對應欄位

  - 假如用戶在`輸入欄`「開始輸入」，`Add`鍵則變更成`Search`鍵
    - 用戶在`輸入欄`輸入`supplier code`後，按下`Search`鍵開始搜尋
    - 令用`supplier code`，到`data_supplier`表搜尋`supplier_code`欄，並返回表內所有欄位
    - `數據顯示區域`以「list」顯示
      - [Supplier Code]: `supplier_code`欄
      - [Supplier Description]: `supplier_name`欄
      - `Update`鍵
    - 當資料顯示後，假如用戶點擊`Update`鍵
      - 將顯示的數據欄位，由「list」變成「inputbox」，並預填本身的數值
      - `Update`鍵變成`Confirm`鍵
    - 用戶更新數值及點擊`Confirm`鍵後，以「全屏overlay」提醒用戶"Confirm to all changes?"
      - 提供`Confirm`及`Cancel`鍵
        - 用戶點擊`Confirm`後執行更新
        - 用戶點擊`Cancel`後取消執行
    - 點擊`Confirm`後，利用用戶新提供的數據，到`data_supplier`搜尋`supplier_code`，並根據用戶提供的各個值更新各欄位

- 更新／新增後以「全屏overlay」提醒用戶"All changes are saved!"

# StockLevelListAndChartCard Workflow and Dataflow

- 系統從`data_code`表`type`欄尋找所有唯一值 (需排除空白值及"-")，並放入dropdown inputbox
  - dropdown inputbox 只能點選，不可輸入
  - 只需加入提取的唯一值
  - 無需加入其他選項
  - 卡片初始時顯示：`Select Product From Below...`
- 用戶點選`目標Product Type`後，系統執行搜尋
  - 先到`stcok_level`表，過濾`stock`欄的所有唯一值，並到`data_code`過濾`type`欄＝用戶點選`目標Product Type`
  - Tab [List]
    - 利用過濾後的`stock`，到`stock_level`，獲取過濾後的`stock`「最後更新當天」的`stock_level`記錄(`update_time`欄)
    - 利用過濾後的`stock`，到`data_code`表，搜尋`code`欄，返回`description`欄
    - 以列表形式顯示
      - 固定位置Columns Header：[Code],[Description],[Latest Update],[Stock Level]
        - [Code]: `data_code`表返回的`code`
        - [Description]: `data_code`表返回的`description`
        - [Latest Update]: `stock_level`表返回的「最後更新日期」
        - [Stock Level]: `stock_level`表返回的「最後更新當天」的`stock_level`

  - Tab [Chart]
    - 利用過濾後的`stock`，到`stock_level`，獲取過濾後的`stock`「由當天日期起計過往21天」的`stock_level`記錄(`update_time`欄)
    - 如中間日期有缺失，則以對上日期填補
      - 例:Product A, 25號`stock_level`記錄＝100，之後26、27號沒有更新，直至28再更新成120
        - 即Product A 25至28號的`stock_level`記錄為：100,100,100,120
      - 以橫向折線圖顯示「查詢當天起計的過往21天」`stock_level`表返回的`stock_level`變化
      - 各個`data_code`表返回的`code`均需要以不同顏色顯示

  - 無需額外的filter，報表生成，手動更新，訂閱等功能

# StockHistoryCard Workflow and Dataflow

- `StockHistoryCard`內兩個tab: `Stock Search`及`Pallet Search`
  - Tab `Stock Search`
    - 用戶輸入`Product Code`(需忽略大小寫進行搜尋)
    - 先到`record_palletinfo`表，搜尋`product_code`整欄，並返回所有`plt_num`欄的`Pallet Number`
    - 利用所有返回的`Pallet Number`，到`record_history`表搜尋`plt_num`欄並返回`time`，`id`，`action`,`loc`, `reamrk`欄
    - 利用`id`欄返回值，到`data_id`表，搜尋`id`欄及返回`name`欄值
    - 最終顯示
      - [Time]: `record_history`表返回的`time`(YYYY-MMM-DD HH:MM)
      - [Operator Name]: `data_id`表返回的`name`
      - [Action]: `record_history`表返回的`action`
      - [Location]: `record_history`表返回的`loc`
      - [Remark]: `record_history`表返回的`remark`

  - Tab `Pallet Search`
    - 用戶輸入`Pallet Number`後，按下`Search`鍵進行搜尋該`Pallet Number`的完整歷史過程
      - 支援兩種輸入方式
        - 手動輸入`Pallet Number`
        - 經由掃瞄器/QR-Code Scanner輸入`series`，再返回`Pallet Number`進行搜尋
    - 資料提取方式
      1. 獲取`plt_num`
         - 假如輸入為`Pallet Number`：到到`record_palletinfo`，搜尋`plt_num`欄，並確認存在
         - 假如輸入為`series`：到`record_palletinfo`，搜尋`series`欄並返回`plt_num`欄
      2. 搜尋`Pallet History`
         - 利用`plt_num`，在`record_history`表內搜尋`plt_num`欄，並返回`time`,`id`,`action`,`loc`,`remark`欄位
         - `id`值需另外再到`data_id`表，搜尋`id`欄並返回`name`欄值
      3. 數據顯示
         - [Time]: `record_history`表返回的`time`
         - [Operator]: `data_id`表返回的`name`
         - [Action]: `record_history`表返回的`action`
         - [Location]: `record_history`表返回的`loc`
         - [Remark]: `record_history`表返回的`remark`
           -" "
         - (下一組History紀錄)

# QCLabelCard

- 用戶在`Product Code`欄輸入`product code`
- 輸入完畢後系統到`data_code`表的`code`欄，核對是否真實存在（搜尋需忽略大小寫）
  - 假如不存在：「全屏overlay」提示
    - "Product Code {product code} not exist."
    - "Please Check Again."
  - 假如存在，則自動將`product code`更改成`data_code`表的`code`內的真實大小寫
- 確實存在後，進一步查詢`data_code`表的`code`欄對應的`type`，`description`及`standard_qty`欄
  - 假如`type`="ACO"
    - 到`record_aco`表`code`欄尋找`product code`，尚未完成的`order_ref`
      - 「尚未完成的」判斷方法：`remain_qty`欄減`finished_qty`欄大於0」
      - 即`remain_qty`欄減`finished_qty`欄＝「`order_ref`尚未完成的數量「」
    - 顯示`ACO Order Reference`，供用戶選擇「尚未完成的`order_ref`」
      - 只能選擇，不能輸入
  - 假如`type`包含`Slate`字眼
    - 顯示`Batch Number` 輸入欄，供用戶輸入`batch number`
  - 在 `Quantity of Pallet`輸入欄，自動填入`data_code`表返回的`standard_qty`
- 「必須填寫」欄位 - `Product Code` - `Quantity of Pallet` - `Count of Pallet` - `ACO Order Reference`(假如`type`="ACO") - `Batch Number`(假如`type`包含`Slate`字眼)
  - 可選填欄位
    - `Operator Clock Number`
- 「必須填寫」欄位填妥後，方可點擊`Print`按鈕執行列印（`Print`按鈕預設為可視但不可點擊）

- 執行列印前必須檢查
  - 假如`type`="ACO"
    - 檢查`Quantity of Pallet`\*`Count of Pallet`，不大於「`order_ref`尚未完成的數量」
  - 以「全屏overlay」要求用戶輸入`User ID`作驗證
    - 用戶輸入後，需要`data_id`表搬尋`id`欄確認存在
      - 假如不存在：「全屏overlay」提示
        - "Not Authorized ID"
        - "Please Contact Your Supervisor."
        - 並停止執行下一步
- 執行列印流程(`unified-print-service.ts`)
  - 先到`pallet_number_buffer`表，由上而下搜尋`used`欄＝`False`的，並返回`pallet_number`欄的「可用Pallet Number」及`series`欄的「可用Series」
  - 例如`Count of Pallet`大於1，則取多個「可用的Pallet Number」
  - 執行現有的列印及上傳Supabase Storage的邏輯
  - 列印完成後，更新各個表格
    - `Count of Pallet`數值等於重覆執行次數
      - 在`record_palletinfo`，建立新一列
        - `plt_num`欄填入`pallet_number_buffer`表獲取「可用Pallet Number」
        - `product_code`欄填入`Product Code`
        - `series`欄填入`pallet_number_buffer`表獲取的「Series」
        - `plt_remark`欄
          - 假如`type`="ACO"，寫入"ACO Order Ref : {order_ref}"
          - 假如`type`包含`Slate`字眼，寫入"Batch Num : {batch number}"
          - 假如用戶有填寫`Operator Clock Number`inputbox，則填入`Operator Clock Number`
          - 否則只需填入`-`
        - `product_qty`欄填入`Quantity of Pallet`
        - `pdf_url`填入[上傳到Supabase Storage後獲取的PDF連結]

      - 在`record_history`，建立新一列
        - `id`欄填入用戶輸入的`User ID`
        - `action`欄填入`Finished QC`
        - `plt_num`欄填入`pallet_number_buffer`表獲取的「可用的Pallet Number」
        - `loc`欄填入`await`
      - 在`record_inventory`，建立新一列
        - `product_code`欄填入`Product Code`
        - `plt_num`欄填入`pallet_number_buffer`表獲取的「可用Pallet Number」
        - `await`欄填入`Quantity of Pallet`

      - 在`stock_level`，「按需要」建立新一列，或加上數值
        - 搜尋`stock`欄，如有符合`Product Code`及`update_time`欄日期等於當天（只需核對日期）
          - 在該列`stock_level`欄原有數值上加上`Quantity of Pallet`
          - `update_time`欄填入更新時間
        - 如沒有符合，則新增一列記錄
          - `stock`欄填入`Product Code`
          - `description`欄填入「`data_code`表獲取的`description`」
          - `stock_level`欄填入`Quantity of Pallet`
          - `update_time`欄填入更新時間

      - 在`work_level`，「按需要」建立新一列，或加上數值
        - 搜尋`id`欄，如有符合用戶輸入的`User ID`及`latest_update`欄日期等於當天（只需核對日期）
          - 在該列`qc`欄原有數值上加上1
          - `latest_update`欄填入更新時間
        - 如沒有符合，則新增一列記錄
          - `id`欄填入用戶輸入的`User ID`
          - `qc`欄填入1
          - `latest_update`欄填入更新時間

      - 假如`type`="ACO"
        - 在`record_aco`表搜尋`order_ref`欄＝{order_ref}，並在該列的`finished_qty`欄原來值上加上`Quantity of Pallet`

- 成功執行列印後，重設所有Inputbox
  - `Product Code`
  - `Quantity of Pallet`
  - `Count of Pallet`
  - `ACO Order Reference`
  - `Batch Number`
  - `Operator Clock Number`

# VerticalTimelineCard

- 在`record_history`表中，搜尋所有記錄並以下邏輯整合
- `id`先到`data_id`表搜尋`id`欄其返回`name`
- 整合時間想近的同類操作
  - 例如
    - `5997` name = `Alex`
    - `6666` name = `Alan`
    - `6001` name = `Alice`
    - `7777` name = `Tracy
    - `record_history`表中
      - `id`欄＝`5997`, `time`欄＝`07－08－2025，在13：31`，`action`欄=`Finished QC`,`plt_num`欄=`070825/1`,`remark`欄＝`-`
      - `id`欄＝`5997`, `time`欄＝`07－08－2025，在13：32`，`action`欄=`Finished QC`,`plt_num`欄=`070825/2`,`remark`欄＝`-`
      - `id`欄＝`5997`, `time`欄＝`07－08－2025，在13：33`，`action`欄=`Finished QC`,`plt_num`欄=`070825/3`,`remark`欄＝`-`
      - `id`欄＝`5997`, `time`欄＝`07－08－2025，在13：34`，`action`欄=`Finished QC`,`plt_num`欄=`070825/4`,`remark`欄＝`-`
      - `id`欄＝`6666`, `time`欄＝`07－08－2025，在13：35`，`action`欄=`Finished QC`,`plt_num`欄=`070825/5`,`remark`欄＝`-`
      - `id`欄＝`6666`, `time`欄＝`07－08－2025，在13：36`，`action`欄=`Finished QC`,`plt_num`欄=`070825/6`,`remark`欄＝`-`
      - `id`欄＝`7777`, `time`欄＝`07－08－2025，在13：37`，`action`欄=`Finished QC`,`plt_num`欄=`070825/7`,`remark`欄＝`-`
      - `id`欄＝`6666`, `time`欄＝`07－08－2025，在13：38`，`action`欄=`Finished QC`,`plt_num`欄=`070825/8`,`remark`欄＝`-`
      - `id`欄＝`6666`, `time`欄＝`07－08－2025，在13：39`，`action`欄=`Finished QC`,`plt_num`欄=`070825/9`,`remark`欄＝`-`
      - `id`欄＝`5997`, `time`欄＝`07－08－2025，在13：40`，`action`欄=`Stock Transfer`,`plt_num`欄=`070825/10`,`remark`欄＝`await > fold mill`
      - `id`欄＝`5997`, `time`欄＝`07－08－2025，在13：41`，`action`欄=`Finished QC`,`plt_num`欄=`070825/11`,`remark`欄＝`-`
      - `id`欄＝`6001`, `time`欄＝`07－08－2025，在13：42`，`action`欄=`Order Upload`,`plt_num`欄=`070825/11`,`remark`欄＝`12345`
      - `id`欄＝`6001`, `time`欄＝`07－08－2025，在13：43`，`action`欄=`Order Upload`,`plt_num`欄=`070825/11`,`remark`欄＝`67890`
  - 整合成
    - [`Alex`] - [`Finished QC` x 4] - [`070825/1 - 070825/4`] - [`07-Aug-2025 13:31-13:34`]
    - [`Alan`] - [`Finished QC` x 2] - [`070825/5 - 070825/6`] - [`07-Aug-2025 13:35-13:36`]
    - [`Tracy`] - [`Finished QC` x 1] - [`070825/7`] - [`07-Aug-2025 13:37`]
    - [`Alan`] - [`Finished QC` x 1] - [`070825/8 - 070825/9`] - [`07-Aug-2025 13:38-13:39`]
    - [`Alex`] - [`Stock Transfer` x 1] - [`070825/10`] - [`await > fold mill`] - [`07-Aug-2025 13:40`]
    - [`Alex`] - [`Finished QC` x 1] - [`070825/11`] - [`07-Aug-2025 13:41`]
    - [`Alice`] - [`Order Upload` x 2] - [`12345,67890`] - [`07-Aug-2025 13:42-13:43`]

- 支援用戶以手動輸入方式進行資料過濾
  - 可過濾欄位:「`id`或`name`」，「`action`」，「`plt_num`」
  - 用戶可直接輸入`5997`或`Alex`，過濾所有`Alex`的操作
- 支援滾動往下查看更多記錄
  - 預設顯示「合併後」的10列記錄
  - 往下滾動顯示多10列「合併後」的記錄
  - 最多顯示100列「合併後」的記錄

- `StockTransferCard` UI設計圖

  ***

  | **\*\*\*\***\_\_\_\_**\*\*\*\*** **\*\*\*\***\_\_\_**\*\*\*\*** **\*\*\*\***\_\_\_**\*\*\*\*** |
  | | (id/name filter) | | (action filter) | | (plt num filter) | |
  | |**\*\*\*\***\_\_**\*\*\*\***| |**\*\*\*\***\_**\*\*\*\***| |**\*\*\*\***\_\_**\*\*\*\***| |
  | ******************\*\*******************\_\_\_******************\*\******************* |
  | | ******\*\*******\_\_\_\_******\*\******* | | |
  | | |[`Alex`] - [`Finished QC` x 4]| | | |
  | | |[`070825/1 - 070825/4`] |---| ******\*\*\*\*******\_\_******\*\*\*\******* | |
  | | |[`07-Aug-2025 13:31-13:34`] | | |[`Alan`] - [`Finished QC` x 2] | | |
  | | |******\*\*******\_\_******\*\*******| | |[`070825/5 - 070825/6`] | | |
  | | ******\*\*******\_\_\_\_******\*\******* |---|[`07-Aug-2025 13:35-13:36`] | | |
  | | | | | |******\*\*\*\*******\_******\*\*\*\*******| | |
  | | | |---| ******\*\*\*\*******\_\_******\*\*\*\******* | |
  | | |******\*\*******\_\_******\*\*******| | | | | |
  | | ******\*\*******\_\_\_\_******\*\******* |---| | | |
  | | | | | |******\*\*\*\*******\_******\*\*\*\*******| | |
  | | | |---| ******\*\*\*\*******\_\_******\*\*\*\******* | |
  | | |******\*\*******\_\_******\*\*******| | | | | |
  | | ******\*\*******\_\_\_\_******\*\******* |---| | | |
  | | | | | |******\*\*\*\*******\_******\*\*\*\*******| | |
  | | | |---| ******\*\*\*\*******\_\_******\*\*\*\******* | |
  | | |******\*\*******\_\_******\*\*******| | | | | |
  | | ******\*\*******\_\_\_\_******\*\******* |---| | | |
  | | | | | |******\*\*\*\*******\_******\*\*\*\*******| | |
  | | | |---| ******\*\*\*\*******\_\_******\*\*\*\******* | |
  | | |******\*\*******\_\_******\*\*******| | | | | |  
   | |********\*\*********\_\_********\*\*********|**\_|****\*\*\*\*******\_\_\_******\*\*\*\*******|\_| |
  |******************\*\*\*\*******************\_\_\_******************\*\*\*\*******************|

- 檢討現時`StockTransferCard`流程是否有過度工程化

# StockTranfardCard

- UI設計圖
  ┌────────────────────────────────────────────────────────────────────────────┐
  │ Stock Transfer - Transfer stock between locations │
  ├────────────────────────────────────────────────────────────────────────────┤
  │ Select Destination Verify Operator │
  │ ┌───────────────────────────────────────────────┐ ┌─────────────────┐ │
  │ │ (●) Fold Mill (○) Production (○) PipeLine │ │ clock Number | │
  │ └───────────────────────────────────────────────┘ └─────────────────┘ │
  ├────────────────────────────────────────────────────────────────────────────┤
  │ Scan / Search Pallet │
  │ ┌────────────────────────────────────────────────────────────────────────┐ │
  │ │ [ Enter or scan pallet number] │ │
  │ └────────────────────────────────────────────────────────────────────────┘ │
  ├────────────────────────────────────────────────────────────────────────────┤
  │ Transfer Log │
  │ ┌────────────────────────────────────────────────────────────────────────┐ │
  │ │ [ Transfer records ] │ │
  │ │ │ │
  │ │ │ │
  │ │ │ │
  │ │ │ │
  │ │ │ │
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
    │ [ Error ] │
    │ [ Reason : Vaild Transfer ] │
    │ [ Deatils : `簡單描述非法轉移內容`] │
    │ │
    │ ┌─────────────┐ │
    │ │ Confime | │
    │ └─────────────┘ │
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

-

## RPC Function List

- QCLabelCard
  - process_qc_label_unified
