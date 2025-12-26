import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Slider,
  Box,
  Stack,
  Button,
  CircularProgress,
  TextField,
  useTheme,
  Alert,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getLeverage, setLeverage as setLeverageApi } from '@/apiServices';
import { useToast } from '@/shared/context/ToastProvider';
import { useMaxLeverage } from '@/context/MaxLeverageContext';

const whiteSliderStyles = {
  '& .MuiSlider-thumb': {
    color: 'white',
    transition: 'none',
    width: 20,
    height: 20,
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0px 0px 0px 8px ${alpha('#ffffff', 0.16)}`,
    },
    '&.Mui-active': {
      boxShadow: `0px 0px 0px 14px ${alpha('#ffffff', 0.16)}`,
      width: 24,
      height: 24,
    },
  },
  '& .MuiSlider-track': {
    color: 'white',
    transition: 'none',
    height: 4,
  },
  '& .MuiSlider-rail': {
    color: 'white',
    transition: 'none',
    height: 4,
    opacity: 0.3,
  },
  '& .MuiSlider-mark': {
    color: 'white',
    transition: 'none',
    width: 4,
    height: 4,
  },
  '& .MuiSlider-markLabel': {
    color: 'white',
    transition: 'none',
    fontSize: { xs: '0.7rem', sm: '0.75rem' },
    whiteSpace: 'nowrap',
  },
  '& .MuiSlider-valueLabel': {
    display: 'none !important',
  },
};

function LeverageChip({ leverage, exchange, pairId, adjustLeverage, maxLeverage }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAdjustLeverage = async (newLeverage) => {
    await adjustLeverage(newLeverage);
  };

  // Show 1x as default when leverage is not available
  const displayLeverage = leverage || 1;
  const isDefault = !leverage;

  // Determine chip color based on leverage
  const chipColor = useMemo(() => {
    if (isDefault) return undefined;
    const leverageValue = Number(displayLeverage);
    if (!Number.isFinite(leverageValue)) return undefined;

    if (leverageValue >= 20) {
      return theme.palette.error.main; // Red for 20x+
    }
    if (leverageValue >= 10) {
      return theme.palette.warning.main; // Orange for 10x+
    }
    return undefined; // Default color
  }, [displayLeverage, isDefault, theme]);

  return (
    <Tooltip title={`Leverage: ${displayLeverage}x${isDefault ? ' (default)' : ''}`}>
      <Chip
        disabled={isDefault}
        label={`${displayLeverage}x`}
        size='small'
        sx={{
          opacity: isDefault ? 0.6 : 1,
          ...(chipColor && {
            borderColor: chipColor,
            color: chipColor,
            '&:hover': {
              borderColor: chipColor,
              backgroundColor: alpha(chipColor, 0.08),
            },
          }),
        }}
        variant='outlined'
        onClick={() => {
          handleOpen();
        }}
      />
      {open && (
        <AdjustLeverageModal
          exchange={exchange}
          handleAdjustLeverage={handleAdjustLeverage}
          handleClose={handleClose}
          leverage={displayLeverage}
          maxLeverage={maxLeverage}
          open={open}
          pairId={pairId}
        />
      )}
    </Tooltip>
  );
}

function AdjustLeverageModal({ leverage, exchange, pairId, open, handleClose, handleAdjustLeverage, maxLeverage }) {
  const [value, setValue] = useState(leverage);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const theme = useTheme();

  const { showToastMessage } = useToast();

  const marks = useMemo(() => {
    return [1, 5, 10, 20, 50, 100]
      .filter((val) => val <= maxLeverage)
      .map((val) => ({
        value: val,
        label: `${val}x`,
      }));
  }, [maxLeverage]);

  const handleAdjustLeverageCallback = async () => {
    if (value === '' || value < 1) return;

    setIsAdjusting(true);
    try {
      await handleAdjustLeverage(value);
      showToastMessage({ message: `Leverage adjusted to ${value}x`, type: 'success' });
    } catch (error) {
      showToastMessage({ message: `Failed to adjust leverage: ${error.message}`, type: 'error' });
    } finally {
      setIsAdjusting(false);
    }

    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <Stack alignItems='center' direction='column' spacing={2}>
          <Stack alignItems='center' direction='column' spacing={1}>
            <Typography variant='h6'>Adjust Leverage</Typography>
            <Typography variant='body1'>
              For {pairId}@{exchange}
            </Typography>
          </Stack>

          <Stack alignItems='center' direction='column' spacing={4} sx={{ width: '96%' }}>
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Slider
                disabled={isAdjusting}
                marks={marks}
                max={maxLeverage}
                min={1}
                step={1}
                sx={{
                  ...whiteSliderStyles,
                  flex: 1,
                  mt: 4,
                  '& .MuiSlider-valueLabel': {
                    display: 'none !important',
                  },
                }}
                value={value}
                valueLabelDisplay='off'
                onChange={(_, newValue) => setValue(newValue || 1)}
              />
              <TextField
                disabled={isAdjusting}
                InputProps={{
                  endAdornment: <Typography sx={{ color: 'white', fontSize: '14px', mr: 1 }}>x</Typography>,
                  inputProps: {
                    min: 1,
                    max: maxLeverage,
                    step: 1,
                    inputMode: 'numeric',
                    pattern: '[0-9]*',
                  },
                }}
                size='small'
                sx={{
                  width: 80,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'background.paper',
                    height: 40,
                    '& fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&:hover fieldset': {
                      borderColor: theme.palette.primary.light,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                    textAlign: 'center',
                    fontSize: '14px',
                    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                    '&[type=number]': {
                      MozAppearance: 'textfield',
                    },
                  },
                }}
                type='number'
                value={value}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  if (inputValue === '') {
                    setValue('');
                    return;
                  }
                  const numValue = parseInt(inputValue, 10);
                  if (!Number.isNaN(numValue)) {
                    const clampedValue = Math.max(1, Math.min(maxLeverage, numValue));
                    setValue(clampedValue);
                  }
                }}
              />
            </Box>

            <Alert severity='warning' sx={{ width: '94%' }} variant='outlined'>
              <Typography variant='body3'>
                Adjusting leverage here will immediately apply on your connected exchange.
              </Typography>
            </Alert>

            <Button
              fullWidth
              color='success'
              disabled={isAdjusting || value === '' || value < 1}
              variant='contained'
              onClick={() => handleAdjustLeverageCallback(value)}
            >
              {isAdjusting ? <CircularProgress size={20} /> : `Confirm ${value}x`}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function useLeverage({ pair, account }) {
  const [leverage, setLeverage] = useState(null);
  const [maxLeverage, setMaxLeverage] = useState(100); // Default to 100x max leverage

  const { getMaxLeverage } = useMaxLeverage();

  useEffect(() => {
    const fetchLeverage = async () => {
      setLeverage(null);
      setMaxLeverage(100); // Reset to default max leverage
      try {
        const response = await getLeverage(pair.id, [account.id]);
        setLeverage(response);
        setMaxLeverage(getMaxLeverage(pair.id, account.exchangeName) || 100);
      } catch (e) {
        // noop, just don't show leverage
      }
    };

    if (pair && pair.market_type !== 'spot' && account) {
      fetchLeverage();
    } else {
      // When account is not set, provide default values
      setLeverage(null);
      setMaxLeverage(100);
    }
  }, [pair, account, getMaxLeverage]);

  const adjustLeverage = async (newLeverage) => {
    if (!account) {
      // Can't adjust leverage without an account
      return;
    }
    await setLeverageApi(newLeverage, pair.id, [account.id]);
    setLeverage((prev) => ({ ...prev, leverage: newLeverage }));
  };

  return { leverage, adjustLeverage, maxLeverage };
}

export { LeverageChip, useLeverage };
