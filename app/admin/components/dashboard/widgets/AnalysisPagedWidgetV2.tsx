'use client';

import React, { useState, useCallback, lazy, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  BarChart,
  PieChart,
  Activity,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Map,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChartInViewport } from '@/app/admin/hooks/useInViewport';
import { ChartSkeleton } from '../widgets/common/charts/ChartSkeleton';

// Lazy load chart components for better performance
// Week 2 Day 3: Progressive Loading for Charts
const AcoOrderProgressChart = lazy(() => import('../charts/AcoOrderProgressChart').catch(() => ({ default: () => <ChartSkeleton /> })));
const TopProductsInventoryChart = lazy(() => import('../charts/TopProductsInventoryChart').catch(() => ({ default: () => <ChartSkeleton /> })));
const UserActivityHeatmap = lazy(() => import('../charts/UserActivityHeatmap').catch(() => ({ default: () => <ChartSkeleton /> })));
const InventoryTurnoverAnalysis = lazy(() => import('../charts/InventoryTurnoverAnalysis').catch(() => ({ default: () => <ChartSkeleton /> })));
const StocktakeAccuracyTrend = lazy(() => import('../charts/StocktakeAccuracyTrend').catch(() => ({ default: () => <ChartSkeleton /> })));
const VoidRecordsAnalysis = lazy(() => import('../charts/VoidRecordsAnalysis').catch(() => ({ default: () => <ChartSkeleton /> })));
const RealTimeInventoryMap = lazy(() => import('../charts/RealTimeInventoryMap').catch(() => ({ default: () => <ChartSkeleton /> })));

interface PageContent {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  component: React.ComponentType<any>;
  color: string;
}

const pages: PageContent[] = [
  {
    id: 1,
    title: 'ACO Order Progress',
    subtitle: 'Track order completion status',
    icon: BarChart,
    component: AcoOrderProgressChart,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    title: 'Top 10 Product Inventory',
    subtitle: 'Identify major inventory products',
    icon: BarChart,
    component: TopProductsInventoryChart,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 3,
    title: 'User Activity Heatmap',
    subtitle: 'Understand employee work patterns',
    icon: Activity,
    component: UserActivityHeatmap,
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 4,
    title: 'Inventory Turnover Analysis',
    subtitle: 'Compare inventory vs order demand',
    icon: TrendingUp,
    component: InventoryTurnoverAnalysis,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 5,
    title: 'Stocktake Accuracy Trend',
    subtitle: 'Monitor inventory management quality',
    icon: CheckCircle,
    component: StocktakeAccuracyTrend,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    id: 6,
    title: 'Void Records Analysis',
    subtitle: 'Reduce waste, improve processes',
    icon: AlertTriangle,
    component: VoidRecordsAnalysis,
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 7,
    title: 'Real-time Inventory Location',
    subtitle: 'Optimize warehouse space utilization',
    icon: Map,
    component: RealTimeInventoryMap,
    color: 'from-teal-500 to-cyan-500',
  },
];

interface AnalysisPagedWidgetV2Props {
  timeFrame?: any;
  theme?: string;
}

export const AnalysisPagedWidgetV2 = function AnalysisPagedWidgetV2({
  timeFrame,
  theme,
}: AnalysisPagedWidgetV2Props) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const handlePageChange = useCallback(
    (index: number) => {
      if (index === currentPage || isFlipping) return;

      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(index);
        setIsFlipping(false);
      }, 300);
    },
    [currentPage, isFlipping]
  );

  const CurrentComponent = pages[currentPage].component;
  const currentPageData = pages[currentPage];

  return (
    <div className='flex h-full gap-6'>
      {/* Left side - Vertical page tabs */}
      <div className='flex w-64 flex-col gap-2 overflow-y-auto py-4'>
        {pages.map((page, index) => {
          const isActive = index === currentPage;
          const isPast = index < currentPage;

          return (
            <motion.div
              key={page.id}
              className={cn(
                'group relative cursor-pointer',
                'transform-style-3d transition-all duration-300',
                isActive && 'z-20'
              )}
              onClick={() => handlePageChange(index)}
              initial={false}
              animate={{
                rotateY: isPast ? -15 : 0,
                x: isPast ? -10 : 0,
                scale: isActive ? 1.02 : 1,
                z: isActive ? 20 : 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
            >
              <div
                className={cn(
                  'relative rounded-lg p-4 transition-all duration-300',
                  'border border-white/10 backdrop-blur-md',
                  'hover:border-white/20',
                  isActive ? 'bg-white/10 shadow-2xl' : 'bg-white/5',
                  isPast && 'opacity-70'
                )}
              >
                {/* Page number */}
                <div
                  className={cn(
                    'absolute -left-3 top-4 h-6 w-6 rounded-full',
                    'flex items-center justify-center text-xs font-bold',
                    'border border-white/20 bg-gradient-to-br',
                    isActive ? page.color : 'from-gray-600 to-gray-700',
                    'text-white shadow-lg'
                  )}
                >
                  {index + 1}
                </div>

                {/* Content */}
                <div className='ml-4 flex items-center gap-3'>
                  <div
                    className={cn(
                      'rounded-lg p-2',
                      'bg-gradient-to-br',
                      isActive ? page.color : 'from-gray-600 to-gray-700',
                      'shadow-lg'
                    )}
                  >
                    <page.icon className='h-5 w-5 text-white' />
                  </div>
                  <div className='flex-1'>
                    <h3
                      className={cn(
                        'text-sm font-semibold',
                        isActive ? 'text-white' : 'text-white/70'
                      )}
                    >
                      {page.title}
                    </h3>
                    <p className='mt-0.5 text-xs text-white/50'>{page.subtitle}</p>
                  </div>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className={cn(
                      'absolute bottom-0 right-0 top-0 w-1 rounded-l',
                      'bg-gradient-to-b',
                      page.color
                    )}
                    layoutId='activeIndicator'
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}

                {/* Hover effect */}
                {!isActive && (
                  <div
                    className={cn(
                      'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100',
                      'bg-gradient-to-r transition-opacity duration-300',
                      page.color,
                      'bg-opacity-10'
                    )}
                  />
                )}
              </div>

              {/* 3D shadow effect */}
              {isActive && (
                <div className='absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-white/10 to-transparent opacity-30 blur-xl' />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Right side - Content area */}
      <div className='relative flex-1'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={currentPage}
            className='absolute inset-0'
            initial={{
              opacity: 0,
              scale: 0.95,
              rotateX: -10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotateX: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              rotateX: 10,
            }}
            transition={{
              duration: 0.3,
              type: 'spring',
              stiffness: 100,
              damping: 20,
            }}
          >
            <div className='bg-white/3 h-full rounded-2xl border border-white/10 p-6 shadow-2xl backdrop-blur-md'>
              {/* Header */}
              <div className='mb-6 border-b border-white/10 pb-4'>
                <div className='flex items-center gap-4'>
                  <div
                    className={cn(
                      'rounded-xl p-3 shadow-lg',
                      'bg-gradient-to-br',
                      currentPageData.color,
                      'relative overflow-hidden'
                    )}
                  >
                    <currentPageData.icon className='relative z-10 h-8 w-8 text-white' />
                    <div className='absolute inset-0 bg-white/20 blur-xl' />
                  </div>
                  <div>
                    <h2 className='relative mb-1 text-2xl font-bold'>
                      <span
                        className={cn(
                          'relative z-10 bg-gradient-to-r bg-clip-text text-transparent',
                          currentPageData.color
                        )}
                      >
                        {currentPageData.title}
                      </span>
                      <span
                        className={cn(
                          'absolute inset-0 bg-gradient-to-r bg-clip-text text-transparent blur-md',
                          currentPageData.color,
                          'opacity-50'
                        )}
                        aria-hidden='true'
                      >
                        {currentPageData.title}
                      </span>
                    </h2>
                    <p className='text-sm font-medium text-white/70'>{currentPageData.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Chart content with Progressive Loading */}
              <div className='h-[calc(100%-6rem)]'>
                <Suspense
                  fallback={
                    <ChartSkeleton
                      type="bar"
                      height="100%"
                      showHeader={false}
                      showLegend={true}
                      showAxisLabels={true}
                      className="h-full"
                    />
                  }
                >
                  <CurrentComponent timeFrame={timeFrame} />
                </Suspense>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        .transform-style-3d {
          transform-style: preserve-3d;
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default AnalysisPagedWidgetV2;
