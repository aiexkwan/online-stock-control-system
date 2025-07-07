import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input', () => {
  it('should render input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('should display placeholder text', () => {
    render(<Input placeholder="Enter your name" />);
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toBeInTheDocument();
  });

  describe('Input types', () => {
    it('should render text input by default', () => {
      const { container } = render(<Input />);
      const input = container.querySelector('input');
      expect(input).toBeInTheDocument();
      // Default type may not be explicitly set as attribute
      expect(input?.type).toBe('text');
    });

    it('should render email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" placeholder="Password" />);
      const input = screen.getByPlaceholderText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render search input', () => {
      render(<Input type="search" />);
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should render tel input', () => {
      render(<Input type="tel" placeholder="Phone" />);
      const input = screen.getByPlaceholderText('Phone');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should render url input', () => {
      render(<Input type="url" placeholder="URL" />);
      const input = screen.getByPlaceholderText('URL');
      expect(input).toHaveAttribute('type', 'url');
    });
  });

  describe('User interactions', () => {
    it('should accept text input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Hello World');
      expect(input).toHaveValue('Hello World');
    });

    it('should handle onChange event', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Test');
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('Test');
    });

    it('should handle onFocus event', async () => {
      const handleFocus = jest.fn();
      const user = userEvent.setup();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should handle onBlur event', async () => {
      const handleBlur = jest.fn();
      const user = userEvent.setup();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      await user.tab(); // Move focus away
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle onKeyDown event', async () => {
      const handleKeyDown = jest.fn();
      const user = userEvent.setup();
      render(<Input onKeyDown={handleKeyDown} />);
      const input = screen.getByRole('textbox');
      
      await user.click(input);
      await user.keyboard('{Enter}');
      expect(handleKeyDown).toHaveBeenCalled();
    });
  });

  describe('Disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should have disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled value="" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, 'Test');
      expect(input).toHaveValue('');
    });
  });

  describe('Styling', () => {
    it('should have default styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'flex',
        'h-9',
        'w-full',
        'rounded-md',
        'border',
        'border-input',
        'bg-background',
        'px-3',
        'py-1',
        'text-sm',
        'shadow-sm',
        'transition-colors'
      );
    });

    it('should merge custom className', () => {
      render(<Input className="custom-class text-lg" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class', 'text-lg');
      // Should also have default classes
      expect(input).toHaveClass('flex', 'h-9', 'w-full');
    });

    it('should have focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-1',
        'focus-visible:ring-ring'
      );
    });

    it('should have placeholder styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('placeholder:text-muted-foreground');
    });
  });

  describe('ForwardRef', () => {
    it('should forward ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });

    it('should allow focus via ref', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      
      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe('Native input attributes', () => {
    it('should pass through native input attributes', () => {
      render(
        <Input
          name="username"
          id="username-input"
          autoComplete="username"
          autoFocus
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9]+"
          data-testid="test-input"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'username');
      expect(input).toHaveAttribute('id', 'username-input');
      expect(input).toHaveAttribute('autoComplete', 'username');
      // autoFocus is a boolean attribute, it may be present without a value
      expect(input).toHaveFocus(); // Better way to test autoFocus
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('minLength', '3');
      expect(input).toHaveAttribute('maxLength', '20');
      expect(input).toHaveAttribute('pattern', '[a-zA-Z0-9]+');
      expect(input).toHaveAttribute('data-testid', 'test-input');
    });

    it('should handle value prop', () => {
      render(<Input value="test value" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('test value');
    });

    it('should handle defaultValue prop', () => {
      render(<Input defaultValue="default text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('default text');
    });

    it('should handle readOnly prop', () => {
      render(<Input readOnly value="read only text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readOnly');
      expect(input).toHaveValue('read only text');
    });
  });

  describe('File input', () => {
    it('should have file input styles', () => {
      const { container } = render(<Input type="file" />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass(
        'file:border-0',
        'file:bg-transparent',
        'file:text-sm',
        'file:font-medium'
      );
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with aria-label', () => {
      render(<Input aria-label="User email" />);
      const input = screen.getByLabelText('User email');
      expect(input).toBeInTheDocument();
    });

    it('should be accessible with aria-describedby', () => {
      render(
        <>
          <Input aria-describedby="email-error" />
          <span id="email-error">Please enter a valid email</span>
        </>
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'email-error');
    });

    it('should support aria-invalid', () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });
});