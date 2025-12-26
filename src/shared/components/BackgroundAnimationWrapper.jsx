import React, { useEffect, useMemo, useState } from 'react';
import { Box, Switch, Typography, useTheme } from '@mui/material';
import PrismaticBurst from '@/pages/marketMaker/PrismaticBurst';

const STORAGE_KEY = 'backgroundAnimationEnabled';

/**
 * Hook to manage background animation toggle state with localStorage persistence
 */
export function useBackgroundAnimation(storageKey = STORAGE_KEY) {
  const [showAnimation, setShowAnimation] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === null ? true : saved === 'true';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('localStorage access failed, using default animation state:', error);
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, showAnimation.toString());
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist animation state to localStorage:', error);
    }
  }, [showAnimation, storageKey]);

  return [showAnimation, setShowAnimation];
}

/**
 * Standalone toggle component for background animation
 */
export function BackgroundToggle({ showAnimation, onToggle, toggleLabel = 'Background' }) {
  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3,
        px: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <Typography variant='body2'>{toggleLabel}</Typography>
      <Switch
        aria-label='Toggle background animation'
        checked={showAnimation}
        size='small'
        onChange={(e) => onToggle(e.target.checked)}
      />
    </Box>
  );
}

/**
 * Wrapper component that provides a PrismaticBurst background animation.
 * Use with useBackgroundAnimation hook and BackgroundToggle component for better layout control.
 *
 * @param {Object} props
 * @param {boolean} props.isFeatureEnabled - Whether the main feature is enabled (affects animation speed)
 * @param {boolean} props.showAnimation - Whether to show the animation
 * @param {Function} [props.renderBackground] - Optional custom renderer for the background content
 */
export default function BackgroundAnimationWrapper({
  isFeatureEnabled = true,
  showAnimation = true,
  renderBackground,
}) {
  const theme = useTheme();

  // Slower animation when feature is disabled (alpha/gate screen), faster when enabled
  const animationSpeed = isFeatureEnabled ? 0.05 : 0.5;

  const backgroundContent = useMemo(() => {
    if (!showAnimation) {
      return null;
    }

    if (typeof renderBackground === 'function') {
      return renderBackground({ animationSpeed, theme, isFeatureEnabled });
    }

    return (
      <PrismaticBurst
        animationType='rotate3d'
        colors={[theme.palette.primary.main, theme.palette.secondary.main, theme.palette.text.primary]}
        distort={5}
        hoverDampness={0.25}
        intensity={2}
        maxIterations={20}
        mixBlendMode='lighten'
        offset={{ x: 0, y: 0 }}
        rayCount={10}
        resolutionScale={0.5}
        speed={animationSpeed}
        targetFPS={30}
      />
    );
  }, [animationSpeed, isFeatureEnabled, renderBackground, showAnimation, theme]);

  return backgroundContent;
}
