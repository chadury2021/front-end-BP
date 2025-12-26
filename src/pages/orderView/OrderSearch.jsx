import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers';
import {
  Box,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Autocomplete,
} from '@mui/material';
import dayjs from 'dayjs';
import React from 'react';
import useViewport from '@/shared/hooks/useViewport';
import { titleCase } from '@/util';
import { ExchangeIcons } from '@/shared/iconUtil';

function OrderSearch({ searchParams, onSearchParamsChange, formData }) {
  const { isMobile } = useViewport();
  const RenderedDatePicker = isMobile ? MobileDatePicker : DatePicker;

  const handleDateChange = (value, field) => {
    const date = dayjs(value);
    if (date.isValid()) {
      onSearchParamsChange({ [field]: date.format('YYYY-MM-DD') });
    }
  };

  // Extract exchange name from account display name
  const getExchangeFromAccount = (account) => {
    if (!account || !account[1]) return null;
    const displayName = account[1];
    const exchangeMatch = displayName.match(/^([^-]+) - /);
    return exchangeMatch ? exchangeMatch[1] : null;
  };

  // Extract account name without exchange prefix
  const getAccountNameOnly = (account) => {
    if (!account || !account[1]) return '';
    const displayName = account[1];
    const accountMatch = displayName.match(/^[^-]+ - (.+)$/);
    return accountMatch ? accountMatch[1] : displayName;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        paddingX: 4,
        height: '80px',
        overflowX: 'auto',
        flexWrap: 'wrap',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        alignContent: 'center',
        justifyContent: !isMobile && 'center',
      }}
    >
      <Stack direction='row' spacing={2}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <RenderedDatePicker
            label='Date From'
            slotProps={{
              textField: { size: 'small' },
              field: {
                clearable: true,
                onClear: () => onSearchParamsChange({ dateFrom: undefined }),
              },
            }}
            sx={{ m: 1, width: 160 }}
            value={searchParams.dateFrom ? dayjs(searchParams.dateFrom) : null}
            onChange={(value) => handleDateChange(value, 'dateFrom')}
          />
          <RenderedDatePicker
            label='Date To'
            slotProps={{
              textField: { size: 'small' },
              field: {
                clearable: true,
                onClear: () => onSearchParamsChange({ dateTo: undefined }),
              },
            }}
            sx={{ m: 1, width: 160 }}
            value={searchParams.dateTo ? dayjs(searchParams.dateTo) : null}
            onChange={(value) => handleDateChange(value, 'dateTo')}
          />

          <FormControl size='small' sx={{ m: 1, minWidth: 200 }}>
            <Autocomplete
              getOptionLabel={(account) => account[1]}
              options={formData.accounts}
              renderInput={(params) => <TextField {...params} label='Account' size='small' />}
              renderOption={(props, account) => (
                <Box component="li" {...props}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <ExchangeIcons
                      exchanges={[getExchangeFromAccount(account)]}
                      pairId={account[0]}
                      style={{ height: '1rem', width: '1rem' }}
                    />
                    <span>{getAccountNameOnly(account)}</span>
                  </Box>
                </Box>
              )}
              onChange={(_, newValue) => onSearchParamsChange({ account_names: newValue?.[0] })}
            />
          </FormControl>

          <FormControl size='small' sx={{ m: 1, minWidth: 160 }}>
            <Autocomplete
              getOptionLabel={(option) => option}
              options={formData.pairs}
              renderInput={(params) => <TextField {...params} label='Pair' size='small' />}
              value={searchParams.pair}
              onChange={(_, newValue) => onSearchParamsChange({ pair: newValue })}
            />
          </FormControl>

          <FormControl size='small' sx={{ m: 1, minWidth: 80 }}>
            <InputLabel id='side'>Side</InputLabel>
            <Select
              id='side'
              label='Side'
              value={searchParams.side}
              onChange={(e) => onSearchParamsChange({ side: e.target.value })}
            >
              <MenuItem value='buy'>Buy</MenuItem>
              <MenuItem value='sell'>Sell</MenuItem>
            </Select>
          </FormControl>

          <FormControl size='small' sx={{ m: 1, minWidth: 200 }}>
            <Autocomplete
              getOptionLabel={(strategy) => strategy[1]}
              groupBy={(options) => options[2]}
              options={formData.strategies}
              renderInput={(params) => <TextField {...params} label='Strategy' size='small' />}
              value={searchParams.strategy}
              onChange={(_, newValue) => onSearchParamsChange({ strategy: newValue })}
            />
          </FormControl>

          <FormControl size='small' sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id='market-type'>Market Type</InputLabel>
            <Select
              multiple
              id='market-type'
              label='Market Type'
              renderValue={(selected) =>
                selected.map((value) => value.charAt(0).toUpperCase() + value.slice(1)).join(', ')
              }
              value={searchParams.marketTypes || []}
              onChange={(e) => onSearchParamsChange({ marketTypes: e.target.value })}
            >
              {formData.market_types.map((market_type) => (
                <MenuItem key={market_type} value={market_type}>
                  {titleCase(market_type)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </LocalizationProvider>
      </Stack>
    </Paper>
  );
}

export { OrderSearch };
