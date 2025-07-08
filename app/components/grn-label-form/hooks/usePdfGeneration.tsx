import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { prepareGrnLabelData, GrnInputData, mergeAndPrintPdfs } from '@/lib/pdfUtils';
import { format } from 'date-fns';

interface PdfGenerationOptions {
  batchSize?: number;
  streamingEnabled?: boolean;
}

interface PdfGenerationResult {
  success: boolean;
  pdfBlobs: Blob[];
  error?: string;
}

export function usePdfGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({
    current: 0,
    total: 0,
    status: [] as ('Pending' | 'Processing' | 'Success' | 'Failed')[],
  });

  // Generate single PDF
  const generateSinglePdf = useCallback(async (data: GrnInputData): Promise<Blob | null> => {
    try {
      const pdfLabelProps = await prepareGrnLabelData(data);

      // Dynamic import for PDF generation
      const { pdf } = await import('@react-pdf/renderer');
      const { PrintLabelPdf } = await import('@/components/print-label-pdf/PrintLabelPdf');

      const pdfBlob = await pdf(<PrintLabelPdf {...pdfLabelProps} />).toBlob();

      if (!pdfBlob) {
        throw new Error('PDF generation failed to return a blob');
      }

      return pdfBlob;
    } catch (error: any) {
      console.error('[GRN usePdfGeneration] PDF generation failed:', error);
      return null;
    }
  }, []);

  // Generate multiple PDFs with batch processing
  const generateMultiplePdfs = useCallback(
    async (
      dataList: GrnInputData[],
      options: PdfGenerationOptions = {}
    ): Promise<PdfGenerationResult> => {
      const { batchSize = 5, streamingEnabled = true } = options;

      setIsGenerating(true);
      setGenerationProgress({
        current: 0,
        total: dataList.length,
        status: Array(dataList.length).fill('Pending'),
      });

      const pdfBlobs: Blob[] = [];
      const errors: string[] = [];

      try {
        // Process in batches for better performance
        for (let i = 0; i < dataList.length; i += batchSize) {
          const batch = dataList.slice(i, Math.min(i + batchSize, dataList.length));
          const batchPromises = batch.map((data, batchIndex) => {
            const index = i + batchIndex;

            // Update status to processing
            setGenerationProgress(prev => ({
              ...prev,
              status: prev.status.map((s, idx) => (idx === index ? 'Processing' : s)),
            }));

            return generateSinglePdf(data).then(blob => {
              if (blob) {
                pdfBlobs.push(blob);
                setGenerationProgress(prev => ({
                  ...prev,
                  current: prev.current + 1,
                  status: prev.status.map((s, idx) => (idx === index ? 'Success' : s)),
                }));
              } else {
                errors.push(`Failed to generate PDF for pallet ${index + 1}`);
                setGenerationProgress(prev => ({
                  ...prev,
                  current: prev.current + 1,
                  status: prev.status.map((s, idx) => (idx === index ? 'Failed' : s)),
                }));
              }
            });
          });

          await Promise.all(batchPromises);

          // Optional: Add small delay between batches to prevent UI freezing
          if (streamingEnabled && i + batchSize < dataList.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        return {
          success: errors.length === 0,
          pdfBlobs,
          error: errors.length > 0 ? errors.join('; ') : undefined,
        };
      } finally {
        setIsGenerating(false);
      }
    },
    [generateSinglePdf]
  );

  // Print PDFs
  const printPdfs = useCallback(
    async (
      pdfBlobs: Blob[],
      grnNumber: string,
      palletNumbers: string[],
      seriesNumbers: string[]
    ) => {
      try {
        const pdfArrayBuffers = await Promise.all(pdfBlobs.map(blob => blob.arrayBuffer()));

        const printFileName =
          pdfBlobs.length === 1
            ? `GRNLabel_${grnNumber}_${palletNumbers[0]?.replace('/', '_')}_${seriesNumbers[0]}.pdf`
            : `GRNLabels_Merged_${grnNumber}_${format(new Date(), 'yyyyMMddHHmmss')}.pdf`;

        await mergeAndPrintPdfs(pdfArrayBuffers, printFileName);

        return { success: true };
      } catch (error: any) {
        console.error('[GRN usePdfGeneration] Print failed:', error);
        return { success: false, error: error.message };
      }
    },
    []
  );

  // Reset progress
  const resetProgress = useCallback(() => {
    setGenerationProgress({
      current: 0,
      total: 0,
      status: [],
    });
  }, []);

  return {
    generateSinglePdf,
    generateMultiplePdfs,
    printPdfs,
    isGenerating,
    generationProgress,
    resetProgress,
  };
}
