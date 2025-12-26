import { Alert, Snackbar, Typography } from '@mui/material';
import React from 'react';

export function BasicSnackBar({ open, setOpen, content }) {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  return (
    <Snackbar autoHideDuration={10000} open={open} onClose={handleClose}>
      <Alert severity={content.severity} sx={{ width: '100%' }} onClose={() => setOpen(false)}>
        <Typography variant='subtitle1'>{content.message}</Typography>
      </Alert>
    </Snackbar>
  );
}
