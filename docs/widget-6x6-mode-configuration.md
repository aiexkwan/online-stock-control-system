完成Document Management Widget調整, 記錄到docs\todoList.md

移除Widget及相關
－Stats Card
－Pallet Overview
－Analytics Dashboard

開始調整各個widget 6x6 模式下的顯示方式

Finished Product Widget
－widget內的圖表跟數據表位置上下對調
－數據表加上columns header
－數據表跟圖表比例因為1：2

Inventory Search Widget
－數據表改成以list方式顯示，並加上columns header
－數據表跟圖表比例因為1：2

－ 所有widget的內容調整完成
－ 現統一所有widget在2x2，4x4，6x6的風格
－ 一律採用透明背景
－ 數據表使用紫色字體，圖表則使用綠色字體
－ 透光邊框（但各個widget都需不一樣，顏色你可以幫我決定）
－ quick access 可自由採用顏色（你可以幫我決定）


先移除現有Widget內的所有quick access

將/admin 頁面導航欄的report內的各個功能, 各自作成一個quick access放到Widget內
- "Void Pallet Report"
- "Order Loading Report"
- "Stock Take Report"
- "ACO Order Report"
- "Transaction Report"
- "GRN Report"
- "Export All Date"

繼續微調widget顯示方式
Void Statistics widget  

對應table：report_void，record_palletinfo
（需利用report_void表的plt_num，到record_palletinfo尋找product_code）

1. 1x1 模式
- 無需顯示icon，只顯示細文字及數據

2. 3x3 模式
- 取消顯示Total Voids及Total Qty
- 顯示損毀統計資料
- 顯示格式 : {time} - {product_code} - {damage_qty}

6. 5x5 模式
- 取消顯示Total Voids及Total Qty
- 顯示損毀統計資料
- 顯示格式 : {time} - {product_code} - reason｝－ {damage_qty}

7. 需加入column header

8. 顯示格式 : {created_at} - {doc_name} - {upload_by}

註 : 要為現時所有的文件上傳功能加入寫入記錄至doc_upload表
- 現時所有的文件上傳功能 : order pdf upload, product spec upload


顯示成功

更新 {upload_by} - 利用USER ID 到 data_id 尋找name欄的用戶名稱

更新 6x6 模式的顯示格式 : {created_at} - {doc_name} - {file_size} - {upload_by}


上,中,下3個

為免date range太長時間, 假如product code太多會有混亂
- 只需將top 3 的product code制成

7. 顯示record_palletinfo記錄條件 : 只顯示plt_remark="Finished In Production"

8. 顯示格式 : {product_code} - {product_qty}

Output Widget Data: {palletCount: 15, productCodeCount: 2, totalQuantity: 405, productDetailsLength: 2, productDetails: Array(2)}palletCount: 15productCodeCount: 2productDetails: (2) [{…}, {…}]productDetailsLength: 2totalQuantity: 405[[Prototype]]: Object


更新6x6 模式下顯示格式 : {time} - {action} - {id} - {plt_num} - {remark}


1. ans in Cantonese

2. 仍有問題 
- 有INVENTROY數據返回, 有返回各LOC 的 QTY
-但折線圖沒有任何顯示
-即使沒有訂單RELATED QTY返回, 亦應返回過往7天的各LOC QTY總和



數據有問題
- 庫存量應是record_inventory表, latest_update作時間範圍, 存量應是根據時間範圍, injection + pipeline + prebook + await + await_grn + fold + bulk + backcarpark既總和
- 訂單量應是data_order表, created_at作時間範圍, 訂單量=product_qty根據時間範圍的總和
- 記住record_aco 表唔係全部訂單紀錄, 只係"aco"呢個客戶既訂單

