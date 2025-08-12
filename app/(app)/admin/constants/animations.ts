/**
 * Animation Constants
 * Common animation configurations used across admin cards
 */

// Common Tailwind animation classes
export const ANIMATION_CLASSES = {
  // Spin animations
  SPIN: 'animate-spin',
  
  // Pulse animations
  PULSE: 'animate-pulse',
  
  // Fade animations
  FADE_IN: 'animate-fadeIn',
  
  // Bounce animations
  BOUNCE: 'animate-bounce',
} as const;

// Transition classes
export const TRANSITION_CLASSES = {
  // Colors transitions
  COLORS: 'transition-colors',
  
  // All properties transitions
  ALL: 'transition-all',
  
  // Opacity transitions
  OPACITY: 'transition-opacity',
  
  // Transform transitions
  TRANSFORM: 'transition-transform',
} as const;

// Duration classes
export const DURATION_CLASSES = {
  FAST: 'duration-150',
  NORMAL: 'duration-300',
  SLOW: 'duration-500',
  SLOWER: 'duration-700',
  SLOWEST: 'duration-1000',
} as const;

// Ease functions
export const EASE_CLASSES = {
  LINEAR: 'ease-linear',
  IN: 'ease-in',
  OUT: 'ease-out',
  IN_OUT: 'ease-in-out',
} as const;

// Common animation patterns
export const ANIMATION_PATTERNS = {
  // Loading spinner
  LOADING_SPINNER: 'animate-spin rounded-full border-b-2 border-primary',
  
  // Loading spinner with custom color
  LOADING_SPINNER_WHITE: 'animate-spin rounded-full border-b-2 border-white',
  
  // Button hover effect
  BUTTON_HOVER: 'transition-all hover:scale-105',
  
  // Card hover effect
  CARD_HOVER: 'transition-all hover:shadow-lg',
  
  // Text hover effect
  TEXT_HOVER: 'transition-colors hover:text-primary',
  
  // Smooth color transition
  SMOOTH_COLOR: 'transition-colors duration-300',
  
  // Smooth all transition
  SMOOTH_ALL: 'transition-all duration-300 ease-out',
} as const;

// Custom CSS animations (to be added to global CSS)
export const CUSTOM_ANIMATIONS = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;