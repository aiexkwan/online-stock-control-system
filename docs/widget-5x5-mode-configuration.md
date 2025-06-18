1. 完成Document Management Widget調整, 記錄到docs\todoList.md

2. 移除Overview widget, 開始調整Report Center Widget的各模式下的顯示

3. 先移除現有Widget內的所有quick access

4. 將/admin 頁面導航欄的report內的各個功能, 各自作成一個quick access放到Widget內
- "Void Pallet Report"
- "Order Loading Report"
- "Stock Take Report"
- "ACO Order Report"
- "Transaction Report"
- "GRN Report"
- "Export All Date"

4. 1x1 模式
- 不支援

5. 3x3 模式
- 只提供"Order Loading Report", "GRN Report","Transaction Report","ACO Order Report"
- 以 2x2 排列

6. 5x5 模式
- 提供所有Report Center Widget可用quick access
- 以 2X5 排列

7. 需加入column header

8. 顯示格式 : {created_at} - {doc_name} - {upload_by}

註 : 要為現時所有的文件上傳功能加入寫入記錄至doc_upload表
- 現時所有的文件上傳功能 : order pdf upload, product spec upload


顯示成功

更新 {upload_by} - 利用USER ID 到 data_id 尋找name欄的用戶名稱

更新 5x5 模式的顯示格式 : {created_at} - {doc_name} - {file_size} - {upload_by}


上,中,下3個

為免date range太長時間, 假如product code太多會有混亂
- 只需將top 3 的product code制成

7. 顯示record_palletinfo記錄條件 : 只顯示plt_remark="Finished In Production"

8. 顯示格式 : {product_code} - {product_qty}

Output Widget Data: {palletCount: 15, productCodeCount: 2, totalQuantity: 405, productDetailsLength: 2, productDetails: Array(2)}palletCount: 15productCodeCount: 2productDetails: (2) [{…}, {…}]productDetailsLength: 2totalQuantity: 405[[Prototype]]: Object


更新5x5 模式下顯示格式 : {time} - {action} - {id} - {plt_num} - {remark}


1. ans in Cantonese

2. 仍有問題 
- 有INVENTROY數據返回, 有返回各LOC 的 QTY
-但折線圖沒有任何顯示
-即使沒有訂單RELATED QTY返回, 亦應返回過往7天的各LOC QTY總和



數據有問題
- 庫存量應是record_inventory表, latest_update作時間範圍, 存量應是根據時間範圍, injection + pipeline + prebook + await + await_grn + fold + bulk + backcarpark既總和
- 訂單量應是data_order表, created_at作時間範圍, 訂單量=product_qty根據時間範圍的總和
- 記住record_aco 表唔係全部訂單紀錄, 只係"aco"呢個客戶既訂單