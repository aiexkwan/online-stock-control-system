# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
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

### Changed
- **ACO Search Logic:**
  - If an existing ACO Order Ref is searched but does not contain the currently entered Product Code:
    - Displays "Product Code Not Included In This Order".
    - Does NOT show the "Please Enter ACO Order Detail" section.
    - "Print Label" button is disabled.
    - (Previously, this was treated as a new order ref for that product code).
- **State Management:**
  - When `productCode` is changed by the user:
    - `acoOrderRef` (both input value and dropdown selection) is now automatically cleared.
    - PDF generation progress bar is automatically hidden/reset.
- **Dashboard Layout & Components:**
  - Removed the separate "Pallets Done" and "Pallets Transferred" cards from the main dashboard view.
  - Data for these counts is now fetched directly in `app/page.tsx` and passed to the `PalletDonutChart` component.
  - The `PalletRatio.tsx` component no longer renders UI and its data fetching logic was moved/duplicated to `app/page.tsx`.
  - Adjusted the main layout in `app/page.tsx` to center the `PalletDonutChart` as the primary element for these stats.
  - Increased the size of the `PalletDonutChart`.
- **ACO Order Ref Dropdown (Print Label Form):**
  - Modified `QcLabelForm.tsx` to filter the "ACO Order Ref" dropdown list.
  - The dropdown now only shows `order_ref` values for ACO orders that are not yet fully completed (i.e., where the sum of `remain_qty` for all items under an `order_ref` is greater than 0).
- Corrected column name references in `AcoOrderStatus.tsx` from `product_code` to `code` and `original_qty` to `required_qty` to match the `record_aco` table schema.
- Removed `customer` field logic from `AcoOrderStatus.tsx` as `order_ref` already implies customer information.

### Fixed
- **PDF Label Content (Dynamic Headers):**
  - Resolved an issue where PDF label headers (e.g., "Quantity" vs "Quantity / Weight", "Q.C. Done By" vs "Received By") were not consistently displaying correctly for QC and GRN label types.
  - The root cause was identified as client-side browser caching of PDF files, which prevented updated rendering logic in `PrintLabelPdf.tsx` from taking effect immediately.
  - After thorough debugging and cache clearing (hard refresh), the dynamic header logic now functions as intended based on the `labelType` prop.
- **PDF Label Content:**
  - Ensured "Work Order Number" on PDF labels for 'Slate' product type correctly displays as "-".
- Resolved an issue where `AcoOrderStatus.tsx` would show an "unknown error" by improving error message handling for non-standard error objects from Supabase queries.
- Addressed Linter error in `AcoOrderStatus.tsx` and `PalletDonutChart.tsx` related to missing `Tooltip` (and `Progress`) component by advising user to install it via `npx shadcn-ui@latest add tooltip` (and `progress`).

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