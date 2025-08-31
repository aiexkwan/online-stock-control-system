import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  spotlight?: boolean;
  spotlightColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
}

// Spotlight Card 顏色配置
const spotlightColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, spotlight = false, spotlightColor = 'blue', style, ...props }, ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const innerRef = React.useRef<HTMLDivElement>(null);
    const { base, spread } = spotlightColorMap[spotlightColor];

    React.useEffect(() => {
      if (!spotlight) return;

      const syncPointer = (e: PointerEvent) => {
        const { clientX: x, clientY: y } = e;

        if (cardRef.current) {
          cardRef.current.style.setProperty('--x', x.toFixed(2));
          cardRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
          cardRef.current.style.setProperty('--y', y.toFixed(2));
          cardRef.current.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
        }
      };

      document.addEventListener('pointermove', syncPointer);
      return () => document.removeEventListener('pointermove', syncPointer);
    }, [spotlight]);

    if (spotlight) {
      const inlineStyles = {
        '--base': base,
        '--spread': spread,
        '--radius': '12',
        '--border': '2',
        '--backdrop': 'hsl(0 0% 60% / 0.08)',
        '--backup-border': 'var(--backdrop)',
        '--size': '150',
        '--outer': '1',
        '--saturation': '100',
        '--lightness': '70',
        '--bg-spot-opacity': '0.05',
        '--border-spot-opacity': '0.8',
        '--border-light-opacity': '0.8',
        '--border-size': 'calc(var(--border, 2) * 1px)',
        '--spotlight-size': 'calc(var(--size, 150) * 1px)',
        '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
        backgroundImage: `radial-gradient(
          var(--spotlight-size) var(--spotlight-size) at
          calc(var(--x, 0) * 1px)
          calc(var(--y, 0) * 1px),
          hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.05)), transparent
        )`,
        backgroundColor: 'var(--backdrop, transparent)',
        backgroundSize:
          'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
        backgroundPosition: '50% 50%',
        backgroundAttachment: 'fixed',
        border: 'var(--border-size) solid var(--backup-border)',
        position: 'relative' as const,
        touchAction: 'none' as const,
        ...style,
      } as React.CSSProperties;

      const beforeAfterStyles = `
        [data-spotlight]::before,
        [data-spotlight]::after {
          pointer-events: none;
          content: "";
          position: absolute;
          inset: calc(var(--border-size) * -1);
          border: var(--border-size) solid transparent;
          border-radius: calc(var(--radius) * 1px);
          background-attachment: fixed;
          background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
          background-repeat: no-repeat;
          background-position: 50% 50%;
          mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
          mask-clip: padding-box, border-box;
          mask-composite: intersect;
        }

        [data-spotlight]::before {
          background-image: radial-gradient(
            calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
            calc(var(--x, 0) * 1px)
            calc(var(--y, 0) * 1px),
            hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 0.8)), transparent 100%
          );
          filter: brightness(2);
        }

        [data-spotlight]::after {
          background-image: radial-gradient(
            calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
            calc(var(--x, 0) * 1px)
            calc(var(--y, 0) * 1px),
            hsl(0 100% 100% / var(--border-light-opacity, 0.8)), transparent 100%
          );
        }

        [data-spotlight] [data-spotlight] {
          position: absolute;
          inset: 0;
          will-change: filter;
          opacity: var(--outer, 1);
          border-radius: calc(var(--radius) * 1px);
          border-width: calc(var(--border-size) * 20);
          filter: blur(calc(var(--border-size) * 10));
          background: none;
          pointer-events: none;
          border: none;
        }

        [data-spotlight] > [data-spotlight]::before {
          inset: -10px;
          border-width: 10px;
        }
      `;

      return (
        <>
          <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
          <div
            ref={node => {
              // 設定內部 ref
              if (cardRef.current !== node) {
                cardRef.current = node;
              }

              // 設定 forwardRef
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            data-spotlight
            style={inlineStyles}
            className={cn(
              'rounded-xl shadow-[0_0.5rem_1rem_-0.5rem_black] backdrop-blur-[2px]',
              className
            )}
            {...props}
          >
            <div ref={innerRef} data-spotlight></div>
            {props.children}
          </div>
        </>
      );
    }

    // 默認 Card 樣式（無 spotlight 效果）
    return (
      <div
        ref={ref}
        className={cn('bg-card text-card-foreground rounded-xl border shadow', className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
