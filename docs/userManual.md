# 用戶手冊 / User Manual

本手冊提供系統主要功能的前端操作流程。
This manual provides the front-end operation flows for the main functions of the system.

---

## 1. 系統登入與導航 / System Login and Navigation

### 中文操作流程

#### 登入
1.  開啟瀏覽器並進入系統的 `/main-login` 頁面。
2.  輸入你的 `@pennineindustries.com` 域名郵箱和密碼。
3.  點擊「登入」按鈕。
4.  成功登入後，系統會先跳轉至 `/access` 頁面，然後在3秒後自動跳轉到主頁 `/home`。

#### 註冊 (新用戶)
1.  在 `/main-login` 頁面，點擊「註冊」相關連結，進入 `/main-login/register` 頁面。
2.  填寫註冊表格，確保使用 `@pennineindustries.com` 域名郵箱。
3.  提交表單後，檢查你的郵箱，點擊郵件中的確認連結以啟用帳戶。

#### 全局導航 (登入後)
1.  **主導航欄 (`GlobalHeader`)**: 成功登入後，頁面頂部會顯示全局導航欄。
    *   **左側漢堡選單**: 將滑鼠懸停在左上角的漢堡圖示 (三條橫線) 上，選單會自動展開。你可以點選以下功能：
        *   Home (主頁)
        *   Print Labels (列印QC標籤)
        *   Print GRN Labels (列印GRN標籤)
        *   Stock Transfer (庫存轉移)
        *   Admin Panel (管理員面板)
    *   **中央區域**: 顯示時間相關的問候語 (如 "Good Morning") 和你的用戶名。
    *   **右側登出**: 點擊紅色的登出按鈕即可安全退出系統。

#### 管理員面板導航 (`/admin`)
1.  透過全局導航欄進入「Admin Panel」。
2.  在 Admin Panel 頁面，全局導航欄下方會有一個專屬的二級導航欄。
3.  將滑鼠懸停在二級導航欄的主功能項 (例如 "Export Reports", "User Management") 上，相關的子功能選單會自動展開供你選擇。

## 2. 列印 QC 標籤 (正常流程) / Print QC Label (Normal)

1.  **導航**: 透過全局導航欄進入「Print Labels」頁面 (`/print-label`)。
2.  **輸入產品資訊**: 在「Pallet Details」或類似卡片中，輸入「Product Code」(產品代碼)、「Quantity」(每板數量)、「Count」(板數)等必要資訊。
3.  **確認操作員身份**: 點擊「Print Label」(列印標籤)按鈕後，會彈出身份確認對話框，請輸入你的「Clock Number」(工號)。
4.  **執行列印**: 確認工號後，系統會開始處理並產生標籤。瀏覽器的列印對話框會自動彈出，確認列印即可。
5.  **查看進度**: 頁面上的進度條 (`ProgressSection`) 會顯示每個棧板標籤的處理狀態。


### English User Steps
1.  **Navigate**: Access the "Print Labels" page (`/print-label`) via the global navigation bar.
2.  **Enter Product Information**: In the "Pallet Details" card (or similar), enter the required information such as "Product Code", "Quantity" (per pallet), and "Count" (number of pallets).
3.  **Confirm Operator Identity**: After clicking the "Print Label" button, an identity confirmation dialog will appear. Enter your "Clock Number".
4.  **Execute Print**: After confirming your clock number, the system will process and generate the labels. Your browser's print dialog will open automatically; confirm to print.
5.  **View Progress**: The progress bar (`ProgressSection`) on the page will display the processing status for each pallet label.

---

## 3. 列印 QC 標籤 (ACO 訂單流程) / Print QC Label (ACO Order)

### 中文操作流程
1.  **導航與產品輸入**: 進入「Print Labels」頁面 (`/print-label`)。輸入「Product Code」。如果系統識別為 ACO 產品，ACO 訂單相關的表單區塊會自動顯示。
2.  **處理 ACO 訂單資訊**:
    *   輸入或選擇「ACO Order Reference」(ACO訂單參考號)。
    *   如果選擇現有訂單，系統會顯示該產品在此訂單的剩餘數量。
    *   如果是新訂單，你需要輸入該訂單的詳細產品和數量。
3.  **輸入列印數量**: 輸入本次要列印的「Quantity」(每板數量) 和「Count」(板數)。系統會檢查是否超出訂單剩餘量 (如適用)。
4.  **確認操作員身份**: 點擊「Print Label」按鈕後，輸入「Clock Number」。
5.  **執行列印與查看進度**: 確認後，系統產生標籤並觸發列印。透過進度條查看狀態。

### English User Steps
1.  **Navigate & Product Input**: Go to the "Print Labels" page (`/print-label`). Enter the "Product Code". If the system identifies it as an ACO product, form sections related to ACO orders will appear.
2.  **Process ACO Order Information**:
    *   Enter or select the "ACO Order Reference".
    *   If an existing order is selected, the system will display the remaining quantity for that product in the order.
    *   For a new order, you will need to input the detailed products and quantities for that order.
3.  **Enter Print Quantity**: Input the "Quantity" (per pallet) and "Count" (number of pallets) for the current print job. The system will check for excess if it's an existing order.
4.  **Confirm Operator Identity**: After clicking "Print Label", enter your "Clock Number".
5.  **Execute Print & View Progress**: After confirmation, the system generates labels and triggers printing. Monitor status via the progress bar.

---

## 4. 列印 QC 標籤 (Slate 產品流程) / Print QC Label (Slate Product)

### 中文操作流程
1.  **導航與產品輸入**: 進入「Print Labels」頁面 (`/print-label`)。輸入「Product Code」。如果系統識別為 Slate 產品，一個簡化的表單區塊會自動顯示。
2.  **輸入 Slate 產品資訊**:
    *   輸入「Batch Number」(批次號碼) – 此為 Slate 產品的核心必填項。
    *   輸入「Quantity」(每板數量)。
    *   「Count」(板數) 通常會被系統自動設為1或建議為1。
3.  **確認操作員身份**: 點擊「Print Label」按鈕後，輸入「Clock Number」。
4.  **執行列印與查看進度**: 確認後，系統產生標籤並觸發列印。透過進度條查看狀態。

### English User Steps
1.  **Navigate & Product Input**: Go to the "Print Labels" page (`/print-label`). Enter the "Product Code". If identified as a Slate product, a simplified form section will appear.
2.  **Enter Slate Product Information**:
    *   Enter the "Batch Number" – this is the core required field for Slate products.
    *   Enter the "Quantity" (per pallet).
    *   The "Count" (number of pallets) is typically automatically set to 1 or suggested as 1 by the system.
3.  **Confirm Operator Identity**: After clicking "Print Label", enter your "Clock Number".
4.  **Execute Print & View Progress**: After confirmation, the system generates labels and triggers printing. Monitor status via the progress bar.

---

## 5. 列印 GRN 標籤 / Print GRN Label

### 中文操作流程
1.  **導航**: 透過全局導航欄進入「Print GRN Labels」頁面 (`/print-grnlabel`)。
2.  **填寫 GRN 詳細資訊**:
    *   輸入「GRN Number」(收貨單號)。
    *   輸入「Material Supplier」(物料供應商代碼)，系統會自動驗證。
    *   輸入「Product Code」(產品代碼)，系統會自動驗證。
3.  **選擇托盤與包裝類型**: 從提供的選項中選擇「Pallet Type」(托盤類型) 和「Package Type」(包裝類型)。
4.  **輸入重量資訊**: 在右側的「Weight Input Section」(重量輸入區)，逐個輸入每個托盤的「Gross Weight」(毛重)。系統會自動計算並顯示「Net Weight」(淨重)。
5.  **確認操作員身份**: 所有資訊填寫完畢後，點擊「Print GRN Label(s)」按鈕，然後在彈出的對話框中輸入你的「Clock Number」。
6.  **執行列印**: 確認後，系統處理請求，產生標籤並觸發瀏覽器列印。

### English User Steps
1.  **Navigate**: Access the "Print GRN Labels" page (`/print-grnlabel`) via the global navigation bar.
2.  **Fill GRN Details**:
    *   Enter the "GRN Number".
    *   Enter the "Material Supplier" code; the system will auto-validate.
    *   Enter the "Product Code"; the system will auto-validate.
3.  **Select Pallet & Package Types**: Choose the "Pallet Type" and "Package Type" from the provided options.
4.  **Enter Weight Information**: In the "Weight Input Section" on the right, enter the "Gross Weight" for each pallet one by one. The system will automatically calculate and display the "Net Weight".
5.  **Confirm Operator Identity**: Once all information is filled, click the "Print GRN Label(s)" button, then enter your "Clock Number" in the confirmation dialog.
6.  **Execute Print**: After confirmation, the system processes the request, generates labels, and triggers browser printing.

---

## 6. 庫存轉移 / Stock Transfer

### 中文操作流程
1.  **導航**: 透過全局導航欄進入「Stock Transfer」頁面 (`/stock-transfer`)。搜尋框會自動聚焦。
2.  **輸入/掃描棧板資訊**: 在搜尋框中手動輸入完整的「Pallet Number」(棧板號碼，如 `ddMMyy/N`) 或「Series Number」(系列號，如 `ddMMyy-XXXXXX`)，或使用 QR Code 掃描器掃描。
3.  **系統自動處理**:
    *   輸入完成後 (失焦或按 Enter)，系統會自動搜尋棧板資訊並顯示其當前位置。
    *   系統會根據預設規則自動計算目標位置。
4.  **確認操作員身份**: 彈出身份確認對話框，請輸入你的「Clock Number」。
5.  **自動執行轉移**: 確認工號後，轉移操作會自動執行。
6.  **查看結果**: 頁面會顯示操作成功或失敗的訊息。成功後，搜尋框會清空並重新聚焦，以便進行下一次操作。

### English User Steps
1.  **Navigate**: Access the "Stock Transfer" page (`/stock-transfer`) via the global navigation bar. The search input will be auto-focused.
2.  **Enter/Scan Pallet Information**: In the search box, manually enter the full "Pallet Number" (e.g., `ddMMyy/N`) or "Series Number" (e.g., `ddMMyy-XXXXXX`), or scan the QR code.
3.  **System Auto-Processing**:
    *   After input is complete (on blur or Enter), the system automatically searches for pallet information and displays its current location.
    *   The system will automatically calculate the target location based on predefined rules.
4.  **Confirm Operator Identity**: An identity confirmation dialog will appear; enter your "Clock Number".
5.  **Automatic Transfer Execution**: After confirming your clock number, the transfer operation will be executed automatically.
6.  **View Results**: The page will display a success or failure message. Upon success, the search box will be cleared and re-focused for the next operation.

---

## 7. 匯出報表 (ACO, GRN, 交易報表) / Export Reports (ACO, GRN, Transaction)

### 中文操作流程
1.  **導航**: 進入「Admin Panel」(管理員面板)，然後找到「Export Reports」相關功能區塊；或者直接訪問 `/export-report` 頁面 (如果系統這樣設計)。
2.  **選擇報表類型**:
    *   **ACO Order Report**: 點擊「ACO Order Report」按鈕。在彈出對話框中選擇一個「ACO Order Reference」(ACO訂單參考號)。
    *   **GRN Report**: 點擊「GRN Report」按鈕。在彈出對話框中選擇一個「GRN Reference Number」(GRN參考號)。
    *   **Transaction Report**: 點擊「Transaction Report」按鈕。在彈出對話框中選擇「Start Date」(開始日期) 和「End Date」(結束日期)，預設為昨天。
3.  **產生與下載**: 選擇完參數後，點擊「Generate Report」(或類似)按鈕。系統會在後端處理數據並產生 Excel 檔案，然後自動觸發瀏覽器下載。
4.  **查看通知**: 留意 Toast 通知以了解匯出進度和結果。

### English User Steps
1.  **Navigate**: Go to the "Admin Panel", then find the "Export Reports" section; or directly access the `/export-report` page (if designed this way).
2.  **Select Report Type**:
    *   **ACO Order Report**: Click the "ACO Order Report" button. In the dialog, select an "ACO Order Reference".
    *   **GRN Report**: Click the "GRN Report" button. In the dialog, select a "GRN Reference Number".
    *   **Transaction Report**: Click the "Transaction Report" button. In the dialog, select a "Start Date" and "End Date"; defaults to yesterday.
3.  **Generate & Download**: After selecting parameters, click the "Generate Report" (or similar) button. The system will process data backend and generate an Excel file, which will then automatically trigger a browser download.
4.  **Check Notifications**: Look for Toast notifications for export progress and results.

---

## 8. 資料匯出 (所有數據) / Export All Data

### 中文操作流程
1.  **導航**: 進入「Admin Panel」(管理員面板)。
2.  **觸發功能**: 在「Export Reports」(或類似)類別下，點擊「Export All Data」選項。
3.  **選擇表格**: 在彈出的對話框中，勾選一個或多個你希望匯出的資料庫表格 (例如 Pallet Information, Code List, Operation History 等)。
4.  **設定日期範圍 (如需要)**:
    *   如果選擇的表格旁邊有「Requires Date Range」橙色標籤 (例如 Operation History, Full Inventory)，則日期範圍設定區塊會自動顯示。
    *   選擇「Start Date」(開始日期) 和「End Date」(結束日期)。注意：日期範圍通常有一個最大限制 (例如31天)。
5.  **產生報告**: 點擊「Generate Report」(或類似)按鈕。
6.  **下載文件**: 系統會為每個選中的表格分別產生一個 CSV 檔案，並逐個觸發瀏覽器下載。
7.  **查看通知與完成**: 留意 Toast 通知匯出進度。完成後，對話框會自動關閉。

### English User Steps
1.  **Navigate**: Go to the "Admin Panel".
2.  **Trigger Function**: Under the "Export Reports" (or similar) category, click the "Export All Data" option.
3.  **Select Tables**: In the dialog that appears, check the box(es) for one or more database tables you wish to export (e.g., Pallet Information, Code List, Operation History).
4.  **Set Date Range (if needed)**:
    *   If a selected table has an orange "Requires Date Range" label next to it (e.g., Operation History, Full Inventory), the date range selection area will appear.
    *   Select a "Start Date" and "End Date". Note: There's usually a maximum limit for the date range (e.g., 31 days).
5.  **Generate Report**: Click the "Generate Report" (or similar) button.
6.  **Download Files**: The system will generate a separate CSV file for each selected table and trigger browser downloads sequentially.
7.  **Check Notifications & Finish**: Look for Toast notifications for export progress. The dialog will close automatically upon completion.

---

## 9. 作廢棧板 / Void Pallet

### 中文操作流程
1.  **導航**: 進入「Admin Panel」(管理員面板)。
2.  **開啟作廢對話框**: 點擊「Void Pallet」選項，作廢棧板的對話框會彈出。
3.  **搜尋棧板**: 在對話框的搜尋欄中輸入「Pallet Number」或「Series Number」。輸入完成後，失焦或按 Enter 鍵會自動開始搜尋。
4.  **確認資訊與選擇原因**:
    *   系統顯示找到的棧板資訊。
    *   從下拉列表中選擇一個「Void Reason」(作廢原因)。
    *   輸入你的密碼或「Clock Number」進行身份驗證。
5.  **執行作廢**: 點擊「Void Pallet」(或類似)按鈕。
    *   **特殊棧板處理**:
        *   如果作廢的是 ACO 訂單棧板，系統會自動將作廢數量加回到對應 ACO 訂單的剩餘數量中。
        *   如果作廢的是 Material GRN 棧板，系統會自動刪除相關的 GRN 記錄。
    *   **自動重印 (如適用)**: 如果選擇的作廢原因是「Damage」(損壞)、「Wrong Qty」(數量錯誤)或「Wrong Product Code」(產品代碼錯誤)：
        1.  原棧板作廢後，會彈出「Reprint Information」(重印資訊)對話框。
        2.  根據提示輸入修正後的資訊 (例如：損壞後的剩餘數量、正確的數量、正確的產品代碼)。
        3.  確認後，系統會自動產生並下載帶有新棧板號和修正資訊的標籤 PDF。
6.  **查看結果**: 頁面會通過 Toast 通知操作結果。成功後，對話框通常會自動關閉。

### English User Steps
1.  **Navigate**: Go to the "Admin Panel".
2.  **Open Void Dialog**: Click the "Void Pallet" option; the void pallet dialog will appear.
3.  **Search Pallet**: In the dialog's search bar, enter the "Pallet Number" or "Series Number". The search will trigger automatically on blur or when Enter is pressed.
4.  **Confirm Information & Select Reason**:
    *   The system will display information for the found pallet.
    *   Select a "Void Reason" from the dropdown list.
    *   Enter your password or "Clock Number" for identity verification.
5.  **Execute Void**: Click the "Void Pallet" (or similar) button.
    *   **Special Pallet Handling**:
        *   If voiding an ACO order pallet, the system automatically adds the voided quantity back to the `remain_qty` of the corresponding ACO order.
        *   If voiding a Material GRN pallet, the system automatically deletes the related GRN record.
    *   **Auto-Reprint (if applicable)**: If the selected void reason is "Damage", "Wrong Qty", or "Wrong Product Code":
        1.  After the original pallet is voided, a "Reprint Information" dialog will appear.
        2.  Enter the corrected information as prompted (e.g., remaining quantity after damage, correct quantity, correct product code).
        3.  Upon confirmation, the system will automatically generate and download a new label PDF with a new pallet number and the corrected information.
6.  **View Results**: The system will indicate the operation's outcome via Toast notification. Upon success, the dialog will typically close automatically.

---

## 10. 查看歷史記錄 / View History

### 中文操作流程
1.  **導航**: 進入「Admin Panel」(管理員面板)。
2.  **觸發功能**: 點擊「View History」(查看歷史記錄)或類似選項。
3.  **顯示對話框**: 「View History Dialog」(查看歷史記錄對話框)會彈出。
4.  **輸入查詢條件**: 在對話框的搜尋框中輸入「Pallet Number」(棧板號碼) 或「Series Number」(系列號)。輸入值會自動轉為大寫。
5.  **執行搜尋**: 按 Enter 鍵或點擊搜尋按鈕 (如果存在)。系統會顯示載入狀態。
6.  **查看結果**:
    *   搜尋完成後，結果會在對話框內以三欄 (棧板資訊、操作歷史時間軸、庫存資訊) 或響應式佈局顯示。
    *   搜尋框會被隱藏，並顯示一個「New Search」(新的搜尋)按鈕。
    *   如果未找到記錄或發生錯誤，會顯示相應提示。
7.  **新的搜尋或關閉**: 點擊「New Search」按鈕可以清空當前結果並重新搜尋。點擊關閉按鈕可關閉對話框。

### English User Steps
1.  **Navigate**: Go to the "Admin Panel".
2.  **Trigger Function**: Click the "View History" or similar option.
3.  **Dialog Appears**: The "View History Dialog" will pop up.
4.  **Enter Search Query**: In the dialog's search box, enter the "Pallet Number" or "Series Number". The input will be auto-capitalized.
5.  **Execute Search**: Press Enter or click the search button (if present). A loading state will be displayed.
6.  **View Results**:
    *   Once the search is complete, the results will be displayed within the dialog, typically in a three-column layout (Pallet Information, Operation History Timeline, Stock Information) or a responsive layout.
    *   The search input area will be hidden, and a "New Search" button will appear.
    *   Appropriate messages will be shown if no records are found or if an error occurs.
7.  **New Search or Close**: Click the "New Search" button to clear current results and perform a new search. Click the close button to dismiss the dialog.

---

## 11. 資料庫更新 (產品主檔) / Database Update (Product Master)

### 中文操作流程

#### 更新現有產品
1.  **導航與搜尋**: 進入產品更新頁面 (例如，從 Admin Panel 進入「Product Update」，通常對應 `/products` 路徑)。在搜尋框中輸入產品代碼 (支援大小寫不敏感搜尋)。
2.  **顯示與修改**: 如果找到產品，其現有資訊 (描述、顏色、標準數量、類型) 會填充到表單中。修改你需要變更的欄位。
3.  **保存更新**: 點擊「Save」或「Update」按鈕。系統會更新資料庫中的產品記錄，並將此操作記錄到 `record_history`。
4.  **查看結果**: 系統會通過 Toast 通知操作是否成功。

#### 新增產品
1.  **觸發與填寫**: 在產品管理頁面，點擊「Add New Product」(新增產品)或類似按鈕。在空白表單中填寫新產品的所有資訊 (代碼、描述、顏色、標準數量、類型)。
2.  **提交新增**: 點擊「Create」或「Add」按鈕。
3.  **系統處理**: 系統會先檢查該產品代碼是否已存在。如果代碼可用，則創建新產品記錄到資料庫，並將操作記錄到 `record_history`。
4.  **查看結果**: 系統會通過 Toast 通知操作是否成功。

### English User Steps

#### Updating an Existing Product
1.  **Navigate & Search**: Go to the product update page (e.g., via Admin Panel -> "Product Update", typically leading to `/products`). Enter the product code in the search bar (case-insensitive search is supported).
2.  **Display & Modify**: If the product is found, its current information (description, colour, standard quantity, type) will populate the form. Modify the fields you need to change.
3.  **Save Update**: Click the "Save" or "Update" button. The system will update the product record in the database and log this action in `record_history`.
4.  **View Result**: The system will notify you of the success or failure of the operation via a Toast message.

#### Adding a New Product
1.  **Trigger & Fill Form**: On the product management page, click "Add New Product" or a similar button. Fill in all the information for the new product in the blank form (code, description, colour, standard quantity, type).
2.  **Submit New Product**: Click the "Create" or "Add" button.
3.  **System Processing**: The system will first check if the product code already exists. If the code is available, it creates the new product record in the database and logs the action to `record_history`.
4.  **View Result**: The system will notify you of the success or failure of the operation via a Toast message.

---

## 12. 文件上傳 / Upload Files

### 中文操作流程
1.  **導航**: 進入「Admin Panel」(管理員面板)。
2.  **觸發功能**: 在「System Tools」(系統工具)或類似類別下，點擊「Upload Files」(上傳文件)選項，打開上傳對話框。
3.  **選擇文件**:
    *   將文件拖拽到指定的「FileDropZone」(文件拖放區域)。
    *   或者，點擊該區域，從你的電腦中選擇文件。
    *   系統會對文件格式 (如 `.pdf`, `.doc`, `.png`, `.jpeg`) 和大小 (如不超過10MB) 進行初步驗證。
4.  **選擇目標文件夾**: 從下拉選單中選擇文件要上傳到的預設文件夾 (例如 `stockPic` 用於圖片，`productSpec` 用於文檔)。
5.  **確認/修改文件名**: 系統會預填原始文件名，你可以按需修改。文件名會經過驗證，確保不含非法字元。
6.  **執行上傳**: 點擊「Confirm Upload」(確認上傳)或類似按鈕。上傳進度條可能會顯示。
7.  **查看結果**:
    *   **成功**: Toast 通知提示上傳成功，並可能顯示文件的訪問 URL。對話框狀態重置。
    *   **失敗**: Toast 通知提示上傳失敗及原因。

### English User Steps
1.  **Navigate**: Go to the "Admin Panel".
2.  **Trigger Function**: Under "System Tools" or a similar category, click the "Upload Files" option to open the upload dialog.
3.  **Select File**:
    *   Drag and drop your file into the designated "FileDropZone".
    *   Alternatively, click the drop zone to select a file from your computer.
    *   The system will perform initial validation for file format (e.g., `.pdf`, `.doc`, `.png`, `.jpeg`) and size (e.g., not exceeding 10MB).
4.  **Select Destination Folder**: Choose a predefined destination folder from the dropdown menu (e.g., `stockPic` for images, `productSpec` for documents).
5.  **Confirm/Modify File Name**: The system will pre-fill the original file name; you can modify it if needed. The file name will be validated for illegal characters.
6.  **Execute Upload**: Click the "Confirm Upload" or similar button. An upload progress bar may be displayed.
7.  **View Result**:
    *   **Success**: A Toast notification will indicate successful upload, possibly displaying the file's access URL. The dialog will reset.
    *   **Failure**: A Toast notification will indicate upload failure and the reason.

---
