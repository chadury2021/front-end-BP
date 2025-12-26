/* eslint-disable react-hooks/exhaustive-deps */
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ClearIcon from '@mui/icons-material/Clear';
import InfoIcon from '@mui/icons-material/Info';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import Tooltip from '@mui/material/Tooltip';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import Checkbox from '@mui/material/Checkbox';
import { useAtom } from 'jotai';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import { getOrderBook } from '../../apiServices';
import { ignoreScrollEvent, noArrowStyle, smartRound } from '../../util';
import PairAutoComplete from './PairAutoComplete';
import { NumericFormatCustom } from './NumberFieldFormat';

export default function LimitPriceField({
  exchanges,
  isBuySide,
  limitPrice,
  selectedAccountExchangeNames,
  selectedPairName,
  setLimitPrice,
  showAlert,
  simple = false,
  tokenPairs,
}) {
  const theme = useTheme();
  const { FormAtoms } = useOrderForm();
  const [dynamicLimitPrice, setDynamicLimitPrice] = useState({
    pair: '',
    exchange: 'Binance',
    offset: '',
  });
  const [previewPrice, setPreviewPrice] = useState(-1);
  const [openDynamicLimitPriceDialog, setOpenDynamicLimitPriceDialog] = useState(false);
  const [previewLimitPrice, setPreviewLimitPrice] = useState('');
  const [isLoadingPreviewPrice, setIsLoadingPreviewPrice] = useState(false);
  const [isLoadingLimitPrice, setIsLoadingLimitPrice] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null);
  const [limitPriceQuickSetting, setLimitPriceQuickSetting] = useAtom(FormAtoms.limitPriceQuickSettingAtom);
  const [isOOLEnabled, setIsOOLEnabled] = useAtom(FormAtoms.isOOLEnabledAtom);
  const [isEntryEnabled, setIsEntryEnabled] = useAtom(FormAtoms.isEntryEnabledAtom);
  const [limitPriceFromOrderBook, setLimitPriceFromOrderBook] = useAtom(FormAtoms.limitPriceFromOrderBookAtom);
  const [formPageType] = useAtom(FormAtoms.formPageType);
  const [isReverseLimitPrice, setIsReverseLimitPrice] = useAtom(FormAtoms.isReverseLimitPriceAtom);
  const previousOffset = useRef(dynamicLimitPrice.offset);
  const [modalView, setModalView] = useState('pairoffset');
  const [customDynamicLimitPrice, setCustomDynamicLimitPrice] = useState('');
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Highlight effect when limit price is set from order book
  useEffect(() => {
    if (limitPriceFromOrderBook) {
      setIsHighlighted(true);
      // Reset highlight after 2 seconds
      const timeout = setTimeout(() => {
        setIsHighlighted(false);
        setLimitPriceFromOrderBook(false); // Reset the atom so it can be triggered again
      }, 2000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [limitPriceFromOrderBook, setLimitPriceFromOrderBook]);

  useEffect(() => {
    if (isEntryEnabled) {
      setIsOOLEnabled(true);
    }
  }, [isEntryEnabled]);
  const fetchPreviewPrice = async () => {
    let price = -1;
    setIsLoadingPreviewPrice(true);
    try {
      const result = await getOrderBook(dynamicLimitPrice.exchange, dynamicLimitPrice.pair);

      if (result && result.asks.length > 0 && result.bids.length > 0) {
        price = (result.asks[0].price + result.bids[0].price) / 2;
      }
    } catch (e) {
      showAlert({
        message: 'Failed to preview dynamic limit price.',
        severity: 'error',
      });
    }
    setIsLoadingPreviewPrice(false);

    return price;
  };

  /**
   * isBuySide, isReverseLimit = isBuy
   *  true, true = false
   *  true, false = true
   *  false, true = true
   *  false, false = false
   */
  const isBuy = isBuySide !== isReverseLimitPrice;

  const selectablePairs = useMemo(() => tokenPairs?.filter((pair) => pair.market_type !== 'dex') || [], [tokenPairs]);

  useEffect(() => {
    const loadPreviewPrice = async (fetchPrice) => {
      let price = previewPrice;

      if (fetchPrice) {
        price = await fetchPreviewPrice();

        if (price === -1) {
          return;
        }

        setPreviewPrice(price);
      }

      const offset = Number(dynamicLimitPrice.offset);
      setPreviewLimitPrice((price + offset).toFixed(8));
    };

    if (dynamicLimitPrice.exchange && dynamicLimitPrice.pair) {
      loadPreviewPrice(previousOffset.current === dynamicLimitPrice.offset);
    }

    previousOffset.current = dynamicLimitPrice.offset;
  }, [dynamicLimitPrice]);

  useEffect(() => {
    if (formPageType !== 'ChainedOrderPage') {
      if (limitPrice === '' || Number.isNaN(Number(limitPrice))) {
        setIsOOLEnabled(false);
      } else {
        setIsOOLEnabled(true);
      }
    }
  }, [limitPrice]);

  const handleDynamicLimitPriceParamChange = async (val, attr) => {
    if (!val) {
      return;
    }
    setDynamicLimitPrice({ ...dynamicLimitPrice, [attr]: val });
  };

  const handleLimitPriceDialogClose = (e) => {
    if (modalView === 'pairoffset') {
      const baseLimitPrice = `${dynamicLimitPrice.pair}@${dynamicLimitPrice.exchange}`;
      const offset = Number(dynamicLimitPrice.offset);

      let newLimitPrice = '';

      if (offset) {
        const operator = offset >= 0 ? '+' : '-';
        newLimitPrice = `${baseLimitPrice} ${operator} ${Math.abs(offset)}`;
      } else {
        newLimitPrice = baseLimitPrice;
      }

      setLimitPrice(newLimitPrice);
      setOpenDynamicLimitPriceDialog(false);
    } else {
      setLimitPrice(customDynamicLimitPrice);
      setOpenDynamicLimitPriceDialog(false);
    }
  };

  const getMidPrice = async () => {
    try {
      const result = await getOrderBook(selectedAccountExchangeNames[0], selectedPairName);

      if (result && result.asks.length > 0 && result.bids.length > 0) {
        return (result.asks[0].price + result.bids[0].price) / 2;
      }
    } catch (e) {
      showAlert({
        message: 'Failed to get price, please input manually.',
        severity: 'error',
      });
    }

    setLimitPriceQuickSetting(null);

    return NaN;
  };

  const getTopOfBook = async (side) => {
    try {
      const result = await getOrderBook(selectedAccountExchangeNames[0], selectedPairName);

      if (result && result[side] && result[side].length > 0) {
        return result[side][0].price;
      }
    } catch (e) {
      showAlert({
        message: 'Failed to get price, please input manually.',
        severity: 'error',
      });
    }

    setLimitPriceQuickSetting(null);

    return NaN;
  };

  const numSelectedExchanges = selectedAccountExchangeNames ? selectedAccountExchangeNames.length : 0;
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!limitPrice && limitPriceQuickSetting) {
      setLimitPriceQuickSetting(null);
    }
  }, [limitPrice]);

  const shouldFormatLimitPrice = useMemo(() => {
    if (limitPrice === null || limitPrice === undefined) {
      return false;
    }

    const trimmedValue = String(limitPrice).trim();
    if (trimmedValue === '') {
      return false;
    }

    const numericPattern = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
    return numericPattern.test(trimmedValue);
  }, [limitPrice]);

  useEffect(() => {
    if (hasMounted.current) {
      setLimitPrice('');
    } else {
      hasMounted.current = true;
    }
  }, [selectedPairName, numSelectedExchanges]);

  const handleLimitPriceValueChange = (event) => {
    setLimitPrice(event.target.value);
  };

  const limitPriceQuickSettingOptions = {
    Mid: getMidPrice,
    Bid: async () => getTopOfBook('bids'),
    Ask: async () => getTopOfBook('asks'),
    '1%': async () => (await getMidPrice()) * (isBuy ? 0.99 : 1.01),
  };

  useEffect(() => {
    const loadNewLimitPrice = async () => {
      const selectedOption = limitPriceQuickSetting;

      setLimitPriceQuickSetting(selectedOption);
      const callable = limitPriceQuickSettingOptions[selectedOption];

      if (!callable) {
        return;
      }

      setIsLoadingLimitPrice(true);
      const price = await callable();

      if (price) {
        setLimitPrice(smartRound(price));
      }

      setIsLoadingLimitPrice(false);
    };

    loadNewLimitPrice();
  }, [limitPriceQuickSetting]);

  const readyToPickLimitPrice = selectedPairName && selectedAccountExchangeNames.length > 0;

  const limitPriceRadioLabel = (option) => {
    if (!option.includes('%')) {
      return option;
    }

    const commonStyle = {
      marginBottom: '3px',
      marginLeft: '-4px',
      marginRight: '-2px',
    };

    const icon = isBuy ? (
      <ArrowDownwardIcon fontSize='small' sx={commonStyle} />
    ) : (
      <ArrowUpwardIcon fontSize='small' sx={commonStyle} />
    );

    return (
      <Stack direction='row' display='flex' flexWrap='nowrap'>
        {icon}
        {option}
      </Stack>
    );
  };

  return (
    <div>
      <TextField
        fullWidth
        disabled={!readyToPickLimitPrice}
        FormHelperTextProps={{
          sx: {
            color: 'warning.main',
            fontSize: '0.75rem',
          },
        }}
        helperText=''
        InputLabelProps={{
          shrink: true, // Always shrink the label when using custom input component
          sx: {
            color: 'var(--text-disabled)', // Default color for the label
            '&.Mui-focused': {
              color: 'var(--text-primary)', // Color when the input is focused
            },
            '&.MuiInputLabel-shrink': {
              color: 'var(--text-primary)', // Color when the label is shrunk (after input is entered)
            },
          },
        }}
        InputProps={{
          step: 'any',
          inputComponent: shouldFormatLimitPrice ? NumericFormatCustom : undefined,
          endAdornment: (
            <InputAdornment position='end'>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {isLoadingLimitPrice && <CircularProgress size={20} sx={{ color: 'info.main', marginRight: '4px' }} />}
                {limitPrice && (
                  <IconButton onClick={() => setLimitPrice('')}>
                    <ClearIcon fontSize='small' />
                  </IconButton>
                )}
                {simple && !limitPrice && (
                  <Tooltip title='Limit price is required for simple limit orders'>
                    <InfoIcon fontSize='small' sx={{ color: 'warning.main', marginRight: '4px' }} />
                  </Tooltip>
                )}
                {simple && limitPrice && (Number.isNaN(Number(limitPrice)) || Number(limitPrice) <= 0) && (
                  <Tooltip title='Please enter a valid positive number'>
                    <InfoIcon fontSize='small' sx={{ color: 'warning.main', marginRight: '4px' }} />
                  </Tooltip>
                )}
                {!simple && (
                  <Tooltip title='Toggle Reverse Limit Price'>
                    <Checkbox
                      checked={isReverseLimitPrice}
                      checkedIcon={<SwapVertIcon sx={{ color: 'text.secondary' }} />}
                      disabled={!readyToPickLimitPrice}
                      icon={<SwapVertIcon />}
                      onChange={(event) => setIsReverseLimitPrice(event.target.checked)}
                    />
                  </Tooltip>
                )}
                {!simple && (
                  <Button
                    disabled={!readyToPickLimitPrice}
                    variant='outlined'
                    onClick={() => setOpenDynamicLimitPriceDialog(true)}
                  >
                    <Typography variant='subtitle'>Dynamic</Typography>
                  </Button>
                )}
              </div>
            </InputAdornment>
          ),
        }}
        label={isReverseLimitPrice ? 'Reverse Limit Price' : 'Limit Price'}
        sx={{
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: isHighlighted ? theme.palette.semantic.warning : undefined,
              borderWidth: isHighlighted ? '2px' : undefined,
              transition: 'border-color 0.3s ease, border-width 0.3s ease',
            },
            '&:hover fieldset': {
              borderColor: isHighlighted ? theme.palette.semantic.warning : undefined,
            },
            '&.Mui-focused fieldset': {
              borderColor: isHighlighted ? theme.palette.semantic.warning : undefined,
            },
            // Ensure highlighting works even when disabled
            '&.Mui-disabled fieldset': {
              borderColor: isHighlighted ? theme.palette.semantic.warning : undefined,
              borderWidth: isHighlighted ? '2px' : undefined,
            },
          },
        }}
        value={limitPrice}
        onChange={handleLimitPriceValueChange}
      />
      <FormControl fullWidth>
        <Stack direction='row'>
          <RadioGroup
            row
            aria-labelledby='limit-price-quick-setting'
            disabled={!readyToPickLimitPrice}
            name='limit-price-quick-setting'
            sx={{ flexWrap: 'nowrap', fontSize: '0.7rem' }}
            value={limitPriceQuickSetting}
            onChange={(e) => setLimitPriceQuickSetting(e.target.value)}
          >
            {Object.keys(limitPriceQuickSettingOptions)
              .filter((option) => (isBuy ? option !== 'Ask' : option !== 'Bid'))
              .map((option) => (
                <FormControlLabel
                  control={<Radio />}
                  disabled={!readyToPickLimitPrice}
                  key={option}
                  label={limitPriceRadioLabel(option)}
                  sx={{
                    marginRight: '7px',
                    '& .MuiTypography-root': {
                      width: '30px',
                      fontSize: '0.65rem',
                    },
                    '& .MuiRadio-root': {
                      padding: '9px 3px 9px 9px',
                    },
                  }}
                  value={option}
                />
              ))}
          </RadioGroup>
          {!simple && formPageType !== 'ChainedOrderPage' && (
            <FormControlLabel
              color='grey.disabled'
              control={
                <Checkbox
                  checked={isEntryEnabled || isOOLEnabled || isReverseLimitPrice}
                  color='primary'
                  sx={{
                    paddingRight: '4px',
                    '& .MuiFormControlLabel-label-root': {
                      width: '30px',
                      fontSize: '0.7rem',
                    },
                  }}
                  onChange={(event) => setIsOOLEnabled(event.target.checked)}
                />
              }
              disabled={(!readyToPickLimitPrice || isReverseLimitPrice) && !isEntryEnabled}
              label={<TreadTooltip variant='ool_pause' />}
              sx={{
                whiteSpace: 'nowrap',
              }}
            />
          )}
          {!simple && formPageType !== 'ChainedOrderPage' && (
            <FormControlLabel
              color='grey.disabled'
              control={
                <Checkbox
                  checked={isEntryEnabled}
                  color='primary'
                  sx={{
                    paddingRight: '4px',
                    '& .MuiFormControlLabel-label-root': {
                      width: '30px',
                      fontSize: '0.7rem',
                    },
                  }}
                  onChange={(event) => setIsEntryEnabled(event.target.checked)}
                />
              }
              disabled={!readyToPickLimitPrice}
              label={<Typography variant='body2'>Entry</Typography>}
              sx={{
                whiteSpace: 'nowrap',
              }}
            />
          )}
        </Stack>
      </FormControl>
      {!simple && (
        <Dialog maxWidth='md' open={openDynamicLimitPriceDialog}>
          <DialogTitle width='400px'>
            <Stack alignItems='center' direction='row' justifyContent='space-between'>
              Dynamic Limit Price
              <ToggleButtonGroup
                exclusive
                size='small'
                value={modalView}
                onChange={(e, newView) => {
                  if (newView !== null) {
                    setModalView(newView);
                  }
                }}
              >
                <ToggleButton value='pairoffset'>Pair Offset</ToggleButton>
                <ToggleButton value='custom'>Custom</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            {modalView === 'pairoffset' && (
              <Stack direction='column' gap={2}>
                <PairAutoComplete
                  fullWidth
                  handleSelectedPair={(pair) => {
                    handleDynamicLimitPriceParamChange(pair?.id, 'pair');
                    setSelectedPair(pair);
                  }}
                  selectedPair={selectedPair}
                  tokenPairs={selectablePairs}
                />
                <Stack direction='row' display='flex' gap={1}>
                  <Select
                    fullWidth
                    value={dynamicLimitPrice.exchange}
                    onChange={(e) => handleDynamicLimitPriceParamChange(e.target.value, 'exchange')}
                  >
                    {exchanges &&
                      exchanges.length > 0 &&
                      exchanges.map((e) => (
                        <MenuItem key={e} value={e}>
                          {e}
                        </MenuItem>
                      ))}
                  </Select>
                  <TextField
                    fullWidth
                    autoComplete='off'
                    InputProps={{
                      step: 'any',
                      inputComponent: NumericFormatCustom,
                    }}
                    label='Offset ($)'
                    sx={noArrowStyle}
                    value={dynamicLimitPrice.offset}
                    onChange={(e) => handleDynamicLimitPriceParamChange(e.target.value, 'offset')}
                    onWheel={ignoreScrollEvent}
                  />
                </Stack>
                <Stack direction='row' display='flex'>
                  <TextField
                    disabled
                    fullWidth
                    InputProps={{
                      step: 'any',
                      endAdornment: isLoadingPreviewPrice ? (
                        <CircularProgress size={20} sx={{ color: 'info.main' }} />
                      ) : (
                        ''
                      ),
                      inputComponent: NumericFormatCustom,
                    }}
                    label='Preview Relative Price ($)'
                    value={previewLimitPrice}
                    variant='filled'
                    onWheel={ignoreScrollEvent}
                  />
                </Stack>
              </Stack>
            )}
            {modalView === 'custom' && (
              <TextField
                fullWidth
                multiline
                label='Custom Dynamic Limit Price'
                rows={4}
                value={customDynamicLimitPrice}
                onChange={(e) => setCustomDynamicLimitPrice(e.target.value)}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDynamicLimitPriceDialog(false)}>Cancel</Button>
            <Button onClick={handleLimitPriceDialogClose}>Submit</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}
