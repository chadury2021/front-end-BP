import React from 'react';

import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { CircularProgress, Stack, useTheme } from '@mui/material';

export function CancelOrderModal({
  open,
  setOpen,
  message,
  handleCancelAll,
  handleCancelFiltered,
  isPaginatedView,
  loadingAll = false,
  loadingFiltered = false,
}) {
  const theme = useTheme();
  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: 400,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 6,
    borderRadius: 3,
  };

  const buttonStyle = {
    width: 200,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 3,
  };

  const closeButtonStyle = {
    position: 'absolute',
    right: 8,
    top: 8,
  };

  return (
    <div>
      <Modal
        closeAfterTransition
        aria-describedby='transition-modal-description'
        aria-labelledby='transition-modal-title'
        open={open}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
        slots={{ backdrop: Backdrop }}
        onClose={() => setOpen(false)}
      >
        <Fade in={open}>
          <Stack alignItems='center' direction='column' sx={modalStyle}>
            <IconButton aria-label='close' sx={closeButtonStyle} onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
            <Box marginBottom='24px'>
              <Typography component='h2' fontWeight='400' id='transition-modal-title' variant='subtitle1'>
                {isPaginatedView
                  ? 'What orders would you like to cancel?'
                  : 'Are you sure you want to cancel all orders?'}
              </Typography>
            </Box>
            <Stack direction='row' justifyContent='space-between' spacing={2}>
              <Button
                color='primary'
                disabled={loadingAll}
                sx={buttonStyle}
                variant='contained'
                onClick={handleCancelAll}
              >
                {loadingAll ? (
                  <CircularProgress size={20} sx={{ color: theme.palette.text.grey }} />
                ) : (
                  <Typography color={theme.palette.text.offBlack}>Cancel All</Typography>
                )}
              </Button>
              {isPaginatedView && (
                <Button
                  color='primary'
                  disabled={loadingFiltered}
                  sx={buttonStyle}
                  variant='contained'
                  onClick={handleCancelFiltered}
                >
                  {loadingFiltered ? (
                    <CircularProgress size={20} sx={{ color: theme.palette.text.grey }} />
                  ) : (
                    <Typography color={theme.palette.text.offBlack}>Cancel Filtered Orders</Typography>
                  )}
                </Button>
              )}
            </Stack>
          </Stack>
        </Fade>
      </Modal>
    </div>
  );
}
