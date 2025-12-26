import { Stack, Tooltip, Typography, Popover, Box, IconButton } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { useAtom } from 'jotai';
import { DateTime } from 'luxon';
import React, { useEffect, useRef, useState } from 'react';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { TimezoneAutoComplete, timeZoneNoOffset } from '../../../../shared/TimezoneUtil';
import { timezoneAtom } from '../../../../shared/hooks/useGlobalFormReducer';
import { useMarketDataContext } from '../MarketDataContext';
import AlgoNumberField from './AlgoNumberField';

const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

function DurationField({
  FormAtoms,
  isCalculatingDuration,
  selectedDuration,
  setSelectedDuration,
  setTimeStart = undefined,
  useMarketData = true,
  povTarget = null,
  inCollapsible = false,
}) {
  const [shouldWarnEvr, setShouldWarnEvr] = useState(false);
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [hasEditedWithPovTarget, setHasEditedWithPovTarget] = useState(false);
  const [isDurationFieldFocused, setIsDurationFieldFocused] = useState(false);
  const durationFieldWrapperRef = useRef(null);
  const [durationStartDate, setDurationStartDate] = useAtom(FormAtoms.durationStartTimeAtom);
  const [durationEndDate, setDurationEndDate] = useAtom(FormAtoms.durationEndTimeAtom);

  const [startDatePlaceholder, setStartDatePlaceholder] = useState(dayjs.utc().local().format('MM/DD/YYYY HH:mm'));
  const [endDatePlaceholder, setEndDatePlaceholder] = useState(
    dayjs.utc().local().add(selectedDuration, 'seconds').format('MM/DD/YYYY HH:mm')
  );

  const [timeZone] = useAtom(timezoneAtom);
  const [formPageType] = useAtom(FormAtoms.formPageType);

  const timeoutRef = useRef(null);
  const chainedOrderView = formPageType && formPageType === 'ChainedOrderPage';

  const { marketSummaryMetrics, reloading } = useMarketDataContext() || {};
  const checkAndSetDuration = (duration) => {
    if (useMarketData && (!marketSummaryMetrics || !marketSummaryMetrics?.evr || marketSummaryMetrics?.evr === null)) {
      setShouldWarnEvr(true);
    }
    setSelectedDuration(duration);
  };

  const handleStartDateChange = (value) => {
    if (!value) {
      return;
    }

    const currentTime = DateTime.local().setZone(timeZoneNoOffset(timeZone));

    let newDate = value;

    // adjust to next 5 minute interval
    if (value < currentTime) {
      const currentMinute = currentTime.minute;
      const nextFifthMinute = Math.ceil((currentMinute + 1) / 5) * 5;
      newDate = currentTime.set({
        minute: nextFifthMinute,
        second: 0,
        millisecond: 0,
      });
    }

    if (newDate && setTimeStart) {
      setTimeStart(newDate.toISO());
    }

    // display calculated end time
    setEndDatePlaceholder(
      DateTime.local()
        .setZone(timeZoneNoOffset(timeZone))
        .plus({ seconds: selectedDuration })
        .toFormat('MM/dd/yyyy HH:mm')
    );

    // 2 use case scenarios:
    // 1. if duration end date is not set, calculate it
    // 2. if duration end date is set, calculate duration
    if (!durationEndDate && selectedDuration) {
      setDurationEndDate(newDate.plus({ seconds: selectedDuration }));
    } else if (durationEndDate) {
      const duration = durationEndDate.diff(newDate, 'seconds').seconds;

      if (duration) checkAndSetDuration(duration);
    }

    setDurationStartDate(newDate);
  };

  const handleEndDateChange = (value) => {
    setDurationEndDate(value);

    if (durationStartDate && value) {
      const duration = value.diff(durationStartDate, 'seconds').seconds;
      checkAndSetDuration(duration);
    }
  };

  const handleDurationChange = (value) => {
    const durationSeconds = Number(value) * 60;
    checkAndSetDuration(value === '' ? null : durationSeconds);
    if (value && durationStartDate) {
      setDurationEndDate(durationStartDate.plus({ seconds: durationSeconds }));
    }

    // Show warning only if povTarget is set and user is manually changing duration
    // Only show if the field is currently focused (user is actively typing)
    if (povTarget && value && !inCollapsible && isDurationFieldFocused && durationFieldWrapperRef.current) {
      // Store reference to currently focused element
      const { activeElement } = document;

      setHasEditedWithPovTarget(true);
      setShowOverrideWarning(true);

      // Restore focus to the input after a brief delay to allow popover to render
      setTimeout(() => {
        if (activeElement && activeElement.focus) {
          activeElement.focus();
        }
      }, 10);

      // Auto-dismiss warning after 5 seconds
      setTimeout(() => {
        setShowOverrideWarning(false);
      }, 5000);
    }

    if (!isDurationFieldFocused) {
      setShowOverrideWarning(false);
      setHasEditedWithPovTarget(false);
    }
  };

  // handles updates on placeholders
  useEffect(() => {
    const updateCurrentTime = () => {
      const currentTime = DateTime.local().setZone(timeZoneNoOffset(timeZone));
      setStartDatePlaceholder(currentTime.toFormat('MM/dd/yyyy HH:mm'));
      if (selectedDuration) {
        setEndDatePlaceholder(currentTime.plus({ seconds: Number(selectedDuration) }).toFormat('MM/dd/yyyy HH:mm'));
      }
      timeoutRef.current = setTimeout(updateCurrentTime, 1000);
    };

    updateCurrentTime();
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [timeZone, selectedDuration]);

  return (
    <Stack direction='column' spacing={4} sx={{ paddingTop: '8px', paddingBottom: '8px' }}>
      <Stack direction='row' spacing={4} width='100%'>
        <Stack alignItems='center' direction='row' spacing={1} sx={{ width: chainedOrderView ? '100%' : '30%' }}>
          <div ref={durationFieldWrapperRef} style={{ width: '100%' }}>
            <AlgoNumberField
              InputProps={{
                step: 'any',
                endAdornment: (
                  <>
                    {isCalculatingDuration && (
                      <InputAdornment position='end'>
                        <CircularProgress size={20} sx={{ color: 'info.main' }} />
                      </InputAdornment>
                    )}
                    {shouldWarnEvr && (
                      <InputAdornment position='end'>
                        <Tooltip title='Duration estimate based on historical data only'>
                          <ErrorOutlinedIcon color='warning' fontSize='small' />
                        </Tooltip>
                      </InputAdornment>
                    )}
                    {povTarget && hasEditedWithPovTarget && (
                      <InputAdornment position='end'>
                        <Tooltip title='Duration overridden despite participation rate calculation'>
                          <WarningAmberIcon color='warning' fontSize='small' />
                        </Tooltip>
                      </InputAdornment>
                    )}
                  </>
                ),
              }}
              label={<TreadTooltip label='Duration (min)' variant='duration' />}
              value={selectedDuration !== null ? Math.max(selectedDuration / 60, 1).toFixed(0) : ''}
              onBlur={() => {
                setIsDurationFieldFocused(false);
                setShowOverrideWarning(false);
              }}
              onChange={(e) => handleDurationChange(e.target.value)}
              onFocus={() => setIsDurationFieldFocused(true)}
            />
          </div>
        </Stack>
        {!chainedOrderView && <TimezoneAutoComplete sx={{ width: '70%', minWidth: 140 }} />}
      </Stack>
      {!chainedOrderView && (
        <Stack direction='row' spacing={2} width='100%'>
          <LocalizationProvider dateAdapter={AdapterLuxon}>
            <DateTimePicker
              disablePast
              fullwidth
              ampm={false}
              label={`Time Start (${timeZoneNoOffset(timeZone)})`}
              slotProps={{
                textField: {
                  size: 'small',
                  inputProps: {
                    placeholder: startDatePlaceholder,
                    style: { textAlign: 'right', fontSize: '0.8rem' },
                  },
                  InputLabelProps: { shrink: true },
                },
                field: {
                  clearable: true,
                  onClear: () => setDurationStartDate(undefined),
                },
              }}
              sx={{ width: '50%' }}
              timezone={timeZoneNoOffset(timeZone)}
              value={durationStartDate}
              onChange={(value) => handleStartDateChange(value)}
            />
            <DateTimePicker
              disablePast
              fullwidth
              ampm={false}
              label={`Time End (${timeZoneNoOffset(timeZone)})`}
              slotProps={{
                textField: {
                  size: 'small',
                  inputProps: {
                    placeholder: endDatePlaceholder,
                    style: { textAlign: 'right', fontSize: '0.8rem' },
                  },
                  InputLabelProps: { shrink: true },
                },
                field: {
                  clearable: true,
                  onClear: () => setDurationEndDate(undefined),
                },
              }}
              sx={{ width: '50%' }}
              timezone={timeZoneNoOffset(timeZone)}
              value={durationEndDate || null}
              onChange={(value) => handleEndDateChange(value)}
            />
          </LocalizationProvider>
        </Stack>
      )}

      {/* Warning Popover for Duration Override */}
      <Popover
        disableAutoFocus
        disableEnforceFocus
        disableRestoreFocus
        anchorEl={durationFieldWrapperRef.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={showOverrideWarning}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        onClose={() => setShowOverrideWarning(false)}
      >
        <Box sx={{ p: 2, maxWidth: 400 }}>
          <Stack alignItems='flex-start' direction='row' spacing={1}>
            <WarningAmberIcon color='warning' fontSize='small' sx={{ mt: 0.5 }} />
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Typography variant='body1Strong'>Duration Override Not Recommended</Typography>
              <Typography color='text.secondary' variant='caption'>
                Duration is automatically calculated based on your participation rate target. Manual override may affect
                execution performance.
              </Typography>
            </Stack>
            <IconButton size='small' sx={{ ml: 1 }} onClick={() => setShowOverrideWarning(false)}>
              <CloseIcon fontSize='small' />
            </IconButton>
          </Stack>
        </Box>
      </Popover>
    </Stack>
  );
}

export default DurationField;
