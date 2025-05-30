'use client';

import React, { useState } from 'react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface InstructionStep {
  title: string;
  description: string;
}

interface FloatingInstructionsProps {
  title?: string;
  steps: InstructionStep[];
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'relative';
  className?: string;
  variant?: 'floating' | 'hangover';
}

export const FloatingInstructions: React.FC<FloatingInstructionsProps> = ({
  title = "Instructions",
  steps,
  position = 'top-right',
  className = '',
  variant = 'hangover'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'relative': 'relative'
  };

  const panelPositionClasses = {
    'top-left': 'top-16 left-0',
    'top-right': 'top-16 right-0',
    'bottom-left': 'bottom-16 left-0',
    'bottom-right': 'bottom-16 right-0',
    'relative': 'top-12 right-0'
  };

  if (variant === 'hangover') {
    return (
      <div 
        className={`relative inline-block ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          className="w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center group"
          title="Instructions"
        >
          <InformationCircleIcon className="h-5 w-5 group-hover:animate-pulse" />
        </button>

        <div className={`
          absolute top-10 right-0 w-80 max-w-[90vw] z-50
          bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50
          transform transition-all duration-300 ease-out
          ${isHovered ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}
        `}>
          <div className="p-4 border-b border-gray-200/50">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
              {title}
            </h3>
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-800 mb-1">
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

          <div className="p-3 bg-gray-50/50 rounded-b-xl border-t border-gray-200/50">
            <p className="text-xs text-gray-500 text-center">
              Hover to view instructions
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-12 h-12 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110
          flex items-center justify-center group
          ${isOpen 
            ? 'bg-blue-600 text-white shadow-blue-500/25' 
            : 'bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-blue-50 shadow-gray-500/25'
          }
        `}
        title={isOpen ? 'Close Instructions' : 'Show Instructions'}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <InformationCircleIcon className="h-6 w-6 group-hover:animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsOpen(false)}
          />
          
          <div className={`
            absolute ${panelPositionClasses[position]} w-80 max-w-[90vw]
            bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50
            transform transition-all duration-300 ease-out
            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
          `}>
            <div className="p-4 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-2" />
                  {title}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-800 mb-1">
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

            <div className="p-3 bg-gray-50/50 rounded-b-xl border-t border-gray-200/50">
              <p className="text-xs text-gray-500 text-center">
                Click anywhere outside to close
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingInstructions; 