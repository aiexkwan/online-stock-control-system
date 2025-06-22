'use client';

import React from 'react';

export default function TestExactCSSPage() {
  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
    gridTemplateRows: '100px 100px 100px 100px 100px 100px 100px',
    gap: '10px 10px',
    width: '100%',
    padding: '20px',
    background: '#0f172a',
    minHeight: '100vh'
  };

  const items = [
    { gridRow: '1 / 8', gridColumn: '9 / 11' },
    { gridRow: '1 / 3', gridColumn: '1 / 3' },
    { gridRow: '1 / 3', gridColumn: '3 / 5' },
    { gridRow: '1 / 3', gridColumn: '5 / 7' },
    { gridRow: '1 / 3', gridColumn: '7 / 9' },
    { gridRow: '3 / 6', gridColumn: '1 / 4' },
    { gridRow: '3 / 6', gridColumn: '4 / 7' },
    { gridRow: '3 / 6', gridColumn: '7 / 9' },
    { gridRow: '6 / 8', gridColumn: '1 / 5' },
    { gridRow: '6 / 8', gridColumn: '5 / 9' }
  ];

  return (
    <div style={containerStyle}>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            ...item,
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          {index + 1}
        </div>
      ))}
    </div>
  );
}