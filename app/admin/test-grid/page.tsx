'use client';

import React, { useState } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export default function TestGridPage() {
  const [layout, setLayout] = useState([
    { i: 'a', x: 0, y: 0, w: 5, h: 5 },
    { i: 'b', x: 5, y: 0, w: 5, h: 5 },
    { i: 'c', x: 10, y: 0, w: 5, h: 5 },
  ]);

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <h1 className="text-white text-2xl mb-4">Grid Layout Test - 18 Columns</h1>
      <div className="bg-gray-800 p-4 rounded">
        <GridLayout
          className="layout"
          layout={layout}
          cols={18}
          rowHeight={90}
          width={1800}
          margin={[16, 16]}
          containerPadding={[40, 20]}
          onLayoutChange={(newLayout) => {
            console.log('Layout changed:', newLayout);
            setLayout(newLayout);
          }}
          compactType={null}
          preventCollision={false}
        >
          <div key="a" className="bg-blue-500 rounded flex items-center justify-center text-white text-2xl">
            Widget A (5x5)
          </div>
          <div key="b" className="bg-green-500 rounded flex items-center justify-center text-white text-2xl">
            Widget B (5x5)
          </div>
          <div key="c" className="bg-red-500 rounded flex items-center justify-center text-white text-2xl">
            Widget C (5x5)
          </div>
        </GridLayout>
      </div>
      <div className="mt-4 text-white">
        <h2 className="text-xl mb-2">Current Layout:</h2>
        <pre className="bg-gray-800 p-4 rounded">
          {JSON.stringify(layout, null, 2)}
        </pre>
      </div>
    </div>
  );
}