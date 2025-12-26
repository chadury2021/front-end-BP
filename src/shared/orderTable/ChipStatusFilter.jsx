import { useTheme } from '@emotion/react';
import { Box, Button, Divider, Typography, Tooltip, Checkbox, FormControlLabel } from '@mui/material';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { useContext, useState, useEffect } from 'react';
import { isEmpty } from '@/util';
import { prepareSearchParams } from '@/shared/hooks/useOrderSearch';
import {
  cancelAllOrders,
  cancelOrdersWithParams,
  pauseAllOrders,
  resumeAllOrders,
  resumeOrder,
} from '../../apiServices';
import { ErrorContext } from '../context/ErrorProvider';
import { BasicModal } from '../Modal';
import { CancelOrderModal } from './CancelOrderModal';

export default function ChipStatusFilter({
  typeFilter,
  statusHighlight,
  dashboardView = false,
  setStatusHighlight,
  setTypeFilter,
  loadOrders = undefined,
  optionsView = false,
  paginationView = false,
  selectedPair,
  setPairFilter,
  pairFilter,
  isDev,
  isSuperUser,
  disabled = false,
  onClickTypeChipCallback = () => {},
  searchParams,
}) {
  const { showAlert } = useContext(ErrorContext);
  const theme = useTheme();

  const [cancelAllModalOpen, setCancelAllModalOpen] = useState(false);
  const [pauseAllModalOpen, setPauseAllModalOpen] = useState(false);
  const [resumeAllModalOpen, setResumeAllModalOpen] = useState(false);
  const [cancelAllLoading, setCancelAllLoading] = useState(false);
  const [cancelFilteredLoading, setCancelFilteredLoading] = useState(false);

  const handleCancelAllConfirm = async () => {
    setCancelAllLoading(true);
    try {
      const response = await cancelAllOrders();
      showAlert({ message: response.message, severity: 'success' });
      if (loadOrders) {
        await loadOrders();
      }
      setCancelAllModalOpen(false);
    } catch (e) {
      showAlert({ message: e.message, severity: 'error' });
    } finally {
      setCancelAllLoading(false);
    }
  };

  const handlePauseAllConfirm = async () => {
    setPauseAllModalOpen(false);
    try {
      const response = await pauseAllOrders();
      showAlert({ message: response.message, severity: 'success' });
      if (loadOrders) {
        await loadOrders();
      }
    } catch (e) {
      showAlert({ message: e.message, severity: 'error' });
    }
  };

  const handleResumeAllConfirm = async () => {
    setResumeAllModalOpen(false);
    try {
      const response = await resumeAllOrders();
      showAlert({ message: response.message, severity: 'success' });
      if (loadOrders) {
        await loadOrders();
      }
    } catch (e) {
      showAlert({ message: e.message, severity: 'error' });
    }
  };

  const handleStatusFilter = (statusType) => {
    onClickTypeChipCallback();

    if (statusHighlight.includes(statusType)) {
      // Remove the status from the array (uncheck)
      setStatusHighlight(statusHighlight.filter((status) => status !== statusType));
    } else {
      // Add the status to the array (check)
      setStatusHighlight([...statusHighlight, statusType]);
    }
  };

  const handleTypeFilter = (type) => {
    onClickTypeChipCallback();

    if (typeFilter.includes(type)) {
      if (paginationView) {
        return;
      }
      setTypeFilter([]);
    } else {
      setTypeFilter([type]);
    }
  };

  const handleCancelFilteredConfirm = async () => {
    setCancelFilteredLoading(true);
    try {
      const response = await cancelOrdersWithParams(prepareSearchParams(searchParams));
      showAlert({ message: response.message, severity: 'success' });
      if (loadOrders) {
        await loadOrders();
      }
      setCancelAllModalOpen(false);
    } catch (e) {
      showAlert({ message: e.message, severity: 'error' });
    } finally {
      setCancelFilteredLoading(false);
    }
  };

  const chipSxProps = {
    borderRadius: '3px',
    minWidth: '80px',
    fontSize: '0.7rem',
  };

  const multiChainedToggle = (type) => {
    if (type) {
      return type === 'MULTI' || type === 'CHAINED';
    }
    return false;
  };

  return (
    <>
      <Stack
        alignItems='center'
        direction='row'
        justifyContent='space-between'
        spacing={2}
        style={{
          overflowX: 'auto',
        }}
      >
        {/* Left: Chips/Filters */}
        <Stack direction='row' spacing={2} style={{ overflowX: 'auto', minWidth: '50px' }}>
          <Chip
            color={statusHighlight.length > 0 && statusHighlight.includes('ACTIVE') ? 'primary' : 'info'}
            disabled={disabled}
            label='Active'
            sx={{
              ...chipSxProps,
              ...(statusHighlight.length > 0 &&
                statusHighlight.includes('ACTIVE') && {
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                }),
            }}
            variant='outlined'
            onClick={() => handleStatusFilter('ACTIVE')}
          />
          <Chip
            color={statusHighlight.length > 0 && statusHighlight.includes('CANCELED') ? 'primary' : 'info'}
            disabled={disabled}
            label='Canceled'
            sx={{
              ...chipSxProps,
              ...(statusHighlight.length > 0 &&
                statusHighlight.includes('CANCELED') && {
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                }),
            }}
            variant='outlined'
            onClick={() => handleStatusFilter('CANCELED')}
          />
          <Chip
            color={statusHighlight.length > 0 && statusHighlight.includes('COMPLETE') ? 'primary' : 'info'}
            disabled={disabled}
            label='Finished'
            sx={{
              ...chipSxProps,
              ...(statusHighlight.length > 0 &&
                statusHighlight.includes('COMPLETE') && {
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                }),
            }}
            variant='outlined'
            onClick={() => handleStatusFilter('COMPLETE')}
          />
          <Chip
            color={statusHighlight.length > 0 && statusHighlight.includes('SCHEDULED') ? 'primary' : 'info'}
            disabled={disabled}
            label='Scheduled'
            sx={{
              ...chipSxProps,
              ...(statusHighlight.length > 0 &&
                statusHighlight.includes('SCHEDULED') && {
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                }),
            }}
            variant='outlined'
            onClick={() => handleStatusFilter('SCHEDULED')}
          />
          <Chip
            color={statusHighlight.length > 0 && statusHighlight.includes('PAUSED') ? 'primary' : 'info'}
            disabled={disabled}
            label='Paused'
            sx={{
              ...chipSxProps,
              ...(statusHighlight.length > 0 &&
                statusHighlight.includes('PAUSED') && {
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                }),
            }}
            variant='outlined'
            onClick={() => handleStatusFilter('PAUSED')}
          />
          <Chip
            color={statusHighlight.length > 0 && statusHighlight.includes('CONDITIONAL') ? 'primary' : 'info'}
            disabled={disabled}
            label='Conditional'
            sx={{
              ...chipSxProps,
              ...(statusHighlight.length > 0 &&
                statusHighlight.includes('CONDITIONAL') && {
                  color: theme.palette.primary.main,
                  borderColor: theme.palette.primary.main,
                }),
            }}
            variant='outlined'
            onClick={() => handleStatusFilter('CONDITIONAL')}
          />
          {!optionsView && !dashboardView && (
            <>
              <Divider orientation='vertical' style={{ height: 'auto' }} variant='middle' />
              <Chip
                color={typeFilter.length > 0 && typeFilter.includes('SINGLE') ? 'primary' : 'info'}
                disabled={disabled}
                label='Single'
                sx={chipSxProps}
                variant='outlined'
                onClick={() => handleTypeFilter('SINGLE')}
              />
              <Chip
                color={typeFilter.length > 0 && typeFilter.includes('MULTI') ? 'primary' : 'info'}
                disabled={disabled}
                label='Multi'
                sx={chipSxProps}
                variant='outlined'
                onClick={() => handleTypeFilter('MULTI')}
              />
              <Chip
                color={typeFilter.length > 0 && typeFilter.includes('CHAINED') ? 'primary' : 'info'}
                disabled={disabled}
                label='Chained'
                sx={chipSxProps}
                variant='outlined'
                onClick={() => handleTypeFilter('CHAINED')}
              />
              <Chip
                color={typeFilter.length > 0 && typeFilter.includes('BATCH') ? 'primary' : 'info'}
                disabled={disabled}
                label='Batch'
                sx={chipSxProps}
                variant='outlined'
                onClick={() => handleTypeFilter('BATCH')}
              />
            </>
          )}
        </Stack>
        {/* Right: Action Buttons */}
        <Stack alignItems='center' direction='row' justifyContent='flex-end' spacing={1}>
          {isSuperUser && (
            <>
              <Button
                color='info'
                sx={{
                  height: '30px',
                  whiteSpace: 'nowrap',
                }}
                variant='text'
                onClick={() => setResumeAllModalOpen(true)}
              >
                Resume All
              </Button>
              <Divider orientation='vertical' style={{ height: '30px' }} />
            </>
          )}
          {isSuperUser && (
            <>
              <Button
                color='warning'
                sx={{
                  height: '30px',
                  whiteSpace: 'nowrap',
                }}
                variant='text'
                onClick={() => setPauseAllModalOpen(true)}
              >
                Pause All
              </Button>
              <Divider orientation='vertical' style={{ height: '30px' }} />
            </>
          )}
          {!optionsView && dashboardView && (
            <>
              <Divider orientation='vertical' style={{ height: '30px' }} />
              <Tooltip
                arrow
                title={
                  selectedPair && selectedPair.chain_id !== undefined
                    ? 'DEX token filtering is not available due to dynamic pairing'
                    : ''
                }
              >
                <span>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={pairFilter}
                        disabled={!selectedPair || disabled || (selectedPair && selectedPair.chain_id !== undefined)}
                        sx={{
                          color: pairFilter ? theme.palette.primary.main : theme.palette.text.secondary,
                          '&.Mui-checked': {
                            color: theme.palette.primary.main,
                          },
                          padding: '4px',
                        }}
                        onChange={() => setPairFilter(!pairFilter)}
                      />
                    }
                    label='Current pair'
                    sx={{
                      color: pairFilter ? theme.palette.primary.main : theme.palette.text.secondary,
                      alignItems: 'center',
                      margin: 0,
                      paddingRight: '8px',
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.7rem',
                        color: pairFilter ? theme.palette.primary.main : theme.palette.text.secondary,
                        marginLeft: '4px',
                      },
                    }}
                  />
                </span>
              </Tooltip>
            </>
          )}
          <Divider orientation='vertical' style={{ height: '30px' }} />
          <Button
            color='error'
            disabled={disabled}
            sx={{
              height: '30px',
              whiteSpace: 'nowrap',
            }}
            variant='text'
            onClick={() => setCancelAllModalOpen(true)}
          >
            Cancel All
          </Button>
        </Stack>
      </Stack>
      <BasicModal
        confirmButtonText='Yes'
        handleConfirm={handleResumeAllConfirm}
        message='Are you sure you want to resume all paused orders?'
        open={resumeAllModalOpen}
        setOpen={setResumeAllModalOpen}
      />
      <BasicModal
        confirmButtonText='Yes'
        handleConfirm={handlePauseAllConfirm}
        message='Are you sure you want to pause all active orders?'
        open={pauseAllModalOpen}
        setOpen={setPauseAllModalOpen}
      />
      <CancelOrderModal
        confirmButtonText='Yes'
        handleCancelAll={handleCancelAllConfirm}
        handleCancelFiltered={handleCancelFilteredConfirm}
        isPaginatedView={paginationView}
        loadingAll={cancelAllLoading}
        loadingFiltered={cancelFilteredLoading}
        open={cancelAllModalOpen}
        setOpen={setCancelAllModalOpen}
      />
    </>
  );
}
