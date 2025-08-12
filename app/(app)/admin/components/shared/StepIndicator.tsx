/**
 * StepIndicator Component
 * Generic step indicator with configurable steps and states
 * Extracted from VoidPalletCard
 * 
 * Features:
 * - Configurable steps with labels and numbers
 * - Completed/active/pending states
 * - Connection lines between steps
 * - Check mark for completed steps
 * - Responsive design
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

export type StepStatus = 'completed' | 'active' | 'pending';

export interface Step {
  id: string;
  label: string;
  number: number;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStepId: string;
  className?: string;
  variant?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showConnectors?: boolean;
  completedColor?: string;
  activeColor?: string;
  pendingColor?: string;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStepId,
  className,
  variant = 'horizontal',
  size = 'md',
  showConnectors = true,
  completedColor = 'green-400',
  activeColor = 'white',
  pendingColor = 'white/60',
}) => {
  const getStepStatus = (stepId: string): StepStatus => {
    const stepOrder = steps.map(step => step.id);
    const currentIndex = stepOrder.indexOf(currentStepId);
    const stepIndex = stepOrder.indexOf(stepId);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          circle: 'h-6 w-6',
          text: 'text-xs',
          label: 'text-xs',
          connector: 'h-px w-8',
        };
      case 'lg':
        return {
          circle: 'h-10 w-10',
          text: 'text-base',
          label: 'text-base',
          connector: 'h-px w-16',
        };
      default:
        return {
          circle: 'h-8 w-8',
          text: 'text-sm',
          label: 'text-sm',
          connector: 'h-px w-12',
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const getStepClasses = (status: StepStatus) => {
    switch (status) {
      case 'completed':
        return {
          container: `text-${completedColor}`,
          circle: `border-${completedColor} bg-${completedColor} text-white`,
          label: `text-${completedColor}`,
        };
      case 'active':
        return {
          container: `text-${activeColor}`,
          circle: `border-${activeColor} bg-${activeColor} text-black`,
          label: `text-${activeColor}`,
        };
      case 'pending':
        return {
          container: `text-${pendingColor}`,
          circle: `border-${pendingColor}/30 bg-${pendingColor}/10 text-${pendingColor}`,
          label: `text-${pendingColor}`,
        };
    }
  };

  const getConnectorClasses = (status: StepStatus) => {
    return status === 'completed' 
      ? `bg-${completedColor}` 
      : `bg-${pendingColor}/20`;
  };

  if (variant === 'vertical') {
    return (
      <div className={cn('space-y-4', className)}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          const stepClasses = getStepClasses(status);
          
          return (
            <div key={step.id} className="relative">
              <div className={cn('flex items-center gap-3', stepClasses.container)}>
                <div className={cn(
                  'flex items-center justify-center rounded-full border-2 font-medium transition-colors',
                  sizeClasses.circle,
                  sizeClasses.text,
                  stepClasses.circle
                )}>
                  {status === 'completed' ? (
                    <CheckCircle className={cn('h-4 w-4', size === 'lg' && 'h-5 w-5')} />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={cn('font-medium', sizeClasses.label, stepClasses.label)}>
                  {step.label}
                </span>
              </div>
              
              {showConnectors && index < steps.length - 1 && (
                <div className={cn(
                  'ml-4 mt-2 w-px h-8 transition-colors',
                  getConnectorClasses(status)
                )} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal layout
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {steps.map((step, index) => {
        const status = getStepStatus(step.id);
        const stepClasses = getStepClasses(status);
        
        return (
          <React.Fragment key={step.id}>
            <div className={cn('flex items-center gap-2', stepClasses.container)}>
              <div className={cn(
                'flex items-center justify-center rounded-full border-2 font-medium transition-colors',
                sizeClasses.circle,
                sizeClasses.text,
                stepClasses.circle
              )}>
                {status === 'completed' ? (
                  <CheckCircle className={cn('h-4 w-4', size === 'lg' && 'h-5 w-5')} />
                ) : (
                  step.number
                )}
              </div>
              <span className={cn('font-medium', sizeClasses.label, stepClasses.label)}>
                {step.label}
              </span>
            </div>
            
            {showConnectors && index < steps.length - 1 && (
              <div className={cn(
                'mx-2 transition-colors',
                sizeClasses.connector,
                getConnectorClasses(status)
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;