/**
 * Mobile-optimized configuration for touch-friendly UI
 * 手機版優化配置 - 統一觸控友好設計
 */

export const mobileConfig = {
  // Touch target sizes (minimum 44x44px for iOS, 48x48dp for Android)
  touchTargets: {
    small: 'min-h-[44px] min-w-[44px]',
    medium: 'min-h-[48px] min-w-[48px]',
    large: 'min-h-[56px] min-w-[56px]',
  },

  // Padding scales for mobile
  padding: {
    button: 'px-4 py-3 md:px-6 md:py-2.5',
    card: 'p-4 md:p-6',
    input: 'px-4 py-3 md:px-4 md:py-2.5',
    section: 'px-4 py-6 md:px-6 md:py-8',
  },

  // Font sizes optimized for mobile readability
  fontSize: {
    // Headings
    h1: 'text-3xl md:text-4xl lg:text-5xl',
    h2: 'text-2xl md:text-3xl lg:text-4xl',
    h3: 'text-xl md:text-2xl lg:text-3xl',
    h4: 'text-lg md:text-xl lg:text-2xl',
    
    // Body text
    body: 'text-base md:text-sm',
    bodyLarge: 'text-lg md:text-base',
    bodySmall: 'text-sm md:text-xs',
    
    // UI elements
    button: 'text-base md:text-sm font-medium',
    input: 'text-base md:text-sm',
    label: 'text-sm md:text-xs',
  },

  // Spacing for mobile
  spacing: {
    stack: 'space-y-4 md:space-y-6',
    stackSmall: 'space-y-2 md:space-y-3',
    stackLarge: 'space-y-6 md:space-y-8',
    inline: 'space-x-3 md:space-x-4',
    inlineSmall: 'space-x-2 md:space-x-3',
  },

  // Grid layouts
  grid: {
    twoColumn: 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6',
    threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6',
    fourColumn: 'grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4',
  },

  // Responsive utilities
  responsive: {
    hideMobile: 'hidden md:block',
    hideDesktop: 'block md:hidden',
    stackMobile: 'flex flex-col md:flex-row',
  },

  // Touch-friendly interactive states
  interactive: {
    tap: 'active:scale-95 transition-transform duration-150',
    hover: 'hover:bg-opacity-80 active:bg-opacity-90',
    focus: 'focus:outline-none focus:ring-2 focus:ring-offset-2',
  },

  // Common mobile-optimized components
  components: {
    button: {
      base: 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95',
      primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500',
      secondary: 'bg-slate-700 text-white hover:bg-slate-600 active:bg-slate-800 focus:ring-slate-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500',
      ghost: 'bg-transparent hover:bg-slate-700/50 active:bg-slate-700/70',
      // Size variants
      sizeSm: 'min-h-[40px] px-3 py-2 text-sm',
      sizeMd: 'min-h-[44px] px-4 py-2.5 text-base md:text-sm',
      sizeLg: 'min-h-[52px] px-6 py-3 text-lg md:text-base',
      sizeXl: 'min-h-[60px] px-8 py-4 text-xl md:text-lg',
    },
    
    input: {
      base: 'w-full rounded-lg border bg-slate-700/50 text-white placeholder-slate-400 transition-all duration-200',
      normal: 'border-slate-600/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/50',
      error: 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/50',
      // Size variants
      sizeSm: 'min-h-[40px] px-3 py-2 text-sm',
      sizeMd: 'min-h-[44px] px-4 py-2.5 text-base',
      sizeLg: 'min-h-[52px] px-5 py-3 text-lg',
    },

    card: {
      base: 'bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm rounded-xl',
      interactive: 'transition-all duration-200 hover:bg-slate-800/60 active:bg-slate-800/70 cursor-pointer',
      padding: 'p-4 md:p-6',
    },

    dialog: {
      overlay: 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50',
      content: 'fixed inset-x-4 top-[50%] translate-y-[-50%] md:inset-x-auto md:left-[50%] md:translate-x-[-50%] max-w-lg w-full max-h-[90vh] overflow-y-auto',
      padding: 'p-6 md:p-8',
    },
  },
};

// Helper function to combine classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Mobile-optimized button component helper
export function getMobileButtonClass(
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary',
  size: 'sm' | 'md' | 'lg' | 'xl' = 'md',
  className?: string
): string {
  return cn(
    mobileConfig.components.button.base,
    mobileConfig.components.button[variant],
    mobileConfig.components.button[`size${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof mobileConfig.components.button],
    className
  );
}

// Mobile-optimized input component helper
export function getMobileInputClass(
  state: 'normal' | 'error' = 'normal',
  size: 'sm' | 'md' | 'lg' = 'md',
  className?: string
): string {
  return cn(
    mobileConfig.components.input.base,
    mobileConfig.components.input[state],
    mobileConfig.components.input[`size${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof mobileConfig.components.input],
    className
  );
}

// Touch-friendly tap handler with haptic feedback (if available)
export function handleMobileTap(callback: () => void) {
  return () => {
    // Trigger haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10); // Light haptic feedback
    }
    callback();
  };
}