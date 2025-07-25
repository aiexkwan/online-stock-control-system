import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { useAria } from '@/lib/accessibility';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;

  // 無障礙性增強屬性
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText = '載入中...',
      disabled,
      children,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      'aria-expanded': ariaExpanded,
      'aria-pressed': ariaPressed,
      ...props
    },
    ref
  ) => {
    const { getAriaProps } = useAria();
    const Comp = asChild ? Slot : 'button';

    // 生成 ARIA 屬性
    const ariaProps = getAriaProps({
      label: ariaLabel,
      describedBy: ariaDescribedBy,
      expanded: ariaExpanded,
      disabled: disabled || loading,
    });

    // 處理按壓狀態
    if (ariaPressed !== undefined) {
      ariaProps['aria-pressed'] = ariaPressed;
    }

    // 處理載入狀態
    if (loading) {
      ariaProps['aria-busy'] = true;
      ariaProps['aria-label'] = ariaLabel || loadingText;
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...ariaProps}
        {...props}
      >
        {loading ? (
          <>
            <div className='mr-2 h-1 w-4 rounded-full bg-current opacity-75' />
            <span className='sr-only'>{loadingText}</span>
            {loadingText}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
