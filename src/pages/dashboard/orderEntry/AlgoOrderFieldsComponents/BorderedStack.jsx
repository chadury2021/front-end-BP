import Stack from '@mui/material/Stack';
import { useTheme } from '@emotion/react';
import { Box, Typography } from '@mui/material';

function BorderedStack({ spacing = 2, title, children, disabled = false, ...props }) {
  const theme = useTheme();
  return (
    <Stack
      direction='column'
      spacing={spacing}
      {...props}
      sx={{
        position: 'relative',
        border: `1px solid ${disabled ? theme.palette.grey.disabled : theme.palette.grey.main}`,
        borderRadius: '4px',
        padding: '20px',
        '&::before': {
          content: `"${title}"`,
          position: 'absolute',
          top: '-10px',
          left: '10px',
          color: disabled ? theme.palette.grey.disabled : theme.palette.text.offWhite,
          backgroundColor: theme.palette.background.paper,
          padding: '0 5px',
          fontFamily: 'IBM PLEX MONO',
          fontSize: '11px',
        },
        ...props.sx,
      }}
    >
      {title && (
        <Box
          style={{
            position: 'absolute',
            top: '-10px',
            left: '10px',
            color: disabled ? theme.palette.grey.disabled : theme.palette.text.offWhite,
            backgroundColor: theme.palette.background.paper,
            padding: '0 5px',
          }}
        >
          <Typography>{title}</Typography>
        </Box>
      )}
      {children}
    </Stack>
  );
}

export default BorderedStack;
