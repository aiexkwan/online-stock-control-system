/**
 * FormCard Component Test
 * 測試 FormCard 組件的基本功能
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { FormCard, FormType } from './FormCard';

// Mock GraphQL Provider
const mocks: any[] = [];

describe('FormCard Component', () => {
  const defaultProps = {
    formType: FormType.PRODUCT_EDIT,
  };

  const renderFormCard = (props = {}) => {
    return render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <FormCard {...defaultProps} {...props} />
      </MockedProvider>
    );
  };

  it('renders product edit form correctly', () => {
    renderFormCard();
    
    expect(screen.getByText('Product Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Code/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Colour/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Standard Quantity/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Product Type/)).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    renderFormCard();
    
    const submitButton = screen.getByRole('button', { name: /Create/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Product Code is required/)).toBeInTheDocument();
      expect(screen.getByText(/Product Description is required/)).toBeInTheDocument();
    });
  });

  it('updates form data on input change', () => {
    renderFormCard();
    
    const codeInput = screen.getByLabelText(/Product Code/);
    fireEvent.change(codeInput, { target: { value: 'TEST-001' } });
    
    expect(codeInput).toHaveValue('TEST-001');
  });

  it('shows progress bar when enabled', () => {
    renderFormCard({ showProgress: true });
    
    expect(screen.getByText(/Form Completion/)).toBeInTheDocument();
  });

  it('renders in edit mode correctly', () => {
    renderFormCard({ isEditMode: true });
    
    expect(screen.getByText(/Edit Mode/)).toBeInTheDocument();
  });

  it('handles cancel button click', () => {
    const onCancel = jest.fn();
    renderFormCard({ onCancel });
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
  });

  it('prefills form with initial data', () => {
    const prefilledData = {
      code: 'PREFILL-001',
      description: 'Prefilled Product',
    };
    
    renderFormCard({ prefilledData });
    
    expect(screen.getByDisplayValue('PREFILL-001')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Prefilled Product')).toBeInTheDocument();
  });
});