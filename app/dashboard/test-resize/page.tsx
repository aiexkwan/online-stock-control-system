/**
 * Test page for dashboard resize functionality
 */

'use client';

import React, { useState } from 'react';
import GridLayout from 'react-grid-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import CSS
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

export default function TestResizePage() {
  const [layout, setLayout] = useState([
    { i: 'a', x: 0, y: 0, w: 2, h: 2, minW: 1, maxW: 6, minH: 1, maxH: 6 },
    { i: 'b', x: 2, y: 0, w: 4, h: 2, minW: 2, maxW: 8, minH: 1, maxH: 4 },
    { i: 'c', x: 0, y: 2, w: 4, h: 4, minW: 2, maxW: 8, minH: 2, maxH: 8 }
  ]);

  const [isEdit, setIsEdit] = useState(true);

  const handleLayoutChange = (newLayout: any) => {
    console.log('Layout changed:', newLayout);
    setLayout(newLayout);
  };

  const handleResize = (layout: any, oldItem: any, newItem: any, placeholder: any) => {
    console.log('Resizing:', { oldItem, newItem, placeholder });
  };

  const handleResizeStop = (layout: any, oldItem: any, newItem: any) => {
    console.log('Resize stopped:', { oldItem, newItem });
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-4">Dashboard Resize Test</h1>
        <Button onClick={() => setIsEdit(!isEdit)} className="mb-4">
          {isEdit ? 'Disable' : 'Enable'} Edit Mode
        </Button>
        <div className="text-white mb-4">
          <p>Edit Mode: {isEdit ? 'ON' : 'OFF'}</p>
          <p className="text-sm text-slate-400">Try resizing the widgets below. Check console for debug info.</p>
        </div>
      </div>

      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={60}
        width={1200}
        isDraggable={isEdit}
        isResizable={isEdit}
        onLayoutChange={handleLayoutChange}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
        compactType="vertical"
        preventCollision={false}
        resizeHandles={['se', 's', 'e']}
      >
        <div key="a">
          <Card className="h-full bg-blue-600 text-white p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">Widget A</div>
              <div className="text-sm">Size: {layout[0].w}×{layout[0].h}</div>
            </div>
          </Card>
        </div>
        <div key="b">
          <Card className="h-full bg-green-600 text-white p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">Widget B</div>
              <div className="text-sm">Size: {layout[1].w}×{layout[1].h}</div>
            </div>
          </Card>
        </div>
        <div key="c">
          <Card className="h-full bg-purple-600 text-white p-4 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">Widget C</div>
              <div className="text-sm">Size: {layout[2].w}×{layout[2].h}</div>
            </div>
          </Card>
        </div>
      </GridLayout>

      <style jsx global>{`
        .react-grid-item {
          transition: all 200ms ease;
        }
        .react-grid-item.cssTransforms {
          transition-property: transform;
        }
        .react-grid-item.resizing {
          z-index: 1;
          opacity: 0.9;
        }
        .react-grid-item.react-draggable-dragging {
          transition: none;
          z-index: 3;
        }
        .react-grid-item.react-grid-placeholder {
          background: rgba(255, 255, 255, 0.2);
          opacity: 0.8;
          transition-duration: 100ms;
          z-index: 2;
          border-radius: 8px;
          border: 2px dashed rgba(255, 255, 255, 0.5);
        }
        .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
        }
        .react-resizable-handle-se {
          bottom: 0;
          right: 0;
          cursor: se-resize;
        }
        .react-resizable-handle-s {
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          cursor: s-resize;
          width: 40px;
          height: 10px;
        }
        .react-resizable-handle-e {
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          cursor: e-resize;
          width: 10px;
          height: 40px;
        }
        .react-resizable-handle::after {
          content: '';
          position: absolute;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 2px;
        }
        .react-resizable-handle-se::after {
          right: 3px;
          bottom: 3px;
          width: 12px;
          height: 12px;
          border-right: 2px solid white;
          border-bottom: 2px solid white;
          background: none;
          border-radius: 0 0 4px 0;
        }
        .react-resizable-handle-s::after {
          width: 100%;
          height: 4px;
          bottom: 3px;
        }
        .react-resizable-handle-e::after {
          width: 4px;
          height: 100%;
          right: 3px;
        }
      `}</style>
    </div>
  );
}