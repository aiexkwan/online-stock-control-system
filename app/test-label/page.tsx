'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { PrintLabelPdf } from '@/components/print-label-pdf';

// 動態導入 PDFDownloadLink 以避免 SSR 問題
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
  { ssr: false }
);

export default function TestLabelPage() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '-');
  };

  const testData = {
    productCode: 'MEP9090150',
    description: '900x900x150mm EcoPlus',
    quantity: '11',
    date: formatDate(new Date()),
    operatorClockNum: 'OP-123',
    qcClockNum: 'QC-456',
    series: 'SER-789',
    palletNum: '070525/14',
    productInfo: {
      type: 'ACO',
      acoOrderRef: 'ACO-123',
    },
    workOrderNumber: '',
  };

  function renderDownloadText({ loading }: { loading: boolean }): React.ReactNode {
    return loading ? <span>準備中...</span> : <span>下載測試標籤 PDF</span>;
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">標籤打印測試</h1>
      <div className="bg-white rounded-lg p-6 shadow-lg">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">測試數據：</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>
          <div className="flex justify-center">
            <PDFDownloadLink
              document={<PrintLabelPdf {...testData} />}
              fileName={`Label_${testData.palletNum.replace('/', '_')}.pdf`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {((params: { loading: boolean }) =>
                params.loading ? <span>準備中...</span> : <span>下載測試標籤 PDF</span>
              ) as unknown as React.ReactNode}
            </PDFDownloadLink>
          </div>
        </div>
      </div>
    </div>
  );
} 