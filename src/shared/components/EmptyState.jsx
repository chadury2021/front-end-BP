import React from 'react';
import { Box, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

/**
 * EmptyState component for displaying when no data is found
 * @param {Object} props - Component props
 * @param {string} props.message - Message to display
 * @param {React.ReactNode} [props.icon] - Optional icon to display
 * @param {Object} [props.sx] - Additional styling
 */
function EmptyState({ message = 'No results found', icon, sx = {} }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 200,
        gap: 2,
        ...sx,
      }}
    >
      {icon || (
        <SearchIcon
          sx={{
            fontSize: 48,
            color: 'text.secondary',
            opacity: 0.6,
          }}
        />
      )}
      <Typography
        color='text.secondary'
        sx={{
          textAlign: 'center',
          fontWeight: 500,
        }}
        variant='body1'
      >
        {message}
      </Typography>
    </Box>
  );
}

export default EmptyState;
