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
      {/* Background layer with starfield */}
      <div className='fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'>
        <StarfieldBackground />
      </div>

      {/* Content layer - must be above background */}
      <div className='relative z-10'>{children}</div>
    </div>
  );
};
