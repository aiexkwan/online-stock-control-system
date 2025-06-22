'use client';

import React, { useEffect, useRef } from 'react';
import 'gridstack/dist/gridstack.min.css';

export function SimpleGridstack() {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstance = useRef<any>(null);

  useEffect(() => {
    // Dynamic import to ensure client-side only
    import('gridstack').then(({ GridStack }) => {
      if (gridRef.current && !gridInstance.current) {
        console.log('Initializing Gridstack...');
        
        gridInstance.current = GridStack.init({
          column: 10,
          cellHeight: 180,
          margin: 16,
          float: false
        }, gridRef.current);

        // Add a test widget
        gridInstance.current.addWidget({
          x: 0,
          y: 0,
          w: 5,
          h: 5,
          content: '<div class="widget-test" style="background: #3b82f6; color: white; padding: 20px; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px;">5×5 Widget<br/>Height Test</div>'
        });

        console.log('Gridstack initialized with test widget');
      }
    }).catch(err => {
      console.error('Failed to load Gridstack:', err);
    });

    return () => {
      if (gridInstance.current) {
        gridInstance.current.destroy(false);
      }
    };
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-white">Simple Gridstack Test</h2>
      <div 
        ref={gridRef} 
        className="grid-stack"
        style={{ 
          background: 'rgba(30, 41, 59, 0.5)', 
          minHeight: '1000px',
          padding: '20px',
          borderRadius: '8px'
        }}
      ></div>
      <style jsx global>{`
        .grid-stack-item {
          background: #1e293b;
          border: 1px solid #475569;
          border-radius: 8px;
          overflow: hidden;
        }
        
        /* Force 5x5 widget height */
        .grid-stack-item[gs-w="5"][gs-h="5"] {
          min-height: 964px !important;
        }
      `}</style>
    </div>
  );
}