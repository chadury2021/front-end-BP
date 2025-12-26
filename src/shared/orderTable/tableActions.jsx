import { Tooltip, IconButton, useTheme } from '@mui/material';
import React, { useState, useContext } from 'react';
import CallMissedOutgoingIcon from '@mui/icons-material/CallMissedOutgoing';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import QueryStatsIcon from '@mui/icons-material/QueryStatsOutlined';
import ReplayIcon from '@mui/icons-material/Replay';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate } from 'react-router-dom';
import {
  ApiError,
  pauseMultiOrder,
  pauseOrder,
  pauseBatchOrder,
  resumeMultiOrder,
  resumeOrder,
  resumeBatchOrder,
  openInNewTab,
} from '@/apiServices';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { getOrderPath } from './util';
import { BASEURL } from '../../util';
import { useUserMetadata } from '../context/UserMetadataProvider';

const handlePause = async (id, orderType, showAlert, orderRefresh) => {
  try {
    if (orderType === 'Multi') {
      await pauseMultiOrder(id);
    } else if (orderType === 'Batch') {
      await pauseBatchOrder(id);
    } else {
      await pauseOrder(id);
    }
    showAlert({
      severity: 'success',
      message: 'Pause request submitted.',
    });
    orderRefresh(false);
  } catch (e) {
    if (e instanceof ApiError) {
      showAlert({ severity: 'error', message: e.message });
    } else {
      throw e;
    }
  }
};

const handleResume = async (id, orderType, showAlert, orderRefresh) => {
  try {
    if (orderType === 'Multi') {
      await resumeMultiOrder(id);
    } else if (orderType === 'Batch') {
      await resumeBatchOrder(id);
    } else {
      await resumeOrder(id);
    }
    showAlert({
      severity: 'success',
      message: 'Resume request submitted.',
    });
    orderRefresh(false);
  } catch (e) {
    if (e instanceof ApiError) {
      showAlert({ severity: 'error', message: e.message });
    } else {
      throw e;
    }
  }
};

export function ResubmitRemainingOrderButton({ disabled, onClick }) {
  const { maintenanceModeEnabled } = useUserMetadata();
  const [resubmitRemainingTooltipOpen, setResubmitRemainingTooltipOpen] = useState(false);

  const theme = useTheme();

  return (
    <Tooltip
      disableHoverListener
      open={resubmitRemainingTooltipOpen}
      placement='top'
      title={
        maintenanceModeEnabled
          ? 'Resubmit Remaining Order is disabled in maintenance mode.'
          : 'Resubmit Remaining Order'
      }
    >
      <span>
        <IconButton
          aria-label='resubmit_remaining'
          color='main.info2'
          disabled={disabled || maintenanceModeEnabled}
          size='small'
          sx={{
            marginRight: '3px',
            padding: '0',
            ':hover': {
              color: theme.palette.primary.main,
            },
          }}
          variant='contained'
          onClick={(event) => {
            onClick(event);
          }}
          onMouseEnter={() => setResubmitRemainingTooltipOpen(true)}
          onMouseLeave={() => setResubmitRemainingTooltipOpen(false)}
        >
          <CallMissedOutgoingIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function ResubmitOrderButton({ disabled, onClick }) {
  const { maintenanceModeEnabled } = useUserMetadata();
  const [resubmitTooltipOpen, setResubmitTooltipOpen] = useState(false);
  const theme = useTheme();

  return (
    <Tooltip
      disableHoverListener
      open={resubmitTooltipOpen}
      placement='top'
      title={maintenanceModeEnabled ? 'Resubmit is disabled in maintenance mode.' : 'Resubmit Order'}
    >
      <span>
        <IconButton
          aria-label='resubmit'
          color='main.info2'
          disabled={disabled || maintenanceModeEnabled}
          size='small'
          sx={{
            marginRight: '3px',
            padding: '0',
            ':hover': {
              color: theme.palette.primary.main,
            },
          }}
          variant='contained'
          onClick={(event) => {
            onClick(event);
          }}
          onMouseEnter={() => setResubmitTooltipOpen(true)}
          onMouseLeave={() => setResubmitTooltipOpen(false)}
        >
          <ReplayIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
export function ViewOrderButton({ orderRow, disabled = false, openInNewTabPreference = true }) {
  const [viewTooltipOpen, setViewTooltipOpen] = useState(false);

  const navigate = useNavigate();
  const theme = useTheme();

  const handleViewOrder = (order, { newTab = false } = {}) => {
    const url = getOrderPath(order);

    if (newTab) {
      openInNewTab(`${BASEURL}${url}`);
      return;
    }

    navigate(url);
  };

  return (
    <Tooltip disableHoverListener open={viewTooltipOpen} placement='top' title='View Order'>
      <span>
        <IconButton
          aria-label='view'
          color='main.info2'
          disabled={disabled}
          size='small'
          sx={{
            marginRight: '3px',
            padding: '0',
            ':hover': {
              color: theme.palette.primary.main,
            },
          }}
          variant='outlined'
          onAuxClick={(event) => {
            event.stopPropagation();
            handleViewOrder(orderRow, { newTab: true });
          }}
          onClick={(event) => {
            event.stopPropagation();
            handleViewOrder(orderRow, { newTab: openInNewTabPreference });
          }}
          onMouseEnter={() => setViewTooltipOpen(true)}
          onMouseLeave={() => setViewTooltipOpen(false)}
        >
          <QueryStatsIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function PauseOrderButton({ orderRow, orderType, orderRefresh }) {
  const [pauseTooltipOpen, setPauseTooltipOpen] = useState(false);
  const theme = useTheme();
  const { showAlert } = useContext(ErrorContext);

  return (
    <Tooltip disableHoverListener open={pauseTooltipOpen} placement='top' title='Pause Order'>
      <span>
        <IconButton
          aria-label='pause'
          color='main.info2'
          disabled={!['ACTIVE'].includes(orderRow.status) || (orderRow.is_simple && orderRow.strategy !== 'Iceberg')}
          size='small'
          sx={{
            marginRight: '3px',
            padding: '0',
            ':hover': {
              color: theme.palette.primary.main,
            },
          }}
          variant='contained'
          onClick={(event) => {
            event.stopPropagation();
            handlePause(orderRow.id, orderType, showAlert, orderRefresh);
          }}
          onMouseEnter={() => setPauseTooltipOpen(true)}
          onMouseLeave={() => setPauseTooltipOpen(false)}
        >
          <PauseCircleOutlineIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function ResumeOrderButton({ orderRow, orderType, orderRefresh }) {
  const { maintenanceModeEnabled } = useUserMetadata();
  const [resumeTooltipOpen, setResumeTooltipOpen] = useState(false);
  const { showAlert } = useContext(ErrorContext);
  const theme = useTheme();

  return (
    <Tooltip
      disableHoverListener
      open={resumeTooltipOpen}
      placement='top'
      title={maintenanceModeEnabled ? 'Resume is disabled in maintenance mode.' : 'Resume Order'}
    >
      <span>
        <IconButton
          aria-label='resume'
          color='main.info2'
          disabled={maintenanceModeEnabled}
          size='small'
          sx={{
            marginRight: '3px',
            padding: '0',
            ':hover': {
              color: theme.palette.primary.main,
            },
          }}
          variant='contained'
          onClick={(event) => {
            event.stopPropagation();
            handleResume(orderRow.id, orderType, showAlert, orderRefresh);
          }}
          onMouseEnter={() => setResumeTooltipOpen(true)}
          onMouseLeave={() => setResumeTooltipOpen(false)}
        >
          <PlayCircleOutlineIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function ShareOrderButton({ disabled, onClick }) {
  const [shareTooltipOpen, setShareTooltipOpen] = useState(false);
  const theme = useTheme();

  return (
    <Tooltip disableHoverListener open={shareTooltipOpen} placement='top' title='Share Order'>
      <span>
        <IconButton
          aria-label='share'
          disabled={disabled}
          size='small'
          sx={{
            marginRight: '3px',
            padding: '0',
            color: `${theme.palette.text.primary} !important`,
            '& .MuiSvgIcon-root': {
              color: `${theme.palette.text.primary} !important`,
            },
            ':hover': {
              color: `${theme.palette.primary.main} !important`,
              '& .MuiSvgIcon-root': {
                color: `${theme.palette.primary.main} !important`,
              },
            },
          }}
          variant='contained'
          onClick={(event) => {
            onClick(event);
          }}
          onMouseEnter={() => setShareTooltipOpen(true)}
          onMouseLeave={() => setShareTooltipOpen(false)}
        >
          <ShareIcon fontSize='inherit' />
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function CancelOrderButton({ disabled, onClick }) {
  const [cancelTooltipOpen, setCancelTooltipOpen] = useState(false);
  const theme = useTheme();

  return (
    <Tooltip disableHoverListener open={cancelTooltipOpen} title='Cancel Order'>
      <span>
        <IconButton
          aria-label='cancel'
          color='error'
          disabled={disabled}
          placement='top'
          size='small'
          sx={{
            padding: '0',
          }}
          variant='contained'
          onClick={(event) => {
            onClick(event);
          }}
          onMouseEnter={() => setCancelTooltipOpen(true)}
          onMouseLeave={() => setCancelTooltipOpen(false)}
        >
          <HighlightOffIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
