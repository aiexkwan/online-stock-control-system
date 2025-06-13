'use client';

import React, { useState, useRef, useEffect } from 'react';
import { InformationCircleIcon, XMarkIcon, QuestionMarkCircleIcon, BookOpenIcon } from '@heroicons/react/24/outline';

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
  title = "Instructions",
  steps,
  position = 'top-left',
  customPosition,
  className = '',
  variant = 'hangover'
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
    'relative': 'relative',
    'custom': ''
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
        className={`relative inline-block z-[9999] ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          ref={buttonRef}
          className="group relative w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center z-[9999] hover:shadow-blue-500/50 hover:shadow-xl"
          title="Instructions"
        >
          <BookOpenIcon className="h-5 w-5 group-hover:animate-pulse" />
          
          {/* 脈衝動畫環 */}
          <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping opacity-75"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-pulse"></div>
        </button>

        <div 
          ref={panelRef}
          className={`
            absolute top-12 w-72 sm:w-80 max-w-[95vw] z-[9999]
            bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50
            transform transition-all duration-300 ease-out
            ${isHovered ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
            ${panelPosition === 'right' ? 'right-0' : 'left-0'}
          `}
          style={{
            transform: isHovered ? 'translateX(0) scale(1)' : 'translateX(0) scale(0.95)',
            transformOrigin: panelPosition === 'right' ? 'top right' : 'top left',
            // 確保對話框不會超出視窗邊界
            maxWidth: panelPosition === 'right' ? 
              `${Math.min(320, window.innerWidth - (buttonRef.current?.getBoundingClientRect().right || 0))}px` :
              `${Math.min(320, buttonRef.current?.getBoundingClientRect().left || 320)}px`
          }}
        >
          <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-cyan-50">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <BookOpenIcon className="h-5 w-5 text-blue-600 mr-2" />
              {title}
            </h3>
          </div>

          <div className="p-4 max-h-80 sm:max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-b-xl border-t border-gray-200/50">
            <p className="text-xs text-gray-500 text-center flex items-center justify-center">
              <QuestionMarkCircleIcon className="h-3 w-3 mr-1" />
              Hover to view instructions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`fixed z-[9999] ${getPositionClass()} ${className}`}
    >
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group relative w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110
          flex items-center justify-center z-[9999]
          ${isOpen 
            ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-white shadow-blue-500/50 shadow-xl' 
            : 'bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-blue-50 shadow-gray-500/25 hover:shadow-blue-500/30'
          }
        `}
        title={isOpen ? 'Close Instructions' : 'View Instructions'}
      >
        {isOpen ? (
          <XMarkIcon className="h-7 w-7" />
        ) : (
          <>
            <BookOpenIcon className="h-7 w-7 group-hover:animate-pulse" />
            
            {/* 脈衝動畫環 */}
            <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping opacity-75"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 animate-pulse"></div>
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          
          <div 
            ref={panelRef}
            className={`
              absolute w-72 sm:w-80 max-w-[95vw] z-[9999]
              bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50
              transform transition-all duration-300 ease-out
              ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
              ${panelPosition === 'right' ? 'right-0' : 'left-0'}
            `}
            style={{
              top: '4rem',
              transformOrigin: panelPosition === 'right' ? 'top right' : 'top left',
              ...getPositionStyle()
            }}
          >
            <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <BookOpenIcon className="h-5 w-5 text-blue-600 mr-2" />
                  {title}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 max-h-80 sm:max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">
                        {step.title}
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-b-xl border-t border-gray-200/50">
              <p className="text-xs text-gray-500 text-center flex items-center justify-center">
                <QuestionMarkCircleIcon className="h-3 w-3 mr-1" />
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