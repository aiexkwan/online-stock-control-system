/**
 * Widget Feature Tooltip Component
 * 顯示不同尺寸下可用嘅功能
 */

'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { WidgetType } from '@/app/types/dashboard';
import { WIDGET_SIZE_RECOMMENDATIONS, getAvailableFeatures } from '@/app/admin/types/widgetSizeRecommendations';
import { cn } from '@/lib/utils';

interface WidgetFeatureTooltipProps {
  widgetType: WidgetType;
  currentSize: { w: number; h: number };
  className?: string;
}

export function WidgetFeatureTooltip({ 
  widgetType, 
  currentSize,
  className 
}: WidgetFeatureTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const recommendations = WIDGET_SIZE_RECOMMENDATIONS[widgetType];
  if (!recommendations) return null;
  
  const currentFeatures = getAvailableFeatures(widgetType, currentSize);
  
  return (
    <div className={cn("relative inline-block", className)}>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-1 rounded hover:bg-white/10 transition-colors"
      >
        <Info className="w-4 h-4 text-gray-400" />
      </button>
      
      {showTooltip && (
        <div className="absolute bottom-full right-0 mb-2 z-30 pointer-events-none">
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 min-w-[280px] max-w-sm">
            <h4 className="text-sm font-medium text-white mb-2">
              {recommendations.description}
            </h4>
            
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Current features ({currentSize.w}×{currentSize.h}):</p>
                <ul className="text-xs text-gray-300 space-y-0.5">
                  {currentFeatures.length > 0 ? (
                    currentFeatures.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-400 mr-1">✓</span>
                        {feature}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">Too small to display content</li>
                  )}
                </ul>
              </div>
              
              <div className="border-t border-gray-700 pt-2">
                <p className="text-xs text-gray-400 mb-1">Other size options:</p>
                <div className="space-y-1">
                  {recommendations.features.map((feature, idx) => {
                    const isActive = currentSize.w >= feature.size.w && currentSize.h >= feature.size.h;
                    const isNext = !isActive && 
                      recommendations.features[idx - 1] && 
                      currentSize.w >= recommendations.features[idx - 1].size.w &&
                      currentSize.h >= recommendations.features[idx - 1].size.h;
                    
                    return (
                      <div 
                        key={idx} 
                        className={cn(
                          "text-xs px-2 py-1 rounded",
                          isActive && "bg-green-900/30 text-green-300",
                          isNext && "bg-yellow-900/30 text-yellow-300",
                          !isActive && !isNext && "text-gray-500"
                        )}
                      >
                        <span className="font-medium">{feature.size.w}×{feature.size.h}:</span>
                        <span className="ml-1">{feature.available.join(', ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                Recommended: {recommendations.recommended.w}×{recommendations.recommended.h}
              </p>
              <p className="text-xs text-gray-500">
                Minimum: {recommendations.minimum.w}×{recommendations.minimum.h}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}