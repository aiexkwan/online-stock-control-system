/**
 * AwaitLocationQtyWidget 測試
 * 測試批量查詢系統整合
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import AwaitLocationQtyWidget from '../AwaitLocationQtyWidget';
import { useWidgetData } from '@/app/admin/contexts/DashboardDataContext';

// Mock the DashboardDataContext
jest.mock('@/app/admin/contexts/DashboardDataContext');

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('AwaitLocationQtyWidget', () => {
  const mockWidget = {
    id: 'await-location-qty',
    type: 'await-location-qty',
    config: {},
  };

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

    render(<AwaitLocationQtyWidget widget={mockWidget} isEditMode={false} />);
    
    expect(screen.getByText('Await Location Qty')).toBeInTheDocument();
    expect(screen.getByTestId('widget-skeleton')).toBeInTheDocument();
  });

  it('should render error state', () => {
    const mockRefetch = jest.fn();
    (useWidgetData as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed to load data'),
      refetch: mockRefetch,
    });

    render(<AwaitLocationQtyWidget widget={mockWidget} isEditMode={false} />);
    
    expect(screen.getByText('Await Location Qty')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load data/)).toBeInTheDocument();
  });

  it('should render data correctly', () => {
    (useWidgetData as jest.Mock).mockReturnValue({
      data: {
        totalAwaitingQty: 1234,
        locations: [],
      },
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AwaitLocationQtyWidget widget={mockWidget} isEditMode={false} />);
    
    expect(screen.getByText('Await Location Qty')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('Pallets')).toBeInTheDocument();
    expect(screen.getByText('Batch Query Optimized')).toBeInTheDocument();
  });

  it('should render edit mode', () => {
    (useWidgetData as jest.Mock).mockReturnValue({
      data: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AwaitLocationQtyWidget widget={mockWidget} isEditMode={true} />);
    
    expect(screen.getByText('Await Location Qty Widget')).toBeInTheDocument();
  });

  it('should call useWidgetData with correct parameter', () => {
    (useWidgetData as jest.Mock).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<AwaitLocationQtyWidget widget={mockWidget} isEditMode={false} />);
    
    expect(useWidgetData).toHaveBeenCalledWith('awaitLocationQty');
  });
});