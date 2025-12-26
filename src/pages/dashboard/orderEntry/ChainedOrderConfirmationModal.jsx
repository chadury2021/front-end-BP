import React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import useViewport from '@/shared/hooks/useViewport';
import ChainedOrderConfirmation from './ChainedOrderConfirmation';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '800px',
  bgcolor: 'background.paper',
  backgroundColor: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(10px)',
  boxShadow: 24,
  borderRadius: 3,
};

export function ChainedOrderModalContainer({ open, setOpen, sx = {}, children }) {
  const sxProp = { ...modalStyle, ...sx };
  return (
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
        <Box display='flex' flexDirection='column' justifyContent='center' sx={sxProp}>
          {children}
        </Box>
      </Fade>
    </Modal>
  );
}

export function ChainedOrderMobileModalContainer({ open, setOpen, children }) {
  return (
    <SwipeableDrawer anchor='bottom' ModalProps={{ keepMounted: false }} open={open} onClose={() => setOpen(false)}>
      {children}
    </SwipeableDrawer>
  );
}

export function ChainedOrderConfirmationModal({ isSubmitted, props }) {
  const { chainedOrderData, handleConfirm, open, setOpen } = props;
  const { isMobile } = useViewport();

  const Wrapper = isMobile ? ChainedOrderMobileModalContainer : ChainedOrderModalContainer;

  return (
    <Wrapper open={open} setOpen={setOpen}>
      <ChainedOrderConfirmation
        chainedOrderData={chainedOrderData}
        isSubmitted={isSubmitted}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </Wrapper>
  );
}