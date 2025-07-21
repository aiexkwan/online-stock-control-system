import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    render(<Button variant='destructive'>Delete</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('applies size classes correctly', () => {
    render(<Button size='lg'>Large Button</Button>);

    const button = screen.getByRole('button');
    // Check that the button has the correct classes for lg size
    expect(button).toHaveClass('px-8');
    expect(button).toHaveClass('h-10'); // Default height for lg size
  });

  it('handles disabled state', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none');
  });

  it('renders as different element when asChild is true', () => {
    render(
      <Button asChild>
        <a href='/'>Link Button</a>
      </Button>
    );

    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
