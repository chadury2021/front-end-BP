import React from 'react';
import { Box } from '@mui/material';

/**
 * A reusable split layout component for authentication pages.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to display in the right panel
 * @param {string} props.imageSrc - Image source for the left panel
 * @param {string} props.imageAlt - Alt text for the image
 * @param {Object} props.containerProps - Additional props for the container
 * @param {Object} props.leftPanelProps - Additional props for the left panel
 * @param {Object} props.rightPanelProps - Additional props for the right panel
 */
function SplitAuthLayout({
  children,
  imageSrc,
  imageAlt = 'Authentication illustration',
  containerProps = {},
  leftPanelProps = {},
  rightPanelProps = {},
}) {
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'background.default',
        padding: { xs: '16px', sm: '32px' },
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: '1200px',
          height: { xs: 'auto', md: '800px' },
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
          ...containerProps.sx,
        }}
        {...containerProps}
      >
        {/* Left panel with image */}
        <Box
          sx={{
            flex: '1 0 55%',
            display: { xs: 'none', md: 'block' },
            position: 'relative',
            ...leftPanelProps.sx,
          }}
          {...leftPanelProps}
        >
          <img
            alt={imageAlt}
            src={imageSrc}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </Box>

        {/* Right panel with content */}
        <Box
          sx={{
            flex: { xs: '1 0 100%', md: '1 0 45%' },
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: { xs: 6, sm: 8, md: 10 },
            position: 'relative',
            boxSizing: 'border-box',
            overflow: 'auto',
            ...rightPanelProps.sx,
          }}
          {...rightPanelProps}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default SplitAuthLayout;
