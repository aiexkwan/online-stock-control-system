'use client';

import React from 'react';
import { StarfieldBackground } from './StarfieldBackground';

interface UniversalBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const UniversalBackground: React.FC<UniversalBackgroundProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Starfield Background - Fixed position for universal coverage */}
      <StarfieldBackground />

      {/* Dark background base */}
      <div
        className='fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        style={{ zIndex: -1 }}
      />

      {/* Content */}
      <div className='relative' style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};
