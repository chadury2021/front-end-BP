import React from 'react';

import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { Stack } from '@mui/material';

export function BasicModal({ open, setOpen, message, handleConfirm, confirmButtonText }) {
  const theme = useTheme();

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: 400,
    backgroundColor: `${theme.palette.common.pureBlack}99`, // 60% opacity
    backdropFilter: 'blur(10px)',
    boxShadow: 24,
    p: 8,
    borderRadius: 3,
  };

  const buttonStyle = {
    width: 70,
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
            <Box marginY='16px'>
              <Typography component='h2' fontWeight='400' id='transition-modal-title' variant='subtitle1'>
                {message}
              </Typography>
            </Box>
            <Button color='primary' sx={buttonStyle} variant='contained' onClick={handleConfirm}>
              <Typography color='var(--text-primary)'>{confirmButtonText}</Typography>
            </Button>
          </Stack>
        </Fade>
      </Modal>
    </div>
  );
}
