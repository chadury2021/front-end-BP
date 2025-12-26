import { resolveOrderOnWatch, resumeOrdersOnWatchBulk } from '@/apiServices';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  Button,
} from '@mui/material';
import React, { useEffect, useMemo, useRef } from 'react';

export default function ResumeOrdersDialog({
  open,
  ordersOnWatch,
  resumeCandidates,
  showToastMessage,
  onClearSelection,
  onClose,
  onRefreshWatchedOrders,
  onResumingChange,
}) {
  const hasStartedRef = useRef(false);
  const hasAutoClosedRef = useRef(false);

  const targetWatchIds = useMemo(() => resumeCandidates.map((record) => record.watch_id), [resumeCandidates]);

  const resumeDialogRecords = useMemo(
    () => ordersOnWatch.filter((watch) => targetWatchIds.includes(watch.watch_id)),
    [ordersOnWatch, targetWatchIds]
  );

  const resumeDialogCompletedCount = useMemo(
    () => Math.max(0, targetWatchIds.length - resumeDialogRecords.length),
    [targetWatchIds, resumeDialogRecords]
  );

  useEffect(() => {
    if (!open) {
      hasStartedRef.current = false;
      hasAutoClosedRef.current = false;
      return;
    }

    if (!resumeCandidates.length || hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    const runResume = async () => {
      const orderIds = Array.from(new Set(resumeCandidates.map((record) => record.order_id).filter(Boolean)));

      if (!orderIds.length) {
        showToastMessage?.({
          message: 'No valid order identifiers found for the selected paused orders',
          type: 'error',
          anchor: 'top-center',
        });
        onClose?.();
        return;
      }

      onResumingChange?.(true);
      try {
        const response = await resumeOrdersOnWatchBulk(orderIds);
        await onRefreshWatchedOrders?.();
        onClearSelection?.();
        // Auto-mark corresponding watch records as resolved
        try {
          await Promise.allSettled(targetWatchIds.map((watchId) => resolveOrderOnWatch(watchId)));
        } catch {
          // best-effort; failures will still be visible in the table
        }
        showToastMessage?.({
          message:
            response?.message || `Queued resume for ${orderIds.length} ${orderIds.length === 1 ? 'order' : 'orders'}`,
          type: 'success',
          anchor: 'top-center',
        });
      } catch (error) {
        showToastMessage?.({
          message: `Failed to resume selected orders: ${error.message}`,
          type: 'error',
          anchor: 'top-center',
        });
      } finally {
        onResumingChange?.(false);
      }
    };

    runResume();
  }, [open, resumeCandidates, showToastMessage, onClearSelection, onClose, onRefreshWatchedOrders, onResumingChange]);

  useEffect(() => {
    if (!open || !targetWatchIds.length || hasAutoClosedRef.current) {
      return;
    }

    // Auto-close once all target watched orders have disappeared from the watch list,
    // which implies they have transitioned out of the "on watch" state.
    if (resumeDialogCompletedCount >= targetWatchIds.length) {
      hasAutoClosedRef.current = true;
      onClose?.();
    }
  }, [open, resumeDialogCompletedCount, targetWatchIds.length, onClose]);

  const handleClose = () => {
    onClose?.();
  };

  const isBulkResuming = Boolean(resumeCandidates.length);

  return (
    <Dialog fullWidth maxWidth='sm' open={open} onClose={handleClose}>
      <DialogTitle sx={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', pr: 1 }}>
        <Typography fontWeight={600} variant='subtitle1'>
          Resuming {targetWatchIds.length} order{targetWatchIds.length === 1 ? '' : 's'}
        </Typography>
        <IconButton aria-label='close-resume-dialog' edge='end' size='small' onClick={handleClose}>
          <CloseIcon fontSize='small' />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 1.5 }}>
        <Stack spacing={1.5}>
          <Typography color='text.secondary' variant='body2'>
            Resumes are being processed in the background with staggered pacing. This view will update as orders move
            off watch or change status.
          </Typography>
          {isBulkResuming && <LinearProgress />}
          <Stack
            spacing={1}
            sx={{
              mt: 1,
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {resumeDialogRecords.map((watch) => (
              <Box
                key={watch.watch_id}
                sx={{
                  alignItems: 'center',
                  boxShadow: 1,
                  borderRadius: 3,
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'space-between',
                  px: 1.5,
                  py: 1,
                }}
              >
                <Stack spacing={0.25}>
                  <Typography fontSize='0.85rem' fontWeight={600}>
                    {watch.pair || 'Unknown pair'}
                  </Typography>
                  <Typography color='text.secondary' fontSize='0.75rem'>
                    Order {String(watch.order_id).slice(0, 8)} · Watch {String(watch.watch_id).slice(0, 8)}
                  </Typography>
                </Stack>
                <Stack alignItems='flex-end' spacing={0.5}>
                  <Chip
                    color={watch.current_status === 'PAUSED' ? 'warning' : 'success'}
                    label={watch.current_status || 'Queued'}
                    size='small'
                    variant='outlined'
                  />
                  {typeof watch.target_order_qty !== 'undefined' && (
                    <Typography color='text.secondary' fontSize='0.7rem'>
                      Target {watch.target_order_qty} {watch.target_token || ''}
                    </Typography>
                  )}
                </Stack>
              </Box>
            ))}
            {resumeDialogCompletedCount > 0 && (
              <Typography color='text.secondary' fontSize='0.75rem' sx={{ mt: 0.5 }}>
                {resumeDialogCompletedCount} order
                {resumeDialogCompletedCount === 1 ? '' : 's'} no longer appear on watch and are likely completed.
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button color='inherit' size='small' onClick={handleClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
