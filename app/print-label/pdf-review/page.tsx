'use client';

import { useSearchParams } from 'next/navigation';
import ReviewTemplate from '../../components/print-label-pdf/ReviewTemplate';
import { useEffect } from 'react';

export default function PdfReviewPage() {
  const searchParams = useSearchParams();

  // 取得所有 query 參數
  const productCode = searchParams.get('productCode') || '';
  const description = searchParams.get('description') || '';
  const quantity = searchParams.get('quantity') || '';
  const date = searchParams.get('date') || '';
  const operatorClockNum = searchParams.get('operatorClockNum') || '';
  const qcClockNum = searchParams.get('qcClockNum') || '';
  const workOrderType = searchParams.get('workOrderType') || '';
  const workOrderValue = searchParams.get('workOrderValue') || '';
  const palletNum = searchParams.get('palletNum') || '';

  // 組合 workOrderNumber 欄位
  const workOrderNumber =
    workOrderType && workOrderValue && workOrderValue !== '-'
      ? `${workOrderType} : ${workOrderValue}`
      : workOrderType;

  // 添加調試信息
  useEffect(() => {
    process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'production' &&
      console.log('PDF Review Page Loaded');
    process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'production' &&
      console.log('URL Parameters:', {
        productCode,
        description,
        quantity,
        date,
        operatorClockNum,
        qcClockNum,
        workOrderType,
        workOrderValue,
        palletNum,
        workOrderNumber,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productCode,
    description,
    quantity,
    date,
    operatorClockNum,
    qcClockNum,
    workOrderType,
    workOrderValue,
    palletNum,
    workOrderNumber,
  ]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-gray-900 py-8'>
      <div className='rounded bg-white p-8 shadow-lg'>
        <ReviewTemplate
          productCode={productCode}
          description={description}
          quantity={Number(quantity) || 0}
          date={date}
          operatorClockNum={operatorClockNum}
          qcClockNum={qcClockNum}
          workOrderNumber={workOrderNumber}
          palletNum={palletNum}
        />
      </div>
    </div>
  );
}
