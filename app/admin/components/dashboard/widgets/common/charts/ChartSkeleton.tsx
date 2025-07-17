/**
 * Chart Skeleton Component
 * 統一的圖表加載骨架屏組件
 * Week 2 Day 3: Progressive Loading for Charts
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ChartSkeletonProps {
  /**
   * 圖表類型 - 影響骨架屏的形狀和佈局
   */
  type?: 'line' | 'bar' | 'area' | 'pie' | 'treemap' | 'heatmap' | 'scatter';
  
  /**
   * 高度設定 - 支援 CSS 值或預設選項
   */
  height?: string | number | 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  
  /**
   * 是否顯示標題骨架
   */
  showHeader?: boolean;
  
  /**
   * 是否顯示圖例骨架
   */
  showLegend?: boolean;
  
  /**
   * 是否顯示軸標籤骨架
   */
  showAxisLabels?: boolean;
  
  /**
   * 是否使用兩階段加載模式 (先顯示統計摘要)
   */
  showStats?: boolean;
  
  /**
   * 自訂 CSS 類名
   */
  className?: string;
  
  /**
   * 統計摘要數據 (用於兩階段加載)
   */
  statsData?: {
    title: string;
    value: string | number;
    subtitle?: string;
  }[];
}

// 預設高度映射
const heightMap = {
  sm: '200px',
  md: '300px', 
  lg: '400px',
  xl: '500px',
  auto: '100%',
};

// 根據圖表類型生成不同的骨架結構
const getSkeletonStructure = (type: ChartSkeletonProps['type']) => {
  switch (type) {
    case 'bar':
      return (
        <div className="flex items-end justify-between space-x-2 h-full">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-700/40 rounded-t"
              style={{ 
                height: `${20 + Math.random() * 60}%`,
                width: '12%'
              }}
            />
          ))}
        </div>
      );
      
    case 'line':
    case 'area':
      return (
        <div className="relative h-full">
          {/* 模擬折線圖路徑 */}
          <svg className="w-full h-full opacity-20">
            <path
              d="M 0,60 Q 20,40 40,50 T 80,45 T 120,55 T 160,35 T 200,45 T 240,40 T 280,50 T 320,45"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-slate-400"
            />
            {type === 'area' && (
              <path
                d="M 0,60 Q 20,40 40,50 T 80,45 T 120,55 T 160,35 T 200,45 T 240,40 T 280,50 T 320,45 L 320,100 L 0,100 Z"
                fill="currentColor"
                className="text-slate-700/20"
              />
            )}
          </svg>
          {/* 數據點 */}
          <div className="absolute inset-0 flex items-end justify-between px-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-slate-600 rounded-full"
                style={{ marginBottom: `${20 + Math.random() * 40}%` }}
              />
            ))}
          </div>
        </div>
      );
      
    case 'pie':
      return (
        <div className="flex items-center justify-center h-full">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-slate-700/30 border-8 border-slate-600/50" />
            <div className="absolute inset-2 w-24 h-24 rounded-full bg-slate-800" />
          </div>
        </div>
      );
      
    case 'treemap':
      return (
        <div className="grid grid-cols-4 grid-rows-3 gap-1 h-full">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "bg-slate-700/40 rounded",
                i === 0 ? "col-span-2 row-span-2" : "",
                i === 1 ? "row-span-2" : "",
                i === 2 ? "col-span-2" : ""
              )}
            />
          ))}
        </div>
      );
      
    case 'heatmap':
      return (
        <div className="grid grid-cols-7 grid-rows-5 gap-1 h-full">
          {[...Array(35)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-700/40 rounded"
              style={{ opacity: 0.2 + Math.random() * 0.6 }}
            />
          ))}
        </div>
      );
      
    case 'scatter':
      return (
        <div className="relative h-full">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-slate-600 rounded-full"
              style={{
                left: `${Math.random() * 90}%`,
                top: `${Math.random() * 90}%`,
              }}
            />
          ))}
        </div>
      );
      
    default:
      // 通用矩形骨架
      return (
        <div className="w-full h-full bg-slate-700/30 rounded animate-pulse" />
      );
  }
};

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  type = 'bar',
  height = 'md',
  showHeader = true,
  showLegend = false,
  showAxisLabels = true,
  showStats = false,
  className,
  statsData = [],
}) => {
  // 計算實際高度值
  const actualHeight = typeof height === 'string' && height in heightMap 
    ? heightMap[height as keyof typeof heightMap]
    : typeof height === 'number'
    ? `${height}px`
    : height;

  return (
    <div 
      className={cn(
        "flex flex-col space-y-4 w-full animate-pulse",
        className
      )}
      style={{ height: actualHeight }}
    >
      {/* 標題骨架 */}
      {showHeader && (
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-700/50 rounded" />
          <div className="h-4 w-32 bg-slate-700/30 rounded" />
        </div>
      )}

      {/* 統計摘要 (兩階段加載模式) */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {(statsData.length > 0 ? statsData : [...Array(4)]).map((stat, i) => (
            <div key={i} className="text-center space-y-1">
              {statsData.length > 0 ? (
                <>
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-400">
                    {stat.title}
                  </div>
                  {stat.subtitle && (
                    <div className="text-xs text-slate-500">
                      {stat.subtitle}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="h-6 w-16 bg-slate-700/50 rounded mx-auto" />
                  <div className="h-3 w-12 bg-slate-700/30 rounded mx-auto" />
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 圖例骨架 */}
      {showLegend && (
        <div className="flex items-center justify-center space-x-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-slate-600 rounded" />
              <div className="h-3 w-16 bg-slate-700/40 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* 主圖表區域 */}
      <div className="flex-1 relative">
        {/* Y軸標籤 */}
        {showAxisLabels && (
          <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between py-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-2 w-6 bg-slate-700/40 rounded" />
            ))}
          </div>
        )}

        {/* 圖表內容區域 */}
        <div className={cn(
          "h-full",
          showAxisLabels ? "ml-10 mb-6" : ""
        )}>
          {getSkeletonStructure(type)}
        </div>

        {/* X軸標籤 */}
        {showAxisLabels && (
          <div className="absolute bottom-0 left-10 right-0 h-4 flex justify-between items-center">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-2 w-8 bg-slate-700/40 rounded" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 預定義的圖表骨架變體
 */
export const BarChartSkeleton = (props: Omit<ChartSkeletonProps, 'type'>) => (
  <ChartSkeleton type="bar" {...props} />
);

export const LineChartSkeleton = (props: Omit<ChartSkeletonProps, 'type'>) => (
  <ChartSkeleton type="line" {...props} />
);

export const AreaChartSkeleton = (props: Omit<ChartSkeletonProps, 'type'>) => (
  <ChartSkeleton type="area" {...props} />
);

export const PieChartSkeleton = (props: Omit<ChartSkeletonProps, 'type'>) => (
  <ChartSkeleton type="pie" {...props} />
);

export const TreemapChartSkeleton = (props: Omit<ChartSkeletonProps, 'type'>) => (
  <ChartSkeleton type="treemap" {...props} />
);

/**
 * 兩階段加載的圖表骨架 - 先顯示統計摘要，再顯示完整圖表
 */
export const ProgressiveChartSkeleton: React.FC<ChartSkeletonProps & {
  stage: 'stats' | 'chart';
}> = ({ stage, ...props }) => {
  if (stage === 'stats') {
    return (
      <ChartSkeleton 
        {...props} 
        showStats={true}
        height="auto"
        className={cn("min-h-[120px]", props.className)}
      />
    );
  }
  
  return <ChartSkeleton {...props} />;
};

export default ChartSkeleton;