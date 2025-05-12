# Changelog

All notable changes to this project will be documented in this file.

## 2025-05-12

### 新增
- 在 Stock Movement 頁面新增行動裝置相機掃描 QR code 功能
  - 使用 @zxing/browser 實現行動裝置相機掃描
  - 掃描結果自動填入 Series 欄位並觸發查詢
  - 僅在行動裝置上顯示「Scan QR」按鈕

### 修復
- 修復 QR code 掃描器的 stopContinuousDecode 方法錯誤，改用官方推薦的 controls.stop() 方法停止掃描
- 改進相機掃描錯誤處理，提供更明確的錯誤訊息：
  - 區分「找不到相機裝置」和「相機權限被拒絕」的情況
  - 顯示中文錯誤訊息，提供使用者解決問題的指引

## [Unreleased]

### Added
- **Feature (Auth & User Management):**
  - Implemented comprehensive login logic based on `data_id.first_login` status:
    - Users log in with their Clock Number as the password for their initial login.
    - If `first_login` is true, users are redirected to `/change-password` to set a new password.
    - The new password (min. 6 characters) is stored in `data_id.password`, and `first_login` is updated to `false`.
    - Subsequent logins use the password stored in `data_id.password`.
  - Password change process now exclusively updates `data_id.password` and `data_id.first_login`, removing previous Supabase Auth user update attempts.
- **Feature (History Logging):**
  - Login events (successful first login, successful subsequent login, failed login with reason) are now recorded in the `record_history` table.
  - Password change events are recorded in `record_history`.
  - User logout events are now recorded in `record_history`.
- **ACO Form Validation & UI:**
  - Enhanced "Print Label" button enablement logic for ACO type:
    - Ensures ACO search is complete, order status is valid (not fulfilled, quantity not exceeded), and if it was a new order ref, its details are submitted.
    - Total required quantity (`Quantity of Pallet` * `Count of Pallet`) is now checked against ACO order's remaining quantity.
  - Modified ACO Order Ref input:
    - Now a combination of a dropdown menu for existing order refs and a text input for manual entry.
    - Added hint text: "Choose From Below Or Enter New Order Ref".
- **Database Timestamps:**
  - `record_inventory`: Added `latest_update` field, automatically set to current timestamp on record insert or update.
  - `record_aco`: Added `latest_update` field, automatically set to current timestamp on record update during label printing.
- **Error Logging:**
  - Expanded error logging to `report_log` table for more failure scenarios, including:
    - Failure to fetch existing ACO pallet count.
    - Failure to update ACO order details (`handleAcoOrderDetailUpdate`).
- Implemented ACO (Assembly Component Order) status display on the dashboard, showing progress for active orders.
  - Fetches data from `record_aco`.
  - Groups by `order_ref` and calculates overall progress (based on `required_qty` and `remain_qty`).
  - Displays progress using Shadcn UI `Progress` component.
  - Shows `order_ref` as "Order Reference : [ref]".
  - Implemented a tooltip on hover for each ACO order in the status list, showing detailed progress for each product code within that order (Completed Qty / Required Qty).
- Added a tooltip to the main dashboard donut chart to display "Pallets Done" and "Pallets Transferred" counts when hovering over the chart.
- GRN Label: Implemented GRN label printing page (`/print-grnlabel`) with PDF generation and upload.
- GRN Label: GRN PDF content tailored with specific fields and formatting.
- GRN Label: Integrated progress indicators (traffic lights) for GRN label printing.
- GRN Label: Form inputs are cleared automatically after successful GRN processing.
- Dashboard: Integrated `<GrnHistory />` component into the main dashboard.
- Dashboard: Integrated `<AcoOrderStatus />` component into the main dashboard.
- QC Label: Added `latest_update` field to `record_inventory` and `record_aco` updates.
- QC Label: ACO Order Ref dropdown in `QcLabelForm` now only shows incomplete orders.
- Integrated `sonner` for Toast notifications in Stock Transfer page for better user feedback.

### Changed
- **Routing & UI:**
  - The main dashboard/home page has been moved from the root path (`/`) to `/dashboard`.
  - The login page (`/login`) now correctly redirects to `/dashboard` after successful non-first-time logins and to `/change-password` for first-time logins.
  - The change password page (`/change-password`) now correctly redirects to `/dashboard` upon successful password updates.
  - The application's root path (`/`) now automatically redirects to `/login`.
  - The primary navigation link for "Home" in the sidebar now points to `/dashboard`.
- **Authentication:**
  - Removed hardcoded `admin` user login credentials and logic.
- **ACO Search Logic:**
  - If an existing ACO Order Ref is searched but does not contain the currently entered Product Code:
    - Displays "Product Code Not Included In This Order".
    - Does NOT show the "Please Enter ACO Order Detail" section.
    - "Print Label" button is disabled.
- **State Management:**
  - When `productCode` is changed by the user:
    - `acoOrderRef` (both input value and dropdown selection) is now automatically cleared.
    - PDF generation progress bar is automatically hidden/reset.
- **Dashboard Layout & Components:**
  - Removed the separate "Pallets Done" and "Pallets Transferred" cards from the main dashboard view.
  - Data for these counts is now fetched directly in `app/dashboard/page.tsx` (previously was `app/page.tsx`) and passed to the `PalletDonutChart` component.
  - The `PalletRatio.tsx` component no longer renders UI.
  - Adjusted the main layout in `app/dashboard/page.tsx` to center the `PalletDonutChart`.
  - Increased the size of the `PalletDonutChart`.
- **ACO Order Ref Dropdown (Print Label Form):**
  - Modified `QcLabelForm.tsx` to filter the "ACO Order Ref" dropdown list.
  - The dropdown now only shows `order_ref` values for ACO orders that are not yet fully completed.
- Corrected column name references in `AcoOrderStatus.tsx` from `product_code` to `code` and `original_qty` to `required_qty`.
- Removed `customer` field logic from `AcoOrderStatus.tsx`.
- Refactored `PrintLabelPdf.tsx` to accept `labelType` prop (`qc` or `grn`).
- Unified `series` generation logic for QC and GRN labels to `YYMMDDHH-XXXXXX` format.
- Navigation: Resolved mobile sidebar overlay issue.
- Navigation: Standardized navigation to use a hamburger-controlled hidden sidebar for all screen sizes.
- Navigation: Implemented differentiated sidebar interaction based on device type (hover for desktop, tap for mobile).
- Dashboard: Main dashboard page is now `app/dashboard/page.tsx`.
- Dashboard: Login page now redirects to `/dashboard`.
- Dashboard: `PalletRatio.tsx` data integrated into `PalletDonutChart` tooltip.
- Dashboard: Removed old quick action buttons.
- Dashboard: Adjusted layout for vertical card stacking and larger donut chart.
- QC Label: `handlePrintLabel` in `QcLabelForm.tsx` refactored.
- QC Label: Modified `handleAcoSearch` to alert and disable printing if `acoOrderRef` doesn't contain the current `productCode`.
- Print Label Menu: "GRN Label" button in `PrintLabelPopover.tsx` now navigates directly to `/print-grnlabel`.
- Corrected logic in `app/stock-transfer/page.tsx` for `p_from_col` when transferring from 'Fold Mill' to 'Production'.
- Stock Transfer page (`app/stock-transfer/page.tsx`) now clears input fields after a successful transfer or when specific errors occur (excluding void/unhandled location scans where inputs might be needed for correction by user).
- Improved success messages in Stock Transfer page.
- Stock Transfer: Initial location for pallets after QC label printing is now consistently expected to be 'Awaiting'.
- QC Label Form: Confirmed `app/components/print-label-menu/QcLabelForm.tsx` sets initial `record_history.loc` to 'Awaiting' (unless product code starts with 'U').
- GRN Label Printing: Changed initial `record_history.loc` for new GRN pallets to 'Awaiting'.
- Stock Transfer: When a pallet's current location is 'Awaiting', the next destination is now conditional based on `productCode` ("Z" prefix goes to 'Production', others to 'Fold Mill').
- Stock Transfer: Success messages for pallet transfers are now displayed in an on-page "Activity Log".
- Stock Transfer: When scanning a pallet at an unhandled location for standard transfer (e.g., already in 'Production'), the `record_history.action` is now "Scan Failure" and `remark` is "Scan at unhandled location for transfer: [currentLocation]".
- Stock Transfer: Messages in Activity Log are now persistent (not cleared on new actions), with new logs appearing at the top (max 50).
- Stock Transfer: Activity Log messages are color-coded: yellow for success, red for errors/alerts.
- Stock Transfer: Activity Log text size is responsive: `text-base` on mobile, `md:text-4xl` on larger screens.

### Fixed
- **PDF Label Content (Dynamic Headers):**
  - Resolved an issue where PDF label headers (e.g., "Quantity" vs "Quantity / Weight", "Q.C. Done By" vs "Received By") were not consistently displaying correctly for QC and GRN label types.
  - The root cause was identified as client-side browser caching of PDF files, which prevented updated rendering logic in `PrintLabelPdf.tsx` from taking effect immediately.
  - After thorough debugging and cache clearing (hard refresh), the dynamic header logic now functions as intended based on the `labelType` prop.
- **PDF Label Content:**
  - Ensured "Work Order Number" on PDF labels for 'Slate' product type correctly displays as "-".
- Resolved an issue where `AcoOrderStatus.tsx` would show an "unknown error" by improving error message handling for non-standard error objects from Supabase queries.
- Addressed Linter error in `AcoOrderStatus.tsx` and `PalletDonutChart.tsx` related to missing `Tooltip` (and `Progress`) component by advising user to install it via `npx shadcn-ui@latest add tooltip` (and `progress`).
- Resolved `GoTrueClient` multiple instances warning in `PdfGenerator.tsx`.
- Addressed Supabase Storage "mime type application/pdf is not supported" error for `pallet-label-pdf` bucket.
- Corrected `record_slate` insert errors due to mismatched column names (e.g., `batch_number` vs `batch_num`).
- Resolved `report_log` table 401 error by adding RLS policy for public insert.
- Fixed `date-fns` version conflict by replacing Shadcn UI Date Picker with `<input type="date">` for Slate "First-Off Date".
- Corrected `PalletRatio.tsx` to query `record_transfer` instead of non-existent `inventory_movements` table.
- Resolved various Linter errors related to prop names and `framer-motion` props in `Navigation.tsx`.
- Addressed Supabase query errors in `app/dashboard/page.tsx` by correcting table/column names and temporarily disabling features dependent on missing columns (e.g., low stock items from `record_inventory`, pending orders from `record_history` based on `status`).
- Debugged and confirmed resolution of "Home" button redirecting to login page despite being logged in; refined `app/dashboard/page.tsx` authentication logic and data fetching.
- Corrected "Home" button navigation in `Navigation.tsx` to point to `/dashboard` instead of `/`, resolving an issue where users were incorrectly redirected to the login page.
- Addressed potential issue where `NULL` quantity columns in `record_inventory` were not correctly updated during stock transfer by implementing `COALESCE` in the `update_inventory_stock_transfer` RPC function (user applied the SQL change).

### Removed
- Deleted placeholder component `app/components/print-label-menu/GrnLabelForm.tsx`.
- Deleted `app/dashboard/page.tsx` (old dashboard, route moved to `app/(dashboard)/page.tsx`).
- Deleted `app/page.tsx` (was a redirect or duplicate of dashboard).
- Removed `useEffect` in `app/login/page.tsx` that cleared `localStorage` on every page load.
- Removed the "Recent Activity" card from the dashboard (`app/dashboard/page.tsx`) as its data source (`record_history`) did not contain the necessary fields (e.g., `grn_number`, `code`, `ttl_pallet`) and its intended functionality was largely redundant with the "GRN History" card.

### Security
- Added RLS policy to `report_log` to allow public inserts.

## [1.0.0] - 2025-05-05

### Added
- Initial project setup with Next.js, React, Supabase, Tailwind CSS, and Shadcn UI.
- Basic file structure and dependency installation.
- Simple page to fetch product list from Supabase.
- Slate event: Each generated pallet number now inserts a record into record_slate with correct plt_num, code, and auto-filled material/colour/shapes.

### Changed
- Migrated from legacy VBA + MS Access-based WMS to a modern web-based application.
- Slate event: Removed Machine No.14, Material, Colour, Shapes inputboxes from UI and validation. Only visible fields are required.
- Slate event: Validation now ignores removed fields and remark is optional.

### Fixed
- Fixed: record_slate insert now always includes code (product code) to satisfy foreign key constraint.
- Fixed: All pallets (count > 1) now insert corresponding record_slate rows.

## [0.1.0] - 2025-05-01

### Added
- Initial release of the online warehouse stock control system.
- Support for both Windows and Mac (no software installation on Windows).
- Real-time code sync with GitHub and deploy via Vercel.
- Supabase integration for data operations (insert/update/query).
- Use of Supabase native features (Edge Functions, RLS, etc.).
- Online code and UI editing capabilities.

### Changed
- None.

### Fixed
- None.

### Previous Unreleased (Integrated into 1.0.0 or earlier, kept for reference if needed)
- Series generation now uses smart code format: `yyMMdd-XXXXXX` (date + 6 random uppercase alphanumeric characters), ensuring uniqueness and traceability for each pallet label QR code.
- Slate: "First-Off Date" input is now a dropdown populated with historical dates from `record_slate.first_off`, with a fallback text input for new dates.
- ACO event: Label right cell now displays `{ACO Order Ref} - {ordinal} PLT` (e.g. `12345 - 4th PLT`), and left cell shows `ACO Order`.
- Removed legacy 12-char random series logic, now always uses the new smart code format.
- PDF 樣板（PrintLabelPdf.tsx）Work Order Number 右側儲存格現在會正確顯示傳入的 workOrderNumber（如 ACO Ref Order: 12345 7th PLT），不再寫死顯示內容。
- ACO Label Ordinal Numbering: Corrected the pallet ordinal numbering for ACO orders. The system now queries the `record_palletinfo` table to find the count of existing pallets for a given `ACO Order Ref` (based on `plt_remark`) and correctly assigns subsequent ordinal numbers (e.g., if 20 pallets exist, the next printed batch will start from 21st, 22nd, etc.). Previously, it only counted ordinals within the current print batch.
- Resolved issues preventing PDF label uploads to Supabase Storage. This involved:
  - Ensuring the `pallet-label-pdf` storage bucket exists and is configured correctly (e.g., public access, appropriate MIME type handling by Supabase).
  - Modifying `setupStorage` in `lib/supabase-storage.ts` to be less strict about `listBuckets` results, allowing upload attempts even if bucket listing fails (as `anon` key might not have `listBuckets` permission by default).
  - Correcting Supabase client prop drilling and usage in `PdfGenerator.tsx` and `QcLabelForm.tsx` to prevent potential multiple client instances and ensure consistent client usage.
- Addressed type mismatches for `setPdfProgress` between `QcLabelForm.tsx` and `PdfGenerator.tsx`.
- Resolved 401 Unauthorized error when attempting to insert records into the `report_log` table. This was fixed by adding a new Row Level Security (RLS) policy to the `report_log` table in Supabase, granting `INSERT` permissions to `public` roles (which includes `anon` and `authenticated`).
- Simplified `setupStorage` function in `lib/supabase-storage.ts` by removing the `listBuckets` call. This eliminates a console warning that occurred because the `anon` key might not have permission to list buckets, without affecting the PDF upload functionality (which relies on object-level permissions). 