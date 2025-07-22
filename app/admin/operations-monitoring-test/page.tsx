/**
 * 簡化測試頁面 - 直接渲染 operations-monitoring layout
 * 用於診斷 Grid 渲染問題
 */

'use client';

import React from 'react';
import { adminDashboardLayouts } from '../components/dashboard/adminDashboardLayouts';

export default function OperationsMonitoringTest() {
  const layout = adminDashboardLayouts['operations-monitoring'];

  if (!layout) {
    return <div>Layout not found</div>;
  }

  const gridTemplateLines = layout.gridTemplate
    .trim()
    .split('\n')
    .filter(line => line.trim());
  const numRows = gridTemplateLines.length;
  const numCols = gridTemplateLines[0] ? gridTemplateLines[0].trim().split(/\s+/).length : 14;

  console.log('Grid Debug:', {
    numRows,
    numCols,
    gridTemplate: layout.gridTemplate,
    widgets: layout.widgets.length,
  });

  return (
    <div className='min-h-screen bg-slate-900 p-4'>
      <h1 className='mb-4 text-2xl text-white'>Operations Monitoring Test</h1>

      <div className='mb-4 text-white'>
        <p>
          Grid: {numCols} cols × {numRows} rows
        </p>
        <p>Widgets: {layout.widgets.length}</p>
      </div>

      <div
        className='border border-slate-600 bg-slate-800'
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${numCols}, 1fr)`,
          gridTemplateRows: `repeat(${numRows}, minmax(120px, auto))`,
          gap: '16px',
          gridTemplateAreas: layout.gridTemplate,
          height: '80vh',
          width: '100%',
          padding: '20px',
        }}
        data-testid='grid-container'
      >
        {layout.widgets.map((widget, index) => (
          <div
            key={`${widget.gridArea}-${index}`}
            style={{
              gridArea: widget.gridArea,
            }}
            className='rounded border border-orange-600 bg-orange-500 p-4 text-white'
          >
            <h3 className='font-bold'>{widget.title}</h3>
            <p className='text-sm'>Component: {widget.component}</p>
            <p className='text-sm'>Grid Area: {widget.gridArea}</p>
            <p className='text-sm'>Type: {widget.type}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
