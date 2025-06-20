/**
 * 網格系統 Hook
 * 管理響應式網格佈局
 */

import { useState, useEffect, useCallback } from 'react';
import { getGridConfig, calculateCellSize, GridConfig } from '../config/gridConfig';

interface GridSystemState {
  gridConfig: GridConfig;
  cellSize: { cellWidth: number; cellHeight: number };
  containerSize: { width: number; height: number };
}

export function useGridSystem(containerRef: React.RefObject<HTMLElement>) {
  const [state, setState] = useState<GridSystemState>(() => {
    // 初始值
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const gridConfig = getGridConfig(screenWidth);
    
    return {
      gridConfig,
      cellSize: { cellWidth: 0, cellHeight: 0 },
      containerSize: { width: 0, height: 0 }
    };
  });

  // 計算網格尺寸
  const calculateGrid = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { width, height } = container.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    
    const gridConfig = getGridConfig(screenWidth);
    const cellSize = calculateCellSize(width, height, gridConfig);
    
    // Debug log
    console.log('Grid calculation:', {
      containerWidth: width,
      containerHeight: height,
      screenWidth,
      gridConfig,
      cellSize
    });
    
    setState({
      gridConfig,
      cellSize,
      containerSize: { width, height }
    });
  }, [containerRef]);

  // 監聽視窗大小變化
  useEffect(() => {
    // 延遲計算以確保容器已渲染
    const timer = setTimeout(() => {
      calculateGrid();
    }, 100);

    const handleResize = () => {
      calculateGrid();
    };

    window.addEventListener('resize', handleResize);
    
    // 使用 ResizeObserver 監聽容器大小變化
    const resizeObserver = new ResizeObserver(() => {
      calculateGrid();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [calculateGrid, containerRef]);

  // 計算 widget 的實際像素位置和大小
  const getWidgetStyle = useCallback((
    x: number,
    y: number,
    cols: number,
    rows: number
  ): React.CSSProperties => {
    const { cellSize, gridConfig } = state;
    const { gap, padding } = gridConfig;
    
    return {
      position: 'absolute',
      left: `${padding + (x * (cellSize.cellWidth + gap))}px`,
      top: `${padding + (y * (cellSize.cellHeight + gap))}px`,
      width: `${cols * cellSize.cellWidth + (cols - 1) * gap}px`,
      height: `${rows * cellSize.cellHeight + (rows - 1) * gap}px`,
      transition: 'all 0.3s ease-in-out'
    };
  }, [state]);

  // 獲取網格容器樣式
  const getGridContainerStyle = useCallback((): React.CSSProperties => {
    const { gridConfig } = state;
    
    return {
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: '600px',
      padding: `${gridConfig.padding}px`,
      backgroundColor: 'transparent'
    };
  }, [state]);

  // 將像素位置轉換為網格座標
  const pixelToGrid = useCallback((
    pixelX: number,
    pixelY: number
  ): { gridX: number; gridY: number } => {
    const { cellSize, gridConfig } = state;
    const { gap, padding } = gridConfig;
    
    const gridX = Math.round((pixelX - padding) / (cellSize.cellWidth + gap));
    const gridY = Math.round((pixelY - padding) / (cellSize.cellHeight + gap));
    
    return {
      gridX: Math.max(0, Math.min(gridX, gridConfig.maxCols - 1)),
      gridY: Math.max(0, Math.min(gridY, gridConfig.maxRows - 1))
    };
  }, [state]);

  return {
    gridConfig: state.gridConfig,
    cellSize: state.cellSize,
    containerSize: state.containerSize,
    getWidgetStyle,
    getGridContainerStyle,
    pixelToGrid,
    recalculate: calculateGrid
  };
}