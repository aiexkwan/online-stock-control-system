// PDF Polyfill for @react-pdf/renderer
// This file provides a mock implementation of pdfkit for client-side usage

if (typeof window !== 'undefined') {
  // Client-side mock
  module.exports = {
    Document: class Document {
      constructor() {
        console.warn('PDFKit is not available in the browser. Using mock implementation.');
      }
      pipe() { return this; }
      end() { return this; }
      addPage() { return this; }
      fontSize() { return this; }
      font() { return this; }
      text() { return this; }
      moveDown() { return this; }
      image() { return this; }
      rect() { return this; }
      fill() { return this; }
      stroke() { return this; }
    }
  };
} else {
  // Server-side - use actual pdfkit if available
  try {
    module.exports = require('pdfkit');
  } catch (e) {
    // If pdfkit is not installed, provide a basic mock
    module.exports = {
      Document: class Document {
        constructor() {
          console.warn('PDFKit not installed. PDF generation may not work properly.');
        }
      }
    };
  }
}