'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Activity, TrendingUp, CheckCircle, AlertTriangle, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import chart components
import AcoOrderProgressCards from '../charts/AcoOrderProgressCards';
import TopProductsInventoryChart from '../charts/TopProductsInventoryChart';
import UserActivityHeatmap from '../charts/UserActivityHeatmap';
import InventoryTurnoverAnalysis from '../charts/InventoryTurnoverAnalysis';
import StocktakeAccuracyTrend from '../charts/StocktakeAccuracyTrend';
import VoidRecordsAnalysis from '../charts/VoidRecordsAnalysis';
import RealTimeInventoryMap from '../charts/RealTimeInventoryMap';

interface ChartOption {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  component: React.ComponentType<any>;
  backgroundGradient: string;
  iconColor: string;
}

const chartOptions: ChartOption[] = [
  {
    id: 1,
    title: 'ACO Order Progress',
    subtitle: 'Track order completion status',
    icon: BarChart,
    component: AcoOrderProgressCards,
    backgroundGradient: 'from-blue-900/90 via-blue-800/70 to-cyan-900/60',
    iconColor: 'from-blue-400 to-cyan-400'
  },
  {
    id: 2,
    title: 'Top Products',
    subtitle: 'Major inventory products',
    icon: BarChart,
    component: TopProductsInventoryChart,
    backgroundGradient: 'from-purple-900/90 via-purple-800/70 to-pink-900/60',
    iconColor: 'from-purple-400 to-pink-400'
  },
  {
    id: 3,
    title: 'Activity Heatmap',
    subtitle: 'Employee work patterns',
    icon: Activity,
    component: UserActivityHeatmap,
    backgroundGradient: 'from-orange-900/90 via-orange-800/70 to-red-900/60',
    iconColor: 'from-orange-400 to-red-400'
  },
  {
    id: 4,
    title: 'Inventory Turnover',
    subtitle: 'Inventory vs demand',
    icon: TrendingUp,
    component: InventoryTurnoverAnalysis,
    backgroundGradient: 'from-green-900/90 via-green-800/70 to-emerald-900/60',
    iconColor: 'from-green-400 to-emerald-400'
  },
  {
    id: 5,
    title: 'Stocktake Accuracy',
    subtitle: 'Quality monitoring',
    icon: CheckCircle,
    component: StocktakeAccuracyTrend,
    backgroundGradient: 'from-indigo-900/90 via-indigo-800/70 to-blue-900/60',
    iconColor: 'from-indigo-400 to-blue-400'
  },
  {
    id: 6,
    title: 'Void Analysis',
    subtitle: 'Waste reduction insights',
    icon: AlertTriangle,
    component: VoidRecordsAnalysis,
    backgroundGradient: 'from-yellow-900/90 via-yellow-800/70 to-orange-900/60',
    iconColor: 'from-yellow-400 to-orange-400'
  },
  {
    id: 7,
    title: 'Inventory Map',
    subtitle: 'Warehouse utilization',
    icon: Map,
    component: RealTimeInventoryMap,
    backgroundGradient: 'from-teal-900/90 via-teal-800/70 to-cyan-900/60',
    iconColor: 'from-teal-400 to-cyan-400'
  }
];

interface AnalysisExpandableCardsProps {
  timeFrame?: any;
  theme?: string;
}

export default function AnalysisExpandableCards({ timeFrame, theme }: AnalysisExpandableCardsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimated, setIsAnimated] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setIsAnimated(true);
    // Show content after cards animate in
    setTimeout(() => {
      setShowContent(true);
    }, 1400);
  }, []);

  const ActiveComponent = chartOptions[activeIndex].component;

  return (
    <div className="h-full flex flex-col">
      {/* Options Container */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex w-full max-w-[1680px] h-[720px] gap-0">
          {chartOptions.map((option, index) => (
            <motion.div
              key={option.id}
              className={cn(
                "option relative cursor-pointer",
                "border-2 border-white/10",
                "transition-all duration-800 ease-out",
                "flex flex-col justify-end",
                "bg-gradient-to-br backdrop-blur-md",
                option.backgroundGradient,
                "overflow-hidden",
                activeIndex === index ? "flex-[7] z-10 border-white/30" : "flex-1 opacity-80",
                activeIndex === index && "shadow-2xl"
              )}
              initial={{ opacity: 0, x: -60 }}
              animate={isAnimated ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: index * 0.18 }}
              onClick={() => setActiveIndex(index)}
              style={{
                boxShadow: activeIndex === index 
                  ? '0 20px 60px rgba(0,0,0,0.5)' 
                  : '0 10px 30px rgba(0,0,0,0.3)'
              }}
            >
              {/* Background gradient overlay */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent",
                "transition-opacity duration-800",
                activeIndex === index ? "opacity-100" : "opacity-60"
              )} />

              {/* Content Container */}
              <div className={cn(
                "relative z-10 h-full flex flex-col",
                activeIndex === index ? "justify-between" : "justify-end"
              )}>
                {/* Chart Content - Only show for active card */}
                {activeIndex === index && (
                  <motion.div 
                    className="flex-1 p-10 pt-8"
                    initial={{ opacity: 0 }}
                    animate={showContent ? { opacity: 1 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <ActiveComponent timeFrame={timeFrame} />
                  </motion.div>
                )}

                {/* Label */}
                <div className="p-4 flex items-center gap-3">
                  {/* Icon */}
                  <motion.div
                    className={cn(
                      "w-[42px] h-[42px] rounded-full flex items-center justify-center",
                      "bg-black/50 backdrop-blur-md border-2",
                      activeIndex === index ? "border-white" : "border-white/30",
                      "transition-all duration-800"
                    )}
                    animate={{
                      scale: activeIndex === index ? 1.1 : 1,
                    }}
                  >
                    <div className={cn(
                      "bg-gradient-to-br bg-clip-text text-transparent",
                      option.iconColor
                    )}>
                      <option.icon className="w-6 h-6" />
                    </div>
                  </motion.div>

                  {/* Text */}
                  <div className={cn(
                    "transition-all duration-800",
                    activeIndex === index ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"
                  )}>
                    <h3 className="text-white font-bold text-base">
                      {option.title}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {option.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .option {
          will-change: flex-grow, box-shadow, opacity;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        
        @media (max-width: 1024px) {
          .option:nth-child(n+6) { display: none; }
        }
        @media (max-width: 768px) {
          .option:nth-child(n+5) { display: none; }
        }
        @media (max-width: 640px) {
          .option:nth-child(n+4) { display: none; }
        }
      `}</style>
    </div>
  );
}