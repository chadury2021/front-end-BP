import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAtom } from 'jotai';
import { ignoreScrollEvent, noArrowStyle, smartRound } from '../../../util';
import { NumericFormatCustom } from '../../../shared/fields/NumberFieldFormat';
import * as multiPageAtoms from '../hooks/multiOrderAtoms';
import { DashboardAccordianComponent } from '../../dashboard/orderEntry/util';

export default function DynamicLimitSpread({
  limitPriceSpread,
  setLimitPriceSpread,
  formState,
  isCollapsed,
  setIsCollapsed,
  formatAtom = multiPageAtoms.dynamicLimitBPSFormat,
}) {
  const [dynamicLimitBPSFormat, setDynamicLimitBPSFormat] = useAtom(formatAtom);

  const isOrderCommitted = (order) => {
    return order.accounts.length > 0 && order.pair && order.pair.id !== '';
  };

  const isReadyToPickLimitPrice =
    formState.buy.length === 1 &&
    formState.sell.length === 1 &&
    isOrderCommitted(formState.buy[0]) &&
    isOrderCommitted(formState.sell[0]);

  const buyPair = formState.buy.length > 0 && formState.buy[0].pair ? formState.buy[0].pair.id : 'Select Buy Pair';
  const buyPreviewPrice = formState.buy.length > 0 && formState.buy[0].pair ? formState.buy[0].pair.price : '';
  const sellPair = formState.sell.length > 0 && formState.sell[0].pair ? formState.sell[0].pair.id : 'Select Sell Pair';
  const sellPreviewPrice = formState.sell.length > 0 && formState.sell[0].pair ? formState.sell[0].pair.price : '';

  // Handle very small prices properly - use more precision for the display
  const buyPrice = Number(buyPreviewPrice);
  const sellPrice = Number(sellPreviewPrice);
  const calculatedSpread = smartRound(sellPrice - buyPrice, 10);
  const calculatedBps = buyPrice > 0 ? smartRound(((sellPrice - buyPrice) / buyPrice) * 10000, 4) : 0;

  return (
    <DashboardAccordianComponent
      isAlgo
      isOpen={!isCollapsed}
      setIsOpen={() => setIsCollapsed(!isCollapsed)}
      title='Dynamic Limit Spread'
    >
      <Stack spacing={2}>
        {/* New UI Component with Prices */}
        <Grid container alignItems='center' spacing={2}>
          <Grid item xs={3}>
            <Stack direction='column' justifyContent='center' sx={{ height: '100%', textAlign: 'right' }}>
              <Typography color={isReadyToPickLimitPrice ? 'success.main' : 'grey.main'} variant='body1'>
                {buyPair}
              </Typography>
              <Typography display={buyPreviewPrice ? 'block' : 'none'} variant='body2'>
                Price: {Number(smartRound(Number(buyPreviewPrice))).toLocaleString()}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={6}>
            <FormControl sx={{ width: '100%' }}>
              <TextField
                fullWidth
                autoComplete='off'
                disabled={!isReadyToPickLimitPrice}
                InputLabelProps={{
                  shrink: Boolean(limitPriceSpread && limitPriceSpread !== '0' && limitPriceSpread !== 0),
                  sx: {
                    color: 'var(--text-disabled)',
                    '&.Mui-focused': {
                      color: 'var(--text-primary)',
                    },
                    '&.MuiInputLabel-shrink': {
                      color: 'var(--text-primary)',
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Select
                        disabled={!isReadyToPickLimitPrice}
                        size='small'
                        sx={{
                          height: '24px',
                          '& .MuiSelect-select': {
                            padding: '0 8px',
                            minHeight: 'auto',
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                          },
                        }}
                        value={dynamicLimitBPSFormat ? 'bps' : '$'}
                        onChange={(e) => setDynamicLimitBPSFormat(e.target.value === 'bps')}
                      >
                        <MenuItem value='$'>$</MenuItem>
                        <MenuItem value='bps'>bps</MenuItem>
                      </Select>
                    </InputAdornment>
                  ),
                  step: 'any',
                  inputComponent: NumericFormatCustom,
                }}
                label='Minimum Spread Threshold'
                sx={{ ...noArrowStyle }}
                value={limitPriceSpread === '0' || limitPriceSpread === 0 ? '' : limitPriceSpread}
                onChange={(e) => setLimitPriceSpread(e.target.value)}
                onWheel={ignoreScrollEvent}
              />
            </FormControl>
          </Grid>
          <Grid item xs={3}>
            <Stack direction='column' justifyContent='center' sx={{ height: '100%', textAlign: 'left' }}>
              <Typography color={isReadyToPickLimitPrice ? 'error.main' : 'grey.main'} variant='body1'>
                {sellPair}
              </Typography>
              <Typography display={sellPreviewPrice ? 'block' : 'none'} variant='body2'>
                Price: {Number(smartRound(Number(sellPreviewPrice))).toLocaleString()}
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        {/* Current Spread Display */}
        <Typography
          color='var(--text-primary)'
          hidden={!isReadyToPickLimitPrice}
          sx={{ textAlign: 'center' }}
          variant='body2'
        >
          Current Spread: ${Number(calculatedSpread).toLocaleString()} | {Number(calculatedBps).toLocaleString()} bps
        </Typography>
      </Stack>
    </DashboardAccordianComponent>
  );
}
