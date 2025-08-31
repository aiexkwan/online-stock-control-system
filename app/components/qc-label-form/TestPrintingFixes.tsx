'use client';

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getHardwareAbstractionLayer } from '@/lib/hardware/hardware-abstraction-layer';

export function TestPrintingFixes() {
  const [isTestingSingle, setIsTestingSingle] = useState(false);
  const [isTestingMultiple, setIsTestingMultiple] = useState(false);
  const halRef = useRef<ReturnType<typeof getHardwareAbstractionLayer> | null>(null);

  // Initialize HAL
  useEffect(() => {
    const initHAL = async () => {
      try {
        const hal = getHardwareAbstractionLayer();
        await hal.initialize();
        halRef.current = hal;
        console.log('✅ HAL initialized for testing');
      } catch (error) {
        console.error('Failed to initialize HAL:', error);
      }
    };
    initHAL();
  }, []);

  // Create a test PDF blob
  const createTestPdfBlob = (content: string): Blob => {
    const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 24 Tf
100 700 Td
(${content}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000260 00000 n
0000000338 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
432
%%EOF`;

    return new Blob([pdfContent], { type: 'application/pdf' });
  };

  // Test single PDF printing (10 second timeout)
  const testSinglePdfPrint = async () => {
    if (!halRef.current) {
      toast.error('HAL not initialized');
      return;
    }

    setIsTestingSingle(true);
    console.log('=== Testing Single PDF Print (10s timeout) ===');

    try {
      const testBlob = createTestPdfBlob('Test Single PDF - 10 Second Timeout');

      const printJob = {
        type: 'qc-label' as const,
        data: {
          pdfBlob: testBlob,
          productCode: 'TEST-001',
          palletNum: 'P/2025/000001',
          series: 'S001',
        },
        copies: 1,
        priority: 'normal' as const,
        metadata: {
          source: 'test-fixes',
          test: 'single-pdf-timeout',
        },
      };

      console.log('📄 Sending single PDF to printer...');
      toast.info('Opening print dialog - You have 10 seconds to interact with it');

      const startTime = Date.now();
      const result = await halRef.current.print(printJob);
      const endTime = Date.now();

      console.log('✅ Print completed:', {
        success: result.success,
        duration: `${(endTime - startTime) / 1000}s`,
        jobId: result.jobId,
      });

      if (result.success) {
        toast.success(`Print dialog was open for ~${Math.round((endTime - startTime) / 1000)}s`);
      } else {
        toast.error(`Print failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Test failed - check console');
    } finally {
      setIsTestingSingle(false);
    }
  };

  // Test multiple PDF printing with merging
  const testMultiplePdfPrint = async () => {
    if (!halRef.current) {
      toast.error('HAL not initialized');
      return;
    }

    setIsTestingMultiple(true);
    console.log('=== Testing Multiple PDF Print with Merging ===');

    try {
      // Create 3 test PDFs
      const testBlobs = [
        createTestPdfBlob('Label 1 of 3'),
        createTestPdfBlob('Label 2 of 3'),
        createTestPdfBlob('Label 3 of 3'),
      ];

      // Import pdf-lib for merging
      const { PDFDocument } = await import('pdf-lib');
      console.log('📚 pdf-lib loaded for merging');

      // Merge PDFs
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < testBlobs.length; i++) {
        console.log(`📄 Processing PDF ${i + 1} of ${testBlobs.length}...`);
        const pdfBuffer = await testBlobs[i].arrayBuffer();

        try {
          const pdfToMerge = await PDFDocument.load(pdfBuffer);
          const pages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
          console.log(`✅ Added PDF ${i + 1} to merged document`);
        } catch (error) {
          console.error(`Failed to process PDF ${i + 1}:`, error);
        }
      }

      const pageCount = mergedPdf.getPageCount();
      console.log(`📑 Merged PDF has ${pageCount} pages`);

      if (pageCount === 0) {
        throw new Error('No pages in merged PDF');
      }

      const mergedPdfBytes = await mergedPdf.save();
      const mergedPdfBlob = new Blob([mergedPdfBytes as BlobPart], {
        type: 'application/pdf',
      });
      console.log(`📦 Created merged PDF blob: ${(mergedPdfBlob.size / 1024).toFixed(2)}KB`);

      // Send merged PDF to hardware service
      const printJob = {
        type: 'qc-label' as const,
        data: {
          pdfBlob: mergedPdfBlob,
          productCode: 'TEST-MULTI',
          palletNumbers: ['P/2025/000001', 'P/2025/000002', 'P/2025/000003'],
          series: ['S001', 'S002', 'S003'],
          merged: true,
        },
        copies: 1,
        priority: 'normal' as const,
        metadata: {
          source: 'test-fixes',
          test: 'multiple-pdf-merge',
          labelCount: 3,
        },
      };

      console.log('🖨️ Sending merged PDF to printer via hardware service...');
      toast.info('Printing 3 merged labels - You have 10 seconds to interact with print dialog');

      const startTime = Date.now();
      const result = await halRef.current.print(printJob);
      const endTime = Date.now();

      console.log('✅ Print completed:', {
        success: result.success,
        duration: `${(endTime - startTime) / 1000}s`,
        jobId: result.jobId,
        mergedPages: pageCount,
      });

      if (result.success) {
        toast.success(`Successfully printed ${pageCount} merged labels using hardware service!`);
      } else {
        toast.error(`Print failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast.error('Test failed - check console');
    } finally {
      setIsTestingMultiple(false);
    }
  };

  return (
    <Card className='mx-auto max-w-2xl p-6'>
      <h2 className='mb-4 text-xl font-semibold'>Hardware Service Print Testing</h2>
      <p className='mb-6 text-sm text-muted-foreground'>
        Test the fixed print dialog timeout (10 seconds) and multiple PDF support with hardware
        services
      </p>

      <div className='space-y-4'>
        <div className='rounded-lg border p-4'>
          <h3 className='mb-2 font-medium'>Test 1: Print Dialog Timeout</h3>
          <p className='mb-3 text-sm text-muted-foreground'>
            Tests that the print dialog stays open for 10 seconds, giving users enough time to
            interact
          </p>
          <Button onClick={testSinglePdfPrint} disabled={isTestingSingle} variant='outline'>
            {isTestingSingle ? 'Testing...' : 'Test Single PDF (10s timeout)'}
          </Button>
        </div>

        <div className='rounded-lg border p-4'>
          <h3 className='mb-2 font-medium'>Test 2: Multiple PDF Printing</h3>
          <p className='mb-3 text-sm text-muted-foreground'>
            Tests printing multiple PDFs using hardware service with PDF merging (pdf-lib)
          </p>
          <Button onClick={testMultiplePdfPrint} disabled={isTestingMultiple} variant='outline'>
            {isTestingMultiple ? 'Testing...' : 'Test Multiple PDFs (Merged)'}
          </Button>
        </div>

        <div className='mt-6 rounded-lg bg-muted p-4'>
          <h4 className='mb-2 font-medium'>Expected Results:</h4>
          <ul className='space-y-1 text-sm'>
            <li>✓ Print dialog should stay open for ~10 seconds</li>
            <li>✓ You should have time to select printer settings</li>
            <li>✓ Multiple PDFs should be merged into one document</li>
            <li>✓ Console logs should show hardware service usage</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
