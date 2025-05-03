'use client';
import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { PrintLabelPdf, PrintLabelPdfProps } from './PrintLabelPdf';

export default function ManualPdfDownloadButton(props: PrintLabelPdfProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    const blob = await pdf(<PrintLabelPdf {...props} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PalletLabel_${props.palletNum}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      style={{
        color: '#2563eb',
        textDecoration: 'underline',
        fontSize: 14,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {loading ? 'Generating PDF...' : 'Download Pallet Label PDF'}
    </button>
  );
} 