import dayjs from 'dayjs';
import { Autocomplete, Divider, Typography, TextField } from '@mui/material';
import { useAtom } from 'jotai';
import React, { useState } from 'react';
import { timezoneAtom, recentTimezoneAtom } from './hooks/useGlobalFormReducer';

const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

export const timezoneList = Intl.supportedValuesOf('timeZone');
export const formattedTimezoneList = timezoneList.map((tz) => {
  const now = dayjs();
  const offset = now.tz(tz).format('Z'); // Format as +HH:mm or -HH:mm
  return `${tz} UTC${offset}`;
});

export const initialFormattedTimeZone = `${dayjs.tz.guess()} UTC${dayjs().tz(dayjs.tz.guess()).format('Z')}`;

export const timeZoneNoOffset = (timeZone) => {
  if (timeZone !== null && timeZone !== undefined) {
    return timeZone.split(' ')[0];
  }
  return null;
};

export function TimezoneAutoComplete({ sx }) {
  const [timeZone, setTimeZone] = useAtom(timezoneAtom);
  const [recentTimeZones, setRecentTimeZones] = useAtom(recentTimezoneAtom);
  const [inputTimeZone, setInputTimeZone] = useState(timeZone);

  const updateRecentTimeZones = (selectedTimeZone) => {
    if (recentTimeZones.includes(selectedTimeZone) || selectedTimeZone === initialFormattedTimeZone) {
      return;
    }
    let updatedRecent = recentTimeZones.filter((zone) => zone !== selectedTimeZone);
    updatedRecent.unshift(selectedTimeZone);
    if (updatedRecent.length > 3) {
      updatedRecent = updatedRecent.slice(0, 3);
    }
    setRecentTimeZones(updatedRecent);
    sessionStorage.setItem('recentTimeZones', JSON.stringify(updatedRecent));
  };

  const divider = { isDivider: true };

  let options = [...recentTimeZones, initialFormattedTimeZone];
  if (recentTimeZones.length > 0) {
    options.push(divider);
  }
  options = options.concat(
    formattedTimezoneList.filter((zone) => !recentTimeZones.includes(zone) && zone !== initialFormattedTimeZone)
  );

  return (
    <Autocomplete
      disableClearable
      disablePortal
      getOptionLabel={(option) => (option.isDivider ? '' : option)}
      inputValue={inputTimeZone}
      options={options}
      renderInput={(params) => <TextField {...params} label='Timezone' />}
      renderOption={(props, option) => {
        const { key, ...restProps } = props;
        if (option.isDivider) {
          return (
            <div key={key} {...restProps} style={{ pointerEvents: 'none', width: '100%' }}>
              <Divider style={{ margin: '10px 0' }} />
              <Typography color='textSecondary' style={{ marginLeft: 10 }} variant='caption'>
                All Time Zones
              </Typography>
            </div>
          );
        }
        return (
          <li key={key} {...restProps}>
            {option}
          </li>
        );
      }}
      size='small'
      sx={sx}
      value={timeZone}
      onChange={(event, newValue) => {
        if (newValue !== null && newValue !== undefined) {
          setTimeZone(newValue);
          updateRecentTimeZones(newValue);
        }
      }}
      onInputChange={(event, newInputValue) => {
        setInputTimeZone(newInputValue);
      }}
    />
  );
}
