'use client';

import React from 'react';
import { usePdfGeneration } from './usePdfGeneration';
import { PrintLabelPdf } from '@/components/print-label-pdf/PrintLabelPdf';
// import { GrnLabelPdf } from '@/components/grn-label-pdf/GrnLabelPdf';
import type { QcInputData } from '@/lib/pdfUtils';
import type { GrnLabelData } from '@/app/print-grnlabel/types';

interface UseUnifiedPdfGenerationOptions {
  labelType: 'qc' | 'grn';
  autoUpload?: boolean;
  autoPrint?: boolean;
}

/**
 * Unified PDF generation hook for QC and GRN labels
 * QC 和 GRN 標籤的統一 PDF 生成 Hook
 *
 * @example
 * ```typescript
 * // For QC Labels
 * const qcPdfGenerator = useUnifiedPdfGeneration({ labelType: 'qc' });
 * const results = await qcPdfGenerator.generateLabels(qcDataArray);
 *
 * // For GRN Labels
 * const grnPdfGenerator = useUnifiedPdfGeneration({ labelType: 'grn' });
 * const results = await grnPdfGenerator.generateLabels(grnDataArray);
 * ```
 */
export function useUnifiedPdfGeneration(options: UseUnifiedPdfGenerationOptions) {
  const { labelType, autoUpload = true, autoPrint = true } = options;

  const storagePath = labelType === 'qc' ? 'qc-labels' : 'grn-labels';

  const pdfGeneration = usePdfGeneration({
    defaultStoragePath: storagePath,
    defaultUpload: autoUpload,
    autoPrint: autoPrint,
    mergePdfs: true,
  });

  /**
   * Generate QC label PDFs
   */
  const generateQcLabels = async (
    dataArray: QcInputData[],
    onProgress?: (current: number, total: number) => void
  ) => {
    const components = dataArray.map(data => (
      <PrintLabelPdf
        key={data.palletNum}
        {...data}
        productType={data.productType || undefined}
        description={data.productDescription}
        date={new Date().toISOString().split('T')[0]}
      />
    ));

    const filenames = dataArray.map(data => `qc-label-${data.palletNum.replace(/\//g, '_')}`);

    return pdfGeneration.generateMultiplePdfs({
      components,
      filenames,
      batchSize: 5,
      onProgress: (current, total, status) => {
        onProgress?.(current, total);
        if (status === 'failed') {
          console.error(`Failed to generate PDF ${current}/${total}`);
        }
      },
    });
  };

  /**
   * Generate GRN label PDFs
   */
  const generateGrnLabels = async (
    dataArray: GrnLabelData[],
    onProgress?: (current: number, total: number) => void
  ) => {
    const components = dataArray.map(data => (
      // <GrnLabelPdf key={data.palletNumber} {...data} />
      <PrintLabelPdf key={data.palletNumber} {...(data as any /* TODO: Strategy 5 - Replace with proper QcInputData type when GrnLabelPdf component is created. Tracking issue: #ESLINT-CLEANUP-001 */)} />
    ));

    const filenames = dataArray.map(data => `grn-label-${data.palletNumber.replace(/\//g, '_')}`);

    return pdfGeneration.generateMultiplePdfs({
      components,
      filenames,
      batchSize: 5,
      onProgress: (current, total, status) => {
        onProgress?.(current, total);
        if (status === 'failed') {
          console.error(`Failed to generate PDF ${current}/${total}`);
        }
      },
    });
  };

  /**
   * Generate labels based on type
   */
  const generateLabels = async (
    dataArray: Record<string, unknown>[],
    onProgress?: (current: number, total: number) => void
  ) => {
    if (labelType === 'qc') {
      return generateQcLabels(dataArray as QcInputData[], onProgress);
    } else {
      return generateGrnLabels(dataArray as GrnLabelData[], onProgress);
    }
  };

  /**
   * Generate a single label
   */
  const generateSingleLabel = async (data: Record<string, unknown>) => {
    const component =
      labelType === 'qc' ? (
        <PrintLabelPdf
          {...(data as QcInputData)}
          productType={data.productType || undefined}
          description={data.productDescription}
          date={new Date().toISOString().split('T')[0]}
        />
      ) : (
        <PrintLabelPdf {...(data as any /* TODO: Strategy 5 - Replace with proper GrnLabelData type conversion utility. Requires: 1. Create GrnLabelData to QcInputData mapper, 2. Implement type-safe conversion. Tracking: #ESLINT-CLEANUP-002 */)} />
      ); // Temporary: use PrintLabelPdf until GrnLabelPdf is created

    const filename =
      labelType === 'qc'
        ? `qc-label-${data.palletNum?.replace(/\//g, '_')}`
        : `grn-label-${data.palletNumber?.replace(/\//g, '_')}`;

    return pdfGeneration.generateSinglePdf({
      component,
      filename,
    });
  };

  return {
    ...pdfGeneration,
    generateLabels,
    generateSingleLabel,
    generateQcLabels,
    generateGrnLabels,
  };
}
