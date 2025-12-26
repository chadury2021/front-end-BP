// Holographic Effects Utility
// Reusable holographic animations and styles for the application

// React hook for value flash effect
import { useEffect, useRef, useState } from 'react';

export const holographicShimmer = {
  '@keyframes holographic-shimmer': {
    '0%': {
      backgroundPosition: '0% 50%',
    },
    '25%': {
      backgroundPosition: '100% 50%',
    },
    '50%': {
      backgroundPosition: '100% 50%',
    },
    '75%': {
      backgroundPosition: '0% 50%',
    },
    '100%': {
      backgroundPosition: '0% 50%',
    },
  },
};

// Isolated holographic effect with better performance
export const isolatedHolographicStyles = (theme) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  borderRadius: '6px',
  willChange: 'transform',
  isolation: 'isolate',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    transition: 'transform 0.6s ease',
    pointerEvents: 'none',
    willChange: 'transform',
    transform: 'translateX(0)',
    contain: 'layout style paint',
  },

  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, #ff0080, #ff8c00, #40e0d0, #ee82ee, #ff0080)',
    backgroundSize: '400% 400%',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: -1,
    borderRadius: '6px',
    pointerEvents: 'none',
    willChange: 'opacity, background-position',
    contain: 'layout style paint',
  },

  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 3px 12px rgba(0,0,0,0.15)',

    '&::before': {
      transform: 'translateX(200%)',
    },

    '&::after': {
      opacity: 0.12,
      animation: 'holographic-shimmer 5s ease-in-out forwards',
    },
  },

  '&:hover *': {
    pointerEvents: 'none',
  },
});

export const holographicButtonStyles = (theme) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  borderRadius: '0',
  willChange: 'transform',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
    transition: 'transform 0.5s ease',
    pointerEvents: 'none',
    willChange: 'transform',
    transform: 'translateX(0)',
  },

  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, #ff0080, #ff8c00, #40e0d0, #ee82ee, #ff0080)',
    backgroundSize: '400% 400%',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: -1,
    borderRadius: '0',
    pointerEvents: 'none',
    willChange: 'opacity, background-position',
  },

  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',

    '&::before': {
      transform: 'translateX(200%)',
    },

    '&::after': {
      opacity: 0.15,
      animation: 'holographic-shimmer 4s ease-in-out forwards',
    },
  },

  // Prevent hover state from flickering when moving mouse over text
  '&:hover *': {
    pointerEvents: 'none',
  },
});

export const holographicCardStyles = (theme) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  borderRadius: '12px',
  willChange: 'transform',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'transform 0.8s ease',
    pointerEvents: 'none',
    willChange: 'transform',
    transform: 'translateX(0)',
  },

  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, #ff0080, #ff8c00, #40e0d0, #ee82ee, #ff0080)',
    backgroundSize: '400% 400%',
    opacity: 0,
    transition: 'opacity 0.4s ease',
    zIndex: -1,
    borderRadius: '12px',
    pointerEvents: 'none',
    willChange: 'opacity, background-position',
  },

  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.3)',

    '&::before': {
      transform: 'translateX(200%)',
    },

    '&::after': {
      opacity: 0.1,
      animation: 'holographic-shimmer 6s ease-in-out forwards',
    },
  },
});

export const holographicTabStyles = (theme) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  borderRadius: '6px',
  willChange: 'transform',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
    transition: 'transform 0.6s ease',
    pointerEvents: 'none',
    willChange: 'transform',
    transform: 'translateX(0)',
  },

  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, #ff0080, #ff8c00, #40e0d0, #ee82ee, #ff0080)',
    backgroundSize: '400% 400%',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: -1,
    borderRadius: '6px',
    pointerEvents: 'none',
    willChange: 'opacity, background-position',
  },

  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 3px 12px rgba(0,0,0,0.15)',

    '&::before': {
      transform: 'translateX(200%)',
    },

    '&::after': {
      opacity: 0.12,
      animation: 'holographic-shimmer 5s ease-in-out forwards',
    },
  },

  '&:hover *': {
    pointerEvents: 'none',
  },
});

// Utility function to create custom holographic styles
export const createHolographicStyles = (options = {}) => {
  const {
    borderRadius = '8px',
    shimmerOpacity = 0.4,
    backgroundOpacity = 0.15,
    animationDuration = '4s',
    transform = 'translateY(-1px)',
    shadow = '0 4px 15px rgba(0,0,0,0.2)',
  } = options;

  return (theme) => ({
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    borderRadius,
    willChange: 'transform',

    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: `linear-gradient(90deg, transparent, rgba(255,255,255,${shimmerOpacity}), transparent)`,
      transition: 'transform 0.5s ease',
      pointerEvents: 'none',
      willChange: 'transform',
      transform: 'translateX(0)',
    },

    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, #ff0080, #ff8c00, #40e0d0, #ee82ee, #ff0080)',
      backgroundSize: '400% 400%',
      opacity: 0,
      transition: 'opacity 0.3s ease',
      zIndex: -1,
      borderRadius,
      pointerEvents: 'none',
      willChange: 'opacity, background-position',
    },

    '&:hover': {
      transform,
      boxShadow: shadow,

      '&::before': {
        transform: 'translateX(200%)',
      },

      '&::after': {
        opacity: backgroundOpacity,
        animation: `holographic-shimmer ${animationDuration} ease-in-out forwards`,
      },
    },

    '&:hover *': {
      pointerEvents: 'none',
    },
  });
};

// Injects up/down flash keyframes and classes for value change flashes
export function injectFlashKeyframes() {
  if (typeof document === 'undefined') return;
  if (!document.getElementById('flash-effect-keyframes')) {
    const style = document.createElement('style');
    style.id = 'flash-effect-keyframes';
    style.textContent = `
      @keyframes flashGlowUp {
        0% { text-shadow: none; transform: scale(1); }
        20% { text-shadow: 0 0 15px rgba(244, 67, 54, 0.6); transform: scale(1.01); }
        40% { text-shadow: 0 0 25px rgba(244, 67, 54, 0.8); transform: scale(1.005); }
        60% { text-shadow: 0 0 15px rgba(244, 67, 54, 0.6); transform: scale(1.002); }
        100% { text-shadow: none; transform: scale(1); }
      }
      @keyframes flashGlowDown {
        0% { text-shadow: none; transform: scale(1); }
        20% { text-shadow: 0 0 15px rgba(56, 183, 104, 0.6); transform: scale(1.01); }
        40% { text-shadow: 0 0 25px rgba(56, 183, 104, 0.8); transform: scale(1.005); }
        60% { text-shadow: 0 0 15px rgba(56, 183, 104, 0.6); transform: scale(1.002); }
        100% { text-shadow: none; transform: scale(1); }
      }
      .flash-up { animation: flashGlowUp 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
      .flash-down { animation: flashGlowDown 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
    `;
    document.head.appendChild(style);
  }
}
export function useFlashOnChange(value) {
  const [flash, setFlash] = useState({ isFlashing: false, direction: null });
  const prev = useRef();

  useEffect(() => {
    injectFlashKeyframes();
    if (prev.current !== undefined && value !== prev.current) {
      const direction = value > prev.current ? 'up' : 'down';
      setFlash({ isFlashing: true, direction });
      const timeout = setTimeout(() => {
        setFlash({ isFlashing: false, direction: null });
      }, 800);
      return () => clearTimeout(timeout);
    }
    prev.current = value;
    return undefined;
  }, [value]);

  let className = '';
  if (flash.isFlashing) {
    if (flash.direction === 'up') className = 'flash-up';
    else if (flash.direction === 'down') className = 'flash-down';
  }
  return {
    className,
    direction: flash.direction,
  };
}