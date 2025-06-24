'use client';

import React, { useState } from 'react';
import './Folder3D.css';

interface Folder3DProps {
  color?: string;
  size?: number;
  icon?: React.ReactNode;
  onClick?: () => void;
  label?: string;
  description?: string;
}

export const Folder3D: React.FC<Folder3DProps> = ({
  color = '#70a1ff',
  size = 1,
  icon,
  onClick,
  label,
  description
}) => {
  const handleClick = () => {
    if (onClick) onClick();
  };

  const folderStyle = {
    '--folder-color': color,
    '--folder-back-color': `color-mix(in srgb, ${color} 85%, black)`,
    transform: `scale(${size})`
  } as React.CSSProperties;

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className="folder"
        style={folderStyle}
        onClick={handleClick}
      >
        <div className="folder__back">
          <div className="paper">
            {icon && React.cloneElement(icon as React.ReactElement, { 
              className: 'w-6 h-6 text-gray-600' 
            })}
          </div>
          <div className="paper"></div>
          <div className="paper"></div>
          <div className="folder__front"></div>
        </div>
      </div>
      
      {label && (
        <h3 className="text-sm font-medium text-slate-200 mt-4">{label}</h3>
      )}
      
      {description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
    </div>
  );
};