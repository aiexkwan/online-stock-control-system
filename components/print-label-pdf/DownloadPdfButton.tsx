'use client';
import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PrintLabelPdf, PrintLabelPdfProps } from './PrintLabelPdf';

export default function DownloadPdfButton(props: PrintLabelPdfProps) {
  return (
    <PDFDownloadLink
      document={<PrintLabelPdf {...props} />}
      fileName={`PalletLabel_${props.palletNum}.pdf`}
      style={{ color: '#2563eb', textDecoration: 'underline', fontSize: 14 }}
    >
      {(({ loading }: { loading: boolean }) =>
        loading ? <span>Generating PDF...</span> : <span>Download Pallet Label PDF</span>
      ) as unknown as React.ReactNode}
    </PDFDownloadLink>
  );
} 