import React, { useMemo } from 'react';
import { Grid, TextField, Slider, Typography, Box, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useAtom } from 'jotai';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { usePriceDataContext } from './PriceDataContext';
import BorderedStack from './AlgoOrderFieldsComponents/BorderedStack';

function ScaleOrdersFields({ FormAtoms }) {
  const theme = useTheme();
  // Base form context
  const { selectedAccounts, selectedPair, selectedSide, baseQty, quoteQty, selectedPairPrice } = useOrderForm();

  // Price data context for live price
  const { livePairPrice } = usePriceDataContext();

  // Scale atoms
  const [isScaleOrdersOpen] = useAtom(FormAtoms.isScaleOrdersOpenAtom);
  const [scaleOrderCount, setScaleOrderCount] = useAtom(FormAtoms.scaleOrderCountAtom);
  const [scaleFromPrice, setScaleFromPrice] = useAtom(FormAtoms.scaleFromPriceAtom);
  const [scaleToPrice, setScaleToPrice] = useAtom(FormAtoms.scaleToPriceAtom);
  const [scalePriceSkew, setScalePriceSkew] = useAtom(FormAtoms.scalePriceSkewAtom);
  const [scaleSizeSkew, setScaleSizeSkew] = useAtom(FormAtoms.scaleSizeSkewAtom);
  const [priceInputMode, setPriceInputMode] = useAtom(FormAtoms.scalePriceInputModeAtom);

  const isFormReady = useMemo(() => {
    return selectedAccounts && selectedAccounts.length > 0 && selectedPair;
  }, [selectedAccounts, selectedPair]);

  // Automatically infer qty mode from which field is filled in parent form
  const qtyMode = useMemo(() => {
    if (baseQty && !quoteQty) return 'base';
    if (quoteQty && !baseQty) return 'quote';
    // If both are filled, prefer base (or could show warning)
    if (baseQty && quoteQty) return 'base';
    return null; // Neither filled
  }, [baseQty, quoteQty]);

  // Get the current quantity from parent form based on inferred mode
  const currentQty = qtyMode === 'base' ? baseQty : quoteQty;

  // Get current market price
  const currentPrice = parseFloat(livePairPrice) || parseFloat(selectedPairPrice?.price) || 0;

  // Marketable price validation
  const isPriceMarketable = (price, isFromPrice = false) => {
    if (!price || !currentPrice || !selectedSide) return false;

    const numericPrice = parseFloat(price);
    if (Number.isNaN(numericPrice)) return false;

    if (priceInputMode === 'percentage') {
      // For percentage mode, calculate the actual price
      const percentage = numericPrice / 100;
      const actualPrice =
        selectedSide === 'buy'
          ? currentPrice * (1 - percentage) // Buy: subtract percentage from current price
          : currentPrice * (1 + percentage); // Sell: add percentage to current price

      return selectedSide === 'buy'
        ? actualPrice >= currentPrice // Buy: marketable if price >= current
        : actualPrice <= currentPrice; // Sell: marketable if price <= current
    }
    // For absolute mode, direct comparison
    return selectedSide === 'buy'
      ? numericPrice >= currentPrice // Buy: marketable if price >= current
      : numericPrice <= currentPrice; // Sell: marketable if price <= current
  };

  const isFromPriceMarketable = isPriceMarketable(scaleFromPrice, true);
  const isToPriceMarketable = isPriceMarketable(scaleToPrice, false);

  // Handle price input changes (numeric-only in UI)
  const handleFromPriceChange = (value) => {
    const numeric = String(value).replace(/[^0-9.]/g, '');
    setScaleFromPrice(numeric);
  };

  const handleToPriceChange = (value) => {
    const numeric = String(value).replace(/[^0-9.]/g, '');
    setScaleToPrice(numeric);
  };

  // Format display values for the input fields
  const getDisplayFromPrice = () => {
    return scaleFromPrice || '';
  };

  const getDisplayToPrice = () => {
    return scaleToPrice || '';
  };

  return (
    <Grid container spacing={0} sx={{ pl: 1, pb: 2, mt: 1 }}>
      <Grid item xs={12}>
        <BorderedStack spacing={0} sx={{ padding: '15px' }} title='Parameters'>
          {/* First row: From Price | To Price with Toggle - Force same line for mobile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
            <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
              <Tooltip arrow placement='top' title={isFromPriceMarketable ? 'Price is marketable' : ''}>
                <TextField
                  fullWidth
                  disabled={!isFormReady}
                  error={isFromPriceMarketable}
                  InputProps={{
                    inputProps: {
                      inputMode: 'decimal',
                    },
                    startAdornment:
                      priceInputMode === 'percentage' ? (
                        <Typography color='text.secondary' sx={{ mr: 0.5, fontSize: '0.75rem' }} variant='body2'>
                          {selectedSide === 'buy' ? '-' : '+'}
                        </Typography>
                      ) : (
                        <Typography color='text.secondary' sx={{ mr: 0.5, fontSize: '0.75rem' }} variant='body2'>
                          $
                        </Typography>
                      ),
                    endAdornment:
                      priceInputMode === 'percentage' ? (
                        <Typography color='text.secondary' sx={{ ml: 0.5, fontSize: '0.75rem' }} variant='body2'>
                          %
                        </Typography>
                      ) : null,
                  }}
                  label='From Price'
                  size='small'
                  type='number'
                  value={getDisplayFromPrice()}
                  onChange={(e) => handleFromPriceChange(e.target.value)}
                />
              </Tooltip>
            </Box>
            <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
              <Tooltip arrow placement='top' title={isToPriceMarketable ? 'Price is marketable' : ''}>
                <TextField
                  fullWidth
                  disabled={!isFormReady}
                  error={isToPriceMarketable}
                  InputProps={{
                    inputProps: {
                      inputMode: 'decimal',
                    },
                    startAdornment:
                      priceInputMode === 'percentage' ? (
                        <Typography color='text.secondary' sx={{ mr: 0.5, fontSize: '0.75rem' }} variant='body2'>
                          {selectedSide === 'buy' ? '-' : '+'}
                        </Typography>
                      ) : (
                        <Typography color='text.secondary' sx={{ ml: 0.5, fontSize: '0.75rem' }} variant='body2'>
                          $
                        </Typography>
                      ),
                    endAdornment:
                      priceInputMode === 'percentage' ? (
                        <Typography color='text.secondary' sx={{ ml: 0.5, fontSize: '0.75rem' }} variant='body2'>
                          %
                        </Typography>
                      ) : null,
                  }}
                  label='To Price'
                  size='small'
                  type='number'
                  value={getDisplayToPrice()}
                  onChange={(e) => handleToPriceChange(e.target.value)}
                />
              </Tooltip>
            </Box>
            <Box sx={{ flex: '0 0 auto', minWidth: 'fit-content' }}>
              <ToggleButtonGroup
                exclusive
                size='small'
                value={priceInputMode}
                onChange={(_, newValue) => {
                  if (newValue !== null) {
                    setPriceInputMode(newValue);
                    // Clear existing values when switching modes
                    setScaleFromPrice('');
                    setScaleToPrice('');
                  }
                }}
              >
                <ToggleButton value='percentage'>%</ToggleButton>
                <ToggleButton value='absolute'>$</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          {/* Second row: Price Skew - Title on one line, slider on next line */}
          <Box sx={{ mt: 3 }}>
            <Tooltip title='Controls distribution across the price range. Negative: denser near From; Positive: denser near To; 0: even.'>
              <Typography color='text.secondary' variant='body1'>
                Price Skew
              </Typography>
            </Tooltip>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: '96%' }}>
                <Slider
                  disabled={!isFormReady}
                  marks={[{ value: -1 }, { value: 0 }, { value: 1 }]}
                  max={1}
                  min={-1}
                  step={0.05}
                  sx={{
                    '& .MuiSlider-thumb': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                      width: 14,
                      height: 14,
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
                      },
                      '&.Mui-active': {
                        boxShadow: `0px 0px 0px 14px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
                      },
                    },
                    '& .MuiSlider-track': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                    '& .MuiSlider-rail': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                    '& .MuiSlider-mark': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                    '& .MuiSlider-markLabel': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                    '& .MuiSlider-valueLabel': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                    '&.Mui-disabled': {
                      '& .MuiSlider-thumb': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      },
                      '& .MuiSlider-track': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      },
                      '& .MuiSlider-rail': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      },
                      '& .MuiSlider-mark': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      },
                      '& .MuiSlider-markLabel': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      },
                    },
                  }}
                  value={scalePriceSkew}
                  valueLabelDisplay='auto'
                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                  onChange={(_, v) => setScalePriceSkew(v)}
                />
              </Box>
            </Box>
          </Box>

          {/* Third row: Size Skew - Title on one line, slider on next line */}
          <Box sx={{ mt: 3 }}>
            <Tooltip title='Controls size distribution. Negative: larger near center; Positive: larger at edges; 0: uniform.'>
              <Typography color='text.secondary' variant='body1'>
                Size Skew
              </Typography>
            </Tooltip>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: '96%' }}>
                <Slider
                  disabled={!isFormReady}
                  marks={[{ value: -1 }, { value: 0 }, { value: 1 }]}
                  max={1}
                  min={-1}
                  step={0.05}
                  sx={{
                    '& .MuiSlider-thumb': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                      width: 14,
                      height: 14,
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
                      },
                      '&.Mui-active': {
                        boxShadow: `0px 0px 0px 14px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
                      },
                    },
                    '& .MuiSlider-track': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                    '& .MuiSlider-rail': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                    '& .MuiSlider-mark': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                    '& .MuiSlider-markLabel': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                    '& .MuiSlider-valueLabel': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                    '&.Mui-disabled': {
                      '& .MuiSlider-thumb': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      },
                      '& .MuiSlider-track': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      },
                      '& .MuiSlider-rail': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      },
                      '& .MuiSlider-mark': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      },
                      '& .MuiSlider-markLabel': {
                        opacity: 0.5,
                        color: 'text.disabled',
                      },
                    },
                  }}
                  value={scaleSizeSkew}
                  valueLabelDisplay='auto'
                  valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                  onChange={(_, v) => setScaleSizeSkew(v)}
                />
              </Box>
            </Box>
          </Box>

          {/* Fourth row: Order Count - Title on one line, slider on next line */}
          <Box sx={{ mt: 3 }}>
            <Typography color='text.secondary' variant='body1'>
              # of Orders
            </Typography>
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: '96%' }}>
                <Slider
                  disabled={!isFormReady}
                  marks={[
                    { value: 1, label: '1' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                    { value: 30, label: '30' },
                    { value: 40, label: '40' },
                  ]}
                  max={40}
                  min={1}
                  step={1}
                  sx={{
                    '& .MuiSlider-markLabel': {
                      marginTop: '-8px', // Reduce space between slider and labels
                    },
                    '& .MuiSlider-thumb': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                      width: 14,
                      height: 14,
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
                      },
                      '&.Mui-active': {
                        boxShadow: `0px 0px 0px 14px ${alpha(theme.palette.common.pureWhite, 0.16)}`,
                      },
                    },
                    '& .MuiSlider-track': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                    '& .MuiSlider-rail': {
                      color: 'var(--text-primary)',
                      transition: 'none',
                    },
                  }}
                  value={scaleOrderCount}
                  valueLabelDisplay='auto'
                  onChange={(_, v) => setScaleOrderCount(v)}
                />
              </Box>
            </Box>
          </Box>
        </BorderedStack>
      </Grid>
    </Grid>
  );
}

export default ScaleOrdersFields;
