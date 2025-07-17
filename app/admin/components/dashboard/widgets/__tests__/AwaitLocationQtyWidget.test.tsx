/**
 * AwaitLocationQtyWidget 測試
 * 測試批量查詢系統整合
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import AwaitLocationQtyWidget from '../AwaitLocationQtyWidget';
import { useWidgetData } from '@/app/admin/contexts/DashboardDataContext';

// Mock supabase client
jest.mock('@/app/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
  })),
}));

// Mock the DashboardDataContext
jest.mock('@/app/admin/contexts/DashboardDataContext');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Package: () => null,
  TrendingUp: () => null,
  TrendingDown: () => null,
  Minus: () => null,
}));

describe('AwaitLocationQtyWidget', () => {
  const mockWidgetId = 'await-location-qty';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    (useWidgetData as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<AwaitLocationQtyWidget widgetId={mockWidgetId} />);
    
    // During loading, MetricCard shows skeleton without text
    const loadingSkeletons = screen.getAllByRole('generic').filter(el => 
      el.className.includes('animate-pulse')
    );
    expect(loadingSkeletons.length).toBeGreaterThan(0);
  });

  it('should render error state', () => {
    const mockRefetch = jest.fn();
    (useWidgetData as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to load data'),
      refetch: mockRefetch,
    });

    render(<AwaitLocationQtyWidget widgetId={mockWidgetId} />);
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('should render data correctly', () => {
    (useWidgetData as jest.Mock).mockReturnValue({
      data: {
        records: [
          { location: 'AWAIT-A1', quantity: 500 },
          { location: 'AWAIT-B2', quantity: 734 },
          { location: 'INJECTION-C3', quantity: 100 }, // Should be ignored
        ],
        trend: { direction: 'up', value: 5.2 },
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AwaitLocationQtyWidget widgetId={mockWidgetId} />);
    
    expect(screen.getByText('Await Location Qty')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('should render empty state', () => {
    (useWidgetData as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AwaitLocationQtyWidget widgetId={mockWidgetId} />);
    
    // When there's no data, awaitQty computes to 0
    expect(screen.getByText('Await Location Qty')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should call useWidgetData with correct parameter', () => {
    (useWidgetData as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<AwaitLocationQtyWidget widgetId={mockWidgetId} />);
    
    expect(useWidgetData).toHaveBeenCalledWith('await-location-qty');
  });
});