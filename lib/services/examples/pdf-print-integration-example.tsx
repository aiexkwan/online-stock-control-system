/**
 * 統一 PDF 和打印服務整合使用範例
 * 展示如何在實際業務場景中使用整合的 PDF 生成和打印功能
 */

import React, { useState } from 'react';
import { UnifiedPdfService, PdfType, type PdfPrintOptions } from '../unified-pdf-service';
import type { QcLabelInputData, GrnLabelInputData } from '@/lib/mappers/pdf-data-mappers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Printer, FileText, CheckCircle, XCircle } from 'lucide-react';

// 範例 1: QC 標籤單個生成並打印
export function QcLabelPrintExample() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const pdfService = UnifiedPdfService.getInstance();

  const handlePrintQcLabel = async () => {
    setLoading(true);

    try {
      // 準備 QC 標籤數據
      const qcData: QcLabelInputData = {
        productCode: 'PRD-2024-001',
        productDescription: 'Premium Quality Product',
        quantity: 500,
        series: 'BATCH-2024-Q1',
        palletNum: 'PLT-QC-001',
        operatorClockNum: 'OP-001',
        qcClockNum: 'QC-001',
      };

      // 打印選項
      const printOptions: PdfPrintOptions = {
        copies: 2,
        priority: 'high',
        uploadBeforePrint: true, // 打印前先上傳到雲端
      };

      // 執行生成並打印
      const result = await pdfService.generateAndPrint(PdfType.QC_LABEL, qcData, printOptions);

      if (result.success) {
        toast({
          title: '打印成功',
          description: `標籤已成功發送到打印機 (Job ID: ${result.jobId})`,
        });

        if (result.pdfUrl) {
          console.log('PDF URL:', result.pdfUrl);
        }
      } else {
        toast({
          title: '打印失敗',
          description: result.error || '未知錯誤',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '系統錯誤',
        description: error instanceof Error ? error.message : '發生未知錯誤',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='p-6'>
      <h3 className='mb-4 text-lg font-semibold'>QC 標籤打印</h3>
      <Button onClick={handlePrintQcLabel} disabled={loading} className='w-full'>
        {loading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            正在處理...
          </>
        ) : (
          <>
            <Printer className='mr-2 h-4 w-4' />
            生成並打印 QC 標籤
          </>
        )}
      </Button>
    </Card>
  );
}

// 範例 2: GRN 標籤批量生成並打印
export function GrnLabelBatchPrintExample() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const { toast } = useToast();
  const pdfService = UnifiedPdfService.getInstance();

  const handleBatchPrint = async () => {
    setLoading(true);
    setProgress({ current: 0, total: 0, status: '' });

    try {
      // 準備批量 GRN 標籤數據
      const grnDataArray: GrnLabelInputData[] = [
        {
          grnNumber: 'GRN-2024-001',
          materialSupplier: 'ABC Supplier Co.',
          productCode: 'MAT-001',
          productDescription: 'Raw Material A',
          netWeight: 100,
          series: 'BATCH-001',
          palletNum: 'PLT-GRN-001',
          receivedBy: 'John Doe',
        },
        {
          grnNumber: 'GRN-2024-002',
          materialSupplier: 'XYZ Trading Ltd.',
          productCode: 'MAT-002',
          productDescription: 'Raw Material B',
          netWeight: 150,
          series: 'BATCH-002',
          palletNum: 'PLT-GRN-002',
          receivedBy: 'Jane Smith',
        },
        {
          grnNumber: 'GRN-2024-003',
          materialSupplier: 'Global Materials Inc.',
          productCode: 'MAT-003',
          productDescription: 'Raw Material C',
          netWeight: 200,
          series: 'BATCH-003',
          palletNum: 'PLT-GRN-003',
          receivedBy: 'Bob Johnson',
        },
      ];

      // 批量打印選項
      const printOptions: PdfPrintOptions = {
        copies: 1,
        priority: 'normal',
        immediateMode: false, // 不合併，分別打印每個標籤
        uploadBeforePrint: true,
      };

      // 執行批量生成並打印
      const result = await pdfService.generateAndPrintBatch(
        PdfType.GRN_LABEL,
        grnDataArray,
        printOptions,
        undefined,
        (current, total, status) => {
          setProgress({ current, total, status });
        }
      );

      const { batchResult, printResult } = result;

      if (printResult?.success) {
        toast({
          title: '批量打印成功',
          description: `成功: ${batchResult.successful}, 失敗: ${batchResult.failed}`,
        });

        // 顯示上傳的 URLs
        if (printResult.uploadedUrls && printResult.uploadedUrls.length > 0) {
          console.log('Uploaded PDFs:', printResult.uploadedUrls);
        }
      } else {
        toast({
          title: '批量打印失敗',
          description: printResult?.error || '打印過程中發生錯誤',
          variant: 'destructive',
        });
      }

      // 顯示詳細結果
      if (batchResult.errors.length > 0) {
        console.error('批量處理錯誤:', batchResult.errors);
      }
    } catch (error) {
      toast({
        title: '系統錯誤',
        description: error instanceof Error ? error.message : '發生未知錯誤',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='p-6'>
      <h3 className='mb-4 text-lg font-semibold'>GRN 標籤批量打印</h3>

      {progress.total > 0 && (
        <div className='mb-4'>
          <div className='mb-1 flex justify-between text-sm text-gray-600'>
            <span>{progress.status}</span>
            <span>
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className='h-2 w-full rounded-full bg-gray-200'>
            <div
              className='h-2 rounded-full bg-blue-600 transition-all'
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <Button onClick={handleBatchPrint} disabled={loading} className='w-full'>
        {loading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            正在處理批量打印...
          </>
        ) : (
          <>
            <FileText className='mr-2 h-4 w-4' />
            批量生成並打印 GRN 標籤
          </>
        )}
      </Button>
    </Card>
  );
}

// 範例 3: 高級打印配置
export function AdvancedPrintConfigExample() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    copies: 1,
    priority: 'normal' as const,
    printerName: '',
    uploadEnabled: true,
    mergeMode: false,
  });
  const { toast } = useToast();
  const pdfService = UnifiedPdfService.getInstance();

  const handleAdvancedPrint = async () => {
    setLoading(true);

    try {
      // 準備測試數據
      const testData: QcLabelInputData[] = Array.from({ length: 5 }, (_, i) => ({
        productCode: `TEST-${i + 1}`,
        productDescription: `Test Product ${i + 1}`,
        quantity: 100 * (i + 1),
        series: `SERIES-${i + 1}`,
        palletNum: `PLT-TEST-${i + 1}`,
        operatorClockNum: `OP-${i + 1}`,
        qcClockNum: `QC-${i + 1}`,
      }));

      // 高級打印選項
      const printOptions: PdfPrintOptions = {
        copies: config.copies,
        priority: config.priority,
        printerPreference: config.printerName || undefined,
        immediateMode: config.mergeMode,
        uploadBeforePrint: config.uploadEnabled,
      };

      // 使用自定義 PDF 配置
      const pdfConfig = {
        paperSize: 'A4' as const,
        orientation: 'portrait' as const,
        uploadEnabled: config.uploadEnabled,
        margin: {
          top: 20,
          right: 15,
          bottom: 20,
          left: 15,
        },
      };

      // 執行高級打印
      const result = await pdfService.generateAndPrintBatch(
        PdfType.QC_LABEL,
        testData,
        printOptions,
        pdfConfig
      );

      if (result.printResult?.success) {
        toast({
          title: '高級打印成功',
          description: `已處理 ${result.batchResult.successful} 個文檔`,
        });

        // 記錄詳細信息
        console.log('打印統計:', {
          總數: testData.length,
          成功: result.batchResult.successful,
          失敗: result.batchResult.failed,
          合併模式: config.mergeMode,
          上傳數量: result.printResult.uploadedUrls?.length || 0,
        });
      } else {
        toast({
          title: '高級打印失敗',
          description: result.printResult?.error || '處理失敗',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '系統錯誤',
        description: error instanceof Error ? error.message : '發生未知錯誤',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='p-6'>
      <h3 className='mb-4 text-lg font-semibold'>高級打印配置</h3>

      <div className='mb-4 space-y-4'>
        <div>
          <label className='mb-1 block text-sm font-medium'>份數</label>
          <input
            type='number'
            min='1'
            max='10'
            value={config.copies}
            onChange={e => setConfig({ ...config, copies: parseInt(e.target.value) || 1 })}
            className='w-full rounded-md border px-3 py-2'
          />
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>優先級</label>
          <select
            value={config.priority}
            onChange={e => setConfig({ ...config, priority: e.target.value as any })}
            className='w-full rounded-md border px-3 py-2'
          >
            <option value='low'>低</option>
            <option value='normal'>正常</option>
            <option value='high'>高</option>
          </select>
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>打印機名稱（可選）</label>
          <input
            type='text'
            value={config.printerName}
            onChange={e => setConfig({ ...config, printerName: e.target.value })}
            placeholder='例如: Label-Printer-01'
            className='w-full rounded-md border px-3 py-2'
          />
        </div>

        <div className='space-y-2'>
          <label className='flex items-center'>
            <input
              type='checkbox'
              checked={config.uploadEnabled}
              onChange={e => setConfig({ ...config, uploadEnabled: e.target.checked })}
              className='mr-2'
            />
            <span className='text-sm'>打印前上傳到雲端</span>
          </label>

          <label className='flex items-center'>
            <input
              type='checkbox'
              checked={config.mergeMode}
              onChange={e => setConfig({ ...config, mergeMode: e.target.checked })}
              className='mr-2'
            />
            <span className='text-sm'>合併為單個 PDF（批量打印）</span>
          </label>
        </div>
      </div>

      <Button onClick={handleAdvancedPrint} disabled={loading} className='w-full'>
        {loading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            正在執行高級打印...
          </>
        ) : (
          <>
            <Printer className='mr-2 h-4 w-4' />
            執行高級打印
          </>
        )}
      </Button>
    </Card>
  );
}

// 主範例組件
export function PdfPrintIntegrationExamples() {
  return (
    <div className='space-y-6 p-6'>
      <h2 className='mb-6 text-2xl font-bold'>PDF 生成與打印整合範例</h2>

      <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <QcLabelPrintExample />
        <GrnLabelBatchPrintExample />
        <AdvancedPrintConfigExample />
      </div>

      <Card className='bg-blue-50 p-6'>
        <h3 className='mb-2 text-lg font-semibold'>整合功能特點</h3>
        <ul className='space-y-2 text-sm'>
          <li className='flex items-start'>
            <CheckCircle className='mr-2 mt-0.5 h-4 w-4 text-green-500' />
            <span>一站式 PDF 生成和打印解決方案</span>
          </li>
          <li className='flex items-start'>
            <CheckCircle className='mr-2 mt-0.5 h-4 w-4 text-green-500' />
            <span>支援單個和批量處理模式</span>
          </li>
          <li className='flex items-start'>
            <CheckCircle className='mr-2 mt-0.5 h-4 w-4 text-green-500' />
            <span>自動 PDF 上傳到雲端存儲</span>
          </li>
          <li className='flex items-start'>
            <CheckCircle className='mr-2 mt-0.5 h-4 w-4 text-green-500' />
            <span>靈活的打印優先級和配置選項</span>
          </li>
          <li className='flex items-start'>
            <CheckCircle className='mr-2 mt-0.5 h-4 w-4 text-green-500' />
            <span>實時進度追踪和錯誤處理</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
