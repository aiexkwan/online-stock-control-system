'use client';

import React, { useState, useEffect } from 'react';
// import { useGlobalPerformanceMonitor } from './hooks/usePerformanceMonitor';
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

interface PerformanceDashboardProps {
  isVisible?: boolean;
  onToggle?: () => void;
  className?: string;
}

const PerformanceMetricCard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
  description?: string;
}> = ({ title, value, unit, status, icon, description }) => {
  const statusColors = {
    good: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
  };

  const iconColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  return (
    <div className={`rounded-lg border p-4 ${statusColors[status]}`}>
      <div className='mb-2 flex items-center justify-between'>
        <div className={`${iconColors[status]}`}>{icon}</div>
        <div className='text-right'>
          <div className='text-2xl font-bold'>
            {value}
            {unit && <span className='ml-1 text-sm font-normal'>{unit}</span>}
          </div>
        </div>
      </div>
      <h3 className='text-sm font-medium'>{title}</h3>
      {description && <p className='mt-1 text-xs opacity-75'>{description}</p>}
    </div>
  );
};

const ComponentBreakdown: React.FC<{
  components: Array<{
    name: string;
    renderCount: number;
    averageRenderTime: number;
    slowRenders: number;
  }>;
}> = ({ components }) => {
  return (
    <div className='space-y-2'>
      <h4 className='mb-3 font-medium text-gray-800'>Component Performance</h4>
      {components.map(component => {
        const isSlow = component.averageRenderTime > 16;
        const slowPercentage =
          component.renderCount > 0 ? (component.slowRenders / component.renderCount) * 100 : 0;

        return (
          <div
            key={component.name}
            className={`rounded-lg border p-3 ${
              isSlow ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-sm font-medium'>{component.name}</span>
              <div className='flex items-center space-x-2'>
                {isSlow && <ExclamationTriangleIcon className='h-4 w-4 text-red-500' />}
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    isSlow ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {component.averageRenderTime.toFixed(1)}ms
                </span>
              </div>
            </div>
            <div className='grid grid-cols-3 gap-2 text-xs text-gray-600'>
              <div>
                <span className='font-medium'>{component.renderCount}</span>
                <div>renders</div>
              </div>
              <div>
                <span className='font-medium'>{component.slowRenders}</span>
                <div>slow</div>
              </div>
              <div>
                <span className='font-medium'>{slowPercentage.toFixed(1)}%</span>
                <div>slow rate</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PerformanceRecommendations: React.FC<{
  recommendations: string[];
}> = ({ recommendations }) => {
  if (recommendations.length === 0) {
    return (
      <div className='rounded-lg border border-green-200 bg-green-50 p-4'>
        <div className='flex items-center'>
          <CheckCircleIcon className='mr-2 h-5 w-5 text-green-600' />
          <span className='font-medium text-green-800'>All components are performing well!</span>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <h4 className='mb-3 flex items-center font-medium text-gray-800'>
        <InformationCircleIcon className='mr-2 h-5 w-5' />
        Performance Recommendations
      </h4>
      {recommendations.map((recommendation, index) => (
        <div key={index} className='rounded-lg border border-blue-200 bg-blue-50 p-3'>
          <p className='text-sm text-blue-800'>{recommendation}</p>
        </div>
      ))}
    </div>
  );
};

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  isVisible = false,
  onToggle,
  className = '',
}) => {
  // Temporarily disabled performance monitoring
  const getGlobalSummary = () => ({
    totalComponents: 0,
    totalRenders: 0,
    averageRenderTime: 0,
    slowComponents: 0,
    slowComponentPercentage: 0,
    componentBreakdown: [],
  });

  const [summary, setSummary] = useState(getGlobalSummary());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSummary(getGlobalSummary());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        type='button'
        onClick={onToggle}
        className='fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 p-3 text-white shadow-lg transition-colors hover:bg-blue-700'
        title='Show Performance Dashboard'
      >
        <ChartBarIcon className='h-6 w-6' />
      </button>
    );
  }

  const getOverallStatus = () => {
    if (summary.slowComponentPercentage > 50) return 'critical';
    if (summary.slowComponentPercentage > 20) return 'warning';
    return 'good';
  };

  const getAllRecommendations = () => {
    const recommendations: string[] = [];

    if (summary.slowComponentPercentage > 30) {
      recommendations.push('Consider using React.memo for frequently re-rendering components');
    }

    if (summary.averageRenderTime > 20) {
      recommendations.push(
        'Average render time is high. Review component complexity and use useMemo for expensive calculations'
      );
    }

    if (summary.totalRenders > 1000) {
      recommendations.push(
        'High number of renders detected. Check for unnecessary re-renders and optimize dependencies'
      );
    }

    summary.componentBreakdown.forEach(
      (component: { name: string; averageRenderTime: number; [key: string]: unknown }) => {
        if (component.averageRenderTime > 32) {
          recommendations.push(
            `${component.name} is consistently slow. Consider code splitting or optimization`
          );
        }
      }
    );

    return recommendations;
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div
        className={`rounded-lg border border-gray-200 bg-white shadow-xl transition-all duration-300 ${
          isExpanded ? 'max-h-96 w-96 overflow-y-auto' : 'w-80'
        }`}
      >
        {/* Header */}
        <div className='rounded-t-lg border-b border-gray-200 bg-gray-50 p-4'>
          <div className='flex items-center justify-between'>
            <h3 className='flex items-center font-semibold text-gray-800'>
              <ChartBarIcon className='mr-2 h-5 w-5' />
              Performance Monitor
            </h3>
            <div className='flex items-center space-x-2'>
              <button
                type='button'
                onClick={() => setIsExpanded(!isExpanded)}
                className='text-sm text-gray-500 hover:text-gray-700'
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </button>
              <button
                type='button'
                onClick={onToggle}
                className='text-gray-500 hover:text-gray-700'
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='space-y-4 p-4'>
          {/* Key Metrics */}
          <div className='grid grid-cols-2 gap-3'>
            <PerformanceMetricCard
              title='Components'
              value={summary.totalComponents}
              status={getOverallStatus()}
              icon={<CubeIcon className='h-5 w-5' />}
              description='Active components'
            />
            <PerformanceMetricCard
              title='Avg Render'
              value={summary.averageRenderTime.toFixed(1)}
              unit='ms'
              status={summary.averageRenderTime > 16 ? 'warning' : 'good'}
              icon={<ClockIcon className='h-5 w-5' />}
              description='Average render time'
            />
          </div>

          <div className='grid grid-cols-2 gap-3'>
            <PerformanceMetricCard
              title='Total Renders'
              value={summary.totalRenders}
              status={summary.totalRenders > 500 ? 'warning' : 'good'}
              icon={<ChartBarIcon className='h-5 w-5' />}
              description='Total render count'
            />
            <PerformanceMetricCard
              title='Slow Components'
              value={`${summary.slowComponentPercentage.toFixed(1)}%`}
              status={summary.slowComponentPercentage > 20 ? 'critical' : 'good'}
              icon={<ExclamationTriangleIcon className='h-5 w-5' />}
              description='Components > 16ms'
            />
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <>
              {/* Component Breakdown */}
              {summary.componentBreakdown.length > 0 && (
                <ComponentBreakdown components={summary.componentBreakdown} />
              )}

              {/* Recommendations */}
              <PerformanceRecommendations recommendations={getAllRecommendations()} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

PerformanceDashboard.displayName = 'PerformanceDashboard';

export default PerformanceDashboard;
