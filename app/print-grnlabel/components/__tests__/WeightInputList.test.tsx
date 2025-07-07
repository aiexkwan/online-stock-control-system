import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeightInputList } from '../WeightInputList';
import { LABEL_MODES } from '@/app/constants/grnConstants';

describe('WeightInputList', () => {
  const defaultProps = {
    grossWeights: ['', '', ''],
    onChange: jest.fn(),
    onRemove: jest.fn(),
    labelMode: LABEL_MODES.WEIGHT,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render weight input list', () => {
      render(<WeightInputList {...defaultProps} />);
      
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs).toHaveLength(3);
    });

    it('should display correct header for weight mode', () => {
      render(<WeightInputList {...defaultProps} labelMode={LABEL_MODES.WEIGHT} />);
      
      expect(screen.getByText('Gross Weight / Qty')).toBeInTheDocument();
    });

    it('should display correct header for quantity mode', () => {
      render(<WeightInputList {...defaultProps} labelMode={LABEL_MODES.QUANTITY} />);
      
      expect(screen.getByText('Quantity')).toBeInTheDocument();
    });

    it('should display pallet count', () => {
      render(<WeightInputList {...defaultProps} grossWeights={['10', '20', '', '']} />);
      
      expect(screen.getByText('2 / 22 pallets')).toBeInTheDocument();
    });

    it('should render with custom maxItems', () => {
      render(<WeightInputList {...defaultProps} maxItems={10} grossWeights={['10', '20']} />);
      
      expect(screen.getByText('2 / 10 pallets')).toBeInTheDocument();
    });
  });

  describe('Weight Mode', () => {
    it('should display kg units in weight mode', () => {
      render(<WeightInputList {...defaultProps} labelMode={LABEL_MODES.WEIGHT} />);
      
      const kgUnits = screen.getAllByText('kg');
      expect(kgUnits.length).toBeGreaterThan(0);
    });

    it('should calculate and display total net weight', () => {
      render(
        <WeightInputList 
          {...defaultProps} 
          labelMode={LABEL_MODES.WEIGHT}
          grossWeights={['100', '200', '150', '']}
          selectedPalletType="wooden"
          selectedPackageType="carton"
        />
      );
      
      // Should show total net weight calculation
      expect(screen.getByText(/Total Net Weight:/)).toBeInTheDocument();
    });

    it('should use step 0.1 for weight inputs', () => {
      render(<WeightInputList {...defaultProps} labelMode={LABEL_MODES.WEIGHT} />);
      
      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('step', '0.1');
      });
    });
  });

  describe('Quantity Mode', () => {
    it('should display pcs units in quantity mode', () => {
      render(<WeightInputList {...defaultProps} labelMode={LABEL_MODES.QUANTITY} />);
      
      const pcsUnits = screen.getAllByText('pcs');
      expect(pcsUnits.length).toBeGreaterThan(0);
    });

    it('should not display total net weight in quantity mode', () => {
      render(
        <WeightInputList 
          {...defaultProps} 
          labelMode={LABEL_MODES.QUANTITY}
          grossWeights={['100', '200', '150']}
        />
      );
      
      expect(screen.queryByText(/Total Net Weight:/)).not.toBeInTheDocument();
    });

    it('should use step 1 for quantity inputs', () => {
      render(<WeightInputList {...defaultProps} labelMode={LABEL_MODES.QUANTITY} />);
      
      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('step', '1');
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<WeightInputList {...defaultProps} onChange={onChange} />);
      
      const firstInput = screen.getAllByRole('spinbutton')[0];
      await user.type(firstInput, '123');
      
      expect(onChange).toHaveBeenCalledWith(0, '123');
    });

    it('should handle Enter key to move to next input', async () => {
      const user = userEvent.setup();
      render(<WeightInputList {...defaultProps} grossWeights={['', '', '']} />);
      
      const inputs = screen.getAllByRole('spinbutton');
      const firstInput = inputs[0];
      const secondInput = inputs[1];
      
      // Focus first input
      firstInput.focus();
      expect(document.activeElement).toBe(firstInput);
      
      // Press Enter
      await user.keyboard('{Enter}');
      
      // Should move focus to second input
      expect(document.activeElement).toBe(secondInput);
    });

    it('should show remove button for filled non-last items', async () => {
      render(
        <WeightInputList 
          {...defaultProps} 
          grossWeights={['100', '200', '']} 
        />
      );
      
      // Should have remove buttons for first two items
      const removeButtons = screen.getAllByTitle('Remove this pallet');
      expect(removeButtons).toHaveLength(2);
    });

    it('should call onRemove when remove button clicked', async () => {
      const user = userEvent.setup();
      const onRemove = jest.fn();
      render(
        <WeightInputList 
          {...defaultProps} 
          onRemove={onRemove}
          grossWeights={['100', '200', '']} 
        />
      );
      
      const removeButtons = screen.getAllByTitle('Remove this pallet');
      await user.click(removeButtons[0]);
      
      expect(onRemove).toHaveBeenCalledWith(0);
    });

    it('should not show remove button when onRemove is not provided', () => {
      render(
        <WeightInputList 
          {...defaultProps} 
          onRemove={undefined}
          grossWeights={['100', '200', '']} 
        />
      );
      
      expect(screen.queryByTitle('Remove this pallet')).not.toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    it('should highlight filled inputs', () => {
      render(
        <WeightInputList 
          {...defaultProps} 
          grossWeights={['100', '', '200', '']} 
        />
      );
      
      const inputs = screen.getAllByRole('spinbutton');
      // Filled inputs should have different styling
      expect(inputs[0]).toHaveClass('bg-slate-700/50');
      expect(inputs[1]).toHaveClass('bg-slate-700/30');
      expect(inputs[2]).toHaveClass('bg-slate-700/50');
    });

    it('should show numbered badges for each input', () => {
      render(<WeightInputList {...defaultProps} grossWeights={['', '', '']} />);
      
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should highlight badges for filled inputs', () => {
      const { container } = render(
        <WeightInputList 
          {...defaultProps} 
          grossWeights={['100', '', '200']} 
        />
      );
      
      // Check badge styling based on whether input has value
      const badges = container.querySelectorAll('.rounded-full.flex.items-center.justify-center');
      expect(badges[0]).toHaveClass('from-orange-500');
      expect(badges[1]).toHaveClass('bg-slate-600/30');
      expect(badges[2]).toHaveClass('from-orange-500');
    });
  });

  describe('Expansion behavior', () => {
    it('should auto-expand when more than 5 items are filled', () => {
      const { rerender } = render(
        <WeightInputList 
          {...defaultProps} 
          grossWeights={['1', '2', '3', '4', '', '', '', '']} 
        />
      );
      
      // Initially not expanded
      const container = screen.getByRole('spinbutton', { name: '' }).closest('.weight-input-scroll-container');
      expect(container).toHaveClass('max-h-[280px]');
      
      // Add 6th item
      rerender(
        <WeightInputList 
          {...defaultProps} 
          grossWeights={['1', '2', '3', '4', '5', '6', '', '']} 
        />
      );
      
      // Should be expanded
      expect(container).toHaveClass('max-h-[500px]');
    });

    it('should show gradient overlay when not expanded with many items', () => {
      const { container } = render(
        <WeightInputList 
          {...defaultProps} 
          grossWeights={['1', '2', '3', '4', '5', '6', '7', '8']} 
        />
      );
      
      // Look for gradient overlay (would be visible when not expanded and have > 5 items)
      const gradient = container.querySelector('.bg-gradient-to-t.from-slate-900');
      expect(gradient).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('should disable all inputs when disabled prop is true', () => {
      render(
        <WeightInputList 
          {...defaultProps} 
          disabled={true}
          grossWeights={['100', '200', '']} 
        />
      );
      
      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });

    it('should disable remove buttons when disabled', () => {
      render(
        <WeightInputList 
          {...defaultProps} 
          disabled={true}
          grossWeights={['100', '200', '']} 
        />
      );
      
      const removeButtons = screen.getAllByTitle('Remove this pallet');
      removeButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Input attributes', () => {
    it('should have correct input attributes', () => {
      render(<WeightInputList {...defaultProps} />);
      
      const inputs = screen.getAllByRole('spinbutton');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('type', 'number');
        expect(input).toHaveAttribute('min', '0');
        expect(input).toHaveAttribute('maxLength', '5');
      });
    });

    it('should show placeholder for last input', () => {
      render(<WeightInputList {...defaultProps} grossWeights={['100', '']} />);
      
      const inputs = screen.getAllByRole('spinbutton');
      expect(inputs[inputs.length - 1]).toHaveAttribute('placeholder', 'Enter');
      expect(inputs[0]).toHaveAttribute('placeholder', '0');
    });
  });

  describe('Grid layout', () => {
    it('should render inputs in 2-column grid', () => {
      const { container } = render(<WeightInputList {...defaultProps} grossWeights={Array(10).fill('')} />);
      
      const gridContainer = container.querySelector('.grid.grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});