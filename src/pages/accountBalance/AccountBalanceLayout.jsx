import React from 'react';
import { Paper, SwipeableDrawer, IconButton, Stack, Box, useTheme } from '@mui/material';
import { Close } from '@mui/icons-material';
import Grid from '@mui/material/Unstable_Grid2';

export function AccountBalanceLayout({ leftPanel, children }) {
  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          width: '500px',
          minWidth: '500px',
          height: '100%',
          borderRight: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Paper elevation={0} sx={{ height: '100%', overflowY: 'auto', scrollbarGutter: 'stable' }}>
          {leftPanel}
        </Paper>
      </Box>
      <Box
        sx={{
          flex: 1,
          height: '100%',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <Paper elevation={0} sx={{ height: '100%', width: '100%', overflowY: 'auto', scrollbarGutter: 'stable' }}>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}

export function MobileAccountBalanceLayout({ leftPanel, children, isAccountSelected, onClose }) {
  const theme = useTheme();

  return (
    <>
      <Paper elevation={0} sx={{ height: '100%', width: '100%', overflowY: 'auto' }}>
        {leftPanel}
      </Paper>
      <SwipeableDrawer
        anchor='bottom'
        elevation={0}
        ModalProps={{ keepMounted: false }}
        open={isAccountSelected}
        PaperProps={{
          sx: {
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
        onClose={onClose}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            bgcolor: theme.palette.grey[900],
            p: 2,
            display: 'flex',
            justifyContent: 'end',
            zIndex: 2,
          }}
        >
          <IconButton onClick={onClose}>
            <Close fontSize='small' />
          </IconButton>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            px: 2,
          }}
        >
          <Box sx={{ width: '930px' }}>{children}</Box>
        </Box>
      </SwipeableDrawer>
    </>
  );
}
