import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  useTheme,
  Button,
  Dialog,
  DialogContent,
  CircularProgress,
  TextField,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getLeverage, setLeverage } from '@/apiServices';
import { useMaxLeverage } from '@/context/MaxLeverageContext';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import Slider from '@mui/material/Slider';

const whiteSliderStyles = {
  '& .MuiSlider-thumb': {
    color: 'white',
    transition: 'none',
    width: 14,
    height: 14,
    '&:hover, &.Mui-focusVisible': {
      boxShadow: `0px 0px 0px 8px ${alpha('#ffffff', 0.16)}`,
    },
    '&.Mui-active': {
      boxShadow: `0px 0px 0px 14px ${alpha('#ffffff', 0.16)}`,
    },
  },
  '& .MuiSlider-track': {
    color: 'white',
    transition: 'none',
  },
  '& .MuiSlider-rail': {
    color: 'white',
    transition: 'none',
  },
  '& .MuiSlider-mark': {
    color: 'white',
    transition: 'none',
  },
  '& .MuiSlider-markLabel': {
    color: 'white',
    transition: 'none',
  },
  '& .MuiSlider-valueLabel': {
    color: 'white',
    transition: 'none',
  },
};

function LeverageField({
  // Required props
  pair,
  account,
  currentLeverage,
  onLeverageChange,

  // Optional props
  disabled = false,
  showLabel = true,
  sx = {},
}) {
  const { showAlert } = useContext(ErrorContext);
  const { getMaxLeverage, loading: maxLeverageLoading } = useMaxLeverage();
  const theme = useTheme();

  const [isFetching, setIsFetching] = useState(false);
  const [localLeverage, setLocalLeverage] = useState('');
  const [marginMode, setMarginMode] = useState(null); // "CROSS" or "ISOLATED"
  const [isSetting, setIsSetting] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustValue, setAdjustValue] = useState(1);
  const [adjustMarginMode, setAdjustMarginMode] = useState('CROSS'); // For modal
  const confirmedLeverageRef = useRef('');

  const isPerpetualPair = pair?.market_type === 'perp';
  const isDisabled = disabled || !pair || !account || !isPerpetualPair;
  const isHyperliquid = account?.exchangeName === 'Hyperliquid';

  const sliderMin = 1;
  const sliderMax = useMemo(() => {
    if (!pair || !account || maxLeverageLoading) return 100;
    const maxLev = getMaxLeverage?.(pair.id, account.exchangeName);
    return Number.isFinite(maxLev) && maxLev > 0 ? Math.max(sliderMin, maxLev) : 100;
  }, [pair, account, maxLeverageLoading, getMaxLeverage]);

  // Generate marks for the adjust modal (linear scale)
  const adjustMarks = useMemo(() => {
    return [1, 5, 10, 20, 50, 100]
      .filter((val) => val <= sliderMax)
      .map((val) => ({
        value: val,
        label: `${val}x`,
      }));
  }, [sliderMax]);

  const handleOpenAdjustModal = () => {
    setAdjustValue(Number(localLeverage) || 1);
    setAdjustMarginMode(marginMode || 'CROSS');
    setShowAdjustModal(true);
  };

  const handleCloseAdjustModal = () => {
    setShowAdjustModal(false);
  };

  const handleConfirmLeverageChange = async () => {
    if (adjustValue === '' || adjustValue < 1) return;

    try {
      setIsSetting(true);
      // Pass margin mode for Hyperliquid
      const marginModeParam = isHyperliquid ? adjustMarginMode : null;
      await setLeverage(adjustValue, pair.id, [account.id], marginModeParam);
      onLeverageChange(adjustValue);
      setLocalLeverage(String(adjustValue));
      confirmedLeverageRef.current = String(adjustValue);
      if (isHyperliquid) {
        setMarginMode(adjustMarginMode);
      }
      setShowAdjustModal(false);
    } catch (error) {
      showAlert({ severity: 'error', message: error.message || 'Failed to set leverage' });
    } finally {
      setIsSetting(false);
    }
  };

  // Auto-fetch leverage when pair or account changes
  useEffect(() => {
    const handleFetchLeverage = async () => {
      if (isDisabled) return;
      setIsFetching(true);
      try {
        const accountIds = [account.id];
        const res = await getLeverage(pair.id, accountIds);
        const lev = Number(res?.leverage);
        if (!Number.isNaN(lev)) {
          setLocalLeverage(String(lev));
          confirmedLeverageRef.current = String(lev);
          onLeverageChange(lev);

          // Update margin mode for Hyperliquid
          if (isHyperliquid) {
            // Use returned margin_mode or default to 'CROSS'
            setMarginMode(res?.margin_mode || 'CROSS');
          }
        } else {
          showAlert({ severity: 'error', message: 'Failed to parse leverage' });
        }
      } catch (e) {
        showAlert({ severity: 'error', message: e.message || 'Failed to fetch leverage' });
      } finally {
        setIsFetching(false);
      }
    };

    if (pair && account) {
      handleFetchLeverage();
    }
  }, [pair, account, isHyperliquid]);

  // Update local leverage when currentLeverage changes
  useEffect(() => {
    if (currentLeverage && currentLeverage !== Number(localLeverage)) {
      setLocalLeverage(String(currentLeverage));
      confirmedLeverageRef.current = String(currentLeverage);
    }
  }, [currentLeverage]);

  if (!isPerpetualPair) {
    return (
      <Box sx={{ px: 1, mt: 0, ...sx }}>
        <Typography color='text.secondary' sx={{ textAlign: 'center', py: 2 }} variant='body2'>
          Leverage not available for spot pairs
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1, mb: 2, position: 'relative', ...sx }} width='98%'>
      <Stack spacing={0}>
        {showLabel && (
          <Box
            sx={{
              alignItems: 'center',
              backgroundColor: 'background.paper',
              borderRadius: 1,
              display: 'flex',
              justifyContent: 'space-between',
              p: 2,
            }}
          >
            <Typography sx={{ pl: 0, color: 'text.secondary' }} variant='body1'>
              <span style={{ color: theme.palette.primary.main }}>{localLeverage ? `${localLeverage}x` : ''}</span>{' '}
              Current Leverage
              {isHyperliquid && marginMode && !isFetching && (
                <span style={{ color: theme.palette.info.main, marginLeft: '8px' }}>
                  ({marginMode === 'CROSS' ? 'Cross' : 'Isolated'})
                </span>
              )}
              {isSetting && <span style={{ color: theme.palette.grey[500], marginLeft: '8px' }}>Setting...</span>}
              {isFetching && <span style={{ color: theme.palette.grey[500], marginLeft: '8px' }}>...</span>}
            </Typography>
            <Button
              disabled={isDisabled || isFetching || isSetting}
              size='small'
              sx={{
                borderColor: theme.palette.primary.main,
                color: 'white',
                '&:hover': {
                  borderColor: theme.palette.primary.light,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                '&.Mui-disabled': {
                  borderColor: theme.palette.grey[600],
                  color: theme.palette.grey[600],
                },
              }}
              variant='outlined'
              onClick={handleOpenAdjustModal}
            >
              <Typography variant='body3'>Adjust</Typography>
            </Button>
          </Box>
        )}
      </Stack>

      {/* Adjust Leverage Modal */}
      <Dialog open={showAdjustModal} onClose={handleCloseAdjustModal}>
        <DialogContent>
          <Stack alignItems='center' direction='column' spacing={2}>
            <Stack alignItems='center' direction='column' spacing={1}>
              <Typography variant='h6'>Adjust Leverage</Typography>
              <Typography variant='body1'>
                For {pair?.id}@{account?.exchangeName}
              </Typography>
            </Stack>

            <Stack alignItems='center' direction='column' spacing={4} sx={{ width: '96%' }}>
              {isHyperliquid && (
                <Box sx={{ width: '100%' }}>
                  <Typography sx={{ mb: 1, color: 'text.secondary' }} variant='body2'>
                    Margin Mode
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    color='primary'
                    disabled={isSetting}
                    size='small'
                    sx={{
                      '& .MuiToggleButton-root': {
                        color: 'white',
                        borderColor: theme.palette.primary.main,
                        '&.Mui-selected': {
                          backgroundColor: theme.palette.primary.main,
                          color: 'white',
                          '&:hover': {
                            backgroundColor: theme.palette.primary.dark,
                          },
                        },
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        },
                      },
                    }}
                    value={adjustMarginMode}
                    onChange={(_, newMode) => {
                      if (newMode !== null) {
                        setAdjustMarginMode(newMode);
                      }
                    }}
                  >
                    <ToggleButton value='CROSS'>Cross</ToggleButton>
                    <ToggleButton value='ISOLATED'>Isolated</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Slider
                  disabled={isSetting}
                  marks={adjustMarks}
                  max={sliderMax}
                  min={sliderMin}
                  step={1}
                  sx={{ ...whiteSliderStyles, flex: 1, mt: 4 }}
                  value={adjustValue}
                  valueLabelDisplay='auto'
                  onChange={(_, newValue) => setAdjustValue(newValue || 1)}
                />
                <TextField
                  disabled={isSetting}
                  InputProps={{
                    endAdornment: <Typography sx={{ color: 'white', fontSize: '14px', mr: 1 }}>x</Typography>,
                    inputProps: {
                      min: sliderMin,
                      max: sliderMax,
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
                  value={adjustValue}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      setAdjustValue('');
                      return;
                    }
                    const value = parseInt(inputValue, 10);
                    if (!Number.isNaN(value)) {
                      const clampedValue = Math.max(sliderMin, Math.min(sliderMax, value));
                      setAdjustValue(clampedValue);
                    }
                  }}
                />
              </Box>

              <Alert severity='warning' sx={{ width: '94%' }} variant='outlined'>
                <Typography variant='body3'>
                  Adjusting leverage{isHyperliquid ? ' and margin mode' : ''} here will immediately apply on your
                  connected exchange.
                </Typography>
              </Alert>

              <Button
                fullWidth
                color='success'
                disabled={isSetting || adjustValue === '' || adjustValue < 1}
                variant='contained'
                onClick={handleConfirmLeverageChange}
              >
                {isSetting ? <CircularProgress size={20} /> : `Confirm ${adjustValue}x`}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function LeverageFieldWrapper() {
  const { selectedPair, selectedAccounts, initialLoadValue, setCurrentLeverage } = useOrderForm();
  const accounts = initialLoadValue?.accounts || {};

  // Get the first selected account for the leverage field
  const account = selectedAccounts && selectedAccounts.length > 0 ? accounts[selectedAccounts[0]] : null;

  // Don't render if no account or pair selected
  if (!account || !selectedPair) {
    return null;
  }

  return (
    <LeverageField
      account={account}
      currentLeverage={1} // This will be fetched automatically
      pair={selectedPair}
      onLeverageChange={setCurrentLeverage}
    />
  );
}

export default LeverageFieldWrapper;
