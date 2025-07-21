'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  InformationCircleIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

interface InstructionStep {
  title: string;
  description: string;
}

interface FloatingInstructionsProps {
  title?: string;
  steps: InstructionStep[];
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'relative' | 'custom';
  customPosition?: { top?: string; right?: string; bottom?: string; left?: string };
  className?: string;
  variant?: 'floating' | 'hangover';
}

export const FloatingInstructions: React.FC<FloatingInstructionsProps> = ({
  title = 'Instructions',
  steps,
  position = 'top-left',
  customPosition,
  className = '',
  variant = 'hangover',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<'left' | 'right'>('left');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ((isHovered || isOpen) && buttonRef.current && panelRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const panelWidth = 320; // w-80 = 320px
      const viewportWidth = window.innerWidth;

      // 檢查右側是否有足夠空間（改為優先向右顯示）
      const spaceOnRight = viewportWidth - buttonRect.right;
      const spaceOnLeft = buttonRect.left;

      // 修復邏輯：優先向右顯示，確保對話框完全顯示在視窗內
      if (spaceOnRight >= panelWidth) {
        setPanelPosition('right');
      } else if (spaceOnLeft >= panelWidth) {
        setPanelPosition('left');
      } else {
        // 如果兩側都不夠，選擇空間較大的一側
        setPanelPosition(spaceOnRight > spaceOnLeft ? 'right' : 'left');
      }
    }
  }, [isHovered, isOpen]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    relative: 'relative',
    custom: '',
  };

  // 處理自定義位置
  const getPositionStyle = () => {
    if (position === 'custom' && customPosition) {
      return customPosition;
    }
    return {};
  };

  const getPositionClass = () => {
    if (position === 'custom') {
      return '';
    }
    return positionClasses[position];
  };

  if (variant === 'hangover') {
    return (
      <div
        className={`relative z-[9999] inline-block ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          ref={buttonRef}
          className='group relative z-[9999] flex h-10 w-10 transform items-center justify-center rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/50'
          title='Instructions'
        >
          <BookOpenIcon className='h-5 w-5 group-hover:animate-pulse' />

          {/* 脈衝動畫環 */}
          <div className='absolute inset-0 animate-ping rounded-full bg-blue-400/30 opacity-75'></div>
          <div className='absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20'></div>
        </button>

        <div
          ref={panelRef}
          className={`absolute top-12 z-[9999] w-72 max-w-[95vw] transform rounded-xl border border-gray-200/50 bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out sm:w-80 ${isHovered ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'} ${panelPosition === 'right' ? 'right-0' : 'left-0'} `}
          style={{
            transform: isHovered ? 'translateX(0) scale(1)' : 'translateX(0) scale(0.95)',
            transformOrigin: panelPosition === 'right' ? 'top right' : 'top left',
            // 確保對話框不會超出視窗邊界
            maxWidth:
              panelPosition === 'right'
                ? `${Math.min(320, window.innerWidth - (buttonRef.current?.getBoundingClientRect().right || 0))}px`
                : `${Math.min(320, buttonRef.current?.getBoundingClientRect().left || 320)}px`,
          }}
        >
          <div className='border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-cyan-50 p-4'>
            <h3 className='flex items-center text-lg font-semibold text-gray-800'>
              <BookOpenIcon className='mr-2 h-5 w-5 text-blue-600' />
              {title}
            </h3>
          </div>

          <div className='max-h-80 overflow-y-auto p-4 sm:max-h-96'>
            <div className='space-y-4'>
              {steps.map((step, index) => (
                <div key={index} className='flex items-start space-x-3'>
                  <div className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-lg'>
                    {index + 1}
                  </div>
                  <div className='min-w-0 flex-1'>
                    <h4 className='mb-1 text-sm font-semibold text-gray-800'>{step.title}</h4>
                    <p className='text-xs leading-relaxed text-gray-600'>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='rounded-b-xl border-t border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 p-3'>
            <p className='flex items-center justify-center text-center text-xs text-gray-500'>
              <QuestionMarkCircleIcon className='mr-1 h-3 w-3' />
              Hover to view instructions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed z-[9999] ${getPositionClass()} ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative z-[9999] flex h-14 w-14 transform items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
          isOpen
            ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-xl shadow-blue-500/50'
            : 'bg-white/90 text-blue-600 shadow-gray-500/25 backdrop-blur-sm hover:bg-blue-50 hover:shadow-blue-500/30'
        } `}
        title={isOpen ? 'Close Instructions' : 'View Instructions'}
      >
        {isOpen ? (
          <XMarkIcon className='h-7 w-7' />
        ) : (
          <>
            <BookOpenIcon className='h-7 w-7 group-hover:animate-pulse' />

            {/* 脈衝動畫環 */}
            <div className='absolute inset-0 animate-ping rounded-full bg-blue-400/20 opacity-75'></div>
            <div className='absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10'></div>
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className='fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm'
            onClick={() => setIsOpen(false)}
          />

          <div
            ref={panelRef}
            className={`absolute z-[9999] w-72 max-w-[95vw] transform rounded-xl border border-gray-200/50 bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out sm:w-80 ${isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'} ${panelPosition === 'right' ? 'right-0' : 'left-0'} `}
            style={{
              top: '4rem',
              transformOrigin: panelPosition === 'right' ? 'top right' : 'top left',
              ...getPositionStyle(),
            }}
          >
            <div className='border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-cyan-50 p-4'>
              <div className='flex items-center justify-between'>
                <h3 className='flex items-center text-lg font-semibold text-gray-800'>
                  <BookOpenIcon className='mr-2 h-5 w-5 text-blue-600' />
                  {title}
                </h3>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className='rounded-full p-1 transition-colors hover:bg-gray-100'
                >
                  <XMarkIcon className='h-4 w-4 text-gray-500' />
                </button>
              </div>
            </div>

            <div className='max-h-80 overflow-y-auto p-4 sm:max-h-96'>
              <div className='space-y-4'>
                {steps.map((step, index) => (
                  <div key={index} className='flex items-start space-x-3'>
                    <div className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-lg'>
                      {index + 1}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <h4 className='mb-1 text-sm font-semibold text-gray-800'>{step.title}</h4>
                      <p className='text-xs leading-relaxed text-gray-600'>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='rounded-b-xl border-t border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 p-3'>
              <p className='flex items-center justify-center text-center text-xs text-gray-500'>
                <QuestionMarkCircleIcon className='mr-1 h-3 w-3' />
                Click outside to close
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingInstructions;
