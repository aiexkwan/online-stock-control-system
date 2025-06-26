'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BarChart, PieChart, Activity, TrendingUp, CheckCircle, AlertTriangle, Map } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Import chart components (will be created)
import AcoOrderProgressCards from '../charts/AcoOrderProgressCards';
import TopProductsInventoryChart from '../charts/TopProductsInventoryChart';
import UserActivityHeatmap from '../charts/UserActivityHeatmap';
import InventoryTurnoverAnalysis from '../charts/InventoryTurnoverAnalysis';
import StocktakeAccuracyTrend from '../charts/StocktakeAccuracyTrend';
import VoidRecordsAnalysis from '../charts/VoidRecordsAnalysis';
import RealTimeInventoryMap from '../charts/RealTimeInventoryMap';

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
    component: AcoOrderProgressCards,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 2,
    title: 'Top 10 Product Inventory',
    subtitle: 'Identify major inventory products',
    icon: BarChart,
    component: TopProductsInventoryChart,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 3,
    title: 'User Activity Heatmap',
    subtitle: 'Understand employee work patterns',
    icon: Activity,
    component: UserActivityHeatmap,
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 4,
    title: 'Inventory Turnover Analysis',
    subtitle: 'Compare inventory vs order demand',
    icon: TrendingUp,
    component: InventoryTurnoverAnalysis,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 5,
    title: 'Stocktake Accuracy Trend',
    subtitle: 'Monitor inventory management quality',
    icon: CheckCircle,
    component: StocktakeAccuracyTrend,
    color: 'from-indigo-500 to-blue-500'
  },
  {
    id: 6,
    title: 'Void Records Analysis',
    subtitle: 'Reduce waste, improve processes',
    icon: AlertTriangle,
    component: VoidRecordsAnalysis,
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 7,
    title: 'Real-time Inventory Location',
    subtitle: 'Optimize warehouse space utilization',
    icon: Map,
    component: RealTimeInventoryMap,
    color: 'from-teal-500 to-cyan-500'
  }
];

interface AnalysisPagedWidgetProps {
  timeFrame?: any;
  theme?: string;
}

export default function AnalysisPagedWidget({ timeFrame, theme }: AnalysisPagedWidgetProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === currentPage || isFlipping) return;
    
    setDirection(newPage > currentPage ? 'next' : 'prev');
    setIsFlipping(true);
    
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsFlipping(false);
    }, 300);
  }, [currentPage, isFlipping]);

  const handlePrevPage = useCallback(() => {
    const newPage = currentPage > 0 ? currentPage - 1 : pages.length - 1;
    handlePageChange(newPage);
  }, [currentPage, handlePageChange]);

  const handleNextPage = useCallback(() => {
    const newPage = currentPage < pages.length - 1 ? currentPage + 1 : 0;
    handlePageChange(newPage);
  }, [currentPage, handlePageChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePrevPage, handleNextPage]);

  const CurrentComponent = pages[currentPage].component;
  const currentPageData = pages[currentPage];

  return (
    <div className="analysis-paged-widget h-full flex flex-col relative">
      {/* 3D Book Container */}
      <div className="book-container flex-1 relative perspective-2000 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            className="page absolute inset-0 transform-style-3d"
            data-flipping={isFlipping}
            initial={{ 
              rotateY: direction === 'next' ? -180 : 180,
              scale: 0.95,
              opacity: 0.8
            }}
            animate={{ 
              rotateY: 0,
              scale: 1,
              opacity: 1
            }}
            exit={{ 
              rotateY: direction === 'next' ? 180 : -180,
              scale: 0.95,
              opacity: 0.8
            }}
            transition={{
              duration: 0.6,
              type: "spring",
              stiffness: 100,
              damping: 20,
              opacity: { duration: 0.3 }
            }}
          >
            <div className="h-full relative overflow-hidden bg-white/3 backdrop-blur-md rounded-2xl shadow-2xl">
              {/* Page Header */}
              <div className="page-header p-6 border-b border-white/5 bg-gradient-to-r from-transparent via-white/5 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "icon-wrapper p-3 rounded-xl shadow-lg",
                      "bg-gradient-to-br",
                      currentPageData.color,
                      "relative overflow-hidden"
                    )}>
                      <currentPageData.icon className="w-6 h-6 text-white relative z-10" />
                      {/* Icon glow effect */}
                      <div className="absolute inset-0 bg-white/20 blur-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-1 relative">
                        <span className={cn(
                          "relative z-10 bg-gradient-to-r bg-clip-text text-transparent",
                          currentPageData.color
                        )}>
                          {currentPageData.title}
                        </span>
                        {/* Text glow effect */}
                        <span className={cn(
                          "absolute inset-0 bg-gradient-to-r bg-clip-text text-transparent blur-md",
                          currentPageData.color,
                          "opacity-50"
                        )} aria-hidden="true">
                          {currentPageData.title}
                        </span>
                      </h2>
                      <p className="text-sm text-white/70 font-medium">{currentPageData.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground/60">
                    Page {currentPage + 1} of {pages.length}
                  </div>
                </div>
              </div>

              {/* Page Content */}
              <div className="page-content p-6 h-[calc(100%-5rem)]">
                <CurrentComponent timeFrame={timeFrame} />
              </div>

              {/* Enhanced gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
              
              {/* Animated glow effect */}
              <div className="absolute -inset-px bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-xl" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="navigation-controls flex items-center justify-between p-4 bg-background/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevPage}
          className="hover:bg-primary/10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Page Indicators */}
        <div className="page-indicators flex gap-2">
          {pages.map((page, index) => (
            <button
              key={page.id}
              onClick={() => handlePageChange(index)}
              className={cn(
                "indicator w-2 h-2 rounded-full transition-all duration-300",
                index === currentPage 
                  ? "w-8 bg-primary" 
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              aria-label={`Go to ${page.title}`}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextPage}
          className="hover:bg-primary/10"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .perspective-2000 {
          perspective: 2000px;
        }
        
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        
        .page {
          transform-origin: center center;
          will-change: transform;
          transform: translateZ(0);
        }
        
        /* Enhanced shadow during flip */
        .page > div {
          transition: box-shadow 0.6s ease;
        }
        
        .page[data-flipping="true"] > div {
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 10px 30px rgba(0, 0, 0, 0.3),
            -10px 0 25px rgba(0, 0, 0, 0.2);
        }
        
        /* Page thickness effect */
        .book-container::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 98%;
          height: 4px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
          border-radius: 0 0 8px 8px;
          z-index: -1;
        }
        
        /* Gradient overlay for lighting effect */
        .page > div::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(255,255,255,0.03) 50%,
            transparent 100%
          );
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.6s ease;
          border-radius: inherit;
        }
        
        .page[data-flipping="true"] > div::after {
          opacity: 1;
        }
        
        /* Navigation button enhancements */
        .navigation-controls button {
          position: relative;
          overflow: hidden;
        }
        
        .navigation-controls button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(255,255,255,0.1), transparent);
          transform: scale(0);
          transition: transform 0.3s ease;
        }
        
        .navigation-controls button:hover::before {
          transform: scale(1);
        }
        
        /* Page indicator enhancements */
        .page-indicators .indicator {
          position: relative;
          overflow: hidden;
        }
        
        .page-indicators .indicator::after {
          content: '';
          position: absolute;
          inset: 0;
          background: inherit;
          border-radius: inherit;
          filter: blur(4px);
          opacity: 0.5;
          z-index: -1;
          transition: filter 0.3s ease;
        }
        
        .page-indicators .indicator:hover::after {
          filter: blur(8px);
        }
        
        @media (prefers-reduced-motion: reduce) {
          .page,
          .page > div,
          .page > div::after,
          .navigation-controls button::before,
          .page-indicators .indicator::after {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}