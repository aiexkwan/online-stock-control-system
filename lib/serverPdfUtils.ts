import { SupabaseClient } from '@supabase/supabase-js';
import { QcInputData } from './pdfUtils';

/**
 * 服務器端專用的 PDF 生成和上傳函數
 * 避免在 API 路由中使用客戶端組件
 */
export async function generateServerPdf(
  input: QcInputData,
  supabaseClient: SupabaseClient
): Promise<{ publicUrl: string; blob: Blob }> {
  
  // 使用 API 路由來生成 PDF
  const response = await fetch('/api/print-label-pdf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productCode: input.productCode,
      description: input.productDescription,
      quantity: input.quantity,
      date: input.series,
      palletNum: input.palletNum,
      operatorClockNum: input.operatorClockNum,
      qcClockNum: input.qcClockNum,
      workOrderNumber: input.workOrderNumber || '-',
      qrValue: `${input.productCode}-${input.palletNum}`
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`PDF generation failed: ${response.status} ${errorData}`);
  }

  // 獲取 PDF blob
  const blob = await response.blob();
  
  // 生成文件名
  const fileName = `${input.palletNum.replace(/\//g, '_')}.pdf`;
  
  // 上傳到 Supabase
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from('pallet-label-pdf')
    .upload(fileName, blob, {
      cacheControl: '3600',
      upsert: true,
      contentType: 'application/pdf',
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  if (!uploadData?.path) {
    throw new Error('Upload succeeded but no path was returned');
  }

  // 獲取公共 URL
  const { data: urlData } = supabaseClient.storage
    .from('pallet-label-pdf')
    .getPublicUrl(uploadData.path);

  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL');
  }

  return { publicUrl: urlData.publicUrl, blob };
} 