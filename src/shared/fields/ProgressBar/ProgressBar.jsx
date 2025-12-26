import React from 'react';
import { useTheme } from '@emotion/react';
import { Typography } from '@mui/material';

function ProgressBar({
  progress,
  orderStatus,
  isPov,
  isDark = false,
  fullWidth = false,
  containerStyleOverride = {},
  barStyleOverride = {},
}) {
  const theme = useTheme();

  const formatPctFilled = () => {
    if (isDark) {
      // Dark theme colors matching the provided examples
      if (isPov && progress <= 100) {
        return [theme.palette.success.main, theme.palette.success.dark2];
      }
      if (progress < 99 && orderStatus === 'ACTIVE') {
        return [theme.palette.success.main, theme.palette.success.dark2];
      }
      if (progress <= 101 && progress >= 95) {
        return [theme.palette.success.main, theme.palette.success.dark2];
      }
      if (progress > 101 || orderStatus === 'COMPLETE') {
        return [theme.palette.error.main, theme.palette.error.dark2];
      }
      return [theme.palette.warning.main, theme.palette.warning.dark2];
    }

    // Light theme colors (existing logic)
    if (isPov && progress <= 100) {
      return [theme.palette.success.main, theme.palette.success.dark2];
    }
    if (progress < 99 && orderStatus === 'ACTIVE') {
      return [theme.palette.success.main, theme.palette.success.dark2];
    }
    if (progress <= 101 && progress >= 95) {
      return [theme.palette.success.main, theme.palette.success.dark2];
    }
    if (progress > 101 || orderStatus === 'COMPLETE') {
      return [theme.palette.error.main, theme.palette.error.dark2];
    }
    return [theme.palette.primary.main, theme.palette.primary.transparent];
  };

  const color = formatPctFilled();

  // Use semantic colors for text in dark mode, white in light mode
  const getTextColor = () => {
    if (isDark) {
      // Use semantic colors based on the state
      if (isPov && progress <= 100) {
        return theme.palette.success.main; // Green text
      }
      if (progress < 99 && orderStatus === 'ACTIVE') {
        return theme.palette.success.main; // Green text
      }
      if (progress <= 101 && progress >= 95) {
        return theme.palette.success.main; // Green text
      }
      if (progress > 101 || orderStatus === 'COMPLETE') {
        return theme.palette.error.main; // Red text
      }
      return theme.palette.warning.main; // Orange text
    }
    return '#FFFFFF'; // White text for light mode
  };

  const containerStyle = {
    position: 'relative',
    height: '15px',
    width: fullWidth ? '120px' : '80px',
    backgroundColor: isDark ? `${color[0]}5` : color[1], // Use transparent version of filled color in dark mode
    borderRadius: '5px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...containerStyleOverride,
    ...(isDark && {
      border: `1px solid ${color[1]}`,
    }),
  };

  const barContainerStyle = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '5px',
    backgroundColor: 'inherit',
    overflow: 'hidden',
  };

  const barStyle = {
    height: '15px',
    width: `${progress}%`,
    backgroundColor: isDark ? color[1] : color[0],
    opacity: isDark ? 1 : 0.5, // Full opacity in dark mode, 50% in light mode
    borderRadius: '0px',
    transition: 'width 0.5s ease-in-out',
    zIndex: 0,
    ...barStyleOverride,
  };

  return (
    <div style={containerStyle}>
      <div style={barContainerStyle}>
        <div style={barStyle} />
      </div>
      <Typography color={getTextColor()} style={{ zIndex: 1 }} variant='body2'>
        {`${progress}%`}
      </Typography>
    </div>
  );
}

export default ProgressBar;
