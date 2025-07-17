/**
 * UniversalUploadWidget Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UniversalUploadWidget } from '../UniversalUploadWidget';
import { UploadFilesConfig } from '../uploadConfigs';

// Mock dependencies
vi.mock('@/app/admin/contexts/UploadRefreshContext', () => ({
  useUploadRefresh: () => ({ triggerRefresh: vi.fn() }),
}));

vi.mock('@/app/admin/hooks/useWidgetToast', () => ({
  useWidgetToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('@/app/actions/fileActions', () => ({
  uploadFile: vi.fn(() => Promise.resolve({
    success: true,
    url: 'https://example.com/file.pdf',
    fileName: 'test.pdf',
  })),
}));

describe('UniversalUploadWidget', () => {
  const defaultProps = {
    widget: {
      id: 'UploadFilesWidget',
      gridX: 0,
      gridY: 0,
      gridWidth: 6,
      gridHeight: 4,
    },
    isEditMode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in edit mode', () => {
    render(<UniversalUploadWidget {...defaultProps} isEditMode={true} />);
    
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByText('Upload Widget')).toBeInTheDocument();
  });

  it('renders in normal mode with correct title', () => {
    render(<UniversalUploadWidget {...defaultProps} />);
    
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByText('Upload images or documents')).toBeInTheDocument();
  });

  it('shows supported file types', () => {
    render(<UniversalUploadWidget {...defaultProps} />);
    
    expect(screen.getByText(/Supported:.*\.png.*\.jpeg.*\.jpg.*\.pdf.*\.doc.*\.docx/)).toBeInTheDocument();
  });

  it('shows max file size', () => {
    render(<UniversalUploadWidget {...defaultProps} />);
    
    expect(screen.getByText('Max size: 10MB')).toBeInTheDocument();
  });

  it('renders browse files button', () => {
    render(<UniversalUploadWidget {...defaultProps} />);
    
    const browseButton = screen.getByText('Browse Files');
    expect(browseButton).toBeInTheDocument();
    expect(browseButton).toHaveClass('bg-blue-600');
  });

  it('handles drag and drop', async () => {
    render(<UniversalUploadWidget {...defaultProps} />);
    
    const dropzone = screen.getByText('Drag and drop your file here').closest('div');
    
    // Simulate drag over
    fireEvent.dragOver(dropzone!, {
      dataTransfer: {
        items: [{ type: 'file' }],
      },
    });
    
    // Check if dropzone shows drag state
    await waitFor(() => {
      expect(dropzone).toHaveClass('border-blue-500');
    });
  });

  it('shows folder selector for UploadFilesWidget', () => {
    render(<UniversalUploadWidget {...defaultProps} />);
    
    // Check for folder selector buttons
    expect(screen.getByText('📷 Stock Pictures')).toBeInTheDocument();
    expect(screen.getByText('📄 Product Specs')).toBeInTheDocument();
  });

  it('renders correctly for UploadPhotoWidget', () => {
    const photoProps = {
      ...defaultProps,
      widget: {
        ...defaultProps.widget,
        id: 'UploadPhotoWidget',
      },
    };
    
    render(<UniversalUploadWidget {...photoProps} />);
    
    expect(screen.getByText('Upload Photo')).toBeInTheDocument();
    expect(screen.getByText('Upload product images')).toBeInTheDocument();
    
    // Should not show folder selector
    expect(screen.queryByText('📷 Stock Pictures')).not.toBeInTheDocument();
  });

  it('renders correctly for UploadOrdersWidgetV2', () => {
    const orderProps = {
      ...defaultProps,
      widget: {
        ...defaultProps.widget,
        id: 'UploadOrdersWidgetV2',
      },
    };
    
    render(<UniversalUploadWidget {...orderProps} />);
    
    expect(screen.getByText('Upload Orders')).toBeInTheDocument();
    expect(screen.getByText('Upload order PDFs for AI analysis')).toBeInTheDocument();
    expect(screen.getByText(/Supported:.*\.pdf/)).toBeInTheDocument();
  });

  it('shows error state', async () => {
    const errorConfig = UploadFilesConfig({
      validation: {
        customValidator: () => false,
      },
    });
    
    render(
      <UniversalUploadWidget 
        {...defaultProps} 
        configOverrides={errorConfig}
      />
    );
    
    // TODO: Test file validation error
  });
});