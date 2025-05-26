'use client';

import React from 'react';
import { PerformanceOptimizedForm } from '../components/qc-label-form/PerformanceOptimizedForm';
import { ErrorBoundary } from '../components/qc-label-form/ErrorBoundary';
// import ReviewTemplate from '../components/print-label-pdf/ReviewTemplate';
// import PdfPreview from '../components/print-label-pdf/PdfPreview';

export default function PrintLabelPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400 mb-2">
            Print QC Label
          </h1>
          {/* <p className="text-gray-300 text-lg">
            Generate and print quality control labels for your products
          </p> */}
        </div>

        <ErrorBoundary>
          <PerformanceOptimizedForm />
        </ErrorBoundary>
        {/* <div className="flex-1">
          <h2 className="text-xl font-bold mb-4 text-white">PDF Preview</h2>
          <ReviewTemplate />
          <div className="mt-8">
            <PdfPreview />
          </div>
        </div> */}
      </div>
    </div>
  );
}