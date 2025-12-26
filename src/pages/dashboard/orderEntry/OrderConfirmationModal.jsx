import React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Fade from '@mui/material/Fade';
import Modal from '@mui/material/Modal';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import useViewport from '@/shared/hooks/useViewport';
import { OrderConfirmation, MultiOrderConfirmation } from './OrderConfirmation';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '800px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 3,
};

export function ModalContainer({ open, setOpen, sx = {}, children }) {
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
        <Box sx={sxProp}>{children}</Box>
      </Fade>
    </Modal>
  );
}

export function MobileModalContainer({ open, setOpen, children }) {
  return (
    <SwipeableDrawer anchor='bottom' ModalProps={{ keepMounted: false }} open={open} onClose={() => setOpen(false)}>
      {children}
    </SwipeableDrawer>
  );
}
export function OrderConfirmationModal({ isSubmitted, props }) {
  const { data, handleConfirm, open, setOpen } = props;
  const { isMobile } = useViewport();

  const Wrapper = isMobile ? MobileModalContainer : ModalContainer;

  return (
    <Wrapper open={open} setOpen={setOpen}>
      <OrderConfirmation
        isSubmitted={isSubmitted}
        order={data}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </Wrapper>
  );
}

export function MultiOrderConfirmationModal({
  data,
  handleConfirm,
  handleEdit,
  mode = 'confirm',
  open,
  setOpen,
  submitLoading,
  confirmDisabled = false,
}) {
  const { isMobile } = useViewport();

  const Wrapper = isMobile ? MobileModalContainer : ModalContainer;
  return (
    <Wrapper open={open} setOpen={setOpen}>
      {open && data ? (
        <MultiOrderConfirmation
          confirmDisabled={confirmDisabled}
          data={data}
          mode={mode}
          submitLoading={submitLoading}
          onClose={() => setOpen(false)}
          onConfirm={handleConfirm}
          onEdit={handleEdit}
        />
      ) : (
        open && (
          <Box alignItems='center' display='flex' height='100%' justifyContent='center' sx={{ p: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )
      )}
    </Wrapper>
  );
}
