<!-- Prepend new entries here -->
## [Unreleased] - 2025-05-24 

### Fixed
- **Supabase Auth Integration Bugs**:
  - Fixed `supabaseAdmin.auth.admin.getUserByEmail is not a function` error by switching to `listUsers` API
  - Modified `userExistsInSupabaseAuth` and `updatePasswordWithSupabaseAuth` functions to use proper Supabase API methods
  - Resolved login session issues that caused users to be redirected back to login page after successful authentication
  - Added cookie-based fallback authentication mechanism in middleware
  - Enhanced AuthStateSync component with retry mechanisms and periodic synchronization
  - Created detailed documentation in loginBuild.md for future reference

### Changed
- **Authentication Flow**:
  - Improved authentication state synchronization between client and server
  - Enhanced middleware to provide better session persistence
  - Added more robust error handling in authentication-related functions

## [Unreleased] - 2025-05-23 

### Added
- **Database RPC (Remote Procedure Call)**: Added a new `update_user_password` RPC function to the Supabase database for direct, cache-bypassing password updates.
- **Server-Side Memory Cache**: Implemented a server-side memory cache for recently changed passwords, ensuring consistent user authentication experiences across concurrent requests even when database changes have propagation delays.
- Integrated Supabase Auth for authentication
- Migrated from custom authentication to Supabase Auth while maintaining existing UI
- Added automatic user migration from custom auth to Supabase Auth
- Enhanced security with JWT-based authentication

### Changed
- **Authentication Process**: Completely rebuilt password change validation and login flow to support multiple layers of verification.
  - Added multiple retry attempts with variable delays (0.5-2s) between database checks to allow for data propagation.
  - Added fallback mechanisms when database queries return inconsistent data.
  - Added memory-based recovery path that retains recently changed password states in server memory.
  - Database reads now use optimized query parameters to bypass potential Supabase query caching.
- **Password Change Verification**: Enhanced the password change function to verify updates are correctly applied before confirming success to users, with multiple verification attempts.
- Updated login flow to use Supabase Auth backend
- Modified password change functionality to use Supabase Auth
- Updated first login detection to work with Supabase Auth
- Preserved all existing UI/UX for authentication

<!-- Prepend new entries here -->
## [Unreleased] - 2025-05-22 

### Fixed
- **Critical Authentication Bug**: Resolved an issue where changes to user login state (`first_login` and password hash) were not immediately reflected in subsequent login attempts within the same server instance. Added cache-breaking parameters to database queries in `customLoginAction` (in `app/actions/authActions.ts`) and `updateUserPasswordInDbAction` (in `app/change-password/actions.ts`) to ensure fresh data is always retrieved from the database.
- Added verification step after password change to confirm database updates were successfully applied.
- Updated user authentication to use a more reliable strategy with multiple database checks if inconsistencies are detected.

<!-- Prepend new entries here -->
## [Unreleased] - 2025-05-21 

### Changed
- **Authentication**:
  - Enhanced logging in `customLoginAction` (in `app/actions/authActions.ts`) to provide better visibility into the user authentication process and data consistency across database queries, particularly focusing on the `first_login` state and password verification in the Vercel environment.

## [Unreleased] - YYYY-MM-DD \n\n### Changed\n- **GRN Label Printing Logic (`app/print-grnlabel/page.tsx`)**:\n  - Reworked `record_grn` table insertion: Removed the single summary GRN record. Each row in `record_grn` now corresponds to an individual physical pallet, containing its specific `plt_num`, `gross_weight`, and `net_weight`.
  - Each individual GRN record in `record_grn` now also includes `pallet_count` and `package_count` fields, reflecting the counts entered by the user for the selected pallet and package types for the entire GRN batch. These counts are repeated for each pallet record within that GRN batch.
  - Optimized data fetching for pallet/package types, counts, and weight subtractions to occur once before the main processing loop, rather than on each iteration.
  - Unified `userId` retrieval to use `localStorage.getItem('loggedInUserClockNumber')` for consistency with other parts of the application.
  - Corrected parameters for `generateAndUploadPdf` call, removing unhandled `index` and `setPdfProgress` props, and moved progress updates to be handled within the calling loop.
  - Ensured that if a pallet is skipped due to non-positive net weight, its status in the PDF progress UI is updated to 'Failed'.
  - Implemented new parsing logic for `pallet_count` and `package_count`:\n    - If the UI input value is a whole number string (e.g., \"1.0\", \"2.0\"), it's stored as an integer (e.g., 1, 2).\n    - If the UI input value has a decimal (e.g., \"0.5\"), it's stored as a number with decimals (e.g., 0.5).\n  - The logic for inserting individual pallet details into `record_palletinfo`, updating `record_inventory`, and logging to `record_history` remains unchanged (i.e., performed per physical pallet processed).\n  - Added a helper function `parseCountValue` to handle the specific parsing requirements for pallet and package counts.\n\n\n<!-- Prepend new entries here -->
## [Unreleased] - 2025-05-15 

### Added
- **GRN Report Export Functionality (`app/export-report`, `lib/exportReport.ts`, `app/actions/reportActions.ts`)**:
  - Implemented a dialog popup for the "GRN Report" button, allowing users to select a unique `grn_ref` from `record_grn`.
  - Created Server Actions:
    - `getUniqueGrnRefs`: Fetches unique GRN reference numbers for the selection dialog.
    - `getMaterialCodesForGrnRef`: Fetches all unique material codes associated with a selected `grn_ref`.
    - `getGrnReportData`: Fetches detailed data for a specific `grn_ref` and `material_code`, including material description (from `data_code`), supplier name (from `data_supplier`), GRN record details, and calculated total weights.
  - The system now iterates through each `material_code` for the selected `grn_ref` and generates a separate Excel report for each.
  - Updated `exportGrnReport` function in `lib/exportReport.ts` to accept `GrnReportPageData` and populate the Excel template with dynamic data, including:
    - GRN Ref, User ID, Material Code, Material Description, Supplier Name, Report Date.
    - Lists of Gross Weight, Net Weight, and conditional markers for Pallet and Package types.
    - Summary of Total Gross Weight, Total Net Weight, and their difference.
  - Excel filenames are now dynamic, incorporating the GRN Ref and Material Code (e.g., `GRN_Report_[grn_ref]_[material_code].xlsx`).
  - Integrated logic to retrieve the logged-in user's ID from `localStorage` (as stored by the login process) and include it in the GRN report.

### Changed
- Updated `app/export-report/page.tsx` to manage state and UI for the GRN report selection dialog and multi-file export process.
- Refined button styling on the `app/export-report/page.tsx` page for a more consistent look and feel.
- Temporarily used `any` type for Supabase client in `app/actions/reportActions.ts` due to unresolved `Database` type import path, with a plan to fix later.

### Fixed
- Corrected `toast` import path in `lib/exportReport.ts` to use `sonner`.

## [Unreleased] - 2025-05-15

### Added
- **ACO Report Export Enhancement (`app/export-report`, `lib/exportReport.ts`, `app/actions/reportActions.ts`)**:
  - Implemented a dialog popup for "ACO Order Report" allowing users to select a specific `order_ref` for export.
  - Created a Server Action (`getAcoReportData`) to fetch data from `record_aco` (for product codes) and `record_palletinfo` (for pallet details: number, quantity, QC date) based on the selected `order_ref`.
  - Dynamically populated the Excel report with the fetched data, including up to 4 product codes and their associated pallet details per report.
  - Displayed the selected `order_ref` in cell M1 of the Excel report.
  - Displayed the report generation date (e.g., "23-JUL-2024") in cell M2 of the Excel report.
  - Updated the exported Excel filename to include the `order_ref` (e.g., `ACO_12345_Report.xlsx`).
  - Added loading states and user feedback during the data fetching and report generation process.

### Changed
- Modified `exportAcoReport` function to accept `reportData` and `orderRef` as parameters.
- Updated `ExportReportPage` component to manage the new selection dialog and data fetching flow for ACO reports.

### Fixed
- Resolved `Module not found` error for Supabase client in Server Actions by using `createServerActionClient` from `@supabase/auth-helpers-nextjs`.
- Added error handling for date formatting in `getAcoReportData` to prevent `RangeError` with invalid date values.
- Corrected `exceljs` error `Cannot merge already merged cells` by removing conflicting cell merge operations in the Excel header setup.
- Addressed accessibility warning for `DialogContent` by including a `DialogDescription` in `app/export-report/page.tsx`.

# Changelog

All notable changes to this project will be documented in this file.

## 2024-07-31

### Changed
- Updated timestamp generation in `app/print-grnlabel/page.tsx` for database records:
  - `record_palletinfo.generate_time`, `record_history.time`, and `record_inventory.latest_update` now use `new Date().toISOString()` instead of client-side formatted time (`dd-MMM-yyyy HH:mm:ss`). This ensures that UTC timestamps are sent to Supabase, which then handles them as `TIMESTAMPTZ`.

## 2025-05-16

### Added
- Implemented PDF merging and direct printing functionality for QC Labels:
  - After all individual QC label PDFs are generated and uploaded, they are now merged into a single PDF document.
  - The merged PDF is then sent directly to the browser's print dialog for user printing.
  - Utilizes `pdf-lib` for client-side PDF merging and an iframe-based method to trigger printing.
- Applied the same PDF merging and direct printing functionality to GRN Labels in `app/print-grnlabel/page.tsx`.
- Added password confirmation before initiating PDF printing for QC Labels (`app/components/print-label-menu/QcLabelForm.tsx`):
  - Created a reusable `PasswordConfirmationDialog.tsx` component in `components/ui/`.
  - Created a server action `verifyCurrentUserPasswordAction` in `app/actions/authActions.ts` to validate the user's password against the stored hash in `data_id` table using `bcryptjs`.
  - Integrated the dialog and server action into the QC Label printing process. Printing only proceeds after successful password verification.
- Added password confirmation before initiating PDF printing for GRN Labels (`app/print-grnlabel/page.tsx`):
  - Reused `PasswordConfirmationDialog.tsx` and `verifyCurrentUserPasswordAction`.
  - Integrated the dialog and server action into the GRN label printing flow.

### Changed
- Modified `app/components/print-label-pdf/PdfGenerator.tsx`:
  - `generateAndUploadPdf` function now returns both the `publicUrl` and the generated `blob` object.
- Updated `app/components/print-label-menu/QcLabelForm.tsx`:
  - `handlePrintLabel` now collects all successfully generated PDF blobs.
  - After all database updates and individual PDF uploads are complete, it calls `mergeAndPrintPdfs` (from `lib/pdfUtils.tsx`) to merge and print.
- Updated `lib/pdfUtils.tsx`:
  - Added the `mergeAndPrintPdfs` function, which handles merging an array of PDF ArrayBuffers and triggering the browser print dialog.
  - Increased the `setTimeout` delay for print dialog cleanup in `mergeAndPrintPdfs` to 10 seconds to allow more time for printing.
  - Ensured `generateAndUploadPdf` function consistently returns an object containing both `publicUrl` and `blob`.
- Updated `app/print-grnlabel/page.tsx`:
  - `handlePrintLabel` function now collects all successfully generated PDF blobs from the modified `generateAndUploadPdf` (from `lib/pdfUtils.tsx`).
  - After all database updates and individual PDF uploads are complete, it calls `mergeAndPrintPdfs`.
- Modified `lib/pdfUtils.tsx`:
  - Ensured `generateAndUploadPdf` correctly returns an object `{ publicUrl: string; blob: Blob }`.

### Fixed
- Resolved Linter error in `app/components/print-label-menu/QcLabelForm.tsx` by changing `toast.warn` to `toast.warning`.
- Ensured `mergeAndPrintPdfs` function is correctly defined and exported in `lib/pdfUtils.tsx`, resolving a module import Linter error.
- Corrected an issue in `app/print-grnlabel/page.tsx` where PDF blobs were not being correctly collected for merged printing due to `generateAndUploadPdf` (in `lib/pdfUtils.tsx`) previously not returning the blob. This has been addressed by the change in `lib/pdfUtils.tsx`.
- Resolved an issue in `lib/pdfUtils.tsx` where `generateAndUploadPdf` was not correctly returning the `blob` object, causing errors in GRN label printing when trying to access `result.blob`.
- Corrected `PasswordConfirmationDialog.tsx` import issue by temporarily removing the `Label` component that was causing a module not found error. The dialog now renders, and `Label` can be added properly later if needed.

## 2025-05-12

### Added
- Added mobile device camera QR code scanning functionality in Stock Movement page
  - Implemented mobile camera scanning using @zxing/browser
  - Scanning results automatically fill the Series field and trigger search
  - "Scan QR" button only displays on mobile devices
- Camera now automatically uses the back camera (if available) for QR code scanning; camera switcher UI removed
- Enlarged QR code scanning interface by ~25% for better usability on mobile devices
- On mobile devices, users can tap the QR Code input field (with placeholder "Tap To Scan") to launch the scanner; the scan button is removed
- QR code scanner is now a reusable component: `components/qr-scanner/qr-scanner.tsx`. Stock Movement page now uses this component for all camera scanning logic and UI.

### Fixed
- Fixed QR code scanner's stopContinuousDecode method error, now using the officially recommended controls.stop() method
- Improved camera scanning error handling with more specific error messages:
  - Distinguished between "camera not found" and "camera permission denied" scenarios
  - Display clear error messages with guidance for users to resolve issues
- Added console logging for listed camera devices to aid troubleshooting camera access issues

## [Unreleased] - 2024-07-25

### Added
- **View History Page (`app/view-history/page.tsx`)**:
  - Implemented initial framework for viewing pallet and stock history.
  - Users can search by "Series" or "Pallet Number".
  - Search is automatically triggered with a debounce mechanism after user input.
  - Displays loading state, error messages, and "no records found" state.
  - **Data Fetching**:
    - Created Server Action `app/actions/viewHistoryActions.ts` (`getPalletHistoryAndStockInfo`).
    - Fetches pallet information from `record_palletinfo`.
    - Fetches product details (description, colour, type, standard_qty) from `data_code` based on `product_code`.
    - Fetches pallet movement history from `record_history` based on `plt_num`.
    - Fetches current stock levels from `record_inventory` based on `product_code`.
  - **Display**:
    - Left card shows "Pallet History" (Location, Action, Time, Operator).
    - Right card shows "Stock Detail" including:
      - "Product Information" (Code, Description, Colour, Standard Qty, Product Type from `data_code`).
      - "Stock Location" (Injection, Pipeline, Pre-Booking, Awaiting, Fold Mill, Bulk Room, Back Car Park from `record_inventory`).

### Changed
- Updated `PalletInfo` and related interfaces in `app/actions/viewHistoryActions.ts` to include product details from `data_code`.
- Refined Supabase client usage in Server Action to use `createServerActionClient` from `@supabase/auth-helpers-nextjs`.

### Removed
- General HTML preview tool `app/html-preview/page.tsx` (file deleted, directory removal was problematic via tool).

## [Unreleased] - 2024-07-30

### Added
- Implemented self-service password reset functionality:
    - Login page's "Forgot Password?" link now directs to `/new-password` with `userId`.
    - Created `app/new-password/page.tsx` for users to set a new password.
    - Created Server Action `app/new-password/actions.ts` (`resetPasswordAction`) to:
        - Securely hash the new password using `bcryptjs`.
        - Update the user's password and `first_login` status in the `data_id` table using Supabase Admin Client.
        - Log the password reset event to `record_history`.
- Enhanced UI feedback on the new password page for loading, success, and error states.

### Changed
- Modified `app/login/page.tsx` to correctly route to the new password reset page.
- Refactored `app/new-password/page.tsx` to remove `localStorage` dependency for user data and use URL parameters instead.

## [Unreleased]

### Added
- **Stock Transfer Logging (`app/stock-transfer/page.tsx`):** After a successful stock movement (inventory update and history logging), a new record is now also inserted into the `record_transfer` table. This record includes `tran_date`, `operator_id`, `plt_num`, `f_loc` (from location), and `t_loc` (to location).
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
- Implemented "Void Pallet" functionality in `app/void-pallet/page.tsx`.
- Added a confirmation dialog requiring void reason (combobox with presets/custom input) and user password.
- Created server action `app/void-pallet/actions.ts#voidPalletAction` to handle the voiding logic:
    - Verifies user password (currently insecure plain text - **NEEDS REPLACEMENT**).
    - Checks if pallet is already voided via `record_history`.
    - Adjusts inventory quantity in `record_inventory` based on pallet's last location (`await`, `injection`, `fold`).
    - Deletes corresponding records from `record_grn` and `record_slate`.
    - Adjusts (adds back) quantity in `record_aco` if pallet remark indicates an ACO order.
    - Logs detailed steps and final status to `record_history`.
    - Returns success/error status to the client.
- Added client-side handling for the void action (calling action, showing toasts, updating activity log, resetting state).
- Included `plt_remark` in pallet search results.
- Added Shadcn UI `Dialog` and `Combobox` components and dependencies.
- QR Code scanner component (`components/qr-scanner/qr-scanner.tsx`) for void pallet page.
- Combobox, Command, Dialog UI components (`components/ui/`).
- Server action for voiding pallets (`app/void-pallet/actions.ts`) with detailed logic for inventory, GRN, Slate, and ACO adjustments.
- Implemented auto-focus on last used input field in Stock Transfer page.

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
- Updated `app/void-pallet/page.tsx` search logic to fetch `plt_remark`.
- Refined UI state management for voiding process.
- Removed Activity Log from Void Pallet page (`app/void-pallet/page.tsx`); status messages now use toast notifications only.
- Increased size of toast notifications and their text by approximately 50% on the Void Pallet page for better visibility.
- Modified `voidPalletAction` in `app/void-pallet/actions.ts`:
    - History logging for "Deducted From Slate Record" now only occurs if a Slate record was actually found and deleted.
    - (ACO record adjustment logging already behaved this way and was confirmed.)
- **Security**: Updated password verification in `app/void-pallet/actions.ts` to use `bcryptjs` for secure hash comparison instead of plaintext. **(Requires manual update of stored passwords in `data_id` table to bcrypt hashes)**.
- Updated `app/void-pallet/page.tsx` to integrate QR scanner, void reason selection, password confirmation dialog, and call the new server action.
- Modified `app/stock-transfer/page.tsx` for auto-focus functionality.
- Minor fixes and enhancements to `PrintLabelPdf.tsx` and `QcLabelForm.tsx`.
- Updated GRN label printing process in `app/print-grnlabel/page.tsx`.
- Dashboard (`app/dashboard/page.tsx`) enhancements and data fetching corrections.
- Navigation component (`app/components/Navigation.tsx`) responsive improvements.
- **Refactor (Void Pallet Atomicity)**: Refactored the void pallet logic (`app/void-pallet/actions.ts`) to use a Supabase database function (`void_pallet_transaction` RPC). This ensures that all related database modifications (inventory, GRN, Slate, ACO adjustments, and history logging) are performed within a single atomic transaction, improving data consistency and reliability.

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
- Ensured cancel button in void dialog clears inputs and resets found pallet state.
- Resolved `GoTrueClient` multiple instance warnings.
- Corrected PDF MIME type issue for Supabase storage uploads.
- Addressed various Linter errors and improved code consistency.
- Fixed `date-fns` version conflict by using native date input for Slate.
- Corrected Supabase RPC call `update_inventory_stock_transfer` for `NULL` value handling.
- Resolved "Home" button navigation issue.
- Addressed module not found error for `@zxing/browser` by installing the dependency.
- GRN Label: Corrected net weight calculation. If 'Not Included' is selected for Pallet Type or Package Type, their respective weights (now set to 0) are not subtracted from the gross weight.

### Removed
- Deleted placeholder component `app/components/print-label-menu/GrnLabelForm.tsx`.
- Deleted `app/dashboard/page.tsx` (old dashboard, route moved to `

### Fixed
- **Build Error:** Resolved TypeScript type error in `app/components/Navigation.tsx` (Type 'number | null' is not assignable to type 'string | number') by ensuring `idForDb` defaults to `0` when a user ID cannot be parsed, satisfying the `record_history.id` column's expected `number` type.
- **Build Error:** Resolved `Module not found: Can't resolve 'react-hot-toast'` in `app/users/page.tsx` by changing the import to use `sonner` for toast notifications, consistent with the rest of the project.

## [Unreleased] - YYYY-MM-DD

### Added
- **Print Label**: For void corrections, `Count of Pallet` now defaults to `1`.
- **Print Label**: For void corrections with pre-filled `product_code` from URL, product information is now auto-fetched, and the \"Print Label\" button is enabled only after data loads.

### Changed
- **Void Pallet**: Enhanced `processDamagedPalletVoidAction` to correctly return `actual_original_location` and `remainingQty` from the RPC, fixing an issue where the original location for reprint was not found for partially damaged pallets.
- **Print Label**: `QcLabelForm.tsx` now uses the `target_location` URL parameter (passed from void pallet page) to set the correct location for new pallet records created during void corrections, instead of defaulting to \"Await\". This affects `record_palletinfo.plt_loc`, `record_inventory` (correct location column used), and `record_history.loc`.
- **Void Pallet**: Client-side history logging for successful void operations is now skipped if the backend (RPC/Server Action) handles it, preventing duplicate history entries.
- **Print Label**: `productCode` state in `QcLabelForm.tsx` is now updated with the canonical casing from the database after fetching product info, preventing potential foreign key issues.
- **Void Pallet**: Server action `processDamagedPalletVoidAction` now explicitly sets `actual_original_location: null` in all error return paths for consistent frontend error handling.

### Fixed
- **Print Label**: Corrected a JSX comment syntax error in `QcLabelForm.tsx`.
- Resolved issue where toast message "BUT original location for reprint not found" appeared for partially damaged pallets due to missing `actual_original_location` from server action.

## [Unreleased] - 2025-05-20

### Added
- **Reporting**: Implemented a "Transaction Report" feature allowing users to export transaction history to an Excel file. This includes the `buildTransactionReport` function in `lib/exportReport.ts` and UI integration in `app/export-report/page.tsx`.

### Changed
- **Authentication**:
  - Enhanced logging in `customLoginAction` (in `app/actions/authActions.ts`) to provide better visibility into the user authentication process and data consistency across database queries, particularly focusing on the `first_login` state and password verification in the Vercel environment.
- **Void Pallet**:
    - Adjusted UI elements on the "Void Pallet" page (`app/void-pallet/page.tsx`): modified Activity Log height, and styling for "Void Reason" and "Damage Qty" input fields.
    - Refined backend logic for handling partially damaged pallets. The `process_damaged_pallet_void` RPC in Supabase was updated to ensure correct inventory ledger adjustments (deducting full quantity from the original pallet, recording damaged quantity, and adding back the remaining quantity to a new pallet at the original location) and to enforce reprinting of the label for the new pallet.
- **Logout**: Enhanced `localStorage` cleanup logic in `app/components/Navigation.tsx` to ensure all relevant user session data (including `loggedInUserClockNumber`, `user`, `isTemporaryLogin`, `firstLogin`) is cleared upon logout.

### Fixed
- **Build Error**: Resolved a TypeScript type error in `app/debug-test/page.tsx` by changing `class` attribute to `className` in an `<h2>` tag, fixing the Vercel deployment failure.
- Addressed various linter errors in `lib/exportReport.ts` for the new Transaction Report feature.