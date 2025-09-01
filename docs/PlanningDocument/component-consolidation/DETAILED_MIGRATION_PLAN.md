# 超詳細組件架構遷移執行計劃

_建立日期: 2025-09-01_
_檔案總數: 203個組件檔案_
_影響範圍: 全專案_

## 第一部分：完整檔案清單與遷移對照表

### A. /components 資料夾檔案 (64個檔案)

#### UI基礎組件 (保留在原位)

| 當前路徑                                             | 新路徑                                               | 狀態    |
| ---------------------------------------------------- | ---------------------------------------------------- | ------- |
| `/components/ui/alert-dialog.tsx`                    | `/components/ui/alert-dialog.tsx`                    | ✅ 保持 |
| `/components/ui/alert.tsx`                           | `/components/ui/alert.tsx`                           | ✅ 保持 |
| `/components/ui/badge.tsx`                           | `/components/ui/badge.tsx`                           | ✅ 保持 |
| `/components/ui/button-download.tsx`                 | `/components/ui/button-download.tsx`                 | ✅ 保持 |
| `/components/ui/button.tsx`                          | `/components/ui/button.tsx`                          | ✅ 保持 |
| `/components/ui/calendar.tsx`                        | `/components/ui/calendar.tsx`                        | ✅ 保持 |
| `/components/ui/card.tsx`                            | `/components/ui/card.tsx`                            | ✅ 保持 |
| `/components/ui/checkbox.tsx`                        | `/components/ui/checkbox.tsx`                        | ✅ 保持 |
| `/components/ui/data-extraction-overlay.tsx`         | `/components/ui/data-extraction-overlay.tsx`         | ✅ 保持 |
| `/components/ui/date-picker.tsx`                     | `/components/ui/date-picker.tsx`                     | ✅ 保持 |
| `/components/ui/dialog.tsx`                          | `/components/ui/dialog.tsx`                          | ✅ 保持 |
| `/components/ui/dropdown-menu.tsx`                   | `/components/ui/dropdown-menu.tsx`                   | ✅ 保持 |
| `/components/ui/field.tsx`                           | `/components/ui/field.tsx`                           | ✅ 保持 |
| `/components/ui/glow-menu.tsx`                       | `/components/ui/glow-menu.tsx`                       | ✅ 保持 |
| `/components/ui/input.tsx`                           | `/components/ui/input.tsx`                           | ✅ 保持 |
| `/components/ui/label.tsx`                           | `/components/ui/label.tsx`                           | ✅ 保持 |
| `/components/ui/pdf-preview-dialog-react-pdf.tsx`    | `/components/ui/pdf-preview-dialog-react-pdf.tsx`    | ✅ 保持 |
| `/components/ui/pdf-preview-dialog.tsx`              | `/components/ui/pdf-preview-dialog.tsx`              | ✅ 保持 |
| `/components/ui/pdf-preview-overlay.tsx`             | `/components/ui/pdf-preview-overlay.tsx`             | ✅ 保持 |
| `/components/ui/popover.tsx`                         | `/components/ui/popover.tsx`                         | ✅ 保持 |
| `/components/ui/progress.tsx`                        | `/components/ui/progress.tsx`                        | ✅ 保持 |
| `/components/ui/radio-group.tsx`                     | `/components/ui/radio-group.tsx`                     | ✅ 保持 |
| `/components/ui/scroll-area.tsx`                     | `/components/ui/scroll-area.tsx`                     | ✅ 保持 |
| `/components/ui/select-radix.tsx`                    | `/components/ui/select-radix.tsx`                    | ✅ 保持 |
| `/components/ui/select.tsx`                          | `/components/ui/select.tsx`                          | ✅ 保持 |
| `/components/ui/separator.tsx`                       | `/components/ui/separator.tsx`                       | ✅ 保持 |
| `/components/ui/skeleton.tsx`                        | `/components/ui/skeleton.tsx`                        | ✅ 保持 |
| `/components/ui/switch.tsx`                          | `/components/ui/switch.tsx`                          | ✅ 保持 |
| `/components/ui/table.tsx`                           | `/components/ui/table.tsx`                           | ✅ 保持 |
| `/components/ui/tabs.tsx`                            | `/components/ui/tabs.tsx`                            | ✅ 保持 |
| `/components/ui/textarea.tsx`                        | `/components/ui/textarea.tsx`                        | ✅ 保持 |
| `/components/ui/tooltip.tsx`                         | `/components/ui/tooltip.tsx`                         | ✅ 保持 |
| `/components/ui/unified-dialog.tsx`                  | `/components/ui/unified-dialog.tsx`                  | ✅ 保持 |
| `/components/ui/unified-search.tsx`                  | `/components/ui/unified-search.tsx`                  | ✅ 保持 |
| `/components/ui/universal-stock-movement-layout.tsx` | `/components/ui/universal-stock-movement-layout.tsx` | ✅ 保持 |
| `/components/ui/use-toast.tsx`                       | `/components/ui/use-toast.tsx`                       | ✅ 保持 |

#### Core Dialog組件 (重組)

| 當前路徑                                            | 新路徑                                                 | 狀態    |
| --------------------------------------------------- | ------------------------------------------------------ | ------- |
| `/components/ui/core/Dialog/ConfirmDialog.tsx`      | `/components/molecules/dialogs/ConfirmDialog.tsx`      | 🔄 遷移 |
| `/components/ui/core/Dialog/Dialog.tsx`             | `/components/molecules/dialogs/Dialog.tsx`             | 🔄 遷移 |
| `/components/ui/core/Dialog/DialogExample.tsx`      | `/components/molecules/dialogs/DialogExample.tsx`      | 🔄 遷移 |
| `/components/ui/core/Dialog/DialogPresets.tsx`      | `/components/molecules/dialogs/DialogPresets.tsx`      | 🔄 遷移 |
| `/components/ui/core/Dialog/index.ts`               | `/components/molecules/dialogs/index.ts`               | 🔄 遷移 |
| `/components/ui/core/Dialog/NotificationDialog.tsx` | `/components/molecules/dialogs/NotificationDialog.tsx` | 🔄 遷移 |
| `/components/ui/core/ThemeProvider.tsx`             | `/components/providers/ThemeProvider.tsx`              | 🔄 遷移 |

#### Loading組件 (重組)

| 當前路徑                                    | 新路徑                                             | 狀態    |
| ------------------------------------------- | -------------------------------------------------- | ------- |
| `/components/ui/loading/index.ts`           | `/components/molecules/loading/index.ts`           | 🔄 遷移 |
| `/components/ui/loading/LoadingButton.tsx`  | `/components/molecules/loading/LoadingButton.tsx`  | 🔄 遷移 |
| `/components/ui/loading/LoadingScreen.tsx`  | `/components/molecules/loading/LoadingScreen.tsx`  | 🔄 遷移 |
| `/components/ui/loading/LoadingSpinner.tsx` | `/components/molecules/loading/LoadingSpinner.tsx` | 🔄 遷移 |

#### Mobile組件 (重組)

| 當前路徑                                 | 新路徑                                          | 狀態    |
| ---------------------------------------- | ----------------------------------------------- | ------- |
| `/components/ui/mobile/index.ts`         | `/components/molecules/mobile/index.ts`         | 🔄 遷移 |
| `/components/ui/mobile/MobileButton.tsx` | `/components/molecules/mobile/MobileButton.tsx` | 🔄 遷移 |
| `/components/ui/mobile/MobileCard.tsx`   | `/components/molecules/mobile/MobileCard.tsx`   | 🔄 遷移 |
| `/components/ui/mobile/MobileDialog.tsx` | `/components/molecules/mobile/MobileDialog.tsx` | 🔄 遷移 |
| `/components/ui/mobile/MobileInput.tsx`  | `/components/molecules/mobile/MobileInput.tsx`  | 🔄 遷移 |

#### Layout組件 (重組)

| 當前路徑                                              | 新路徑                                                   | 狀態    |
| ----------------------------------------------------- | -------------------------------------------------------- | ------- |
| `/components/layout/universal/constants.ts`           | `/components/templates/universal/constants.ts`           | 🔄 遷移 |
| `/components/layout/universal/index.ts`               | `/components/templates/universal/index.ts`               | 🔄 遷移 |
| `/components/layout/universal/types.ts`               | `/components/templates/universal/types.ts`               | 🔄 遷移 |
| `/components/layout/universal/UniversalCard.tsx`      | `/components/templates/universal/UniversalCard.tsx`      | 🔄 遷移 |
| `/components/layout/universal/UniversalContainer.tsx` | `/components/templates/universal/UniversalContainer.tsx` | 🔄 遷移 |
| `/components/layout/universal/UniversalErrorCard.tsx` | `/components/templates/universal/UniversalErrorCard.tsx` | 🔄 遷移 |
| `/components/layout/universal/UniversalGrid.tsx`      | `/components/templates/universal/UniversalGrid.tsx`      | 🔄 遷移 |
| `/components/layout/universal/UniversalProvider.tsx`  | `/components/templates/universal/UniversalProvider.tsx`  | 🔄 遷移 |
| `/components/layout/universal/UniversalStack.tsx`     | `/components/templates/universal/UniversalStack.tsx`     | 🔄 遷移 |

#### 業務組件 (重組)

| 當前路徑                                        | 新路徑                                                | 狀態    |
| ----------------------------------------------- | ----------------------------------------------------- | ------- |
| `/components/print-label-pdf/index.ts`          | `/components/business/printing/index.ts`              | 🔄 遷移 |
| `/components/print-label-pdf/PrintLabelPdf.tsx` | `/components/business/printing/PrintLabelPdf.tsx`     | 🔄 遷移 |
| `/components/qr-scanner/simple-qr-scanner.tsx`  | `/components/business/scanning/simple-qr-scanner.tsx` | 🔄 遷移 |

### B. /app/components 資料夾檔案 (115個檔案)

#### 需保留在app/components的檔案

| 當前路徑                                         | 新路徑                                           | 理由                |
| ------------------------------------------------ | ------------------------------------------------ | ------------------- |
| `/app/components/AuthChecker.tsx`                | `/app/components/AuthChecker.tsx`                | App Router特定      |
| `/app/components/StarfieldBackground.tsx`        | `/app/components/StarfieldBackground.tsx`        | App特定背景         |
| `/app/components/providers/FullProviders.tsx`    | `/app/components/providers/FullProviders.tsx`    | App Router Provider |
| `/app/components/providers/MinimalProviders.tsx` | `/app/components/providers/MinimalProviders.tsx` | App Router Provider |

#### QC Label Form組件群 (遷移至business)

| 當前路徑                                                     | 新路徑                                                             | 狀態        |
| ------------------------------------------------------------ | ------------------------------------------------------------------ | ----------- |
| `/app/components/qc-label-form/Accordion.tsx`                | `/components/business/forms/qc-label/Accordion.tsx`                | 🔄 遷移     |
| `/app/components/qc-label-form/AcoOrderForm.tsx`             | `/components/business/forms/qc-label/AcoOrderForm.tsx`             | 🔄 遷移     |
| `/app/components/qc-label-form/BasicProductForm.tsx`         | `/components/business/forms/qc-label/BasicProductForm.tsx`         | 🔄 遷移     |
| `/app/components/qc-label-form/BatchProcessingDialog.tsx`    | `/components/business/forms/qc-label/BatchProcessingDialog.tsx`    | 🔄 遷移     |
| `/app/components/qc-label-form/ClockNumberConfirmDialog.tsx` | `/components/business/forms/qc-label/ClockNumberConfirmDialog.tsx` | ❗ 合併重複 |
| `/app/components/qc-label-form/constants.ts`                 | `/components/business/forms/qc-label/constants.ts`                 | 🔄 遷移     |
| `/app/components/qc-label-form/EnhancedFormField.tsx`        | `/components/business/forms/qc-label/EnhancedFormField.tsx`        | 🔄 遷移     |
| `/app/components/qc-label-form/EnhancedProgressBar.tsx`      | `/components/business/forms/qc-label/EnhancedProgressBar.tsx`      | ❗ 合併重複 |
| `/app/components/qc-label-form/ErrorBoundary.tsx`            | `/components/business/forms/qc-label/ErrorBoundary.tsx`            | 🔄 遷移     |
| `/app/components/qc-label-form/ErrorStats.tsx`               | `/components/business/forms/qc-label/ErrorStats.tsx`               | 🔄 遷移     |
| `/app/components/qc-label-form/FormField.tsx`                | `/components/business/forms/qc-label/FormField.tsx`                | 🔄 遷移     |
| `/app/components/qc-label-form/FormPersistenceIndicator.tsx` | `/components/business/forms/qc-label/FormPersistenceIndicator.tsx` | 🔄 遷移     |
| `/app/components/qc-label-form/GridBasicProductForm.tsx`     | `/components/business/forms/qc-label/GridBasicProductForm.tsx`     | 🔄 遷移     |
| `/app/components/qc-label-form/index.ts`                     | `/components/business/forms/qc-label/index.ts`                     | 🔄 遷移     |
| `/app/components/qc-label-form/LazyComponents.tsx`           | `/components/business/forms/qc-label/LazyComponents.tsx`           | 🔄 遷移     |
| `/app/components/qc-label-form/PerformanceOptimizedForm.tsx` | `/components/business/forms/qc-label/PerformanceOptimizedForm.tsx` | 🔄 遷移     |
| `/app/components/qc-label-form/PrintLabelGrid.tsx`           | `/components/business/forms/qc-label/PrintLabelGrid.tsx`           | 🔄 遷移     |
| `/app/components/qc-label-form/PrintProgressBar.tsx`         | `/components/business/forms/qc-label/PrintProgressBar.tsx`         | 🔄 遷移     |
| `/app/components/qc-label-form/ProductCodeInput.tsx`         | `/components/business/forms/qc-label/ProductCodeInput.tsx`         | 🔄 遷移     |
| `/app/components/qc-label-form/ProductCodeInputGraphQL.tsx`  | `/components/business/forms/qc-label/ProductCodeInputGraphQL.tsx`  | 🔄 遷移     |
| `/app/components/qc-label-form/ProductInfoDisplay.tsx`       | `/components/business/forms/qc-label/ProductInfoDisplay.tsx`       | 🔄 遷移     |
| `/app/components/qc-label-form/RemarkFormatter.tsx`          | `/components/business/forms/qc-label/RemarkFormatter.tsx`          | 🔄 遷移     |
| `/app/components/qc-label-form/ResponsiveLayout.tsx`         | `/components/business/forms/qc-label/ResponsiveLayout.tsx`         | 🔄 遷移     |
| `/app/components/qc-label-form/SlateDetailsForm.tsx`         | `/components/business/forms/qc-label/SlateDetailsForm.tsx`         | 🔄 遷移     |
| `/app/components/qc-label-form/StreamingModeToggle.tsx`      | `/components/business/forms/qc-label/StreamingModeToggle.tsx`      | 🔄 遷移     |
| `/app/components/qc-label-form/TestHardwareButton.tsx`       | `/components/business/forms/qc-label/TestHardwareButton.tsx`       | 🔄 遷移     |
| `/app/components/qc-label-form/TestPrintingFixes.tsx`        | `/components/business/forms/qc-label/TestPrintingFixes.tsx`        | 🔄 遷移     |
| `/app/components/qc-label-form/types.ts`                     | `/components/business/forms/qc-label/types.ts`                     | 🔄 遷移     |
| `/app/components/qc-label-form/ValidationSummary.tsx`        | `/components/business/forms/qc-label/ValidationSummary.tsx`        | 🔄 遷移     |

#### QC Label Form Hooks (遷移至business)

| 當前路徑                                                                    | 新路徑                                                                            | 狀態    |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------- |
| `/app/components/qc-label-form/hooks/index.ts`                              | `/components/business/forms/qc-label/hooks/index.ts`                              | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/useErrorHandler.ts`                    | `/components/business/forms/qc-label/hooks/useErrorHandler.ts`                    | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/useFormValidation.ts`                  | `/components/business/forms/qc-label/hooks/useFormValidation.ts`                  | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/useMediaQuery.ts`                      | `/components/business/forms/qc-label/hooks/useMediaQuery.ts`                      | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/useOptimizedCallback.ts`               | `/components/business/forms/qc-label/hooks/useOptimizedCallback.ts`               | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/usePerformanceMonitor.ts`              | `/components/business/forms/qc-label/hooks/usePerformanceMonitor.ts`              | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/useQcLabelBusiness.tsx`                | `/components/business/forms/qc-label/hooks/useQcLabelBusiness.tsx`                | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/modules/useAcoManagement.tsx`          | `/components/business/forms/qc-label/hooks/modules/useAcoManagement.tsx`          | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/modules/useAuth.tsx`                   | `/components/business/forms/qc-label/hooks/modules/useAuth.tsx`                   | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/modules/useBatchProcessing.tsx`        | `/components/business/forms/qc-label/hooks/modules/useBatchProcessing.tsx`        | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/modules/useClockConfirmation.tsx`      | `/components/business/forms/qc-label/hooks/modules/useClockConfirmation.tsx`      | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/modules/useEnhancedErrorHandling.tsx`  | `/components/business/forms/qc-label/hooks/modules/useEnhancedErrorHandling.tsx`  | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/modules/useFormPersistence.tsx`        | `/components/business/forms/qc-label/hooks/modules/useFormPersistence.tsx`        | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/modules/useFormValidation.tsx`         | `/components/business/forms/qc-label/hooks/modules/useFormValidation.tsx`         | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/modules/useSlateManagement.tsx`        | `/components/business/forms/qc-label/hooks/modules/useSlateManagement.tsx`        | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/modules/useStockUpdates.tsx`           | `/components/business/forms/qc-label/hooks/modules/useStockUpdates.tsx`           | 🔄 遷移 |
| `/app/components/qc-label-form/hooks/modules/useStreamingPdfGeneration.tsx` | `/components/business/forms/qc-label/hooks/modules/useStreamingPdfGeneration.tsx` | 🔄 遷移 |

#### QC Label Form Services (遷移至business)

| 當前路徑                                                 | 新路徑                                                         | 狀態    |
| -------------------------------------------------------- | -------------------------------------------------------------- | ------- |
| `/app/components/qc-label-form/services/ErrorHandler.ts` | `/components/business/forms/qc-label/services/ErrorHandler.ts` | 🔄 遷移 |

#### Analytics組件 (遷移至business)

| 當前路徑                                                      | 新路徑                                                             | 狀態    |
| ------------------------------------------------------------- | ------------------------------------------------------------------ | ------- |
| `/app/components/analytics/AnalyticsButton.tsx`               | `/components/business/analytics/AnalyticsButton.tsx`               | 🔄 遷移 |
| `/app/components/analytics/AnalyticsDashboardDialog.tsx`      | `/components/business/analytics/AnalyticsDashboardDialog.tsx`      | 🔄 遷移 |
| `/app/components/analytics/FinishedTransferDialog.tsx`        | `/components/business/analytics/FinishedTransferDialog.tsx`        | 🔄 遷移 |
| `/app/components/analytics/GlobalAnalyticsDialogs.tsx`        | `/components/business/analytics/GlobalAnalyticsDialogs.tsx`        | 🔄 遷移 |
| `/app/components/analytics/GlobalAnalyticsDialogsWrapper.tsx` | `/components/business/analytics/GlobalAnalyticsDialogsWrapper.tsx` | 🔄 遷移 |
| `/app/components/analytics/index.ts`                          | `/components/business/analytics/index.ts`                          | 🔄 遷移 |
| `/app/components/analytics/OrderTrendDialog.tsx`              | `/components/business/analytics/OrderTrendDialog.tsx`              | 🔄 遷移 |
| `/app/components/analytics/StaffWorkloadDialog.tsx`           | `/components/business/analytics/StaffWorkloadDialog.tsx`           | 🔄 遷移 |
| `/app/components/analytics/useAnalyticsDashboard.tsx`         | `/components/business/analytics/useAnalyticsDashboard.tsx`         | 🔄 遷移 |
| `/app/components/analytics/charts/OutputRatioChart.tsx`       | `/components/business/analytics/charts/OutputRatioChart.tsx`       | 🔄 遷移 |
| `/app/components/analytics/charts/ProductTrendChart.tsx`      | `/components/business/analytics/charts/ProductTrendChart.tsx`      | 🔄 遷移 |
| `/app/components/analytics/charts/StaffWorkloadChart.tsx`     | `/components/business/analytics/charts/StaffWorkloadChart.tsx`     | 🔄 遷移 |

#### Reports組件 (遷移至business)

| 當前路徑                                                          | 新路徑                                                                 | 狀態    |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| `/app/components/reports/GlobalReportDialogs.tsx`                 | `/components/business/reports/GlobalReportDialogs.tsx`                 | 🔄 遷移 |
| `/app/components/reports/ReportsButton.tsx`                       | `/components/business/reports/ReportsButton.tsx`                       | 🔄 遷移 |
| `/app/components/reports/ReportsDashboardDialog.tsx`              | `/components/business/reports/ReportsDashboardDialog.tsx`              | 🔄 遷移 |
| `/app/components/reports/UnifiedExportAllDataDialog.tsx`          | `/components/business/reports/UnifiedExportAllDataDialog.tsx`          | 🔄 遷移 |
| `/app/components/reports/useReportsDashboard.tsx`                 | `/components/business/reports/useReportsDashboard.tsx`                 | 🔄 遷移 |
| `/app/components/reports/configs/acoOrderReport.ts`               | `/components/business/reports/configs/acoOrderReport.ts`               | 🔄 遷移 |
| `/app/components/reports/configs/exportAllDataReport.ts`          | `/components/business/reports/configs/exportAllDataReport.ts`          | 🔄 遷移 |
| `/app/components/reports/configs/grnReport.ts`                    | `/components/business/reports/configs/grnReport.ts`                    | 🔄 遷移 |
| `/app/components/reports/configs/orderLoadingReport.ts`           | `/components/business/reports/configs/orderLoadingReport.ts`           | 🔄 遷移 |
| `/app/components/reports/configs/stockTakeReport.ts`              | `/components/business/reports/configs/stockTakeReport.ts`              | 🔄 遷移 |
| `/app/components/reports/configs/transactionReport.ts`            | `/components/business/reports/configs/transactionReport.ts`            | 🔄 遷移 |
| `/app/components/reports/configs/voidPalletReport.ts`             | `/components/business/reports/configs/voidPalletReport.ts`             | 🔄 遷移 |
| `/app/components/reports/core/LegacyOrderLoadingPdfGenerator.ts`  | `/components/business/reports/core/LegacyOrderLoadingPdfGenerator.ts`  | 🔄 遷移 |
| `/app/components/reports/core/LegacyPdfGenerator.ts`              | `/components/business/reports/core/LegacyPdfGenerator.ts`              | 🔄 遷移 |
| `/app/components/reports/core/ReportBuilder.tsx`                  | `/components/business/reports/core/ReportBuilder.tsx`                  | 🔄 遷移 |
| `/app/components/reports/core/ReportCache.ts`                     | `/components/business/reports/core/ReportCache.ts`                     | 🔄 遷移 |
| `/app/components/reports/core/ReportConfig.ts`                    | `/components/business/reports/core/ReportConfig.ts`                    | 🔄 遷移 |
| `/app/components/reports/core/ReportEngine.ts`                    | `/components/business/reports/core/ReportEngine.ts`                    | 🔄 遷移 |
| `/app/components/reports/core/ReportRegistry.ts`                  | `/components/business/reports/core/ReportRegistry.ts`                  | 🔄 遷移 |
| `/app/components/reports/core/UnifiedReportDialog.tsx`            | `/components/business/reports/core/UnifiedReportDialog.tsx`            | 🔄 遷移 |
| `/app/components/reports/dataSources/AcoOrderDataSource.ts`       | `/components/business/reports/dataSources/AcoOrderDataSource.ts`       | 🔄 遷移 |
| `/app/components/reports/dataSources/ExportAllDataSource.ts`      | `/components/business/reports/dataSources/ExportAllDataSource.ts`      | 🔄 遷移 |
| `/app/components/reports/dataSources/GrnDataSource.ts`            | `/components/business/reports/dataSources/GrnDataSource.ts`            | 🔄 遷移 |
| `/app/components/reports/dataSources/OrderLoadingDataSource.ts`   | `/components/business/reports/dataSources/OrderLoadingDataSource.ts`   | 🔄 遷移 |
| `/app/components/reports/dataSources/StockTakeDataSource.ts`      | `/components/business/reports/dataSources/StockTakeDataSource.ts`      | 🔄 遷移 |
| `/app/components/reports/dataSources/TransactionDataSource.ts`    | `/components/business/reports/dataSources/TransactionDataSource.ts`    | 🔄 遷移 |
| `/app/components/reports/dataSources/VoidPalletDataSource.ts`     | `/components/business/reports/dataSources/VoidPalletDataSource.ts`     | 🔄 遷移 |
| `/app/components/reports/generators/CsvGenerator.ts`              | `/components/business/reports/generators/CsvGenerator.ts`              | 🔄 遷移 |
| `/app/components/reports/generators/ExcelGenerator.ts`            | `/components/business/reports/generators/ExcelGenerator.ts`            | 🔄 遷移 |
| `/app/components/reports/generators/ExcelGeneratorNew.ts`         | `/components/business/reports/generators/ExcelGeneratorNew.ts`         | 🔄 遷移 |
| `/app/components/reports/generators/LegacyOrderLoadingAdapter.ts` | `/components/business/reports/generators/LegacyOrderLoadingAdapter.ts` | 🔄 遷移 |
| `/app/components/reports/generators/LegacyVoidPalletAdapter.ts`   | `/components/business/reports/generators/LegacyVoidPalletAdapter.ts`   | 🔄 遷移 |
| `/app/components/reports/generators/PdfGenerator.ts`              | `/components/business/reports/generators/PdfGenerator.ts`              | 🔄 遷移 |
| `/app/components/reports/hooks/useReportGeneration.ts`            | `/components/business/reports/hooks/useReportGeneration.ts`            | 🔄 遷移 |
| `/app/components/reports/schemas/ExcelGeneratorSchemas.ts`        | `/components/business/reports/schemas/ExcelGeneratorSchemas.ts`        | 🔄 遷移 |

#### Shared Validation組件 (遷移至business)

| 當前路徑                                                | 新路徑                                                       | 狀態    |
| ------------------------------------------------------- | ------------------------------------------------------------ | ------- |
| `/app/components/shared/validation/index.ts`            | `/components/business/shared/validation/index.ts`            | 🔄 遷移 |
| `/app/components/shared/validation/NumericInput.tsx`    | `/components/business/shared/validation/NumericInput.tsx`    | 🔄 遷移 |
| `/app/components/shared/validation/SupplierField.tsx`   | `/components/business/shared/validation/SupplierField.tsx`   | 🔄 遷移 |
| `/app/components/shared/validation/SupplierInput.tsx`   | `/components/business/shared/validation/SupplierInput.tsx`   | 🔄 遷移 |
| `/app/components/shared/validation/ValidationForm.tsx`  | `/components/business/shared/validation/ValidationForm.tsx`  | 🔄 遷移 |
| `/app/components/shared/validation/ValidationInput.tsx` | `/components/business/shared/validation/ValidationInput.tsx` | 🔄 遷移 |
| `/app/components/shared/validation/validationRules.ts`  | `/components/business/shared/validation/validationRules.ts`  | 🔄 遷移 |

#### Visual System組件 (保留在app)

| 當前路徑                                                            | 新路徑                                                              | 狀態    |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------- |
| `/app/components/visual-system/config/performance-config.ts`        | `/app/components/visual-system/config/performance-config.ts`        | ✅ 保持 |
| `/app/components/visual-system/config/visual-config.ts`             | `/app/components/visual-system/config/visual-config.ts`             | ✅ 保持 |
| `/app/components/visual-system/core/ClientVisualSystemProvider.tsx` | `/app/components/visual-system/core/ClientVisualSystemProvider.tsx` | ✅ 保持 |
| `/app/components/visual-system/core/UnifiedBackground.tsx`          | `/app/components/visual-system/core/UnifiedBackground.tsx`          | ✅ 保持 |
| `/app/components/visual-system/core/VisualSystemProvider.tsx`       | `/app/components/visual-system/core/VisualSystemProvider.tsx`       | ✅ 保持 |
| `/app/components/visual-system/hooks/usePerformanceMonitor.tsx`     | `/app/components/visual-system/hooks/usePerformanceMonitor.tsx`     | ✅ 保持 |
| `/app/components/visual-system/hooks/useVisualEffects.tsx`          | `/app/components/visual-system/hooks/useVisualEffects.tsx`          | ✅ 保持 |
| `/app/components/visual-system/index.ts`                            | `/app/components/visual-system/index.ts`                            | ✅ 保持 |

#### 其他組件

| 當前路徑                                               | 新路徑                                                    | 狀態    |
| ------------------------------------------------------ | --------------------------------------------------------- | ------- |
| `/app/components/admin/UniversalTimeRangeSelector.tsx` | `/components/domain/admin/UniversalTimeRangeSelector.tsx` | 🔄 遷移 |
| `/app/components/print-label-pdf/PdfGenerator.tsx`     | `/components/business/printing/PdfGenerator.tsx`          | 🔄 遷移 |

### C. /app/(app)/admin/components 資料夾檔案 (19個檔案)

#### Admin專屬組件 (全部遷移)

| 當前路徑                                                      | 新路徑                                                           | 狀態            |
| ------------------------------------------------------------- | ---------------------------------------------------------------- | --------------- |
| `/app/(app)/admin/components/AIResponseRenderer.tsx`          | `/components/domain/admin/chat/AIResponseRenderer.tsx`           | 🔄 遷移         |
| `/app/(app)/admin/components/ChatHeader.tsx`                  | `/components/domain/admin/chat/ChatHeader.tsx`                   | 🔄 遷移         |
| `/app/(app)/admin/components/ChatInput.tsx`                   | `/components/domain/admin/chat/ChatInput.tsx`                    | 🔄 遷移         |
| `/app/(app)/admin/components/ChatMessages.tsx`                | `/components/domain/admin/chat/ChatMessages.tsx`                 | 🔄 遷移         |
| `/app/(app)/admin/components/ClockNumberConfirmDialog.tsx`    | ❌ 刪除                                                          | ❗ 使用統一版本 |
| `/app/(app)/admin/components/EnhancedProgressBar.tsx`         | ❌ 刪除                                                          | ❗ 使用統一版本 |
| `/app/(app)/admin/components/GridBasicProductFormGraphQL.tsx` | `/components/domain/admin/forms/GridBasicProductFormGraphQL.tsx` | 🔄 遷移         |
| `/app/(app)/admin/components/MemoryDashboard.tsx`             | `/components/domain/admin/dashboard/MemoryDashboard.tsx`         | 🔄 遷移         |
| `/app/(app)/admin/components/qc-label-constants.ts`           | `/components/domain/admin/constants/qc-label-constants.ts`       | 🔄 遷移         |
| `/app/(app)/admin/components/QuerySuggestions.tsx`            | `/components/domain/admin/chat/QuerySuggestions.tsx`             | 🔄 遷移         |
| `/app/(app)/admin/components/QuickActions.tsx`                | `/components/domain/admin/chat/QuickActions.tsx`                 | 🔄 遷移         |
| `/app/(app)/admin/components/SuggestionCategories.tsx`        | `/components/domain/admin/chat/SuggestionCategories.tsx`         | 🔄 遷移         |
| `/app/(app)/admin/components/UserIdVerificationDialog.tsx`    | `/components/domain/admin/dialogs/UserIdVerificationDialog.tsx`  | 🔄 遷移         |

#### Admin Shared組件

| 當前路徑                                                   | 新路徑                                                  | 狀態    |
| ---------------------------------------------------------- | ------------------------------------------------------- | ------- |
| `/app/(app)/admin/components/shared/FormInputGroup.tsx`    | `/components/domain/admin/shared/FormInputGroup.tsx`    | 🔄 遷移 |
| `/app/(app)/admin/components/shared/index.ts`              | `/components/domain/admin/shared/index.ts`              | 🔄 遷移 |
| `/app/(app)/admin/components/shared/ProgressIndicator.tsx` | `/components/domain/admin/shared/ProgressIndicator.tsx` | 🔄 遷移 |
| `/app/(app)/admin/components/shared/SearchInput.tsx`       | `/components/domain/admin/shared/SearchInput.tsx`       | 🔄 遷移 |
| `/app/(app)/admin/components/shared/StatusOverlay.tsx`     | `/components/domain/admin/shared/StatusOverlay.tsx`     | 🔄 遷移 |
| `/app/(app)/admin/components/shared/StepIndicator.tsx`     | `/components/domain/admin/shared/StepIndicator.tsx`     | 🔄 遷移 |

### D. /app/(app)/admin/cards/components 資料夾檔案 (5個檔案)

#### Cards專屬組件 (全部遷移)

| 當前路徑                                                           | 新路徑                                                          | 狀態    |
| ------------------------------------------------------------------ | --------------------------------------------------------------- | ------- |
| `/app/(app)/admin/cards/components/StockCountErrorBoundary.tsx`    | `/components/domain/admin/cards/StockCountErrorBoundary.tsx`    | 🔄 遷移 |
| `/app/(app)/admin/cards/components/StockCountForm.tsx`             | `/components/domain/admin/cards/StockCountForm.tsx`             | 🔄 遷移 |
| `/app/(app)/admin/cards/components/StockCountResult.tsx`           | `/components/domain/admin/cards/StockCountResult.tsx`           | 🔄 遷移 |
| `/app/(app)/admin/cards/components/StockTransferErrorBoundary.tsx` | `/components/domain/admin/cards/StockTransferErrorBoundary.tsx` | 🔄 遷移 |
| `/app/(app)/admin/cards/components/StockTransferLoadingState.tsx`  | `/components/domain/admin/cards/StockTransferLoadingState.tsx`  | 🔄 遷移 |

## 第二部分：Import路徑變更清單

### 重複組件合併規則

#### EnhancedProgressBar 合併

```typescript
// 原始版本1: /app/components/qc-label-form/EnhancedProgressBar.tsx
// 原始版本2: /app/(app)/admin/components/EnhancedProgressBar.tsx
// 合併至: /components/business/shared/EnhancedProgressBar.tsx

// 舊import (需更新)
import { EnhancedProgressBar } from '@/app/components/qc-label-form/EnhancedProgressBar';
import { EnhancedProgressBar } from '../components/EnhancedProgressBar';

// 新import
import { EnhancedProgressBar } from '@/components/business/shared/EnhancedProgressBar';
```

#### ClockNumberConfirmDialog 合併

```typescript
// 原始版本1: /app/components/qc-label-form/ClockNumberConfirmDialog.tsx
// 原始版本2: /app/(app)/admin/components/ClockNumberConfirmDialog.tsx
// 合併至: /components/business/shared/ClockNumberConfirmDialog.tsx

// 舊import (需更新)
import ClockNumberConfirmDialog from '@/app/components/qc-label-form/ClockNumberConfirmDialog';
import ClockNumberConfirmDialog from '../components/ClockNumberConfirmDialog';

// 新import
import { ClockNumberConfirmDialog } from '@/components/business/shared/ClockNumberConfirmDialog';
```

### 需要更新import的檔案清單

#### 使用UI組件的檔案 (保持不變，但確認路徑)

```typescript
// 這些import保持不變
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
// ... 其他UI組件
```

#### 使用QC Label Form組件的檔案

| 檔案路徑                                       | 舊import                                                                              | 新import                                                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `/app/(app)/admin/cards/QCLabelCard.tsx`       | `import GridBasicProductFormGraphQL from '../components/GridBasicProductFormGraphQL'` | `import { GridBasicProductFormGraphQL } from '@/components/domain/admin/forms/GridBasicProductFormGraphQL'` |
| `/app/(app)/admin/cards/GRNLabelCard.tsx`      | `import { EnhancedProgressBar } from '../components/EnhancedProgressBar'`             | `import { EnhancedProgressBar } from '@/components/business/shared/EnhancedProgressBar'`                    |
| `/app/(app)/admin/cards/StockTransferCard.tsx` | `import { SearchInput, FormInputGroup } from '../components/shared'`                  | `import { SearchInput, FormInputGroup } from '@/components/domain/admin/shared'`                            |

#### 使用Admin組件的檔案

| 檔案路徑                                 | 舊import                                                            | 新import                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `/app/(app)/admin/cards/ChatbotCard.tsx` | `import AIResponseRenderer from '../components/AIResponseRenderer'` | `import { AIResponseRenderer } from '@/components/domain/admin/chat/AIResponseRenderer'` |
| `/app/(app)/admin/cards/ChatbotCard.tsx` | `import ChatHeader from '../components/ChatHeader'`                 | `import { ChatHeader } from '@/components/domain/admin/chat/ChatHeader'`                 |
| `/app/(app)/admin/cards/ChatbotCard.tsx` | `import ChatInput from '../components/ChatInput'`                   | `import { ChatInput } from '@/components/domain/admin/chat/ChatInput'`                   |
| `/app/(app)/admin/cards/ChatbotCard.tsx` | `import ChatMessages from '../components/ChatMessages'`             | `import { ChatMessages } from '@/components/domain/admin/chat/ChatMessages'`             |

#### 使用Cards組件的檔案

| 檔案路徑                                    | 舊import                                                                     | 新import                                                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `/app/(app)/admin/cards/StockCountCard.tsx` | `import StockCountForm from './components/StockCountForm'`                   | `import { StockCountForm } from '@/components/domain/admin/cards/StockCountForm'`                   |
| `/app/(app)/admin/cards/StockCountCard.tsx` | `import StockCountResult from './components/StockCountResult'`               | `import { StockCountResult } from '@/components/domain/admin/cards/StockCountResult'`               |
| `/app/(app)/admin/cards/StockCountCard.tsx` | `import StockCountErrorBoundary from './components/StockCountErrorBoundary'` | `import { StockCountErrorBoundary } from '@/components/domain/admin/cards/StockCountErrorBoundary'` |

## 第三部分：實施步驟詳細指南

### 步驟1：建立新目錄結構 (第1天)

```bash
# 執行以下命令建立新結構
mkdir -p components/molecules/{dialogs,loading,mobile}
mkdir -p components/organisms
mkdir -p components/templates/universal
mkdir -p components/providers
mkdir -p components/business/{forms/qc-label,analytics,reports,shared,printing,scanning}
mkdir -p components/business/forms/qc-label/{hooks/modules,services}
mkdir -p components/business/analytics/charts
mkdir -p components/business/reports/{configs,core,dataSources,generators,hooks,schemas}
mkdir -p components/business/shared/validation
mkdir -p components/domain/admin/{chat,dashboard,dialogs,forms,constants,shared,cards}
```

### 步驟2：設置TypeScript路徑別名 (第1天)

更新 `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/ui/*": ["./components/ui/*"],
      "@/molecules/*": ["./components/molecules/*"],
      "@/organisms/*": ["./components/organisms/*"],
      "@/templates/*": ["./components/templates/*"],
      "@/business/*": ["./components/business/*"],
      "@/domain/*": ["./components/domain/*"],
      "@/providers/*": ["./components/providers/*"],
      "@/app-components/*": ["./app/components/*"]
    }
  }
}
```

### 步驟3：創建統一類型定義 (第2天)

創建 `/types/shared/index.ts`:

```typescript
// 統一的ProductInfo類型
export interface ProductInfo {
  readonly code: string;
  readonly description: string;
  readonly standard_qty: string;
  readonly type: string;
  readonly remark?: string;
}

// 可變版本
export type MutableProductInfo = {
  -readonly [K in keyof ProductInfo]: ProductInfo[K];
};

// 其他共用類型...
```

### 步驟4：合併重複組件 (第3-4天)

#### 合併EnhancedProgressBar

1. 比較兩個版本的功能差異
2. 整合最佳功能到統一版本
3. 創建 `/components/business/shared/EnhancedProgressBar.tsx`
4. 更新所有引用

#### 合併ClockNumberConfirmDialog

1. 比較兩個版本的功能差異
2. 整合最佳功能到統一版本
3. 創建 `/components/business/shared/ClockNumberConfirmDialog.tsx`
4. 更新所有引用

### 步驟5：批量遷移腳本 (第5-7天)

創建 `scripts/migrate-components.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';

const migrationMap = {
  // UI Core Dialog組件
  '/components/ui/core/Dialog/ConfirmDialog.tsx': '/components/molecules/dialogs/ConfirmDialog.tsx',
  '/components/ui/core/Dialog/Dialog.tsx': '/components/molecules/dialogs/Dialog.tsx',
  // ... 完整的遷移映射
};

function migrateFile(oldPath: string, newPath: string) {
  const content = fs.readFileSync(oldPath, 'utf8');
  const dir = path.dirname(newPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(newPath, content);
  console.log(`遷移: ${oldPath} -> ${newPath}`);
}

// 執行遷移
Object.entries(migrationMap).forEach(([oldPath, newPath]) => {
  const fullOldPath = path.join(process.cwd(), oldPath);
  const fullNewPath = path.join(process.cwd(), newPath);

  if (fs.existsSync(fullOldPath)) {
    migrateFile(fullOldPath, fullNewPath);
  }
});
```

### 步驟6：更新import路徑腳本 (第8-10天)

創建 `scripts/update-imports.ts`:

```typescript
import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

const importUpdateMap = {
  '@/app/components/qc-label-form': '@/business/forms/qc-label',
  '../components/EnhancedProgressBar': '@/business/shared/EnhancedProgressBar',
  // ... 完整的import映射
};

// 更新所有檔案的import
project.getSourceFiles().forEach(sourceFile => {
  sourceFile.getImportDeclarations().forEach(importDecl => {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    for (const [oldPath, newPath] of Object.entries(importUpdateMap)) {
      if (moduleSpecifier.includes(oldPath)) {
        const updatedPath = moduleSpecifier.replace(oldPath, newPath);
        importDecl.setModuleSpecifier(updatedPath);
        console.log(`更新: ${moduleSpecifier} -> ${updatedPath}`);
      }
    }
  });
});

await project.save();
```

### 步驟7：建立相容層 (第11天)

創建 `/components/compatibility.ts`:

```typescript
// 臨時相容層，確保舊import仍可運作
export { Button } from '@/ui/button';
export { EnhancedProgressBar } from '@/business/shared/EnhancedProgressBar';
export { ClockNumberConfirmDialog } from '@/business/shared/ClockNumberConfirmDialog';
// ... 其他組件
```

### 步驟8：測試與驗證 (第12-14天)

```bash
# 執行TypeScript編譯檢查
npm run typecheck

# 執行單元測試
npm run test

# 執行E2E測試
npm run test:e2e

# 執行建置
npm run build
```

### 步驟9：清理舊檔案 (第15天)

創建 `scripts/cleanup-old-files.ts`:

```typescript
import * as fs from 'fs';

const filesToDelete = [
  '/app/(app)/admin/components/EnhancedProgressBar.tsx',
  '/app/(app)/admin/components/ClockNumberConfirmDialog.tsx',
  // ... 其他要刪除的檔案
];

filesToDelete.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`刪除: ${file}`);
  }
});

// 刪除空目錄
const emptyDirs = [
  '/app/(app)/admin/cards/components',
  // ... 其他可能變空的目錄
];

emptyDirs.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath) && fs.readdirSync(fullPath).length === 0) {
    fs.rmdirSync(fullPath);
    console.log(`刪除空目錄: ${dir}`);
  }
});
```

## 第四部分：風險管理與回滾計劃

### 風險點檢查清單

- [ ] 所有TypeScript類型定義已統一
- [ ] 所有重複組件已合併
- [ ] 所有import路徑已更新
- [ ] 所有測試通過
- [ ] 建置成功
- [ ] 無循環依賴
- [ ] 性能指標正常

### 回滾步驟

如果遷移失敗，執行以下回滾：

```bash
# 1. 還原git變更
git stash
git checkout main

# 2. 還原node_modules (如有需要)
rm -rf node_modules
npm install

# 3. 清除建置快取
rm -rf .next
npm run build
```

## 第五部分：驗證檢查清單

### 編譯時檢查

- [ ] `npm run typecheck` 無錯誤
- [ ] `npm run lint` 無錯誤
- [ ] `npm run build` 成功

### 運行時檢查

- [ ] 所有頁面正常載入
- [ ] 所有組件正常渲染
- [ ] 所有功能正常運作
- [ ] 無控制台錯誤

### 性能檢查

- [ ] 首次載入時間 < 3秒
- [ ] 組件渲染無延遲
- [ ] Bundle大小未顯著增加

## 總結

此超詳細計劃涵蓋：

- **203個組件檔案**的完整遷移路徑
- **所有import語句**的更新清單
- **重複組件**的合併策略
- **自動化腳本**協助執行
- **風險管理**與回滾計劃

預計執行時間：**15個工作天**
影響檔案數：**約500-600個檔案**（包括引用組件的檔案）

建議採用漸進式實施，每完成一個階段立即測試驗證，確保系統穩定性。
