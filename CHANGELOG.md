# Changelog

All notable changes to this project will be documented in this file.

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

## [Unreleased]
### Added
- Series generation now uses smart code format: `yyMMdd-XXXXXX` (date + 6 random uppercase alphanumeric characters), ensuring uniqueness and traceability for each pallet label QR code.

### Changed
- ACO event: Label right cell now displays `{ACO Order Ref} - {ordinal} PLT` (e.g. `12345 - 4th PLT`), and left cell shows `ACO Order`.

### Fixed
- Removed legacy 12-char random series logic, now always uses the new smart code format.
- PDF 樣板（PrintLabelPdf.tsx）Work Order Number 右側儲存格現在會正確顯示傳入的 workOrderNumber（如 ACO Ref Order: 12345 7th PLT），不再寫死顯示內容。 

### Added
- Troubleshoot PDF generation:
  - Implemented MinimalPdfDoc for isolated testing in PdfGenerator.
  - Added extensive logging in QcLabelForm and PdfGenerator.
  - Corrected Supabase storage function call parameters.
  - Verified Supabase bucket name configuration.
  - Ongoing investigation into PDF generation silent failure. 