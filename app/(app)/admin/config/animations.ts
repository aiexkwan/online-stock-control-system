/**
 * Animation Configuration
 * Centralized animation settings for consistent motion
 */

export const ANIMATIONS = {
  // Fade in with scale
  fadeInScale: {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.7, ease: [0.46, 0.03, 0.52, 0.96] },
  },

  // Fade up for cells with stagger
  fadeUpCell: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: [0.64, 0.09, 0.08, 1] },
  },

  // Cell delays for staggered appearance
  cellDelays: {
    cell1: 0.2,
    cell2: 0.35,
    cell3: 0.5,
    cell4: 0.65,
  },

  // Hover effects
  hover: {
    scale: { scale: 1.02 },
    glow: { filter: 'brightness(1.1)' },
  },

  // Tab switching
  tabSwitch: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: 'easeInOut' },
  },

  // Widget drag animation
  widgetDrag: {
    dragging: { scale: 1.05, opacity: 0.8 },
    normal: { scale: 1, opacity: 1 },
  },
};

// CSS Keyframes for complex animations
export const CSS_ANIMATIONS = `
  @property --rotation-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }

  @keyframes rotate {
    to {
      --rotation-angle: 360deg;
    }
  }

  @keyframes fadeInScale {
    0% {
      opacity: 0;
      transform: scale(0.97);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes fadeUpCell {
    0% {
      opacity: 0;
      transform: translateY(30px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: .5;
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
`;

// Animation utility classes
export const ANIMATION_CLASSES = {
  fadeInScale: 'animate-fade-in-scale',
  fadeUpCell: 'animate-fade-up-cell',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  shimmer: 'animate-shimmer',
};
