'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Badge } from '@/app/components/ui/badge';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  ChartBarIcon,
  ClockIcon,
  ServerIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  improvement?: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface PerformanceData {
  metrics: PerformanceMetric[];
  timestamp: Date;
  isOptimized: boolean;
}

export function PerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    const collectMetrics = () => {
      // Collect Web Vitals
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics: PerformanceMetric[] = [];

          // Process performance entries
          entries.forEach(entry => {
            if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
              metrics.push({
                name: 'First Contentful Paint',
                value: entry.startTime,
                unit: 'ms',
                target: 1800,
                icon: ClockIcon
              });
            }
            
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.push({
                name: 'Largest Contentful Paint',
                value: entry.startTime,
                unit: 'ms',
                target: 2500,
                icon: ChartBarIcon
              });
            }
          });

          // Add memory metrics if available
          if ((performance as any).memory) {
            metrics.push({
              name: 'JS Heap Used',
              value: (performance as any).memory.usedJSHeapSize / 1024 / 1024,
              unit: 'MB',
              target: 50,
              icon: CpuChipIcon
            });
          }

          // Add navigation timing
          const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navTiming) {
            metrics.push({
              name: 'DOM Content Loaded',
              value: navTiming.domContentLoadedEventEnd,
              unit: 'ms',
              target: 2000,
              icon: ServerIcon
            });
          }

          if (metrics.length > 0) {
            setPerformanceData({
              metrics,
              timestamp: new Date(),
              isOptimized: localStorage.getItem('widget-mode') === 'optimized'
            });
          }
        });

        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'navigation'] });

        return () => observer.disconnect();
      }
    };

    collectMetrics();
    const interval = setInterval(collectMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isMonitoring as string]);

  const getMetricStatus = (metric: PerformanceMetric): 'good' | 'warning' | 'poor' => {
    const ratio = metric.value / metric.target;
    if (ratio <= 1) return 'good';
    if (ratio <= 1.5) return 'warning';
    return 'poor';
  };

  const getStatusColor = (status: 'good' | 'warning' | 'poor') => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <div className="flex items-center gap-2">
            {performanceData?.isOptimized && (
              <Badge variant="default" className="bg-green-500">
                Optimized Mode
              </Badge>
            )}
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                isMonitoring 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!performanceData ? (
          <Alert>
            <AlertDescription>
              Click &quot;Start Monitoring&quot; to begin collecting performance metrics
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              Last updated: {performanceData.timestamp.toLocaleTimeString()}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performanceData.metrics.map((metric, index) => {
                const status = getMetricStatus(metric);
                const Icon = metric.icon;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">{metric.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${getStatusColor(status)}`}>
                          {metric.value.toFixed(1)} {metric.unit}
                        </span>
                        {metric.improvement && (
                          <div className="flex items-center gap-1">
                            {metric.improvement > 0 ? (
                              <ArrowDownIcon className="h-3 w-3 text-green-600" />
                            ) : (
                              <ArrowUpIcon className="h-3 w-3 text-red-600" />
                            )}
                            <span className="text-xs text-gray-500">
                              {Math.abs(metric.improvement).toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Progress 
                        value={Math.min((metric.value / metric.target) * 100, 100)} 
                        className="h-2"
                      />
                      <div className="absolute right-0 -top-5 text-xs text-gray-400">
                        Target: {metric.target} {metric.unit}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Performance Tips</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Enable optimized mode for better performance</li>
                <li>• Reduce the number of widgets on screen</li>
                <li>• Use virtualization for large data lists</li>
                <li>• Close unused browser tabs to free memory</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}