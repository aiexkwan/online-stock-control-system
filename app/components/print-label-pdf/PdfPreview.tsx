'use client';

import { useState } from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import PdfTemplate from './PdfTemplate';

interface PdfPreviewProps {
  productCode?: string;
  description?: string;
  quantity?: number;
  date?: string;
  operatorClockNum?: string;
  qcClockNum?: string;
  workOrderNumber?: string;
  palletNum?: string;
}

export default function PdfPreview({
  productCode = 'SA40-10',
  description = 'Envirocrate Heavy 40-10',
  quantity = 6,
  date = '06-May-2025',
  operatorClockNum = '5500/5579',
  qcClockNum = '5997',
  workOrderNumber = 'ACO Ref : 123456  (Plt : 1)',
  palletNum = '060525/34'
}: PdfPreviewProps) {
  const [showPdf, setShowPdf] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setShowPdf(!showPdf)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {showPdf ? 'Hide PDF Preview' : 'Show PDF Preview'}
      </button>

      {showPdf && (
        <div className="w-full h-[800px] border border-gray-300">
          <PDFViewer width="100%" height="100%">
            <PdfTemplate
              productCode={productCode}
              description={description}
              quantity={quantity}
              date={date}
              operatorClockNum={operatorClockNum}
              qcClockNum={qcClockNum}
              workOrderNumber={workOrderNumber}
              palletNum={palletNum}
            />
          </PDFViewer>
        </div>
      )}
    </div>
  );
} 