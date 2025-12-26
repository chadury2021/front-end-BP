import React from 'react';
import { Container, InputAdornment, Stack, TextField } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { DateTimeField } from '@mui/x-date-pickers/DateTimeField';
import { useAtom } from 'jotai';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import AlgoNumberField from '../../../pages/dashboard/orderEntry/AlgoOrderFieldsComponents/AlgoNumberField';
import { noArrowStyle } from '../../../util';
import { TimezoneAutoComplete, timeZoneNoOffset } from '../../TimezoneUtil';
import { timezoneAtom } from '../../hooks/useGlobalFormReducer';

const timezone = require('dayjs/plugin/timezone');

dayjs.extend(timezone);
const timeZone = dayjs().tz(dayjs.tz.guess()).format('z');

export function TargetTimeView({
  selectedDuration,
  setSelectedDuration,
  targetTime,
  setTargetTime,
  isCalculatingDuration,
}) {
  const [timeZoneState] = useAtom(timezoneAtom);

  // Ensure targetTime is a valid DateTime object
  const isValidTargetTime = targetTime && typeof targetTime.setZone === 'function';

  const handleDateChange = (value) => {
    if (value !== null && typeof value.setZone === 'function') {
      setTargetTime(value.setZone(timeZoneNoOffset(timeZoneState)));
    }
  };

  const timeZoneFallback = timeZoneNoOffset(timeZoneState) || 'UTC';

  return (
    <Stack direction='column' spacing={2}>
      <TimezoneAutoComplete sx={{ width: '100%' }} />

      <LocalizationProvider dateAdapter={AdapterLuxon}>
        <Stack direction='row' spacing={2} width='100%'>
          <Container disableGutters>
            <DateTimeField
              ampm={false}
              format='MM/dd/yyyy HH:mm'
              label={`Target Time (${timeZoneNoOffset(timeZoneState)})`}
              name='targetTimeField'
              slotProps={{
                textField: {
                  size: 'small',
                },
                field: {
                  clearable: true,
                  onClear: () => setTargetTime(undefined),
                },
              }}
              sx={{ ...noArrowStyle, width: '100%' }}
              value={isValidTargetTime ? targetTime.setZone(timeZoneFallback) : null}
              views={['year', 'month', 'day', 'hours', 'minutes']}
              onChange={(value) => handleDateChange(value)}
            />
          </Container>

          <AlgoNumberField
            InputProps={{
              endAdornment: isCalculatingDuration && (
                <InputAdornment position='end'>
                  <CircularProgress size={20} sx={{ color: 'info.main' }} />
                </InputAdornment>
              ),
            }}
            label='Interval (minutes)'
            size='small'
            sx={{
              width: '30%',
            }}
            value={selectedDuration !== null ? Math.max(selectedDuration / 60, 1) / 2 : ''}
            onChange={(e) => {
              const { value } = e.target;
              setSelectedDuration(value === '' ? null : Number(value) * 60 * 2);
            }}
          />
        </Stack>
      </LocalizationProvider>
    </Stack>
  );
}
