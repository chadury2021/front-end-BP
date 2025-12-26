import {
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PauseCircleOutlineOutlinedIcon from '@mui/icons-material/PauseCircleOutlineOutlined';
import PlayCircleOutlineOutlinedIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { useUserMetadata } from '../../../../shared/context/UserMetadataProvider';

const buttonColor = (isDisabled) => {
  return isDisabled ? 'text.disabled' : 'primary';
};

export function AmendButton({ status, setAmendDialogOpen, parentOrder }) {
  const { isDev } = useUserMetadata();
  const amendDisabledTooltipMessage = () => {
    if (status === 'COMPLETE' || status === 'CANCELED') {
      return 'Order has terminated.';
    }

    if (parentOrder) {
      return 'Cannot amend child orders.';
    }

    return '';
  };

  // easier testing in dev
  const isDisabled = status === 'COMPLETE' || status === 'CANCELED' || (!!parentOrder && !isDev);

  return (
    <Tooltip title={amendDisabledTooltipMessage()}>
      <Box width='25%'>
        <Button
          fullWidth
          aria-label='amend'
          color='primary'
          disabled={isDisabled}
          size='small'
          startIcon={<EditOutlinedIcon />}
          variant='text'
          onClick={(event) => {
            event.stopPropagation();
            setAmendDialogOpen(true);
          }}
        >
          <Typography color={buttonColor(isDisabled)} variant='button1'>
            Amend
          </Typography>
        </Button>
      </Box>
    </Tooltip>
  );
}

const pauseDisabledTooltipMessage = (
  isPauseDisabled,
  isOOLPaused,
  status,
  super_strategy_name,
  parent_order,
  allowPauseWhenCanceled,
  maintenanceModeEnabled
) => {
  if (!isPauseDisabled) {
    return '';
  }

  if (isOOLPaused) {
    return 'Resume is disabled because order is OOL. The order will automatically resume when the market price is within range.';
  }

  if (status === 'COMPLETE' || (status === 'CANCELED' && !allowPauseWhenCanceled)) {
    return 'Order has terminated.';
  }

  if (super_strategy_name === 'Target Time') {
    return 'Cannot pause orders with Target Time strategy.';
  }

  if (parent_order) {
    return 'Please pause from parent order page.';
  }

  if (maintenanceModeEnabled) {
    return 'Pause is disabled in maintenance mode.';
  }

  return '';
};

const renderPauseResumeText = (isPaused, isPauseDisabled) =>
  isPaused ? (
    <Typography color={buttonColor(isPauseDisabled)} variant='button1'>
      Resume{' '}
    </Typography>
  ) : (
    <Typography color={buttonColor(isPauseDisabled)} variant='button1'>
      Pause
    </Typography>
  );

export function PauseResumeButton({
  status,
  isPaused,
  isOOLPaused,
  parent_order,
  super_strategy_name,
  setHandleConfirm,
  setConfirmModalText,
  setConfirmModalOpen,
  handlePause,
  handleResume,
  maintenanceModeEnabled,
  allowPauseWhenCanceled = false,
}) {
  const isPauseDisabled =
    isOOLPaused ||
    status === 'COMPLETE' ||
    (status === 'CANCELED' && !allowPauseWhenCanceled) ||
    super_strategy_name === 'Target Time' ||
    !!parent_order ||
    maintenanceModeEnabled;
  return (
    <Tooltip
      title={pauseDisabledTooltipMessage(
        isPauseDisabled,
        isOOLPaused,
        status,
        super_strategy_name,
        parent_order,
        allowPauseWhenCanceled,
        maintenanceModeEnabled
      )}
    >
      <Box sx={{ width: '25%' }}>
        <Button
          fullWidth
          aria-label='pause'
          color='primary'
          disabled={isPauseDisabled}
          size='small'
          startIcon={isPaused ? <PlayCircleOutlineOutlinedIcon /> : <PauseCircleOutlineOutlinedIcon />}
          variant='text'
          onClick={(event) => {
            event.stopPropagation();
            setHandleConfirm(() => (isPaused ? handleResume : handlePause));
            setConfirmModalText(`Are you sure you want to ${isPaused ? 'resume' : 'pause'} this order?`);
            setConfirmModalOpen(true);
          }}
        >
          {renderPauseResumeText(isPaused, isPauseDisabled)}
        </Button>
      </Box>
    </Tooltip>
  );
}

const cancelDisabledTooltipMessage = (status, parentOrder) => {
  if (status === 'COMPLETE' || status === 'CANCELED') {
    return 'Order has terminated.';
  }

  if (parentOrder) {
    return 'Cannot cancel child orders.';
  }

  return '';
};

export function CancelButton({
  status,
  setHandleConfirm,
  setConfirmModalText,
  setConfirmModalOpen,
  handleCancel,
  parentOrder,
}) {
  const isCancelDisabled = status === 'COMPLETE' || status === 'CANCELED' || !!parentOrder;

  return (
    <Tooltip title={cancelDisabledTooltipMessage(status, parentOrder)}>
      <Box sx={{ width: '25%' }}>
        <Button
          fullWidth
          aria-label='cancel'
          color='primary'
          disabled={isCancelDisabled}
          size='small'
          startIcon={<CancelOutlinedIcon />}
          variant='text'
          onClick={(event) => {
            event.stopPropagation();
            setConfirmModalText('Are you sure you want to cancel this order?');
            setHandleConfirm(() => handleCancel);
            setConfirmModalOpen(true);
          }}
        >
          <Typography color={buttonColor(isCancelDisabled)} variant='button1'>
            Cancel
          </Typography>
        </Button>
      </Box>
    </Tooltip>
  );
}

export function ResubmitButton({ handleResubmit, handleResubmitRemaining, maintenanceModeEnabled }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isDisabled = maintenanceModeEnabled;

  return (
    <Tooltip title={isDisabled ? 'Resubmit is disabled in maintenance mode.' : ''}>
      <Box sx={{ width: '25%' }}>
        <Button
          fullWidth
          aria-label='resubmit_order_action'
          color='primary'
          disabled={isDisabled}
          size='small'
          startIcon={<ReplayOutlinedIcon />}
          variant='text'
          onClick={(event) => {
            event.stopPropagation();
            setAnchorEl(event.currentTarget);
          }}
        >
          <Typography color={buttonColor(isDisabled)} variant='button1'>
            Resubmit
          </Typography>
        </Button>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
          <MenuItem
            onClick={() => {
              handleResubmitRemaining();
              handleClose();
            }}
          >
            <Typography variant='button1'>Resubmit Remaining Order</Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleResubmit();
              handleClose();
            }}
          >
            <Typography variant='button1'>Resubmit Entire Order</Typography>
          </MenuItem>
        </Menu>
      </Box>
    </Tooltip>
  );
}

export function ChangeSpreadButton({
  status,
  guaranteePnl,
  marketMaker,
  onSelectSpread,
  spreadOptions,
  maintenanceModeEnabled,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const isDisabled =
    maintenanceModeEnabled || guaranteePnl || !marketMaker || status === 'COMPLETE' || status === 'CANCELED';

  const handleClose = () => setAnchorEl(null);
  let tooltipMessage = '';
  if (isDisabled) {
    if (guaranteePnl) {
      tooltipMessage = 'Disable grid mode before changing spread.';
    } else if (!marketMaker) {
      tooltipMessage = 'Spread changes are only available for market maker orders.';
    } else if (status === 'COMPLETE' || status === 'CANCELED') {
      tooltipMessage = 'Order has terminated.';
    } else if (maintenanceModeEnabled) {
      tooltipMessage = 'Disabled in maintenance mode.';
    }
  }

  return (
    <Tooltip title={tooltipMessage}>
      <Box sx={{ width: '25%' }}>
        <Button
          fullWidth
          aria-label='change-spread'
          color='primary'
          disabled={isDisabled}
          size='small'
          startIcon={<TuneOutlinedIcon />}
          variant='text'
          onClick={(event) => {
            event.stopPropagation();
            setAnchorEl(event.currentTarget);
          }}
        >
          <Typography color={buttonColor(isDisabled)} variant='button1'>
            Change Spread
          </Typography>
        </Button>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
          {(spreadOptions || []).map((option) => (
            <MenuItem
              key={option}
              onClick={() => {
                handleClose();
                onSelectSpread?.(option);
              }}
            >
              <Typography variant='button1'>{`${option} bps`}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Tooltip>
  );
}

export function GridAndSpreadButton({
  status,
  marketMaker,
  maintenanceModeEnabled,
  initialReferencePrice = 'mid',
  initialReferenceExchange,
  initialSpreadBps,
  availableExchanges = [],
  onApply,
}) {
  const { isDev } = useUserMetadata();
  const [anchorEl, setAnchorEl] = useState(null);
  const [referencePrice, setReferencePrice] = useState(initialReferencePrice);
  const [referenceExchange, setReferenceExchange] = useState(
    initialReferenceExchange || availableExchanges[0] || 'Binance'
  );
  const computeInitialSpread = (refPrice, spread) => {
    if (spread != null) return spread;
    return 0;
  };
  const [spreadBps, setSpreadBps] = useState(computeInitialSpread(referencePrice, initialSpreadBps));

  const isTerminated = status === 'COMPLETE' || status === 'CANCELED';
  const isDisabled = maintenanceModeEnabled || !marketMaker || isTerminated;

  const handleClose = () => setAnchorEl(null);

  let tooltipMessage = '';
  if (isDisabled) {
    if (!marketMaker) {
      tooltipMessage = 'Available only for market maker orders.';
    } else if (isTerminated) {
      tooltipMessage = 'Order has terminated.';
    } else if (maintenanceModeEnabled) {
      tooltipMessage = 'Disabled in maintenance mode.';
    }
  }

  const getSpreadOptions = (refPrice) => {
    if (refPrice === 'grid') return [-10, -1, 0, 5, 10];
    if (refPrice === 'other_exchange') return [0, 1, -1];
    return [0, 1, 2, 5, 10];
  };

  const handleOpen = (event) => {
    // Reset menu state to latest props when opened
    setReferencePrice(initialReferencePrice);
    setReferenceExchange(initialReferenceExchange || availableExchanges[0] || 'Binance');
    setSpreadBps(computeInitialSpread(initialReferencePrice, initialSpreadBps));
    setAnchorEl(event.currentTarget);
  };

  const handleApply = () => {
    if (onApply) {
      onApply({
        referencePrice,
        referenceExchange,
        spreadBps,
      });
    }
    setAnchorEl(null);
  };

  const spreadOptions = getSpreadOptions(referencePrice);

  return (
    <Tooltip title={tooltipMessage}>
      <Box sx={{ width: '25%' }}>
        <Button
          fullWidth
          aria-label='grid-spread'
          color='primary'
          disabled={isDisabled}
          size='small'
          startIcon={<TuneOutlinedIcon />}
          variant='text'
          onClick={(event) => {
            event.stopPropagation();
            handleOpen(event);
          }}
        >
          <Typography color={buttonColor(isDisabled)} variant='button1'>
            Mode
          </Typography>
        </Button>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
          <Box sx={{ p: 2, width: 280 }}>
            <Stack direction='column' spacing={1.5}>
              <Box>
                <Typography color='text.secondary' variant='caption'>
                  Reference Price
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size='small'
                  value={referencePrice}
                  onChange={(_, val) => {
                    if (!val) return;
                    setReferencePrice(val);
                    const nextSpreads = getSpreadOptions(val);
                    if (!nextSpreads.includes(spreadBps)) {
                      setSpreadBps(nextSpreads[0]);
                    }
                  }}
                >
                  <ToggleButton value='mid'>
                    <Typography variant='button2'>Mid Price</Typography>
                  </ToggleButton>
                  <ToggleButton value='grid'>
                    <Typography variant='button2'>Grid</Typography>
                  </ToggleButton>
                  {isDev && (
                    <ToggleButton value='other_exchange'>
                      <Typography variant='button2'>Other Exch</Typography>
                    </ToggleButton>
                  )}
                </ToggleButtonGroup>
              </Box>

              {referencePrice === 'other_exchange' && (
                <TextField
                  fullWidth
                  select
                  label='Exchange'
                  size='small'
                  value={referenceExchange}
                  onChange={(e) => setReferenceExchange(e.target.value)}
                >
                  {[...new Set([...availableExchanges, referenceExchange || 'Binance'])].map((ex) => (
                    <MenuItem key={ex} value={ex}>
                      {ex}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <Box>
                <Typography color='text.secondary' variant='caption'>
                  Spread
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size='small'
                  value={spreadBps}
                  onChange={(_, val) => val != null && setSpreadBps(val)}
                >
                  {spreadOptions.map((option) => {
                    const label = option > 0 ? `+${option}` : `${option}`;
                    const color = (() => {
                      if (option > 0) return 'success.main';
                      if (option < 0) return 'error.main';
                      return 'text.primary';
                    })();
                    return (
                      <ToggleButton key={option} value={option}>
                        <Typography color={color} variant='button2'>{`${label} bps`}</Typography>
                      </ToggleButton>
                    );
                  })}
                </ToggleButtonGroup>
              </Box>
              <Divider />
              <Button fullWidth disabled={isDisabled} variant='contained' onClick={handleApply}>
                Apply
              </Button>
            </Stack>
          </Box>
        </Menu>
      </Box>
    </Tooltip>
  );
}
